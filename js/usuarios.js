//const BASE_URL =
//  "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app";

const BASE_URL = "https://proyecto-movilidad-18726-default-rtdb.europe-west1.firebasedatabase.app";

const DEFAULT_PASSWORD = "1234";
const form = document.getElementById("usuarioForm");
const lista = document.getElementById("listaUsuarios");

const usuarioIdInput = document.getElementById("usuarioId");
const nombreInput = document.getElementById("nombreUsuario");

const centroInput = document.getElementById("centro");
const formTitle = document.getElementById("formTitle");

const SECRET_KEY = "movilidad_motorizada_2026";

function encriptarPassword(password) {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
}

const listaEnlaces = ["sedes.html", "pacientes.html", "gestion.html"];
const nombreEnlaces = ["Sedes", "Pacientes", "Gestión"];

document.addEventListener("DOMContentLoaded", () => {
    establecerUsuario();
    //mostrarPacientes();
    conectarLogout();
    agregarOpcionesAdmin();
    cargarUsuarios();
});

// ✅ Logout
function conectarLogout() {
    document.getElementById("cerrarSesionBtn").addEventListener("click", () => {
        localStorage.removeItem("usuarioActivo");
        window.location.href = "login.html";
    });
}

function establecerUsuario() {
    const usuarioActivo = localStorage.getItem("usuarioActivo");

    if (usuarioActivo) {
        
        // Insertar el nombre en el HTML
        document.getElementById("usuarioSesion").textContent = usuarioActivo;
    }
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

/* ===============================
   GENERAR USUARIO
================================ */

let existingHandles = [];

//const handle = await generateHandle("Ángel Muñoz", existingHandles);
//console.log(handle); // -> "juan3"

// Normaliza texto: quita acentos, espacios raros, etc.
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD") // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // elimina acentos
    .replace(/[^a-z0-9\s-]/g, "") // solo letras y números
    .replace(/\s+/g, " ") // espacios múltiples → uno
    .trim();
}

// Convierte a slug tipo "juan-munoz"
function slugify(text) {
  return normalizeText(text)
    .replace(/\s+/g, "-") // espacios → guiones
    .replace(/-+/g, "-"); // evita guiones repetidos
}

// Genera handle único
async function generateHandle(name, existingHandles = []) {
  let baseHandle = slugify(name);

  // fallback si el nombre queda vacío
  if (!baseHandle) {
    baseHandle = "user";
  }

  let handle = baseHandle;
  let counter = 1;

  const exists = (h) => existingHandles.includes(h);

  while (exists(handle)) {
    handle = `${baseHandle}${counter}`;
    counter++;
  }

  return handle;
}


/* ===============================
   BORRAR
================================ */
window.borrarUsuario = async (id) => {
  if (!confirm("¿Eliminar este usuario?")) return;

  await fetch(`${BASE_URL}/${id}.json`, {
    method: "DELETE"
  });

  cargarUsuarios();
};

/* ===============================
   INICIO
================================ */
//cargarUsuarios();

async function cargarSedes() {
  const handle = await generateHandle("Ángel Muñoz", existingHandles);
    console.log(handle); // -> "juan3"

  const res = await fetch(`${BASE_URL}/sedes.json`);
  const sedes = await res.json();

  sedeSelect.innerHTML = `<option value="">Selecciona un centro</option>`;

  for (const id in sedes) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = sedes[id].nombre;
    sedeSelect.appendChild(option);
  }
}

async function cargarUsuarios() {
  lista.innerHTML = "";
  console.log("Cargando usuarios..."); // Depuración
  const [resUsuarios, resSedes] = await Promise.all([
    fetch(`${BASE_URL}/usuarios.json`),
    fetch(`${BASE_URL}/sedes.json`)
  ]);

  const usuarios = await resUsuarios.json();
  const sedes = await resSedes.json();

  if (!usuarios) return;

  for (const id in usuarios) {
    const u = usuarios[id];
    const sedeNombre = sedes?.[u.sedeId]?.nombre || "Sin centro";
    existingHandles.push(u.handle); // Para evitar duplicados al generar nuevos handles
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${u.nombre}</strong><br>
      <strong>Login: ${u.handle}</strong><br>
      Centro: ${sedeNombre}<br>
      <button class="icon-btn edit" onclick="editarUsuario('${id}')">✏️</button>
      <button class="icon-btn delete" onclick="borrarUsuario('${id}')">🗑️</button>
      <button class="icon-btn reset" onclick="resetUsuario('${id}')">Reset password 🔄</button>
    `;

    lista.appendChild(li);
  }
}

window.editarUsuario = async (id) => {
  const res = await fetch(`${BASE_URL}/usuarios/${id}.json`);
  const u = await res.json();

  usuarioIdInput.value = id;
  nombreInput.value = u.nombre;
  sedeSelect.value = u.sedeId;

  formTitle.textContent = "Modificar usuario";
};

window.resetUsuario = async (id) => {
  if (confirm("¿Seguro que quieres resetear la contraseña deeste usuario?")) {
    console.log("Reseteando contraseña:", id);

    const res = await fetch(`${BASE_URL}/usuarios/${id}.json`);
    const u = await res.json();
    u.primerLogin = true;
    await fetch(`${BASE_URL}/usuarios/${id}.json`, {
      method: "PATCH",
      body: JSON.stringify(u)
  });
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = {
    nombre: nombreInput.value.trim(),
    sedeId: sedeSelect.value,
    password: encriptarPassword(DEFAULT_PASSWORD),
    primerLogin: true,
    handle: await generateHandle(nombreInput.value.trim(), existingHandles)
  };

  const id = usuarioIdInput.value;

  if (id) {
    await fetch(`${BASE_URL}/usuarios/${id}.json`, {
      method: "PUT",
      body: JSON.stringify(usuario)
    });
  } else {
    await fetch(`${BASE_URL}/usuarios.json`, {
      method: "POST",
      body: JSON.stringify(usuario)
    });
  }

  form.reset();
  usuarioIdInput.value = "";
  formTitle.textContent = "Alta de usuario";
  console.log("Antes de cargar usuario 1"); // Depuración 
  cargarUsuarios();
});


window.borrarUsuario = async (id) => {
  if (!confirm("¿Eliminar este usuario?")) return;

  await fetch(`${BASE_URL}/usuarios/${id}.json`, {
    method: "DELETE"
  });
console.log("Antes de cargar usuario 2"); // Depuración
  cargarUsuarios();
};

cargarSedes();
console.log("Antes de cargar usuario 3"); // Depuración
//cargarUsuarios();
