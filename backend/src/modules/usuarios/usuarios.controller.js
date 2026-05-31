const db = require('../../config/db');
const bcrypt = require('bcrypt');

const listar = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.nombres, u.apellidos, u.cedula, u.correo, u.telefono,
                    u.estado, u.fecha_registro,
                    r.nombre as rol,
                    c.nombre as cooperativa_nombre
             FROM usuarios u
             INNER JOIN roles r ON u.rol_id = r.id
             LEFT JOIN cooperativas c ON u.cooperativa_id = c.id
             WHERE u.estado = 1
             ORDER BY u.nombres`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const obtener = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            `SELECT u.id, u.nombres, u.apellidos, u.cedula, u.correo, u.telefono,
                    u.estado, u.fecha_registro,
                    r.nombre as rol, r.id as rol_id,
                    c.nombre as cooperativa_nombre, u.cooperativa_id
             FROM usuarios u
             INNER JOIN roles r ON u.rol_id = r.id
             LEFT JOIN cooperativas c ON u.cooperativa_id = c.id
             WHERE u.id = ?`,
            [id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const crear = async (req, res) => {
    try {
        const { nombres, apellidos, cedula, correo, password, telefono, rol_id, cooperativa_id } = req.body;

        const [existe] = await db.query(
            'SELECT id FROM usuarios WHERE correo = ? OR cedula = ?',
            [correo, cedula]
        );

        if (existe.length > 0) {
            return res.status(400).json({ error: 'El correo o cédula ya están registrados' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        const [resultado] = await db.query(
            `INSERT INTO usuarios (nombres, apellidos, cedula, correo, password, telefono, rol_id, cooperativa_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombres, apellidos, cedula, correo, passwordEncriptada, telefono || null, rol_id, cooperativa_id || null]
        );

        res.status(201).json({ mensaje: 'Usuario creado correctamente', id: resultado.insertId });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombres, apellidos, cedula, correo, telefono, rol_id, cooperativa_id } = req.body;

        await db.query(
            `UPDATE usuarios SET nombres = ?, apellidos = ?, cedula = ?, correo = ?,
              telefono = ?, rol_id = ?, cooperativa_id = ?
             WHERE id = ?`,
            [nombres, apellidos, cedula, correo, telefono || null, rol_id, cooperativa_id || null, id]
        );

        res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const cambiarPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [passwordEncriptada, id]);
        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error al cambiar password:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE usuarios SET estado = 0 WHERE id = ?', [id]);
        res.json({ mensaje: 'Usuario desactivado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { listar, obtener, crear, actualizar, cambiarPassword, eliminar };