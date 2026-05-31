const express = require('express');
const router = express.Router();
const { escanear, historialEscaneos } = require('./escaneo.controller');
const { verificarToken, verificarRol } = require('../../middlewares/auth.middleware');

router.post('/', verificarToken, verificarRol('CHOFER', 'AYUDANTE'), escanear);
router.get('/historial', verificarToken, verificarRol('ADMIN', 'OFICINISTA', 'CHOFER'), historialEscaneos);

module.exports = router;