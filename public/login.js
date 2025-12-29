document.addEventListener("DOMContentLoaded", () => {
  // ===============================
  // OJO PASSWORD
  // ===============================
  const toggleBtn = document.getElementById("landingTogglePassword");
  const passwordInput = document.getElementById("landingPassword");
  const eyeIcon = document.getElementById("landingEyeIcon");

  if (toggleBtn && passwordInput && eyeIcon) {
    toggleBtn.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      eyeIcon.src = isHidden
        ? "./assets/img/eye-open.svg"
        : "./assets/img/eye-closed.svg";
    });
  }

  // ===============================
  // LOGIN
  // ===============================
  const form = document.getElementById("landingLoginForm");
  const errorBox = document.getElementById("loginError");
  const forgotBox = document.getElementById("forgotPassword");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    ocultarMensajes();

    const email = form.email.value.trim().toLowerCase(); // 👈 FIX REAL
    const password = passwordInput.value;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      // ⚠️ IMPORTANTE: aquí NO usamos catch
      if (!res.ok) {
        manejarError(data);
        return;
      }

      // LOGIN OK
      window.location.href = `${data.redirect}?email=${encodeURIComponent(email)}`;


    } catch (err) {
      console.error(err);
      mostrarError("No se pudo conectar con el servidor.");
    }
  });

  // ===============================
  // HELPERS
  // ===============================
  function manejarError(data) {
    mostrarError(data.message || "Error al iniciar sesión");

    if (data.action === "PLANES") {
      mostrarPlanes();
    }

    if (data.code === "INVALID_PASSWORD") {
      mostrarOlvide();
    }
  }

  function mostrarError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.style.display = "block";
  }

  function mostrarOlvide() {
    if (!forgotBox) return;
    forgotBox.innerHTML = `<a href="/recuperar">¿Olvidaste tu contraseña?</a>`;
    forgotBox.style.display = "block";
  }

  function mostrarPlanes() {
  if (!forgotBox) return;

  forgotBox.innerHTML = `
    <a href="/index.html#planes">Ver planes</a>
  `;
  forgotBox.style.display = "block";
}


  function ocultarMensajes() {
    if (errorBox) errorBox.style.display = "none";
    if (forgotBox) forgotBox.style.display = "none";
  }
});
