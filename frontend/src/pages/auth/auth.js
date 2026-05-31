import api from '../../services/api.js';
import { guardarSesion, redirigirSegunRol, estaAutenticado } from '../../utils/auth.js';

if (estaAutenticado()) redirigirSegunRol();

const cargarCooperativa = async () => {
    try {
        const coop = await api.get('/cooperativa');
        if (coop.nombre) {
            document.getElementById('nombre-cooperativa').textContent = coop.nombre;
            document.title = `Iniciar Sesión - ${coop.nombre}`;
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

document.getElementById('btnLogin').addEventListener('click', async () => {
    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');
    const btn = document.getElementById('btnLogin');

    errorMsg.style.display = 'none';

    if (!correo || !password) {
        errorMsg.textContent = 'Por favor completa todos los campos';
        errorMsg.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Ingresando...';

    try {
        const res = await api.post('/auth/login', { correo, password });

        if (res.error) {
            errorMsg.textContent = res.error;
            errorMsg.style.display = 'block';
            return;
        }

        guardarSesion(res.token, res.usuario);
        redirigirSegunRol();

    } catch (error) {
        errorMsg.textContent = 'Error de conexión. Intenta nuevamente.';
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Iniciar Sesión';
    }
});

cargarCooperativa();