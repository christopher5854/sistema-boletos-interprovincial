const express = require('express');
const router = express.Router();
const { listar, obtener, crear, actualizar, eliminar } = require('./buses.controller');
const { verificarToken, verificarRol } = require('../../middlewares/auth.middleware');

router.get('/', verificarToken, listar);
router.get('/:id', verificarToken, obtener);
router.post('/', verificarToken, verificarRol('ADMIN', 'COOPERATIVA'), crear);
router.put('/:id', verificarToken, verificarRol('ADMIN', 'COOPERATIVA'), actualizar);
router.delete('/:id', verificarToken, verificarRol('ADMIN', 'COOPERATIVA'), eliminar);

module.exports = router;