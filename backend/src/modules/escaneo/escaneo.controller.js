const db = require('../../config/db');

const escanear = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { codigo_boleto } = req.body;
        const escaneado_por = req.usuario.id;

        const [boletos] = await conn.query(
            `SELECT bo.*, 
                    a.numero_asiento,
                    hr.fecha,
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
             WHERE bo.codigo_boleto = ?`,
            [codigo_boleto]
        );

        if (boletos.length === 0) {
            await conn.query(
                `INSERT INTO escaneos (boleto_id, escaneado_por, resultado)
                 VALUES (0, ?, 'INVALIDO')`,
                [escaneado_por]
            );
            await conn.commit();
            return res.status(404).json({ resultado: 'INVALIDO', error: 'Boleto no encontrado' });
        }

        const boleto = boletos[0];

        if (boleto.estado === 'USADO') {
            await conn.query(
                `INSERT INTO escaneos (boleto_id, escaneado_por, resultado)
                 VALUES (?, ?, 'YA_USADO')`,
                [boleto.id, escaneado_por]
            );
            await conn.commit();
            return res.status(400).json({ resultado: 'YA_USADO', error: 'El boleto ya fue usado' });
        }

        if (boleto.estado === 'ANULADO') {
            await conn.query(
                `INSERT INTO escaneos (boleto_id, escaneado_por, resultado)
                 VALUES (?, ?, 'INVALIDO')`,
                [boleto.id, escaneado_por]
            );
            await conn.commit();
            return res.status(400).json({ resultado: 'INVALIDO', error: 'El boleto está anulado' });
        }

        if (boleto.estado === 'RESERVADO') {
            await conn.query(
                `INSERT INTO escaneos (boleto_id, escaneado_por, resultado)
                 VALUES (?, ?, 'INVALIDO')`,
                [boleto.id, escaneado_por]
            );
            await conn.commit();
            return res.status(400).json({ resultado: 'INVALIDO', error: 'El boleto no está pagado' });
        }

        await conn.query(
            "UPDATE boletos SET estado = 'USADO' WHERE id = ?",
            [boleto.id]
        );

        await conn.query(
            `INSERT INTO escaneos (boleto_id, escaneado_por, resultado)
             VALUES (?, ?, 'VALIDO')`,
            [boleto.id, escaneado_por]
        );

        await conn.commit();

        res.json({
            resultado: 'VALIDO',
            boleto: {
                id: boleto.id,
                codigo_boleto: boleto.codigo_boleto,
                nombres_pasajero: boleto.nombres_pasajero,
                apellidos_pasajero: boleto.apellidos_pasajero,
                cedula_pasajero: boleto.cedula_pasajero,
                numero_asiento: boleto.numero_asiento,
                origen: boleto.origen_nombre,
                destino: boleto.destino_nombre,
                fecha: boleto.fecha,
                hora_salida: boleto.hora_salida
            }
        });

    } catch (error) {
        await conn.rollback();
        console.error('Error al escanear boleto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        conn.release();
    }
};

const historialEscaneos = async (req, res) => {
    try {
        const { hoja_ruta_id } = req.query;

        let query = `
            SELECT e.*, 
                   bo.codigo_boleto, bo.nombres_pasajero, bo.apellidos_pasajero,
                   a.numero_asiento,
                   CONCAT(u.nombres, ' ', u.apellidos) as escaneado_por_nombre
            FROM escaneos e
            INNER JOIN boletos bo ON e.boleto_id = bo.id
            INNER JOIN asientos a ON bo.asiento_id = a.id
            INNER JOIN usuarios u ON e.escaneado_por = u.id
            WHERE e.resultado = 'VALIDO'
        `;

        const params = [];
        if (hoja_ruta_id) {
            query += ' AND bo.hoja_ruta_id = ?';
            params.push(hoja_ruta_id);
        }

        query += ' ORDER BY e.fecha_escaneo DESC';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener historial de escaneos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { escanear, historialEscaneos };