const db = require('../../config/db');

const listar = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT b.*, c.nombre as cooperativa_nombre 
             FROM buses b
             INNER JOIN cooperativas c ON b.cooperativa_id = c.id
             WHERE b.estado = 1
             ORDER BY b.numero_disco`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al listar buses:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const obtener = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            `SELECT b.*, c.nombre as cooperativa_nombre 
             FROM buses b
             INNER JOIN cooperativas c ON b.cooperativa_id = c.id
             WHERE b.id = ? AND b.estado = 1`,
            [id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Bus no encontrado' });

        const [asientos] = await db.query(
            'SELECT * FROM asientos WHERE bus_id = ? AND estado = 1 ORDER BY numero_asiento',
            [id]
        );

        res.json({ ...rows[0], asientos });
    } catch (error) {
        console.error('Error al obtener bus:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const crear = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const {
            numero_disco, placa, chasis, marca_chasis,
            carroceria, marca_carroceria, anio, fotografia_url,
            cooperativa_id, asientos
        } = req.body;

        if (!asientos || asientos.length === 0) {
            return res.status(400).json({ error: 'Debe definir al menos un asiento' });
        }

        const [resultado] = await conn.query(
            `INSERT INTO buses (numero_disco, placa, chasis, marca_chasis, carroceria, 
              marca_carroceria, anio, fotografia_url, capacidad_total, cooperativa_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [numero_disco, placa, chasis, marca_chasis, carroceria,
             marca_carroceria, anio, fotografia_url, asientos.length, cooperativa_id]
        );

        const busId = resultado.insertId;

        for (const asiento of asientos) {
            await conn.query(
                'INSERT INTO asientos (bus_id, numero_asiento, tipo, fila, columna) VALUES (?, ?, ?, ?, ?)',
                [busId, asiento.numero_asiento, asiento.tipo, asiento.fila || null, asiento.columna || null]
            );
        }

        await conn.commit();
        res.status(201).json({ mensaje: 'Bus creado correctamente', id: busId });

    } catch (error) {
        await conn.rollback();
        console.error('Error al crear bus:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        conn.release();
    }
};

const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            numero_disco, placa, chasis, marca_chasis,
            carroceria, marca_carroceria, anio, fotografia_url
        } = req.body;

        await db.query(
            `UPDATE buses SET numero_disco = ?, placa = ?, chasis = ?, marca_chasis = ?,
              carroceria = ?, marca_carroceria = ?, anio = ?, fotografia_url = ?
             WHERE id = ?`,
            [numero_disco, placa, chasis, marca_chasis,
             carroceria, marca_carroceria, anio, fotografia_url, id]
        );

        res.json({ mensaje: 'Bus actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar bus:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE buses SET estado = 0 WHERE id = ?', [id]);
        res.json({ mensaje: 'Bus desactivado correctamente' });
    } catch (error) {
        console.error('Error al eliminar bus:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };