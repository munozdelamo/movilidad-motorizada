const SECRET_KEY = "movilidad_motorizada_2026";

function encriptarPassword(password) {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
}
function desencriptarPassword(passwordCifrada) {
  const bytes = CryptoJS.AES.decrypt(passwordCifrada, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

const BASE_URL =
  "https://movilidad-motorizada-default-rtdb.europe-west1.firebasedatabase.app/usuarios";

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("loginError");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";

  const usuarioInput = document.getElementById("usuario").value;
  const passInput = document.getElementById("password").value;

  // ⬇️ Buscamos TODOS los usuarios
  const res = await fetch(`${BASE_URL}.json`);
  const usuarios = await res.json();
  console.log("Usuarios en la base de datos:", usuarios);

  if (!usuarios) {
    errorMsg.textContent =
      "El usuario no existe. Contacte con el administrador.";
    return;
  }

  // 🔎 Buscar usuario
  console.log("Buscando usuario:", usuarioInput);
  const usuarioEncontrado = Object.values(usuarios).find(
    u => u.handle === usuarioInput
  );

  if (!usuarioEncontrado) {
    errorMsg.textContent =
      "El usuario no existe. Contacte con el administrador.";
    return;
  }

// ✅ Guardamos el usuario activo
localStorage.setItem("usuarioActivo", usuarioInput);
localStorage.setItem("sedeId", usuarioEncontrado.sedeId);
localStorage.setItem("rolActivo", usuarioEncontrado.rol);

// ✅ PRIMER LOGIN → mostrar modal (SIN navegar)
if (usuarioEncontrado.primerLogin === true) {
  console.log("Primer acceso detectado para el usuario:", usuarioInput);
  document
    .getElementById("passwordModal")
    .classList.remove("hidden");
} //else {
  // ✅ Acceso normal
  //window.location.href = "index.html";
//}

  const passwordReal = desencriptarPassword(usuarioEncontrado.password);

  if (passwordReal !== passInput) {
    errorMsg.textContent = "Contraseña incorrecta";
    return;
  }else {
  // ✅ Acceso normal
      if(usuarioEncontrado.rol === "Admin"){
      localStorage.setItem("rolActivo", "admin");
      window.location.href = "indexUsuario.html";
    }else {
      localStorage.setItem("rolActivo", "fisio");
      window.location.href = "indexUsuario.html";
    }
  }

});

const passwordForm = document.getElementById("passwordForm");
const passwordMsg = document.getElementById("passwordMsg");

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  passwordMsg.textContent = "";

  const p1 = document.getElementById("password1").value.trim();
  const p2 = document.getElementById("password2").value.trim();

  // ✅ Validaciones
  if (p1.length < 8) {
    passwordMsg.textContent =
      "La contraseña debe tener al menos 8 caracteres.";
    return;
  }

  if (p1 !== p2) {
    passwordMsg.textContent = "Las contraseñas no coinciden.";
    return;
  }

  // ✅ Recuperamos el usuario activo (guardado en login)
  const usuarioActivo = localStorage.getItem("usuarioActivo");
  if (!usuarioActivo) {
    passwordMsg.textContent = "Sesión no válida. Vuelva a iniciar sesión.";
    return;
  }

  // ✅ Buscar usuario en la BBDD
  const res = await fetch(`${BASE_URL}.json`);
  const usuarios = await res.json();

  const usuarioEntry = Object.entries(usuarios).find(
    ([, u]) => u.handle === usuarioActivo
  );

  if (!usuarioEntry) {
    passwordMsg.textContent = "Usuario no encontrado.";
    return;
  }

  const [usuarioId] = usuarioEntry;
  const usuarioObj = usuarios[usuarioId];
  // ✅ Guardar contraseña y quitar primerLogin
  await fetch(`${BASE_URL}/${usuarioId}.json`, {
    method: "PATCH",
    body: JSON.stringify({
      password: encriptarPassword(p1),
      primerLogin: false,
      rol: "fisio"
    })
  });
// ✅ Guardamos el usuario activo
localStorage.setItem("usuarioActivo", usuarioObj.handle);
localStorage.setItem("sedeId", usuarioObj.sedeId);
localStorage.setItem("rolActivo", "fisio");

  // ✅ Todo correcto → entrar en la aplicación
  window.location.href = "indexUsuario.html";
});