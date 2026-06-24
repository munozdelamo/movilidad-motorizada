
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

const listaEnlaces = ["indexUsuario.html", "sedes.html", "pacientes.html", "gestion.html"];
const nombreEnlaces = ["Datos Pacientes", "Sedes", "Pacientes", "Gestión"];

document.addEventListener("DOMContentLoaded", () => {
    agregarOpcionesAdmin();
    establecerUsuario();
    conectarLogout();
});

// ✅ Logout
function conectarLogout() {
    document.getElementById("cerrarSesionBtn").addEventListener("click", () => {
        localStorage.removeItem("usuarioActivo");
        window.location.href = "login.html";
    });
}
function agregarOpcionesAdmin() {

    const rol = localStorage.getItem("rolActivo");
    const menu = document.querySelector(".menu ul");
    let li = document.createElement("li");
    if (rol === "admin") {
        for (let i = 0; i < listaEnlaces.length; i++) {
            li = document.createElement("li");
            const enlace = listaEnlaces[i];
            const nombre = nombreEnlaces[i];
            li.innerHTML = `
                <a href="${enlace}">${nombre}</a>
            `;
            menu.appendChild(li);
        }
    }
}

function establecerUsuario() {
    const usuarioActivo = localStorage.getItem("usuarioActivo");

    if (usuarioActivo) {
        
        // Insertar el nombre en el HTML
        document.getElementById("nombreUsuario").textContent = usuarioActivo;
    }
}
const FIREBASE_URL = "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app";

/* Genera un código aleatorio de 4 dígitos */
function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* Obtiene todos los códigos existentes en la base de datos */
async function obtenerCodigosExistentes() {
  const response = await fetch(`${FIREBASE_URL}/pacientes/.json`);
  const data = await response.json();

  const codigos = [];
console.log('Datos obtenidos de Firebase:', data); // Depuración
  if (data) {
    for (const paciente in data) {
      if (data[paciente].pin ) {
        codigos.push(data[paciente].pin);
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

/* Crear paciente */

const BASE_URL = "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app";

const form = document.getElementById("pacienteForm");
const lista = document.getElementById("listaPacientes");

const pacienteIdInput = document.getElementById("pacienteId");
const nombreInput = document.getElementById("nombrePaciente");
const ssidInput = document.getElementById("SSID");
const claveInput = document.getElementById("clave");
const sedeSelect = document.getElementById("sedeSelect");
const formTitle = document.getElementById("formTitle");

/* ===============================
   CARGAR SEDES
================================ */
async function cargarSedes() {
  const res = await fetch(`${BASE_URL}/sedes.json`);
  const sedes = await res.json();

  sedeSelect.innerHTML = `<option value="">Selecciona una sede</option>`;

  for (const id in sedes) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = sedes[id].nombre;
    sedeSelect.appendChild(option);
  }
}

/* ===============================
   CARGAR PACIENTES
================================ */
async function cargarPacientes() {
  lista.innerHTML = "";

  const resPac = await fetch(`${BASE_URL}/pacientes.json`);
  const resSed = await fetch(`${BASE_URL}/sedes.json`);

  const pacientes = await resPac.json();
  const sedes = await resSed.json();

  if (!pacientes) return;

  for (const id in pacientes) {
    const p = pacientes[id];
    const sedeNombre = sedes?.[p.sedeId]?.nombre || "Sin sede";

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${p.nombre}</strong> – ${sedeNombre}<br>
      SSID: ${p.ssid}<br>
      <button class="icon-btn edit" onclick="editarPaciente('${id}')">✏️</button>
      <button class="icon-btn delete" onclick="borrarPaciente('${id}')">🗑</button>
      <span style="font-size: 12px; color: #555;">PIN: ${p.pin}</span>
    `;
    lista.appendChild(li);
  }
}

/* ===============================
   GUARDAR (ALTA / MODIFICACIÓN)
================================ */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const paciente = {
    nombre: nombreInput.value,
    ssid: ssidInput.value,
    clave: claveInput.value,
    sedeId: sedeSelect.value,
    pin: await generarCodigoUnico()
  };

  const id = pacienteIdInput.value;

  if (id) {
    await fetch(`${BASE_URL}/pacientes/${id}.json`, {
      method: "PUT",
      body: JSON.stringify(paciente)
    });
  } else {
    await fetch(`${BASE_URL}/pacientes.json`, {
      method: "POST",
      body: JSON.stringify(paciente)
    });
  }

  form.reset();
  pacienteIdInput.value = "";
  formTitle.textContent = "Alta de paciente";
  cargarPacientes();
});

/* ===============================
   EDITAR
================================ */
window.editarPaciente = async (id) => {
  const res = await fetch(`${BASE_URL}/pacientes/${id}.json`);
  const p = await res.json();

  pacienteIdInput.value = id;
  nombreInput.value = p.nombre;
  ssidInput.value = p.ssid;
  claveInput.value = p.clave;
  sedeSelect.value = p.sedeId;

  formTitle.textContent = "Modificar paciente";
};

/* ===============================
   BORRAR
================================ */
window.borrarPaciente = async (id) => {
  if (!confirm("¿Eliminar paciente?")) return;

  await fetch(`${BASE_URL}/pacientes/${id}.json`, {
    method: "DELETE"
  });

  cargarPacientes();
};

/* ===============================
   INICIO
================================ */
cargarSedes();
cargarPacientes();