const express = require('express');
const router = express.Router();
const { buscarRutas, obtenerAsientos, obtenerPrecioTramo } = require('./busqueda.controller');
const { verificarToken } = require('../../middlewares/auth.middleware');

router.get('/rutas', verificarToken, buscarRutas);
router.get('/asientos/:hoja_ruta_id', verificarToken, obtenerAsientos);
router.get('/precio-tramo', verificarToken, obtenerPrecioTramo);

module.exports = router;