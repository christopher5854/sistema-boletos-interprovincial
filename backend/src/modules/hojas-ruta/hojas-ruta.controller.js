const db = require('../../config/db');

const listar = async (req, res) => {
    try {
        const { fecha } = req.query;
        let query = `
            SELECT hr.*, 
                   b.numero_disco, b.placa,
                   f.hora_salida, f.tipo_viaje,
                   co.nombre as origen_nombre,
                   cd.nombre as destino_nombre,
                   CONCAT(uc.nombres, ' ', uc.apellidos) as chofer_nombre,
                   CONCAT(ua.nombres, ' ', ua.apellidos) as ayudante_nombre
            FROM hojas_ruta hr
            INNER JOIN buses b ON hr.bus_id = b.id
            INNER JOIN frecuencias f ON hr.frecuencia_id = f.id
            INNER JOIN ciudades co ON f.origen_id = co.id
            INNER JOIN ciudades cd ON f.destino_id = cd.id
            LEFT JOIN usuarios uc ON hr.chofer_id = uc.id
            LEFT JOIN usuarios ua ON hr.ayudante_id = ua.id
        `;

        const params = [];
        if (fecha) {
            query += ' WHERE hr.fecha = ?';
            params.push(fecha);
        }

        query += ' ORDER BY hr.fecha, f.hora_salida';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al listar hojas de ruta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const obtener = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            `SELECT hr.*, 
                    b.numero_disco, b.placa, b.capacidad_total,
                    f.hora_salida, f.precio_base, f.tipo_viaje,
                    co.nombre as origen_nombre,
                    cd.nombre as destino_nombre,
                    CONCAT(uc.nombres, ' ', uc.apellidos) as chofer_nombre,
                    CONCAT(ua.nombres, ' ', ua.apellidos) as ayudante_nombre
             FROM hojas_ruta hr
             INNER JOIN buses b ON hr.bus_id = b.id
             INNER JOIN frecuencias f ON hr.frecuencia_id = f.id
             INNER JOIN ciudades co ON f.origen_id = co.id
             INNER JOIN ciudades cd ON f.destino_id = cd.id
             LEFT JOIN usuarios uc ON hr.chofer_id = uc.id
             LEFT JOIN usuarios ua ON hr.ayudante_id = ua.id
             WHERE hr.id = ?`,
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Hoja de ruta no encontrada' });

        const [boletos] = await db.query(
            `SELECT bo.*, a.numero_asiento, a.tipo as tipo_asiento,
                    po.ciudad_id as origen_ciudad_id,
                    pd.ciudad_id as destino_ciudad_id
             FROM boletos bo
             INNER JOIN asientos a ON bo.asiento_id = a.id
             INNER JOIN paradas_intermedias po ON bo.parada_origen_id = po.id
             INNER JOIN paradas_intermedias pd ON bo.parada_destino_id = pd.id
             WHERE bo.hoja_ruta_id = ? AND bo.estado != 'ANULADO'`,
            [id]
        );

        res.json({ ...rows[0], boletos });
    } catch (error) {
        console.error('Error al obtener hoja de ruta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const crear = async (req, res) => {
    try {
        const { fecha, bus_id, frecuencia_id, chofer_id, ayudante_id } = req.body;

        const [existente] = await db.query(
            'SELECT id FROM hojas_ruta WHERE bus_id = ? AND fecha = ?',
            [bus_id, fecha]
        );

        if (existente.length > 0) {
            return res.status(400).json({ error: 'El bus ya tiene una hoja de ruta asignada para esa fecha' });
        }

        const [resultado] = await db.query(
            `INSERT INTO hojas_ruta (fecha, bus_id, frecuencia_id, chofer_id, ayudante_id, generacion)
             VALUES (?, ?, ?, ?, ?, 'MANUAL')`,
            [fecha, bus_id, frecuencia_id, chofer_id || null, ayudante_id || null]
        );

        res.status(201).json({ mensaje: 'Hoja de ruta creada correctamente', id: resultado.insertId });
    } catch (error) {
        console.error('Error al crear hoja de ruta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const generarAutomatica = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { fecha } = req.body;

        const [frecuencias] = await conn.query(
            'SELECT id FROM frecuencias WHERE activa = 1'
        );

        const [buses] = await conn.query(
            'SELECT id FROM buses WHERE estado = 1'
        );

        if (buses.length === 0) {
            return res.status(400).json({ error: 'No hay buses disponibles' });
        }

        if (frecuencias.length === 0) {
            return res.status(400).json({ error: 'No hay frecuencias activas' });
        }

        let asignados = 0;
        let busIndex = 0;

        for (const frecuencia of frecuencias) {
            if (busIndex >= buses.length) break;

            const [existente] = await conn.query(
                'SELECT id FROM hojas_ruta WHERE bus_id = ? AND fecha = ?',
                [buses[busIndex].id, fecha]
            );

            if (existente.length === 0) {
                await conn.query(
                    `INSERT INTO hojas_ruta (fecha, bus_id, frecuencia_id, generacion)
                     VALUES (?, ?, ?, 'AUTOMATICA')`,
                    [fecha, buses[busIndex].id, frecuencia.id]
                );
                asignados++;
            }

            busIndex++;
        }

        await conn.commit();
        res.status(201).json({ mensaje: `Hojas de ruta generadas: ${asignados}` });

    } catch (error) {
        await conn.rollback();
        console.error('Error al generar hojas de ruta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        conn.release();
    }
};

const actualizarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosValidos = ['PROGRAMADA', 'EN_RUTA', 'FINALIZADA', 'DIA_PARADA'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }

        await db.query('UPDATE hojas_ruta SET estado = ? WHERE id = ?', [estado, id]);
        res.json({ mensaje: 'Estado actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { listar, obtener, crear, generarAutomatica, actualizarEstado };