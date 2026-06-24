const SECRET_KEY = "movilidad_motorizada_2026";


document.addEventListener("DOMContentLoaded", async () => {
  await guardarSesionUsuario();
});

async function guardarSesionUsuario() {
  const usuarioActivo = localStorage.getItem("usuarioActivo");

  if (!usuarioActivo) return;

  const res = await fetch(`${BASE_URL}.json`);
  const usuarios = await res.json();

  for (const id in usuarios) {
    const u = usuarios[id];

    if (u.usuario === usuarioActivo) {
      // ✅ Guardar en localStorage
      alert("Usuario encontrado: " + u.usuario + " con rol: " + u.rol); // Depuración 
      localStorage.setItem("usuarioActivo", u.usuario);
      localStorage.setItem("rolActivo", u.rol);

      console.log("✅ Usuario y rol guardados:", u.usuario, u.rol);
      break;
    }
  }
}

function encriptarPassword(password) {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
}

const usuarioActivo = localStorage.getItem("usuarioActivo");

const BASE_URL =
  "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app/usuarios";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (password1.value !== password2.value) {
    msg.textContent = "Las contraseñas no coinciden";
    return;
  }

  const res = await fetch(`${BASE_URL}.json`);
  const usuarios = await res.json();

  const usuarioId = Object.keys(usuarios).find(
    id => usuarios[id].usuario === usuarioActivo
  );
  const usuarioObj = usuarios[usuarioId];

  await fetch(`${BASE_URL}/${usuarioId}.json`, {
    method: "PATCH",
    body: JSON.stringify({
      password: encriptarPassword(password1.value),
      primerLogin: false
    })
  });

  localStorage.setItem("rolActivo", usuarioObj.rol);
  localStorage.setItem("usuarioActivo", usuarioObj.usuario);
  alert("Contraseña actualizada para: " + usuarioObj.usuario + " con rol: " + usuarioObj.rol); // Depuración
  window.location.href = "indexUsuario.html";
});
