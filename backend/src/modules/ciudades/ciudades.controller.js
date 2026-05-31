const db = require('../../config/db');

const listar = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ciudades WHERE activa = 1 ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        console.error('Error al listar ciudades:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const crear = async (req, res) => {
    try {
        const { nombre, provincia } = req.body;
        const [resultado] = await db.query(
            'INSERT INTO ciudades (nombre, provincia) VALUES (?, ?)',
            [nombre, provincia]
        );
        res.status(201).json({ mensaje: 'Ciudad creada', id: resultado.insertId });
    } catch (error) {
        console.error('Error al crear ciudad:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, provincia } = req.body;
        await db.query(
            'UPDATE ciudades SET nombre = ?, provincia = ? WHERE id = ?',
            [nombre, provincia, id]
        );
        res.json({ mensaje: 'Ciudad actualizada' });
    } catch (error) {
        console.error('Error al actualizar ciudad:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE ciudades SET activa = 0 WHERE id = ?', [id]);
        res.json({ mensaje: 'Ciudad desactivada' });
    } catch (error) {
        console.error('Error al eliminar ciudad:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { listar, crear, actualizar, eliminar };