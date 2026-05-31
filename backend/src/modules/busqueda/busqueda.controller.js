const db = require('../../config/db');

const buscarRutas = async (req, res) => {
    try {
        const { origen_id, destino_id, fecha, tipo_asiento, cooperativa_id, tipo_viaje } = req.query;

        if (!origen_id || !destino_id || !fecha) {
            return res.status(400).json({ error: 'origen, destino y fecha son requeridos' });
        }

        let query = `
            SELECT DISTINCT
                hr.id as hoja_ruta_id,
                hr.fecha,
                hr.estado as estado_hoja,
                f.id as frecuencia_id,
                f.hora_salida,
                f.tipo_viaje,
                f.precio_base,
                f.resolucion_ant,
                co.nombre as origen_nombre,
                cd.nombre as destino_nombre,
                b.id as bus_id,
                b.numero_disco,
                b.placa,
                b.chasis,
                b.marca_chasis,
                b.carroceria,
                b.marca_carroceria,
                b.fotografia_url,
                b.capacidad_total,
                cp.nombre as cooperativa_nombre,
                cp.logo_url,
                (
                    SELECT COUNT(*) FROM asientos a 
                    WHERE a.bus_id = b.id AND a.estado = 1
                ) as total_asientos,
                (
                    SELECT COUNT(*) FROM boletos bo 
                    WHERE bo.hoja_ruta_id = hr.id AND bo.estado != 'ANULADO'
                ) as asientos_ocupados
            FROM hojas_ruta hr
            INNER JOIN frecuencias f ON hr.frecuencia_id = f.id
            INNER JOIN buses b ON hr.bus_id = b.id
            INNER JOIN cooperativas cp ON f.cooperativa_id = cp.id
            INNER JOIN ciudades co ON f.origen_id = co.id
            INNER JOIN ciudades cd ON f.destino_id = cd.id
            INNER JOIN paradas_intermedias po ON po.frecuencia_id = f.id
            INNER JOIN paradas_intermedias pd ON pd.frecuencia_id = f.id
            INNER JOIN ciudades cpo ON po.ciudad_id = cpo.id
            INNER JOIN ciudades cpd ON pd.ciudad_id = cpd.id
            WHERE hr.fecha = ?
            AND hr.estado = 'PROGRAMADA'
            AND f.activa = 1
            AND po.ciudad_id = ?
            AND pd.ciudad_id = ?
            AND po.orden_parada < pd.orden_parada
        `;

        const params = [fecha, origen_id, destino_id];

        if (cooperativa_id) {
            query += ' AND cp.id = ?';
            params.push(cooperativa_id);
        }

        if (tipo_viaje) {
            query += ' AND f.tipo_viaje = ?';
            params.push(tipo_viaje);
        }

        if (tipo_asiento) {
            query += ` AND (
                SELECT COUNT(*) FROM asientos a 
                WHERE a.bus_id = b.id AND a.tipo = ? AND a.estado = 1
            ) > 0`;
            params.push(tipo_asiento);
        }

        query += ' ORDER BY f.hora_salida';

        const [rows] = await db.query(query, params);

        const resultado = rows.map(r => ({
            ...r,
            asientos_disponibles: r.total_asientos - r.asientos_ocupados
        }));

        res.json(resultado);
    } catch (error) {
        console.error('Error al buscar rutas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const obtenerAsientos = async (req, res) => {
    try {
        const { hoja_ruta_id } = req.params;

        const [asientos] = await db.query(
            `SELECT a.id, a.numero_asiento, a.tipo, a.fila, a.columna,
                    CASE WHEN bo.id IS NOT NULL THEN 'OCUPADO' ELSE 'DISPONIBLE' END as estado
             FROM asientos a
             INNER JOIN hojas_ruta hr ON hr.id = ?
             LEFT JOIN boletos bo ON bo.asiento_id = a.id 
                AND bo.hoja_ruta_id = ? 
                AND bo.estado != 'ANULADO'
             WHERE a.bus_id = hr.bus_id AND a.estado = 1
             ORDER BY a.numero_asiento`,
            [hoja_ruta_id, hoja_ruta_id]
        );

        res.json(asientos);
    } catch (error) {
        console.error('Error al obtener asientos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const obtenerPrecioTramo = async (req, res) => {
    try {
        const { frecuencia_id, origen_id, destino_id } = req.query;

        const [paradas] = await db.query(
            `SELECT p.id, p.ciudad_id, p.orden_parada, p.precio_desde_origen
             FROM paradas_intermedias p
             WHERE p.frecuencia_id = ? AND p.ciudad_id IN (?, ?)`,
            [frecuencia_id, origen_id, destino_id]
        );

        if (paradas.length < 2) {
            return res.status(400).json({ error: 'No se encontraron las paradas' });
        }

        const paradaOrigen = paradas.find(p => p.ciudad_id == origen_id);
        const paradaDestino = paradas.find(p => p.ciudad_id == destino_id);

        const precio = Math.abs(paradaDestino.precio_desde_origen - paradaOrigen.precio_desde_origen);

        res.json({
            parada_origen_id: paradaOrigen.id,
            parada_destino_id: paradaDestino.id,
            precio_base: precio
        });
    } catch (error) {
        console.error('Error al obtener precio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { buscarRutas, obtenerAsientos, obtenerPrecioTramo };