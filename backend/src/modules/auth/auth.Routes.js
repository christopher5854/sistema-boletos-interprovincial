const express = require('express');
const router = express.Router();
const { registrarUsuario, login, perfil } = require('./auth.Controller');
const { verificarToken } = require('../../middlewares/auth.middleware');

router.post('/registro', registrarUsuario);
router.post('/login', login);
router.get('/perfil', verificarToken, perfil);

module.exports = router;