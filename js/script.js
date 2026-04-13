/*************************************************
 * 1. CONSTANTES Y CONFIGURACIÓN
 *************************************************/
Chart.defaults.devicePixelRatio = window.devicePixelRatio || 1;
const BASE_URL = "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app";

// Variable global para la gráfica de tiempo, así podemos destruirla y crear una nueva al cambiar de usuario

/*************************************************
 * 2. ESTADO GLOBAL DE LA APLICACIÓN
 *************************************************/

// Gráficas principales
let chartTiempo = null;
let chartSesiones = null;

// Gráficas modales
let chartTiempoModal = null;
let chartSesionesModal = null;

// Datos agrupados por semanas
let semanasTiempo = [];
let semanasSesiones = [];


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

/*************************************************
 * 4. PROCESADO DE DATOS
 *************************************************/

// 🔹 Movimiento (tiempo)
function procesarDatosMovimiento(data) {
  const fechas = Object.keys(data).sort();
  const tiempos = fechas.map(f => data[f].tiempo / 1000);
  return { fechas, tiempos };
}

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

/*************************************************
 * 5. AGRUPACIÓN DE DATOS POR SEMANAS
 *************************************************/

// Tiempo
function dividirEnSemanas(fechas, valores) {
  const semanas = [];
  for (let i = 0; i < fechas.length; i += 7) {
    semanas.push({
      fechas: fechas.slice(i, i + 7),
      valores: valores.slice(i, i + 7)
    });
  }
  return semanas;
}

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
 * 6. CREACIÓN DE GRÁFICAS
 *************************************************/

// Tiempo
function crearGrafica(fechas, tiempos) {
    return new Chart(document.getElementById("tiempoChart"), {
        type: "bar",
        data: {
            labels: fechas,
            datasets: [{
                label: "Tiempo de uso",
                data: tiempos
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return "Tiempo: " + msToTime(context.raw * 1000);
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "Tiempo (hh:mm:ss)"
                    },
                    ticks: {
                        font: {
                            size: 10
                        },
                        callback: function (value) {
                            return msToTime(value * 1000);
                        }
                    }
                }
            }
        }
    });
}


/*************************************************
 * 7. MODALES
 *************************************************/

// Modal tiempo
// Función para abrir el modal con la gráfica ampliada
function abrirModalTiempo() {
    const modal = document.getElementById("modalTiempo");
    modal.style.display = "block";

    const ctx = document
        .getElementById("tiempoChartModal")
        .getContext("2d");

    // Mostrar solo las semanas existentes
    botonesTiempoModal.forEach((btn, i) => {
        btn.style.display = semanasTiempo[i] ? "inline-block" : "none";
        btn.classList.remove("active");
    });

    // Evitar duplicados
    if (chartTiempoModal) {
        chartTiempoModal.destroy();
    }

    chartTiempoModal = new Chart(ctx, {
        type: "bar",
        data: {
            labels: chartTiempo.data.labels,
            datasets: chartTiempo.data.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return "Tiempo: " +
                                msToTime(context.raw * 1000);
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: value =>
                            msToTime(value * 1000)
                    }
                }
            }
        }
    });
}

if (semanasSesiones.length > 0) {
    if (chartSesiones) chartSesiones.destroy();

    chartSesiones = new Chart(
        document.getElementById("sesionesChart"),
        {
            type: "bar",
            data: {
                labels: semanasSesiones[0].fechas,
                datasets: [
                    { label: "Aceleraciones", data: semanasSesiones[0].aceleraciones },
                    { label: "Colisiones", data: semanasSesiones[0].colisiones },
                    { label: "Paradas", data: semanasSesiones[0].paradas },
                    { label: "Tiempo (s)", data: semanasSesiones[0].tiempo },
                    {
                        label: "Estabilidad (media)",
                        type: "line",
                        data: semanasSesiones[0].estabilidad,
                        yAxisID: "y1"
                    },
                    {
                        label: "Score (medio)",
                        type: "line",
                        data: semanasSesiones[0].score,
                        yAxisID: "y1"
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: "index", intersect: false },
                scales: {
                    y: { beginAtZero: true },
                    y1: {
                        position: "right",
                        beginAtZero: true,
                        max: 100,
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        }
    );
}

// Función para cerrar el modal y destruir la gráfica ampliada
function cerrarModalTiempo() {
    const modal = document.getElementById("modalTiempo");
    modal.style.display = "none";

    if (chartTiempoModal) {
        chartTiempoModal.destroy();
        chartTiempoModal = null;
    }
}

// Modal sesiones
function abrirModalSesiones() {
    const modal = document.getElementById("modalSesiones");
    modal.style.display = "block";

    const ctx = document
        .getElementById("sesionesChartModal")
        .getContext("2d");

    // Mostrar solo semanas existentes
    botonesSesionesModal.forEach((btn, i) => {
        btn.style.display = semanasSesiones[i] ? "inline-block" : "none";
        btn.classList.remove("active");
    });

    // Evitar duplicados
    if (chartSesionesModal) {
        chartSesionesModal.destroy();
    }

    // Copiamos datos de la gráfica principal
    chartSesionesModal = new Chart(ctx, {
        type: "bar",
        data: {
            labels: chartSesiones.data.labels,
            datasets: chartSesiones.data.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    beginAtZero: true
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function cerrarModalSesiones() {
    const modal = document.getElementById("modalSesiones");
    modal.style.display = "none";

    if (chartSesionesModal) {
        chartSesionesModal.destroy();
        chartSesionesModal = null;
    }
}


/*************************************************
 * 8. FIREBASE – USUARIOS
 *************************************************/

// ✅ Cargar usuarios desde raíz del Realtime Database
function cargarUsuarios() {
    const rootRef = ref(db, "/");

    get(rootRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();

                // ✅ Vaciar select
                usuarioSelect.innerHTML = "";
                // Insertamos un elemento vacío para obligar a seleccionar un usuario
                const optionVac = document.createElement("option");
                optionVac.value = "";
                optionVac.textContent = "Selecciona un paciente";
                usuarioSelect.appendChild(optionVac);
                // ✅ Recorrer claves (nombres de usuarios)
                Object.keys(data).forEach((usuario) => {
                    const option = document.createElement("option");
                    option.value = usuario;
                    option.textContent = usuario;
                    usuarioSelect.appendChild(option);
                });
            } else {
                usuarioSelect.innerHTML = "<option>No hay usuarios registrados</option>";
            }
        })
        .catch((error) => {
            console.error("Error obteniendo usuarios:", error);
            usuarioSelect.innerHTML = "<option>Error al cargar</option>";
        });
}


// Detectamos el click en la gráfica de tiempo para abrir el modal
document
    .getElementById("tiempoChart")
    .addEventListener("click", () => {
        abrirModalTiempo();
    });

document
    .getElementById("cerrarModalTiempo")
    .addEventListener("click", cerrarModalTiempo);

const botonesTiempoModal = document.querySelectorAll(
    '.modal-buttons button[data-modal]'
);

botonesTiempoModal.forEach(btn => {
    btn.addEventListener("click", () => {
        const index = Number(btn.dataset.modal);
        cargarSemanaTiempoModal(index);
    });
});

function cargarSemanaTiempoModal(index) {
    if (!semanasTiempo[index]) return;

    // Marcar botón activo
    botonesTiempoModal.forEach(b => b.classList.remove("active"));
    botonesTiempoModal[index]?.classList.add("active");

    // Redibujar gráfica del modal
    if (chartTiempoModal) {
        chartTiempoModal.destroy();
    }

    const ctx = document
        .getElementById("tiempoChartModal")
        .getContext("2d");

    chartTiempoModal = new Chart(ctx, {
        type: "bar",
        data: {
            labels: semanasTiempo[index].fechas,
            datasets: [
                {
                    label: "Tiempo de uso",
                    data: semanasTiempo[index].valores
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx =>
                            "Tiempo: " +
                            msToTime(ctx.raw * 1000)
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: v => msToTime(v * 1000)
                    }
                }
            }
        }
    });
}

/**
 * Funciones para obtener la ventana modal de sesiones, abrirla, cerrarla y cargar los datos de la semana seleccionada. 
 */

document
    .getElementById("sesionesChart")
    .addEventListener("click", () => {
        abrirModalSesiones();
    });

document
    .getElementById("cerrarModalSesiones")
    .addEventListener("click", cerrarModalSesiones);

const botonesSesionesModal = document.querySelectorAll(
    '.modal-buttons button[data-sesiones]'
);

botonesSesionesModal.forEach(btn => {
    btn.addEventListener("click", () => {
        const index = Number(btn.dataset.sesiones);
        cargarSemanaSesionesModal(index);
    });
});

// Cargar datos de la semana seleccionada en el modal de sesiones
function cargarSemanaSesionesModal(index) {
    if (!semanasSesiones[index]) return;

    // Marcar botón activo
    botonesSesionesModal.forEach(b => b.classList.remove("active"));
    botonesSesionesModal[index]?.classList.add("active");

    // Redibujar gráfica
    if (chartSesionesModal) {
        chartSesionesModal.destroy();
    }

    const ctx = document
        .getElementById("sesionesChartModal")
        .getContext("2d");

    chartSesionesModal = new Chart(ctx, {
        type: "bar",
        data: {
            labels: semanasSesiones[index].fechas,
            datasets: [
                {
                    label: "Aceleraciones",
                    data: semanasSesiones[index].aceleraciones
                },
                {
                    label: "Colisiones",
                    data: semanasSesiones[index].colisiones
                },
                {
                    label: "Paradas",
                    data: semanasSesiones[index].paradas
                },
                {
                    label: "Tiempo (s)",
                    data: semanasSesiones[index].tiempo
                },
                {
                    label: "Estabilidad (media)",
                    type: "line",
                    data: semanasSesiones[index].estabilidad,
                    yAxisID: "y1"
                },
                {
                    label: "Score (medio)",
                    type: "line",
                    data: semanasSesiones[index].score,
                    yAxisID: "y1"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    beginAtZero: true
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
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

    const url = `${BASE_URL}/${usuario}/movimiento.json`;

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

    const url = `${BASE_URL}/${usuario}/sesiones.json`;

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

// 🚀 5. Ejecutar
getMovimiento().then(data => {
    const { fechas, tiempos } = procesarDatos(data);
    chartTiempo = crearGrafica(fechas, tiempos);
});

function crearGraficaSesiones(datos) {
    const fechas = Object.keys(datos);

    return new Chart(document.getElementById("sesionesChart"), {
        type: "bar",
        data: {
            labels: fechas,
            datasets: [
                {
                    label: "Aceleraciones",
                    data: fechas.map(f => datos[f].aceleraciones)
                },
                {
                    label: "Colisiones",
                    data: fechas.map(f => datos[f].colisiones)
                },
                {
                    label: "Paradas",
                    data: fechas.map(f => datos[f].paradas)
                },
                {
                    label: "Tiempo (s)",
                    data: fechas.map(f => datos[f].tiempo)
                },
                {
                    label: "Estabilidad (media)",
                    type: "line",
                    data: fechas.map(f => datos[f].estabilidad),
                    yAxisID: 'y1'
                },
                {
                    label: "Score (medio)",
                    type: "line",
                    data: fechas.map(f => datos[f].score),
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    labels: {
                        font: { size: 10 }
                    }
                },
                tooltip: {
                    bodyFont: { size: 10 },
                    titleFont: { size: 10 }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Eventos / Tiempo",
                        font: {
                            size: 10
                        }
                    }
                },

                y1: {
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        font: {
                            size: 10
                        }
                    },
                    title: {
                        display: true,
                        text: "Score / Estabilidad",
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

/*getSesiones().then(data => {
    const datosProcesados = procesarSesiones(data);
    chartSesiones = crearGraficaSesiones(datosProcesados);
});
*/

function resetCanvas(id) {
    console.log("Id canvas: " + id);
    const oldCanvas = document.getElementById(id);


    if (oldCanvas) {
        console.warn(`⚠️ Canvas con ID "${id}" será eliminado`);

        const parent = oldCanvas.parentNode;

        // Eliminar
        parent.removeChild(oldCanvas);

        // Crear uno nuevo
        const newCanvas = document.createElement("canvas");
        newCanvas.id = id;
        parent.appendChild(newCanvas);

        return newCanvas.getContext("2d");
        //return null; 
    }
}


//Firebase scripts

// ✅ Importar Firebase (v9)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// ✅ Configuración de tu proyecto (ajusta si es necesario)
const firebaseConfig = {
    databaseURL: "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app/"
};

// ✅ Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✅ Elemento select
const usuarioSelect = document.getElementById("usuarioSelect");

// ✅ Ejecutar al cargar la página
cargarUsuarios();

const selectUsuario = document.getElementById("usuarioSelect");


const botonesTiempo = document.querySelectorAll(
    '.week-buttons[data-chart="tiempo"] button'
);

botonesTiempo.forEach((btn, index) => {
    btn.addEventListener("click", () => {
        cargarSemanaTiempo(index);
    });
});

// La llamamos cada vez que pulsamos un botón para cargar
// los datos de la semana correspondiente
function cargarSemanaTiempo(index, botones) {
    if (!semanasTiempo[index]) return;

    // Marcar botón activo
    botonesTiempo.forEach(b => b.classList.remove("active"));
    botonesTiempo[index].classList.add("active");

    // Redibujar gráfica
    if (chartTiempo) chartTiempo.destroy();

    chartTiempo = crearGrafica(
        semanasTiempo[index].fechas,
        semanasTiempo[index].valores
    );
}


let sesionesChartModal;

function crearSesionesChartModal(semana = 0) {
    const ctx = document.getElementById("sesionesChartModal");

    if (sesionesChartModal) sesionesChartModal.destroy();

    sesionesChartModal = new Chart(ctx, {
        type: "bar",
        data: {
            labels: semanasSesiones[semana].fechas,
            datasets: [{
                label: "Sesiones por día",
                data: semanasSesiones[semana].valores,
                backgroundColor: "#ff9800"
            }]
        }
    });
}
document
    .querySelectorAll('#modalSesiones button[data-modal]')
    .forEach(button => {
        button.addEventListener('click', () => {
            crearSesionesChartModal(Number(button.dataset.modal));
        });
    });
    
/*************************************************
 * 9. CAMBIO DE USUARIO
 *************************************************/

    selectUsuario.addEventListener("change", async () => {

    const usuario = selectUsuario.value;

    semanasTiempo = []; // 🔥 reset total

    if (!usuario) {
        if (chartTiempo) chartTiempo.destroy();
        if (chartSesiones) chartSesiones.destroy();
        return;
    }

    const movimiento = await getMovimiento(usuario);
    const sesiones = await getSesiones(usuario);

    // ✅ Destruir gráficas anteriores
    if (chartTiempo) chartTiempo.destroy();
    if (chartSesiones) chartSesiones.destroy();

    // ✅ Crear nuevas
    const { fechas, tiempos } = procesarDatos(movimiento);

    // 1️⃣ Dividir en semanas
    semanasTiempo = dividirEnSemanas(fechas, tiempos);

    // 2️⃣ Si hay semanas, pintar la primera
    if (semanasTiempo.length > 0) {
        if (chartTiempo) chartTiempo.destroy();

        chartTiempo = crearGrafica(
            semanasTiempo[0].fechas,
            semanasTiempo[0].valores
        );

    }
    //chartTiempo = crearGrafica(fechas, tiempos);
    // Datos de sesiones por semanas
    // 🔁 Obtener sesiones del usuario


    // ✅ Procesar sesiones
    const datosProcesados = procesarSesiones(sesiones);

    // ✅ Crear semanas (GLOBAL)
    semanasSesiones = dividirSesionesEnSemanas(datosProcesados);

    // ✅ Si no hay datos, salir
    if (semanasSesiones.length === 0) {
        if (chartSesiones) chartSesiones.destroy();
        return;
    }

    // ✅ Destruir gráfica anterior
    if (chartSesiones) chartSesiones.destroy();

    // ✅ Crear gráfica (SEMANA 0)
    chartSesiones = new Chart(
        document.getElementById("sesionesChart"),
        {
            type: "bar",
            data: {
                labels: semanasSesiones[0].fechas,
                datasets: [
                    { label: "Aceleraciones", data: semanasSesiones[0].aceleraciones },
                    { label: "Colisiones", data: semanasSesiones[0].colisiones },
                    { label: "Paradas", data: semanasSesiones[0].paradas },
                    { label: "Tiempo (s)", data: semanasSesiones[0].tiempo },
                    {
                        label: "Estabilidad (media)",
                        type: "line",
                        data: semanasSesiones[0].estabilidad,
                        yAxisID: "y1"
                    },
                    {
                        label: "Score (medio)",
                        type: "line",
                        data: semanasSesiones[0].score,
                        yAxisID: "y1"
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: "index", intersect: false },
                scales: {
                    y: { beginAtZero: true },
                    y1: {
                        position: "right",
                        beginAtZero: true,
                        max: 100,
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        }
    );


    semanasSesiones = dividirSesionesEnSemanas(datosProcesados);

    let semanaActualSesiones = 0;

/*************************************************
 * 10. EVENTOS DE BOTONES (SEMANAS)
 *************************************************/

    document
        .querySelectorAll("[data-session-week]")
        .forEach(btn => {
            btn.addEventListener("click", () => {
                const index = Number(btn.dataset.sessionWeek);
                if (!semanasSesiones[index] || !chartSesiones) return;

                chartSesiones.data.labels = semanasSesiones[index].fechas;
                chartSesiones.data.datasets[0].data = semanasSesiones[index].aceleraciones;
                chartSesiones.data.datasets[1].data = semanasSesiones[index].colisiones;
                chartSesiones.data.datasets[2].data = semanasSesiones[index].paradas;
                chartSesiones.data.datasets[3].data = semanasSesiones[index].tiempo;
                chartSesiones.data.datasets[4].data = semanasSesiones[index].estabilidad;
                chartSesiones.data.datasets[5].data = semanasSesiones[index].score;

                chartSesiones.update();
            });
        });

    //chartSesiones = crearGraficaSesiones(datosProcesados);

});