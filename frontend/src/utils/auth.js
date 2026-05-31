export const getToken = () => localStorage.getItem('token');
export const getUsuario = () => JSON.parse(localStorage.getItem('usuario') || '{}');
export const getRol = () => getUsuario().rol || null;

export const guardarSesion = (token, usuario) => {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
};

export const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/';
};

export const estaAutenticado = () => !!getToken();

export const redirigirSegunRol = () => {
    const rol = getRol();
    const rutas = {
        'ADMIN': '/pages/admin/dashboard.html',
        'OFICINISTA': '/pages/oficinista/dashboard.html',
        'CLIENTE': '/pages/cliente/dashboard.html',
        'CHOFER': '/pages/chofer/dashboard.html',
        'COOPERATIVA': '/pages/admin/dashboard.html'
    };
    window.location.href = rutas[rol] || '/';
};