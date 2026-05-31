const express = require('express');
const router = express.Router();
const { obtener, actualizar } = require('./cooperativa.controller');
const { verificarToken, verificarRol } = require('../../middlewares/auth.middleware');

router.get('/', verificarToken, obtener);
router.put('/', verificarToken, verificarRol('ADMIN'), actualizar);

module.exports = router;