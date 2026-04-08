const BASE_URL = "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app";
/*
// 🔥 1. Obtener datos
async function getMovimiento() {
  const res = await fetch(BASE_URL + "/movimiento.json");
  return await res.json();
}
 
// 🔥 1. Obtener datos de sesiones
async function getSesiones() {
  const res = await fetch("https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app/sesiones.json");
  return await res.json();
}*/


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

let chartSesiones = null;
let chartTiempo = null;

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


// ⏱️ 2. Convertir ms → hh:mm:ss
function msToTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);

    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;

    return (
        String(h).padStart(2, '0') + ":" +
        String(m).padStart(2, '0') + ":" +
        String(s).padStart(2, '0')
    );
}

// 📊 3. Procesar datos
function procesarDatos(data) {
    const fechas = Object.keys(data).sort();

    const tiempos = fechas.map(f => data[f].tiempo / 1000); // en segundos

    return { fechas, tiempos };
}
// Los datos obtenidos los dividimos en semanas para mostrar una por una
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

// 📈 4. Crear gráfica
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
            responsive: false,
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
                            size: 8
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
                            size: 8
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

// 🚀 5. Ejecutar
getMovimiento().then(data => {
    const { fechas, tiempos } = procesarDatos(data);
    chartTiempo = crearGrafica(fechas, tiempos);
});

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
            tiempo: totalTiempo / 1000, // a segundos
            estabilidad: count ? totalEstabilidad / count : 0,
            score: count ? totalScore / count : 0
        };
    });

    return resultado;
}

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
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Eventos / Tiempo"
                    }
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: "Score / Estabilidad"
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

getSesiones().then(data => {
    const datosProcesados = procesarSesiones(data);
    chartSesiones = crearGraficaSesiones(datosProcesados);
});


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

// ✅ Ejecutar al cargar la página
cargarUsuarios();

const selectUsuario = document.getElementById("usuarioSelect");


selectUsuario.addEventListener("change", async () => {

    const usuario = selectUsuario.value;
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
    const semanasTiempo = dividirEnSemanas(fechas, tiempos);



    const botonesTiempo = document.querySelectorAll(
        '.week-buttons[data-chart="tiempo"] button'
    );

    botonesTiempo.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            cargarSemanaTiempo(index, botonesTiempo);
        });
    });
    // La llamamos cada vez que pulsamos un botón para cargar
    // los datos de la semana correspondiente
    function cargarSemanaTiempo(index, botones) {
        if (!semanasTiempo[index]) return;

        // Marcar botón activo
        botones.forEach(b => b.classList.remove("active"));
        botones[index].classList.add("active");

        // Redibujar gráfica
        if (chartTiempo) chartTiempo.destroy();

        chartTiempo = crearGrafica(
            semanasTiempo[index].fechas,
            semanasTiempo[index].valores
        );
    }


    // 2️⃣ Si hay semanas, pintar la primera
    if (semanasTiempo.length > 0) {
        if (chartTiempo) chartTiempo.destroy();

        chartTiempo = crearGrafica(
            semanasTiempo[0].fechas,
            semanasTiempo[0].valores
        );

    }
    //chartTiempo = crearGrafica(fechas, tiempos);

    const datosProcesados = procesarSesiones(sesiones);
    chartSesiones = crearGraficaSesiones(datosProcesados);

});