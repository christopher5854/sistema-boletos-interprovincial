require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importar rutas
const authRoutes = require('./src/modules/auth/auth.Routes');
const cooperativaRoutes = require('./src/modules/cooperativa/cooperativa.routes');
const ciudadesRoutes = require('./src/modules/ciudades/ciudades.routes');
const busesRoutes = require('./src/modules/buses/buses.routes');
const frecuenciasRoutes = require('./src/modules/frecuencias/frecuencias.routes');
const hojasRutaRoutes = require('./src/modules/hojas-ruta/hojas-ruta.routes');
const boletosRoutes = require('./src/modules/boletos/boletos.routes');
const busquedaRoutes = require('./src/modules/busqueda/busqueda.routes');
const escaneoRoutes = require('./src/modules/escaneo/escaneo.routes');
const usuariosRoutes = require('./src/modules/usuarios/usuarios.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/cooperativa', cooperativaRoutes);
app.use('/api/ciudades', ciudadesRoutes);
app.use('/api/buses', busesRoutes);
app.use('/api/frecuencias', frecuenciasRoutes);
app.use('/api/hojas-ruta', hojasRutaRoutes);
app.use('/api/boletos', boletosRoutes);
app.use('/api/busqueda', busquedaRoutes);
app.use('/api/escaneo', escaneoRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Test de salud
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
});