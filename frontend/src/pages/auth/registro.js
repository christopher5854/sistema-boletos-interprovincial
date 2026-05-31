import api from '../../services/api.js';
import { estaAutenticado, redirigirSegunRol } from '../../utils/auth.js';

if (estaAutenticado()) redirigirSegunRol();

const cargarCooperativa = async () => {
    try {
        const coop = await api.get('/cooperativa');
        if (coop.nombre) {
            document.getElementById('nombre-cooperativa').textContent = coop.nombre;
            document.title = `Registro - ${coop.nombre}`;
        }
        if (coop.logo_url) {
            const logo = document.getElementById('logo-img');
            logo.src = coop.logo_url;
            logo.style.display = 'block';
        }
        if (coop.color_primario) document.documentElement.style.setProperty('--primary', coop.color_primario);
        if (coop.color_secundario) document.documentElement.style.setProperty('--secondary', coop.color_secundario);
    } catch (error) {
        console.error('Error cargando cooperativa:', error);
    }
};

document.getElementById('togglePassword').addEventListener('click', () => {
    const input = document.getElementById('password');
    input.type = input.type === 'password' ? 'text' : 'password';
});

document.getElementById('btnRegistro').addEventListener('click', async () => {
    const nombres = document.getElementById('nombres').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const cedula = document.getElementById('cedula').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;

    const errorMsg = document.getElementById('error-msg');
    const successMsg = document.getElementById('success-msg');
    const btn = document.getElementById('btnRegistro');

    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    if (!nombres || !apellidos || !cedula || !correo || !password) {
        errorMsg.textContent = 'Por favor completa todos los campos obligatorios';
        errorMsg.style.display = 'block';
        return;
    }

    if (cedula.length !== 10) {
        errorMsg.textContent = 'La cédula debe tener 10 dígitos';
        errorMsg.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Creando cuenta...';

    try {
        const res = await api.post('/auth/registro', {
            nombres, apellidos, cedula, telefono, correo, password, rol_id: 4
        });

        if (res.error) {
            errorMsg.textContent = res.error;
            errorMsg.style.display = 'block';
            return;
        }

        successMsg.textContent = 'Cuenta creada correctamente. Redirigiendo...';
        successMsg.style.display = 'block';

        setTimeout(() => {
            window.location.href = '/src/pages/auth/login.html';
        }, 1500);

    } catch (error) {
        errorMsg.textContent = 'Error de conexión. Intenta nuevamente.';
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Crear cuenta';
    }
});

cargarCooperativa();