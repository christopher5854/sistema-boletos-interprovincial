const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

const registrarUsuario = async (req, res) => {
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

        res.status(201).json({
            mensaje: 'Usuario registrado con éxito',
            usuarioId: resultado.insertId
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        const [usuarios] = await db.query(
            `SELECT u.*, r.nombre as rol_nombre 
             FROM usuarios u 
             INNER JOIN roles r ON u.rol_id = r.id 
             WHERE u.correo = ? AND u.estado = 1`,
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuario = usuarios[0];

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                rol: usuario.rol_nombre,
                cooperativa_id: usuario.cooperativa_id
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                correo: usuario.correo,
                rol: usuario.rol_nombre,
                cooperativa_id: usuario.cooperativa_id
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const perfil = async (req, res) => {
    try {
        const [usuarios] = await db.query(
            `SELECT u.id, u.nombres, u.apellidos, u.cedula, u.correo, u.telefono, 
                    u.fecha_registro, r.nombre as rol
             FROM usuarios u
             INNER JOIN roles r ON u.rol_id = r.id
             WHERE u.id = ?`,
            [req.usuario.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(usuarios[0]);

    } catch (error) {
        console.error('Error en perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { registrarUsuario, login, perfil };