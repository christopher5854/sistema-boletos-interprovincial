document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // Evita que la página se recargue

  const nombres = document.getElementById('nombres').value;
  const apellidos = document.getElementById('apellidos').value;
  const cedula = document.getElementById('cedula').value;
  const correo = document.getElementById('correo').value;
  const password = document.getElementById('password').value;

  try {
    // Apuntamos al puerto 3000 de nuestro backend
    const response = await fetch('http://localhost:3000/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombres,
        apellidos,
        cedula,
        correo,
        password,
        rol_id: 1, // 1 corresponde a 'ADMIN_COOP' en nuestra tabla de roles
        cooperativa_id: null // Nulo temporalmente hasta crear el módulo de cooperativas
      })
    });

    const data = await response.json();

    const divMensaje = document.getElementById('mensaje');
    if (response.ok) {
      divMensaje.style.color = 'green';
      divMensaje.innerText = `✅ Éxito: ${data.mensaje}`;
      document.getElementById('registroForm').reset();
    } else {
      divMensaje.style.color = 'red';
      divMensaje.innerText = `❌ Error: ${data.error}`;
    }
  } catch (error) {
    document.getElementById('mensaje').innerText = '❌ Error crítico: ¿Está encendido el servidor backend?';
  }
});