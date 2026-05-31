const db = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

const listar = async (req, res) => {
    try {
        const { hoja_ruta_id } = req.query;
        let query = `
            SELECT bo.*,
                   a.numero_asiento, a.tipo as tipo_asiento,
                   hr.fecha, hr.bus_id,
                   b.numero_disco, b.placa,
                   co.nombre as origen_nombre,
                   cd.nombre as destino_nombre,
                   f.hora_salida
            FROM boletos bo
            INNER JOIN asientos a ON bo.asiento_id = a.id
            INNER JOIN hojas_ruta hr ON bo.hoja_ruta_id = hr.id
            INNER JOIN buses b ON hr.bus_id = b.id
            INNER JOIN frecuencias f ON hr.frecuencia_id = f.id
            INNER JOIN paradas_intermedias po ON bo.parada_origen_id = po.id
            INNER JOIN paradas_intermedias pd ON bo.parada_destino_id = pd.id
            INNER JOIN ciudades co ON po.ciudad_id = co.id
            INNER JOIN ciudades cd ON pd.ciudad_id = cd.id
            WHERE bo.estado != 'ANULADO'
        `;

        const params = [];
        if (hoja_ruta_id) {
            query += ' AND bo.hoja_ruta_id = ?';
            params.push(hoja_ruta_id);
        }

        query += ' ORDER BY bo.fecha_compra DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al listar boletos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const obtener = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            `SELECT bo.*,
                    a.numero_asiento, a.tipo as tipo_asiento,
                    hr.fecha,
                    b.numero_disco, b.placa, b.chasis, b.carroceria, b.fotografia_url,
                    co.nombre as origen_nombre,
                    cd.nombre as destino_nombre,
                    f.hora_salida,
                    cp.nombre as cooperativa_nombre, cp.logo_url
             FROM boletos bo
             INNER JOIN asientos a ON bo.asiento_id = a.id
             INNER JOIN hojas_ruta hr ON bo.hoja_ruta_id = hr.id
             INNER JOIN buses b ON hr.bus_id = b.id
             INNER JOIN frecuencias f ON hr.frecuencia_id = f.id
             INNER JOIN cooperativas cp ON f.cooperativa_id = cp.id
             INNER JOIN paradas_intermedias po ON bo.parada_origen_id = po.id
             INNER JOIN paradas_intermedias pd ON bo.parada_destino_id = pd.id
             INNER JOIN ciudades co ON po.ciudad_id = co.id
             INNER JOIN ciudades cd ON pd.ciudad_id = cd.id
             WHERE bo.id = ?`,
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Boleto no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener boleto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const crear = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const {
            hoja_ruta_id, usuario_id, nombres_pasajero, apellidos_pasajero,
            cedula_pasajero, asiento_id, parada_origen_id, parada_destino_id,
            tipo_descuento, origen_venta, metodo_pago
        } = req.body;

        const vendedor_id = req.usuario.id;

        const [asientoOcupado] = await conn.query(
            `SELECT id FROM boletos 
             WHERE hoja_ruta_id = ? AND asiento_id = ? AND estado != 'ANULADO'`,
            [hoja_ruta_id, asiento_id]
        );

        if (asientoOcupado.length > 0) {
            return res.status(400).json({ error: 'El asiento ya está ocupado' });
        }

        const [paradas] = await conn.query(
            `SELECT p.orden_parada, p.precio_desde_origen
             FROM paradas_intermedias p
             WHERE p.id IN (?, ?)`,
            [parada_origen_id, parada_destino_id]
        );

        if (paradas.length < 2) {
            return res.status(400).json({ error: 'Paradas inválidas' });
        }

        const paradaOrigen = paradas.find(p => p.id == parada_origen_id) || paradas[0];
        const paradaDestino = paradas.find(p => p.id == parada_destino_id) || paradas[1];
        const precioBase = Math.abs(paradaDestino.precio_desde_origen - paradaOrigen.precio_desde_origen);

        const descuentos = {
            'NINGUNO': 0,
            'TERCERA_EDAD': 50,
            'DISCAPACIDAD': 50,
            'MENOR_EDAD': 50
        };

        const porcentajeDescuento = descuentos[tipo_descuento] || 0;
        const precioFinal = precioBase - (precioBase * porcentajeDescuento / 100);

        const codigoBoleto = uuidv4().substring(0, 12).toUpperCase();

        const [resultado] = await conn.query(
            `INSERT INTO boletos (
                hoja_ruta_id, usuario_id, vendedor_id, nombres_pasajero, apellidos_pasajero,
                cedula_pasajero, asiento_id, parada_origen_id, parada_destino_id,
                precio_base, porcentaje_descuento, precio_final, tipo_descuento,
                origen_venta, estado, codigo_boleto
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RESERVADO', ?)`,
            [
                hoja_ruta_id, usuario_id || null, vendedor_id, nombres_pasajero, apellidos_pasajero,
                cedula_pasajero, asiento_id, parada_origen_id, parada_destino_id,
                precioBase, porcentajeDescuento, precioFinal, tipo_descuento,
                origen_venta, codigoBoleto
            ]
        );

        const boletoId = resultado.insertId;

        await conn.query(
            `INSERT INTO pagos (boleto_id, metodo_pago, monto, estado)
             VALUES (?, ?, ?, ?)`,
            [boletoId, metodo_pago, precioFinal, metodo_pago === 'EFECTIVO' ? 'VERIFICADO' : 'PENDIENTE']
        );

        if (metodo_pago === 'EFECTIVO') {
            await conn.query(
                "UPDATE boletos SET estado = 'PAGADO' WHERE id = ?",
                [boletoId]
            );
        }

        await conn.commit();
        res.status(201).json({
            mensaje: 'Boleto creado correctamente',
            id: boletoId,
            codigo_boleto: codigoBoleto,
            precio_final: precioFinal
        });

    } catch (error) {
        await conn.rollback();
        console.error('Error al crear boleto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        conn.release();
    }
};

const anular = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(
            "UPDATE boletos SET estado = 'ANULADO' WHERE id = ?",
            [id]
        );
        await db.query(
            "UPDATE pagos SET estado = 'RECHAZADO' WHERE boleto_id = ?",
            [id]
        );
        res.json({ mensaje: 'Boleto anulado correctamente' });
    } catch (error) {
        console.error('Error al anular boleto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const historialUsuario = async (req, res) => {
    try {
        const usuario_id = req.usuario.id;
        const [rows] = await db.query(
            `SELECT bo.id, bo.codigo_boleto, bo.nombres_pasajero, bo.apellidos_pasajero,
                    bo.precio_final, bo.estado, bo.fecha_compra,
                    a.numero_asiento, a.tipo as tipo_asiento,
                    hr.fecha as fecha_viaje,
                    f.hora_salida,
                    co.nombre as origen_nombre,
                    cd.nombre as destino_nombre
             FROM boletos bo
             INNER JOIN asientos a ON bo.asiento_id = a.id
             INNER JOIN hojas_ruta hr ON bo.hoja_ruta_id = hr.id
             INNER JOIN frecuencias f ON hr.frecuencia_id = f.id
             INNER JOIN paradas_intermedias po ON bo.parada_origen_id = po.id
             INNER JOIN paradas_intermedias pd ON bo.parada_destino_id = pd.id
             INNER JOIN ciudades co ON po.ciudad_id = co.id
             INNER JOIN ciudades cd ON pd.ciudad_id = cd.id
             WHERE bo.usuario_id = ?
             ORDER BY bo.fecha_compra DESC`,
            [usuario_id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { listar, obtener, crear, anular, historialUsuario };