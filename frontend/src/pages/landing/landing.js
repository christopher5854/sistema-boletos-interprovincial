import api from '../../services/api.js';

const cargarCooperativa = async () => {
    try {
        const coop = await api.get('/cooperativa');

        if (coop.nombre) {
            document.getElementById('nombre-cooperativa').textContent = coop.nombre;
            document.title = coop.nombre;
            document.getElementById('footer-texto').textContent = `© ${new Date().getFullYear()} ${coop.nombre}. Todos los derechos reservados.`;
            document.getElementById('hero-titulo').textContent = `Viaja seguro con ${coop.nombre}`;
            document.getElementById('texto-nosotros').textContent = `Somos ${coop.nombre}, una cooperativa de transporte interprovincial comprometida con brindar el mejor servicio a nuestros pasajeros en todo el Ecuador.`;
        }

        if (coop.logo_url) {
            const logo = document.getElementById('logo-img');
            logo.src = coop.logo_url;
            logo.alt = coop.nombre;
            logo.style.display = 'block';
        }

        if (coop.color_primario) {
            document.documentElement.style.setProperty('--primary', coop.color_primario);
        }

        if (coop.color_secundario) {
            document.documentElement.style.setProperty('--secondary', coop.color_secundario);
        }

        if (coop.telefono_soporte) {
            document.getElementById('telefono-soporte').textContent = coop.telefono_soporte;
            document.getElementById('item-telefono').style.display = 'block';
        }

        if (coop.correo_soporte) {
            document.getElementById('correo-soporte').textContent = coop.correo_soporte;
            document.getElementById('item-correo').style.display = 'block';
        }

        if (coop.direccion) {
            document.getElementById('direccion').textContent = coop.direccion;
            document.getElementById('item-direccion').style.display = 'block';
        }

        const redes = document.getElementById('redes');
        if (coop.facebook_url) redes.innerHTML += `<a href="${coop.facebook_url}" target="_blank">Facebook</a>`;
        if (coop.instagram_url) redes.innerHTML += `<a href="${coop.instagram_url}" target="_blank">Instagram</a>`;
        if (coop.twitter_url) redes.innerHTML += `<a href="${coop.twitter_url}" target="_blank">Twitter</a>`;
        if (coop.whatsapp) redes.innerHTML += `<a href="https://wa.me/${coop.whatsapp}" target="_blank">WhatsApp</a>`;

    } catch (error) {
        console.error('Error cargando cooperativa:', error);
    }
};

const cargarCiudades = async () => {
    try {
        const ciudades = await api.get('/ciudades');
        const origen = document.getElementById('origen');
        const destino = document.getElementById('destino');

        ciudades.forEach(c => {
            origen.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
            destino.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
        });
    } catch (error) {
        console.error('Error cargando ciudades:', error);
    }
};

const buscarRutas = async () => {
    const origen_id = document.getElementById('origen').value;
    const destino_id = document.getElementById('destino').value;
    const fecha = document.getElementById('fecha').value;

    if (!origen_id || !destino_id || !fecha) {
        alert('Por favor completa todos los campos');
        return;
    }

    if (origen_id === destino_id) {
        alert('El origen y destino no pueden ser iguales');
        return;
    }

    try {
        const resultados = await api.get(`/busqueda/rutas?origen_id=${origen_id}&destino_id=${destino_id}&fecha=${fecha}`);
        mostrarResultados(resultados);
    } catch (error) {
        console.error('Error buscando rutas:', error);
    }
};

const mostrarResultados = (rutas) => {
    const seccion = document.getElementById('resultados');
    const lista = document.getElementById('listaResultados');

    seccion.style.display = 'block';
    seccion.scrollIntoView({ behavior: 'smooth' });

    if (rutas.length === 0) {
        lista.innerHTML = '<p style="text-align:center;color:#757575;padding:40px">No hay rutas disponibles para esta búsqueda</p>';
        return;
    }

    lista.innerHTML = rutas.map(r => `
        <div class="ruta-card">
            <div class="ruta-info">
                <h3>${r.origen_nombre} → ${r.destino_nombre}</h3>
                <p>🕐 ${r.hora_salida} &nbsp;|&nbsp; 🚌 ${r.cooperativa_nombre} &nbsp;|&nbsp; ${r.tipo_viaje === 'DIRECTO' ? '🚀 Directo' : '🛑 Con paradas'}</p>
                <p>Bus: ${r.numero_disco} - ${r.placa} &nbsp;|&nbsp; Chasis: ${r.marca_chasis || '-'} &nbsp;|&nbsp; Carrocería: ${r.marca_carroceria || '-'}</p>
            </div>
            <div class="ruta-precio">
                <div class="precio">$${r.precio_base}</div>
                <div class="asientos">${r.asientos_disponibles} asientos disponibles</div>
            </div>
            <button class="btn-seleccionar" onclick="seleccionar(${r.hoja_ruta_id}, ${r.frecuencia_id})">
                Seleccionar
            </button>
        </div>
    `).join('');
};

window.seleccionar = (hoja_ruta_id, frecuencia_id) => {
    window.location.href = `/src/pages/cliente/compra.html?hoja_ruta_id=${hoja_ruta_id}&frecuencia_id=${frecuencia_id}`;
};

document.getElementById('fecha').min = new Date().toISOString().split('T')[0];
document.getElementById('btnBuscar').addEventListener('click', buscarRutas);

cargarCooperativa();
cargarCiudades();