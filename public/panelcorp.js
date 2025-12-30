// ==================================================
// PANEL CORPORATIVO — JS BASE + MODAL PASSWORD
// ==================================================

document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // CAMBIO DE VISTAS
  // ===============================
  const buttons = document.querySelectorAll(".panelcorp-nav button");
  const views = document.querySelectorAll(".panelcorp-view");

  function activateView(viewId) {
    views.forEach(v => v.classList.remove("active"));

    const target = document.getElementById(viewId);
    if (target) target.classList.add("active");

    buttons.forEach(b => b.classList.remove("active"));
    const btn = document.querySelector(`[data-view="${viewId}"]`);
    if (btn) btn.classList.add("active");
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const viewId = btn.dataset.view;
      if (viewId) activateView(viewId);
    });
  });

  // ===============================
  // COLAPSO SIDEBAR
  // ===============================
  const sidebar = document.getElementById("panelcorp-sidebar");
  const toggleBtn = document.getElementById("panelcorp-toggle-btn");

  if (sidebar && toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const collapsed = sidebar.classList.toggle("is-collapsed");
      toggleBtn.textContent = collapsed ? "❯" : "❮";
      toggleBtn.blur();
    });
  }

  // ===============================
  // EMAIL DEL USUARIO (DESDE URL)
  // ===============================
  const emailSpan = document.getElementById("panel-user-email");
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  const needsPassword = params.get("needsPassword"); // ← viene SOLO post-pago

  if (email && emailSpan) {
    emailSpan.textContent = email;
  }

// ===============================
// MODAL — CREAR CONTRASEÑA (POST-PAGO) — FIX REAL
// ===============================
const modal = document.getElementById("create-password-modal");
const form = document.getElementById("create-password-form");
const newPass = document.getElementById("new-password");
const confirmPass = document.getElementById("confirm-password");
const errorBox = document.getElementById("create-password-error");

// 🔒 si ya se creó la contraseña en esta sesión, no mostrar modal
if (sessionStorage.getItem("passwordCreated") === "true") {
  modal.hidden = true;
  document.body.classList.remove("modal-lock");
} else {
  checkPasswordAndToggleModal();
}

async function checkPasswordAndToggleModal() {
  try {
    const res = await fetch(
      `/api/user/has-password?email=${encodeURIComponent(email)}`
    );
    const data = await res.json();

    // 👉 ya tiene contraseña → nunca mostrar modal
    if (data.hasPassword) {
      modal.hidden = true;
      document.body.classList.remove("modal-lock");
      sessionStorage.setItem("passwordCreated", "true");
      return;
    }

    // 👉 no tiene contraseña → forzar modal
    modal.hidden = false;
    document.body.classList.add("modal-lock");

  } catch (err) {
    console.error("Error verificando contraseña:", err);
  }
}

// ===============================
// SUBMIT — CREAR CONTRASEÑA
// ===============================
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.style.display = "none";

    if (newPass.value.length < 8) {
      errorBox.textContent = "La contraseña debe tener al menos 8 caracteres.";
      errorBox.style.display = "block";
      return;
    }

    if (newPass.value !== confirmPass.value) {
      errorBox.textContent = "Las contraseñas no coinciden.";
      errorBox.style.display = "block";
      return;
    }

    try {
      const res = await fetch("/api/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: newPass.value
        })
      });

      const data = await res.json();

      if (!res.ok) {
        errorBox.textContent = data.message || "Error al guardar contraseña";
        errorBox.style.display = "block";
        return;
      }

      // ✅ CONTRASEÑA GUARDADA → CERRAR Y NORMALIZAR PANEL
      sessionStorage.setItem("passwordCreated", "true");

      modal.hidden = true;
      document.body.classList.remove("modal-lock");

      // 🔁 refresco limpio para dejar panel 100% funcional
      setTimeout(() => {
        window.location.reload();
      }, 300);

    } catch (err) {
      console.error("Error set-password:", err);
      errorBox.textContent = "Error de conexión";
      errorBox.style.display = "block";
    }
  });
}

  // ===============================
  // LOGOUT
  // ===============================
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      window.location.href = "/index.html";
    });
  }

});
