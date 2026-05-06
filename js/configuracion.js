
/*document.getElementById('altaUsuarioForm').addEventListener('submit', function (e) {
  e.preventDefault(); // Evita el envío automático del formulario

  const nombre = document.getElementById('nombreUsuario').value.trim();
  const ssid = document.getElementById('SSID').value.trim();
  const clave = document.getElementById('clave').value.trim();

  if (nombre === '' || ssid === '' || clave === '') {
    alert('⚠️ Todos los campos son obligatorios');
    return;
  }

  // Si llega aquí, el formulario es válido
  alert('✅ Usuario creado correctamente');

  // Aquí puedes llamar a tu lógica de creación de usuario
  // crearUsuario(nombre, ssid, clave);

  // Limpieza opcional del formulario
  this.reset();
});
*/

const FIREBASE_URL = "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app";
const BASE_URL =     "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app";

/* Genera un código aleatorio de 4 dígitos */
function generarCodigo() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/* Obtiene todos los códigos existentes en la base de datos */
async function obtenerCodigosExistentes() {
  const response = await fetch(`${FIREBASE_URL}/.json`);
  const data = await response.json();

  const codigos = [];
console.log('Datos obtenidos de Firebase:', data); // Depuración
  if (data) {
    for (const usuario in data) {
      if (data[usuario].perfil && data[usuario].perfil.codigo) {
        codigos.push(data[usuario].perfil.codigo);
      }
    }
  }
  return codigos;
}

/* Genera un código único */
async function generarCodigoUnico() {
  const codigosExistentes = await obtenerCodigosExistentes();
  let codigo;

  do {
    codigo = generarCodigo();
  } while (codigosExistentes.includes(codigo));

  return codigo;
}

/* Crear usuario */
document.getElementById('altaUsuarioForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const nombreUsuario = document.getElementById('nombreUsuario').value.trim();
  const ssid = document.getElementById('SSID').value.trim();
  const clave = document.getElementById('clave').value.trim();

  if (!nombreUsuario || !ssid || !clave) {
    alert('⚠️ Todos los campos son obligatorios');
    return;
  }

  try {
    const codigoUnico = await generarCodigoUnico();

    const nuevoUsuario = {
      perfil: {
        SSID: ssid,
        ClaveWifi: clave,
        codigo: codigoUnico
      }
    };

    await fetch(`${FIREBASE_URL}/${nombreUsuario}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoUsuario)
    });

    alert(`✅ Usuario creado correctamente\nCódigo asignado: ${codigoUnico}`);
    this.reset();

  } catch (error) {
    console.error(error);
    alert('❌ Error al crear el usuario');
  }
});
