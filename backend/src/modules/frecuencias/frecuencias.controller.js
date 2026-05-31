const db = require('../../config/db');

const listar = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT f.*, 
                    co.nombre as origen_nombre, 
                    cd.nombre as destino_nombre,
                    cp.nombre as cooperativa_nombre
             FROM frecuencias f
             INNER JOIN ciudades co ON f.origen_id = co.id
             INNER JOIN ciudades cd ON f.destino_id = cd.id
             INNER JOIN cooperativas cp ON f.cooperativa_id = cp.id
             ORDER BY f.hora_salida`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al listar frecuencias:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const obtener = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            `SELECT f.*, 
                    co.nombre as origen_nombre, 
                    cd.nombre as destino_nombre
             FROM frecuencias f
             INNER JOIN ciudades co ON f.origen_id = co.id
             INNER JOIN ciudades cd ON f.destino_id = cd.id
             WHERE f.id = ?`,
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Frecuencia no encontrada' });

        const [paradas] = await db.query(
            `SELECT p.*, c.nombre as ciudad_nombre
             FROM paradas_intermedias p
             INNER JOIN ciudades c ON p.ciudad_id = c.id
             WHERE p.frecuencia_id = ?
             ORDER BY p.orden_parada`,
            [id]
        );

        res.json({ ...rows[0], paradas });
    } catch (error) {
        console.error('Error al obtener frecuencia:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const crear = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const {
            resolucion_ant, origen_id, destino_id,
            hora_salida, tipo_viaje, precio_base,
            cooperativa_id, paradas
        } = req.body;

        const [resultado] = await conn.query(
            `INSERT INTO frecuencias (resolucion_ant, origen_id, destino_id, hora_salida, tipo_viaje, precio_base, cooperativa_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [resolucion_ant, origen_id, destino_id, hora_salida, tipo_viaje, precio_base, cooperativa_id]
        );

        const frecuenciaId = resultado.insertId;

        if (paradas && paradas.length > 0) {
            for (const parada of paradas) {
                await conn.query(
                    `INSERT INTO paradas_intermedias (frecuencia_id, ciudad_id, orden_parada, precio_desde_origen)
                     VALUES (?, ?, ?, ?)`,
                    [frecuenciaId, parada.ciudad_id, parada.orden_parada, parada.precio_desde_origen]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ mensaje: 'Frecuencia creada correctamente', id: frecuenciaId });

    } catch (error) {
        await conn.rollback();
        console.error('Error al crear frecuencia:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        conn.release();
    }
};

const actualizar = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { id } = req.params;
        const {
            resolucion_ant, origen_id, destino_id,
            hora_salida, tipo_viaje, precio_base, activa, paradas
        } = req.body;

        await conn.query(
            `UPDATE frecuencias SET resolucion_ant = ?, origen_id = ?, destino_id = ?,
              hora_salida = ?, tipo_viaje = ?, precio_base = ?, activa = ?
             WHERE id = ?`,
            [resolucion_ant, origen_id, destino_id, hora_salida, tipo_viaje, precio_base, activa, id]
        );

        if (paradas) {
            await conn.query('DELETE FROM paradas_intermedias WHERE frecuencia_id = ?', [id]);
            for (const parada of paradas) {
                await conn.query(
                    `INSERT INTO paradas_intermedias (frecuencia_id, ciudad_id, orden_parada, precio_desde_origen)
                     VALUES (?, ?, ?, ?)`,
                    [id, parada.ciudad_id, parada.orden_parada, parada.precio_desde_origen]
                );
            }
        }

        await conn.commit();
        res.json({ mensaje: 'Frecuencia actualizada correctamente' });

    } catch (error) {
        await conn.rollback();
        console.error('Error al actualizar frecuencia:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        conn.release();
    }
};

const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE frecuencias SET activa = 0 WHERE id = ?', [id]);
        res.json({ mensaje: 'Frecuencia desactivada correctamente' });
    } catch (error) {
        console.error('Error al eliminar frecuencia:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };