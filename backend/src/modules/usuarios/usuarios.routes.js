const express = require('express');
const router = express.Router();
const { listar, obtener, crear, actualizar, cambiarPassword, eliminar } = require('./usuarios.controller');
const { verificarToken, verificarRol } = require('../../middlewares/auth.middleware');

router.get('/', verificarToken, verificarRol('ADMIN'), listar);
router.get('/:id', verificarToken, obtener);
router.post('/', verificarToken, verificarRol('ADMIN'), crear);
router.put('/:id', verificarToken, verificarRol('ADMIN'), actualizar);
router.patch('/:id/password', verificarToken, verificarRol('ADMIN'), cambiarPassword);
router.delete('/:id', verificarToken, verificarRol('ADMIN'), eliminar);

module.exports = router;