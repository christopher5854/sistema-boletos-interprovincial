const express = require('express');
const router = express.Router();
const { registrarUsuario, login } = require('../controllers/authController');

// Definimos los endpoints
router.post('/registro', registrarUsuario);
router.post('/login', login);

module.exports = router;