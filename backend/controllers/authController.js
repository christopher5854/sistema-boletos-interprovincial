const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Registro de un nuevo usuario
const registrarUsuario = async (req, res) => {
    try {
        const { nombres, apellidos, cedula, correo, password, rol_id, cooperativa_id } = req.body;

        // 1. Verificar si el usuario o la cédula ya existen
        const [existeUsuario] = await db.query(
            'SELECT id FROM usuarios WHERE correo = ? OR cedula = ?', 
            [correo, cedula]
        );

        if (existeUsuario.length > 0) {
            return res.status(400).json({ error: 'El correo o la cédula ya están registrados' });
        }

        // 2. Encriptar la contraseña (10 saltos de seguridad es el estándar)
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        // 3. Guardar en la base de datos
        const [resultado] = await db.query(
            `INSERT INTO usuarios (nombres, apellidos, cedula, correo, password, rol_id, cooperativa_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nombres, apellidos, cedula, correo, passwordEncriptada, rol_id, cooperativa_id || null]
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

// Login de usuario
const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        // 1. Buscar al usuario en la base de datos
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        
        if (usuarios.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuario = usuarios[0];

        // 2. Comparar la contraseña ingresada con la encriptada
        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 3. Generar el Token de Sesión (JWT)
        const token = jwt.sign(
            { 
                id: usuario.id, 
                rol: usuario.rol_id, 
                cooperativa: usuario.cooperativa_id 
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' } // El turno de un oficinista o ayudante dura aprox 8 horas
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                nombres: usuario.nombres,
                rol_id: usuario.rol_id
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { registrarUsuario, login };