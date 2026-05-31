const express = require('express');
const router = express.Router();
const { listar, obtener, crear, generarAutomatica, actualizarEstado } = require('./hojas-ruta.controller');
const { verificarToken, verificarRol } = require('../../middlewares/auth.middleware');

router.get('/', verificarToken, listar);
router.get('/:id', verificarToken, obtener);
router.post('/', verificarToken, verificarRol('ADMIN', 'OFICINISTA'), crear);
router.post('/generar-automatica', verificarToken, verificarRol('ADMIN'), generarAutomatica);
router.patch('/:id/estado', verificarToken, verificarRol('ADMIN', 'OFICINISTA', 'CHOFER'), actualizarEstado);

module.exports = router;