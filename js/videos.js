/*    import { initializeApp } from
      "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
    import {
      getStorage,
      ref,
      listAll,
      getDownloadURL
    } from
      "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

    const firebaseConfig = {
      databaseURL:
        "https://proyecto-movilidad-18726-default-rtdb.europe-west1.firebasedatabase.app"
    };

    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// Configuración Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "proyecto-movilidad-18726.firebaseapp.com",
    databaseURL: "https://proyecto-movilidad-18726-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "proyecto-movilidad-18726",
    storageBucket: "proyecto-movilidad-18726.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ID del usuario

const usuarioId = localStorage.getItem("pacienteSeleccionado");
console.log("Usuario seleccionado:", usuarioId); // Depuración

async function cargarVideos() {

    const videosRef = ref(
        db,
        `usuarios_movil/${usuarioId}/videos_entrenamiento`
    );

    try {

        const snapshot = await get(videosRef);

        if (!snapshot.exists()) {
            console.log("No hay vídeos");
            return;
        }

        const contenedor = document.getElementById("videos-container");
        contenedor.innerHTML = "";

        snapshot.forEach(videoSnap => {

            const video = videoSnap.val();

            const tarjeta = document.createElement("div");
            tarjeta.classList.add("video-card");

            tarjeta.innerHTML = `
                <h3>Vídeo ${video.id}</h3>
                <p>Fecha: ${video.date}</p>
                <p>Duración: ${video.duration} min</p>

                <video controls width="400">
                    <source src="${video.url}" type="video/mp4">
                    Tu navegador no soporta vídeo HTML5.
                </video>
                <hr>
            `;

            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        console.error("Error cargando vídeos:", error);
    }
}

cargarVideos();
