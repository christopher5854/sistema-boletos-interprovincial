const express = require('express');
const router = express.Router();
const { listar, crear, actualizar, eliminar } = require('./ciudades.controller');
const { verificarToken, verificarRol } = require('../../middlewares/auth.middleware');

router.get('/', verificarToken, listar);
router.post('/', verificarToken, verificarRol('ADMIN'), crear);
router.put('/:id', verificarToken, verificarRol('ADMIN'), actualizar);
router.delete('/:id', verificarToken, verificarRol('ADMIN'), eliminar);

module.exports = router;