// ✅ Importar Firebase (v9)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// ✅ Configuración de tu proyecto (ajusta si es necesario)
const firebaseConfig = {
    databaseURL: "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app/"
};
const listaEnlaces = ["sedes.html", "pacientes.html", "gestion.html"];
const nombreEnlaces = ["Sedes", "Pacientes", "Gestión"];
// ✅ Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener("DOMContentLoaded", () => {
    comprobarSesion();
    mostrarPacientes();
    conectarLogout();
    agregarOpcionesAdmin();
    establecerUsuario();
});


function agregarOpcionesAdmin() {

    const rol = localStorage.getItem("rolActivo");
    console.log("Rol del usuario activo:", rol); // Depuración  
    const menu = document.querySelector(".menu ul");
    console.log("Elemento menu:", menu); // Depuración
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

function comprobarSesion() {
    console.log("Comprobando sesión...");
    const usuario = localStorage.getItem("usuarioActivo");
    const rol = localStorage.getItem("rolActivo");
    if (!usuario) {
        window.location.href = "login.html";
    }
}

// ✅ Mostrar pacientes filtrados por sede
function mostrarPacientes() {
    const usuario = localStorage.getItem("usuarioActivo");
    const pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];

    const lista = document.getElementById("listaPacientes");
    lista.innerHTML = "";

    /*const pacientesFiltrados = pacientes.filter(p => p.sede === usuario.sede);

    pacientesFiltrados.forEach(p => {
        const li = document.createElement("li");
        console.log("Paciente filtrado:", p); // Depuración
        li.textContent = p.nombre;
        lista.appendChild(li);
    });

    if (pacientesFiltrados.length === 0) {
        lista.innerHTML = "<li>No hay pacientes en tu sede</li>";
    }*/
   cargarPacientes();
}

// ✅ Logout
function conectarLogout() {
    document.getElementById("cerrarSesionBtn").addEventListener("click", () => {
        localStorage.removeItem("usuarioActivo");
        localStorage.removeItem("rolActivo");
        window.location.href = "login.html";
    });
}

const pacientesList = document.getElementById("listaPacientes");

// ===============================
// CARGAR PACIENTES
// ===============================
window.verDatosPaciente = function (id) {
    // ✅ Guardar el paciente seleccionado
    localStorage.setItem("pacienteSeleccionado", id);

    // ✅ Redirigir a index.html
    window.location.href = "index2.html";
}

function establecerUsuario() {
    const usuarioActivo = localStorage.getItem("usuarioActivo");

    if (usuarioActivo) {
        
        // Insertar el nombre en el HTML
        document.getElementById("nombreUsuario").textContent = usuarioActivo;
    }
}
window.verVideosPaciente = function (id) {
    window.location.href = "videos.html";
}
/* ===============================
   CARGAR PACIENTES
================================ */
async function cargarPacientes() {
  let lista = document.getElementById("listaPacientes");
  const sedeId = localStorage.getItem("sedeId");
  const rol = localStorage.getItem("rolActivo");
  console.log("Sede ID del usuario activo:", sedeId); // Depuración
  console.log("Rol del usuario activo:", rol); // Depuración
  
  lista.innerHTML = "";

  const resPac = await fetch(`${firebaseConfig.databaseURL}/pacientes.json`);
  const resSed = await fetch(`${firebaseConfig.databaseURL}/sedes.json`);

  const pacientes = await resPac.json();
  const sedes = await resSed.json();
  
  if (!pacientes) return;

  for (const id in pacientes) {
    const p = pacientes[id];
    const sedeNombre = sedes?.[p.sedeId]?.nombre || "Sin sede";

    if (rol === "fisio" &&  p.sedeId === sedeId) { 
            const li = document.createElement("li");
            li.innerHTML = `
            <strong>${p.nombre}</strong> – ${sedeNombre}<br>
            <button class="icon-btn view enlace-paciente" onclick="verDatosPaciente('${id}')">📊 Datos</button>
            <button class="icon-btn view enlace-paciente" onclick="verVideosPaciente('${id}')">🎥 Videos</button>
            <span style="font-size: 12px; color: #fff;">PIN: ${p.pin}</span>

            `;
            lista.appendChild(li);
    }else if (rol === "admin") {
            const li = document.createElement("li");
            li.innerHTML = `
            <strong>${p.nombre}</strong> – ${sedeNombre}<br>
            <button class="icon-btn view enlace-paciente" onclick="verDatosPaciente('${id}')">📊 Datos</button>
            <button class="icon-btn view enlace-paciente" onclick="verVideosPaciente('${id}')">🎥 Videos</button>
            <span style="font-size: 12px; color: #fff;">PIN: ${p.pin}</span>
            `;
            lista.appendChild(li);
    }
  }
}

