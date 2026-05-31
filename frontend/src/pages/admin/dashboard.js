import api from '../../services/api.js';
import { getUsuario, cerrarSesion, estaAutenticado, getRol } from '../../utils/auth.js';

if (!estaAutenticado() || !['ADMIN', 'COOPERATIVA'].includes(getRol())) {
    window.location.href = '/src/pages/auth/login.html';
}

const usuario = getUsuario();
document.getElementById('usuario-nombre').textContent = `${usuario.nombres}`;

const cargarCooperativa = async () => {
    try {
        const coop = await api.get('/cooperativa');
        if (coop.nombre) document.getElementById('nombre-cooperativa').textContent = coop.nombre;
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

const pages = {
    inicio: async () => {
        const [buses, usuarios, frecuencias, ciudades] = await Promise.all([
            api.get('/buses'),
            api.get('/usuarios'),
            api.get('/frecuencias'),
            api.get('/ciudades')
        ]);

        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">🚌</div>
                    <div class="stat-info">
                        <h3>${buses.length || 0}</h3>
                        <p>Buses activos</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <h3>${usuarios.length || 0}</h3>
                        <p>Usuarios registrados</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🗓️</div>
                    <div class="stat-info">
                        <h3>${frecuencias.length || 0}</h3>
                        <p>Frecuencias</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🏙️</div>
                    <div class="stat-info">
                        <h3>${ciudades.length || 0}</h3>
                        <p>Ciudades</p>
                    </div>
                </div>
            </div>
        `;
    },

    ciudades: async () => {
        const ciudades = await api.get('/ciudades');
        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Ciudades</h3>
                    <button class="btn-add" onclick="abrirModalCiudad()">+ Agregar ciudad</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Provincia</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ciudades.map(c => `
                            <tr>
                                <td>${c.nombre}</td>
                                <td>${c.provincia}</td>
                                <td><span class="badge badge-success">Activa</span></td>
                                <td>
                                    <button class="btn-action btn-edit" onclick="editarCiudad(${c.id}, '${c.nombre}', '${c.provincia}')">Editar</button>
                                    <button class="btn-action btn-delete" onclick="eliminarCiudad(${c.id})">Eliminar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="modal-ciudad"></div>
        `;
    },

    usuarios: async () => {
        const usuarios = await api.get('/usuarios');
        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Usuarios</h3>
                    <button class="btn-add" onclick="abrirModalUsuario()">+ Agregar usuario</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Cédula</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${usuarios.map(u => `
                            <tr>
                                <td>${u.nombres} ${u.apellidos}</td>
                                <td>${u.cedula}</td>
                                <td>${u.correo}</td>
                                <td><span class="badge badge-info">${u.rol}</span></td>
                                <td>
                                    <button class="btn-action btn-delete" onclick="eliminarUsuario(${u.id})">Desactivar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="modal-usuario"></div>
        `;
    },

    buses: async () => {
        const buses = await api.get('/buses');
        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Buses</h3>
                    <button class="btn-add" onclick="window.location.href='buses.html'">+ Agregar bus</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Disco</th>
                            <th>Placa</th>
                            <th>Chasis</th>
                            <th>Carrocería</th>
                            <th>Capacidad</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${buses.length === 0 ? `
                            <tr><td colspan="6">
                                <div class="empty-state">
                                    <span>🚌</span>
                                    <p>No hay buses registrados</p>
                                </div>
                            </td></tr>
                        ` : buses.map(b => `
                            <tr>
                                <td>${b.numero_disco}</td>
                                <td>${b.placa}</td>
                                <td>${b.marca_chasis || '-'}</td>
                                <td>${b.marca_carroceria || '-'}</td>
                                <td>${b.capacidad_total}</td>
                                <td>
                                    <button class="btn-action btn-delete" onclick="eliminarBus(${b.id})">Desactivar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    frecuencias: async () => {
        const frecuencias = await api.get('/frecuencias');
        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Frecuencias</h3>
                    <button class="btn-add" onclick="abrirModalFrecuencia()">+ Agregar frecuencia</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Resolución ANT</th>
                            <th>Origen</th>
                            <th>Destino</th>
                            <th>Hora</th>
                            <th>Tipo</th>
                            <th>Precio</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${frecuencias.length === 0 ? `
                            <tr><td colspan="8">
                                <div class="empty-state">
                                    <span>🗓️</span>
                                    <p>No hay frecuencias registradas</p>
                                </div>
                            </td></tr>
                        ` : frecuencias.map(f => `
                            <tr>
                                <td>${f.resolucion_ant}</td>
                                <td>${f.origen_nombre}</td>
                                <td>${f.destino_nombre}</td>
                                <td>${f.hora_salida}</td>
                                <td><span class="badge badge-info">${f.tipo_viaje}</span></td>
                                <td>$${f.precio_base}</td>
                                <td><span class="badge ${f.activa ? 'badge-success' : 'badge-danger'}">${f.activa ? 'Activa' : 'Inactiva'}</span></td>
                                <td>
                                    <button class="btn-action btn-delete" onclick="eliminarFrecuencia(${f.id})">Desactivar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="modal-frecuencia"></div>
        `;
    },

    'hojas-ruta': async () => {
        const hoy = new Date().toISOString().split('T')[0];
        const hojas = await api.get(`/hojas-ruta?fecha=${hoy}`);
        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Hojas de Ruta - Hoy</h3>
                    <button class="btn-add" onclick="abrirModalHoja()">+ Agregar hoja</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Bus</th>
                            <th>Ruta</th>
                            <th>Hora</th>
                            <th>Chofer</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hojas.length === 0 ? `
                            <tr><td colspan="7">
                                <div class="empty-state">
                                    <span>📋</span>
                                    <p>No hay hojas de ruta para hoy</p>
                                </div>
                            </td></tr>
                        ` : hojas.map(h => `
                            <tr>
                                <td>${h.fecha}</td>
                                <td>${h.numero_disco} - ${h.placa}</td>
                                <td>${h.origen_nombre} → ${h.destino_nombre}</td>
                                <td>${h.hora_salida}</td>
                                <td>${h.chofer_nombre || '-'}</td>
                                <td><span class="badge badge-info">${h.estado}</span></td>
                                <td>
                                    <button class="btn-action btn-edit" onclick="verHoja(${h.id})">Ver</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="modal-hoja"></div>
        `;
    },

    boletos: async () => {
        const boletos = await api.get('/boletos');
        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Boletos</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Pasajero</th>
                            <th>Ruta</th>
                            <th>Asiento</th>
                            <th>Precio</th>
                            <th>Estado</th>
                            <th>Origen venta</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${boletos.length === 0 ? `
                            <tr><td colspan="7">
                                <div class="empty-state">
                                    <span>🎫</span>
                                    <p>No hay boletos registrados</p>
                                </div>
                            </td></tr>
                        ` : boletos.map(b => `
                            <tr>
                                <td>${b.codigo_boleto}</td>
                                <td>${b.nombres_pasajero} ${b.apellidos_pasajero}</td>
                                <td>${b.origen_nombre} → ${b.destino_nombre}</td>
                                <td>${b.numero_asiento}</td>
                                <td>$${b.precio_final}</td>
                                <td><span class="badge badge-${b.estado === 'PAGADO' ? 'success' : b.estado === 'ANULADO' ? 'danger' : 'warning'}">${b.estado}</span></td>
                                <td>${b.origen_venta}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
};

const cargarPagina = async (page) => {
    const content = document.getElementById('content');
    const title = document.getElementById('page-title');

    const titles = {
        inicio: 'Inicio',
        cooperativa: 'Cooperativa',
        usuarios: 'Usuarios',
        buses: 'Buses',
        ciudades: 'Ciudades',
        frecuencias: 'Frecuencias',
        'hojas-ruta': 'Hojas de Ruta',
        boletos: 'Boletos'
    };

    title.textContent = titles[page] || page;
    content.innerHTML = '<div class="empty-state"><span>⏳</span><p>Cargando...</p></div>';

    try {
        if (pages[page]) {
            content.innerHTML = await pages[page]();
        }
    } catch (error) {
        content.innerHTML = '<div class="empty-state"><span>❌</span><p>Error al cargar los datos</p></div>';
        console.error('Error cargando página:', error);
    }
};

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        cargarPagina(item.dataset.page);
    });
});

document.getElementById('btnLogout').addEventListener('click', cerrarSesion);

document.getElementById('btnMenu').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

window.eliminarCiudad = async (id) => {
    if (!confirm('¿Desactivar esta ciudad?')) return;
    await api.delete(`/ciudades/${id}`);
    cargarPagina('ciudades');
};

window.abrirModalCiudad = () => {
    document.getElementById('modal-ciudad').innerHTML = `
        <div class="modal-overlay" onclick="cerrarModal(event)">
            <div class="modal">
                <h3>Agregar Ciudad</h3>
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" id="ciudad-nombre" placeholder="Quito">
                </div>
                <div class="form-group">
                    <label>Provincia</label>
                    <input type="text" id="ciudad-provincia" placeholder="Pichincha">
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel" onclick="document.getElementById('modal-ciudad').innerHTML=''">Cancelar</button>
                    <button class="btn-save" onclick="guardarCiudad()">Guardar</button>
                </div>
            </div>
        </div>
    `;
};

window.editarCiudad = (id, nombre, provincia) => {
    document.getElementById('modal-ciudad').innerHTML = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>Editar Ciudad</h3>
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" id="ciudad-nombre" value="${nombre}">
                </div>
                <div class="form-group">
                    <label>Provincia</label>
                    <input type="text" id="ciudad-provincia" value="${provincia}">
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel" onclick="document.getElementById('modal-ciudad').innerHTML=''">Cancelar</button>
                    <button class="btn-save" onclick="actualizarCiudad(${id})">Guardar</button>
                </div>
            </div>
        </div>
    `;
};

window.guardarCiudad = async () => {
    const nombre = document.getElementById('ciudad-nombre').value.trim();
    const provincia = document.getElementById('ciudad-provincia').value.trim();
    if (!nombre || !provincia) return alert('Completa todos los campos');
    await api.post('/ciudades', { nombre, provincia });
    document.getElementById('modal-ciudad').innerHTML = '';
    cargarPagina('ciudades');
};

window.actualizarCiudad = async (id) => {
    const nombre = document.getElementById('ciudad-nombre').value.trim();
    const provincia = document.getElementById('ciudad-provincia').value.trim();
    if (!nombre || !provincia) return alert('Completa todos los campos');
    await api.put(`/ciudades/${id}`, { nombre, provincia });
    document.getElementById('modal-ciudad').innerHTML = '';
    cargarPagina('ciudades');
};

window.eliminarUsuario = async (id) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    await api.delete(`/usuarios/${id}`);
    cargarPagina('usuarios');
};

window.abrirModalUsuario = async () => {
    document.getElementById('modal-usuario').innerHTML = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>Agregar Usuario</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombres</label>
                        <input type="text" id="u-nombres">
                    </div>
                    <div class="form-group">
                        <label>Apellidos</label>
                        <input type="text" id="u-apellidos">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Cédula</label>
                        <input type="text" id="u-cedula" maxlength="10">
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="text" id="u-telefono">
                    </div>
                </div>
                <div class="form-group">
                    <label>Correo</label>
                    <input type="email" id="u-correo">
                </div>
                <div class="form-group">
                    <label>Contraseña</label>
                    <input type="password" id="u-password">
                </div>
                <div class="form-group">
                    <label>Rol</label>
                    <select id="u-rol">
                        <option value="2">Cooperativa</option>
                        <option value="3">Oficinista</option>
                        <option value="4">Cliente</option>
                        <option value="5">Chofer</option>
                        <option value="6">Ayudante</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel" onclick="document.getElementById('modal-usuario').innerHTML=''">Cancelar</button>
                    <button class="btn-save" onclick="guardarUsuario()">Guardar</button>
                </div>
            </div>
        </div>
    `;
};

window.guardarUsuario = async () => {
    const data = {
        nombres: document.getElementById('u-nombres').value.trim(),
        apellidos: document.getElementById('u-apellidos').value.trim(),
        cedula: document.getElementById('u-cedula').value.trim(),
        telefono: document.getElementById('u-telefono').value.trim(),
        correo: document.getElementById('u-correo').value.trim(),
        password: document.getElementById('u-password').value,
        rol_id: parseInt(document.getElementById('u-rol').value)
    };
    if (!data.nombres || !data.apellidos || !data.cedula || !data.correo || !data.password) {
        return alert('Completa todos los campos obligatorios');
    }
    const res = await api.post('/usuarios', data);
    if (res.error) return alert(res.error);
    document.getElementById('modal-usuario').innerHTML = '';
    cargarPagina('usuarios');
};

window.eliminarBus = async (id) => {
    if (!confirm('¿Desactivar este bus?')) return;
    await api.delete(`/buses/${id}`);
    cargarPagina('buses');
};

window.eliminarFrecuencia = async (id) => {
    if (!confirm('¿Desactivar esta frecuencia?')) return;
    await api.delete(`/frecuencias/${id}`);
    cargarPagina('frecuencias');
};

window.verHoja = (id) => {
    window.location.href = `hojas-ruta.html?id=${id}`;
};

window.cerrarModal = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.parentElement.innerHTML = '');
    }
};

cargarCooperativa();
cargarPagina('inicio');