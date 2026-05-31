const express = require('express');
const router = express.Router();
const { listar, obtener, crear, actualizar, eliminar } = require('./frecuencias.controller');
const { verificarToken, verificarRol } = require('../../middlewares/auth.middleware');

router.get('/', verificarToken, listar);
router.get('/:id', verificarToken, obtener);
router.post('/', verificarToken, verificarRol('ADMIN'), crear);
router.put('/:id', verificarToken, verificarRol('ADMIN'), actualizar);
router.delete('/:id', verificarToken, verificarRol('ADMIN'), eliminar);

module.exports = router;