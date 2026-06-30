//const BASE_URL =
//  "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app/sedes";

const BASE_URL = "https://proyecto-movilidad-18726-default-rtdb.europe-west1.firebasedatabase.app/sedes";

const form = document.getElementById("sedeForm");
const lista = document.getElementById("listaSedes");
const nombreInput = document.getElementById("nombreSede");
const poblacionInput = document.getElementById("poblacion");
const sedeIdInput = document.getElementById("sedeId");
const formTitle = document.getElementById("formTitle");

const listaEnlaces = ["indexUsuario.html", "sedes.html", "pacientes.html", "gestion.html"];
const nombreEnlaces = ["Datos Pacientes", "Sedes", "Pacientes", "Gestión"];

document.addEventListener("DOMContentLoaded", () => {
    agregarOpcionesAdmin();
    establecerUsuario();
});


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
/* =============================
   CARGAR SEDES
============================= */
async function cargarSedes() {
  lista.innerHTML = "";

  const response = await fetch(`${BASE_URL}.json`);
  const data = await response.json();

  if (!data) return;

  for (const id in data) {
    const sede = data[id];

    const li = document.createElement("li");

        li.innerHTML = `
            <h4>${sede.nombre}</h4>
            <p>${sede.poblacion || ""}</p>
            <button class="icon-btn edit" onclick="editarSede('${id}', '${sede.nombre}', '${sede.poblacion}')">✏️ Editar</button>
            <button class="icon-btn delete" onclick="borrarSede('${id}')">🗑 Eliminar</button>
        `;

    lista.appendChild(li);
  }
}

/* =============================
   GUARDAR (ALTA / MODIFICACIÓN)
============================= */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = nombreInput.value.trim();
  const poblacion = poblacionInput.value.trim();
  const sedeId = sedeIdInput.value;

  if (!nombre || !poblacion) return;

  const sedeData = {
    nombre,
    poblacion
  };

  if (sedeId) {
    // 🔁 MODIFICAR
    await fetch(`${BASE_URL}/${sedeId}.json`, {
      method: "PUT",
      body: JSON.stringify(sedeData)
    });
  } else {
    // ➕ ALTA
    await fetch(`${BASE_URL}.json`, {
      method: "POST",
      body: JSON.stringify(sedeData)
    });
  }

  form.reset();
  sedeIdInput.value = "";
  formTitle.textContent = "Crear nueva sede";
  cargarSedes();
});

/* =============================
   EDITAR
============================= */
window.editarSede = (id, nombre, poblacion) => {
  sedeIdInput.value = id;
  nombreInput.value = nombre;
  poblacionInput.value = poblacion;
  formTitle.textContent = "Editar sede";
};

/* =============================
   BORRAR
============================= */
window.borrarSede = async (id) => {
  if (!confirm("¿Seguro que deseas eliminar esta sede?")) return;

  await fetch(`${BASE_URL}/${id}.json`, {
    method: "DELETE"
  });

  cargarSedes();
};

/* =============================
   INICIO
============================= */
cargarSedes();