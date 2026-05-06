import { initializeApp } from
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get
} from
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// ✅ Configuración Firebase (misma que en horas.html)
const firebaseConfig = {
  databaseURL:
    "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app/"
};

let semanasTiempo = [];
let semanasSesiones = [];

// ✅ Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const selectUsuarioInforme = document.getElementById("usuarioInforme");


async function cargarUsuariosInforme() {
  try {
    const snapshot = await get(ref(db, "/"));

    if (!snapshot.exists()) {
      selectUsuarioInforme.innerHTML =
        "<option value=''>No hay usuarios</option>";
      return;
    }

    const data = snapshot.val();

    // Limpiar (por si recarga)
    selectUsuarioInforme.innerHTML =
      "<option value=''>Selecciona un usuario</option>";

    // Las claves raíz son los usuarios
    Object.keys(data).forEach(usuario => {
      const option = document.createElement("option");
      option.value = usuario;
      option.textContent = usuario;
      selectUsuarioInforme.appendChild(option);
    });

  } catch (error) {
    console.error("Error cargando usuarios:", error);
    selectUsuarioInforme.innerHTML =
      "<option value=''>Error al cargar usuarios</option>";
  }
}

// ✅ Ejecutar al cargar la página
cargarUsuariosInforme();

document.getElementById("generarInforme").addEventListener("click", async () => {
  const usuario = document.getElementById("usuarioInforme").value;
  const tipo = document.getElementById("tipoInforme").value;

  if (!usuario) {
    alert("Selecciona un usuario");
    return;
  }

  if (tipo !== "resumen") {
    alert("Este informe aún no está implementado");
    return;
  }

  async function obtenerMovimiento(usuario) {
    const movimiento1 = await getMovimiento(usuario);
    return movimiento1;
  }

  async function obtenerSesiones(usuario) {
    const sesiones1 = await getSesiones(usuario);
    return sesiones1;
  }
  const movimiento = await obtenerMovimiento(usuario);
  console.log("Movimiento obtenido:", movimiento);
  const sesiones = await obtenerSesiones(usuario);
  console.log("Sesiones obtenidas:", sesiones);
  const { fechas, tiempos } = procesarDatos(movimiento);
  // ✅ Procesar sesiones
  const datosProcesados = procesarSesiones(sesiones);

  semanasSesiones = dividirSesionesEnSemanas(datosProcesados);

  semanasTiempo = dividirEnSemanas(fechas, tiempos);

  // 1️⃣ Calcular datos
  const datos = calcularResumenSemanal(usuario);

  // 2️⃣ Generar HTML
  const contenedor = document.getElementById("contenidoInforme");

  generarInformeResumenDOM(contenedor, datos);
  //contenedor.style.display = "block";
  contenedor.style.height = "auto";
  contenedor.style.maxHeight = "none";
  contenedor.style.overflow = "visible";

  console.log("Contenedor: "+contenedor.innerHTML);

  // 3️⃣ Generar PDF
setTimeout(() => {
  html2pdf()
    .set({
      margin: 10,
      filename: `Informe_resumen_${usuario}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] }
    })
    .from(contenedor)
    .save()
}, 200);

});

/*************************************************
 * 4. PROCESADO DE DATOS
 *************************************************/

// 🔹 Sesiones (agregadas por día)
function procesarSesiones(data) {
  const resultado = {};
  const fechas = Object.keys(data).sort();

  fechas.forEach(fecha => {
    const sesiones = data[fecha];

    let totalAceleraciones = 0;
    let totalColisiones = 0;
    let totalParadas = 0;
    let totalTiempo = 0;
    let totalEstabilidad = 0;
    let totalScore = 0;
    let count = 0;

    for (let id in sesiones) {
      const s = sesiones[id];
      totalAceleraciones += s.aceleraciones_bruscas || 0;
      totalColisiones += s.colisiones || 0;
      totalParadas += s.paradas_bruscas || 0;
      totalTiempo += s.tiempo_movimiento || 0;
      totalEstabilidad += s.estabilidad || 0;
      totalScore += s.score || 0;
      count++;
    }

    resultado[fecha] = {
      aceleraciones: totalAceleraciones,
      colisiones: totalColisiones,
      paradas: totalParadas,
      tiempo: totalTiempo / 1000,
      estabilidad: count ? totalEstabilidad / count : 0,
      score: count ? totalScore / count : 0
    };
  });

  return resultado;
}

let usuario = selectUsuarioInforme.value;

// Sesiones (estructura completa)
function dividirSesionesEnSemanas(datosProcesados) {
  const fechas = Object.keys(datosProcesados).sort();
  const semanas = [];

  for (let i = 0; i < fechas.length; i += 7) {
    const bloque = fechas.slice(i, i + 7);

    semanas.push({
      fechas: bloque,
      aceleraciones: bloque.map(f => datosProcesados[f].aceleraciones),
      colisiones: bloque.map(f => datosProcesados[f].colisiones),
      paradas: bloque.map(f => datosProcesados[f].paradas),
      tiempo: bloque.map(f => datosProcesados[f].tiempo),
      estabilidad: bloque.map(f => datosProcesados[f].estabilidad),
      score: bloque.map(f => datosProcesados[f].score)
    });
  }

  return semanas;
}
/*************************************************
 * 11. GENERACIÓN DE INFORMES
 *************************************************/
function calcularResumenSemanal(usuario) {
  const resumen = [];
  console.log("Semanas de tiempo:", semanasTiempo);

  semanasTiempo.forEach((semanaTiempo, index) => {
    const tiempos = semanaTiempo.valores; // segundos
    const fechas = semanaTiempo.fechas;

    const tiempoTotal = tiempos.reduce((a, b) => a + b, 0);
    const mediaDiaria = tiempoTotal / tiempos.length;

    const maxUso = Math.max(...tiempos);
    const minUso = Math.min(...tiempos);

    const diaMax = fechas[tiempos.indexOf(maxUso)];
    const diaMin = fechas[tiempos.indexOf(minUso)];

    const sesionesSemana = semanasSesiones[index]
      ? semanasSesiones[index].aceleraciones.length
      : 0;

    resumen.push({
      semana: index + 1,
      tiempoTotal,
      mediaDiaria,
      diaMax,
      diaMin,
      sesiones: sesionesSemana
    });
    console.log(`Semana ${index + 1}: Tiempo total = ${tiempoTotal}s, Media diaria = ${mediaDiaria}s, Día max = ${diaMax} (${maxUso}s), Día min = ${diaMin} (${minUso}s), Sesiones = ${sesionesSemana}`);
  });
  console.log("Usuario:", usuario);
  console.log("Resumen semanal:", resumen);
  return {
    usuario,
    resumen
  };
}
function dividirEnSemanas(fechas, valores) {
  const semanas = [];
  console.log("Dividiendo en semanas:");
  console.log("Fechas:", fechas);
  console.log("Valores:", valores);
  for (let i = 0; i < fechas.length; i += 7) {
    semanas.push({
      fechas: fechas.slice(i, i + 7),
      valores: valores.slice(i, i + 7)
    });
  }
  return semanas;
}

/*************************************************
 * 3. FUNCIONES UTILITARIAS
 *************************************************/

// ⏱️ Convertir milisegundos a hh:mm:ss
function msToTime(ms) {
  let totalSeconds = Math.floor(ms / 1000);
  let h = Math.floor(totalSeconds / 3600);
  let m = Math.floor((totalSeconds % 3600) / 60);
  let s = totalSeconds % 60;

  return (
    String(h).padStart(2, "0") + ":" +
    String(m).padStart(2, "0") + ":" +
    String(s).padStart(2, "0")
  );
}

function generarHTMLInformeResumen(datos) {
  console.log("Generando HTML para informe resumen con datos:", datos);
  let html = `
    <h1>Informe semanal de uso</h1>
    <p><strong>Usuario:</strong> ${datos.usuario}</p>
    <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString()}</p>
    <hr />
  `;

  datos.resumen.forEach(sem => {
    html += `
      <h2>Semana ${sem.semana}</h2>
      <ul>
        <li><strong>Tiempo total de uso:</strong> ${msToTime(sem.tiempoTotal * 1000)}</li>
        <li><strong>Media diaria:</strong> ${msToTime(sem.mediaDiaria * 1000)}</li>
        <li><strong>Día con más uso:</strong> ${sem.diaMax}</li>
        <li><strong>Día con menos uso:</strong> ${sem.diaMin}</li>
        <li><strong>Número total de sesiones:</strong> ${sem.sesiones}</li>
      </ul>
      <hr />
    `;
  });

  return html;
}

function generarInformeResumenDOM(contenedor, datos) {
  console.log("Generando informe resumen DOM con datos:", datos);

  // Limpiar contenedor
  contenedor.innerHTML = "";

  // ===== TÍTULO =====
  const h1 = document.createElement("h1");
  h1.textContent = "Informe semanal de uso";
  contenedor.appendChild(h1);

  // ===== USUARIO =====
  const pUsuario = document.createElement("p");
  const strongUsuario = document.createElement("strong");
  strongUsuario.textContent = "Usuario: ";
  pUsuario.appendChild(strongUsuario);
  pUsuario.appendChild(document.createTextNode(datos.usuario));
  contenedor.appendChild(pUsuario);

  // ===== FECHA =====
  const pFecha = document.createElement("p");
  const strongFecha = document.createElement("strong");
  strongFecha.textContent = "Fecha de generación: ";
  pFecha.appendChild(strongFecha);
  pFecha.appendChild(
    document.createTextNode(new Date().toLocaleDateString())
  );
  contenedor.appendChild(pFecha);

  contenedor.appendChild(document.createElement("hr"));

  // ===== SEMANAS =====
  datos.resumen.forEach(sem => {
    // Título semana
    const h2 = document.createElement("h2");
    h2.textContent = `Semana ${sem.semana}`;
    contenedor.appendChild(h2);

    const ul = document.createElement("ul");

    const crearItem = (titulo, valor) => {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = `${titulo}: `;
      li.appendChild(strong);
      li.appendChild(document.createTextNode(valor));
      return li;
    };

    ul.appendChild(
      crearItem(
        "Tiempo total de uso",
        msToTime(sem.tiempoTotal * 1000)
      )
    );

    ul.appendChild(
      crearItem(
        "Media diaria",
        msToTime(sem.mediaDiaria * 1000)
      )
    );

    ul.appendChild(
      crearItem("Día con más uso", sem.diaMax)
    );

    ul.appendChild(
      crearItem("Día con menos uso", sem.diaMin)
    );

    ul.appendChild(
      crearItem("Número total de sesiones", sem.sesiones)
    );

    contenedor.appendChild(ul);
    contenedor.appendChild(document.createElement("hr"));
  });
}

/**
 * 🔥 Obtener datos de movimiento para un usuario
 * Si no hay usuario, devuelve un objeto vacío
 */
async function getMovimiento(usuario) {
  if (!usuario) {
    console.log("⛔ No hay usuario seleccionado → movimiento vacío");
    return {};
  }

  const url = `${firebaseConfig.databaseURL}/${usuario}/movimiento.json`;

  const res = await fetch(url);
  const data = await res.json();
  //console.log(JSON.stringify(data, null, 2));
  return data || {};
}



/**
 * 🔥 Obtener sesiones para un usuario
 * Si no hay usuario, devuelve un objeto vacío
 */
async function getSesiones(usuario) {
  if (!usuario) {
    console.log("⛔ No hay usuario seleccionado → sesiones vacías");
    return {};
  }

  const url = `${firebaseConfig.databaseURL}/${usuario}/sesiones.json`;

  const res = await fetch(url);
  const data = await res.json();
  return data || {};
}

// 📊 3. Procesar datos
function procesarDatos(data) {
  const fechas = Object.keys(data).sort();
  const tiempos = fechas.map(f => data[f].tiempo / 1000); // en segundos
  return { fechas, tiempos };
}