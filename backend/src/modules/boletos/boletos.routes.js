const express = require('express');
const router = express.Router();
const { listar, obtener, crear, anular, historialUsuario } = require('./boletos.controller');
const { verificarToken, verificarRol } = require('../../middlewares/auth.middleware');

router.get('/', verificarToken, verificarRol('ADMIN', 'OFICINISTA', 'CHOFER'), listar);
router.get('/historial', verificarToken, historialUsuario);
router.get('/:id', verificarToken, obtener);
router.post('/', verificarToken, verificarRol('ADMIN', 'OFICINISTA', 'CHOFER', 'CLIENTE'), crear);
router.patch('/:id/anular', verificarToken, verificarRol('ADMIN', 'OFICINISTA'), anular);

module.exports = router;