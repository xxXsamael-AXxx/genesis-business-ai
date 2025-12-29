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
// MODAL — CREAR CONTRASEÑA (POST-PAGO)
// ===============================
const modal = document.getElementById("create-password-modal");
const form = document.getElementById("create-password-form");
const newPass = document.getElementById("new-password");
const confirmPass = document.getElementById("confirm-password");
const errorBox = document.getElementById("create-password-error");

// Flag local para no reabrir el modal
const passwordReady = sessionStorage.getItem("passwordReady");

// Si vienes de post-pago y NO se ha creado contraseña aún
if (needsPassword === "true" && modal && !passwordReady) {
  modal.hidden = false;
  document.body.classList.add("modal-lock"); // si usas bloqueo visual
}

// Toggle ojos
document.querySelectorAll(".modal-password-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    const img = btn.querySelector("img");
    if (!input || !img) return;

    if (input.type === "password") {
      input.type = "text";
      img.src = "/assets/img/eye-open.svg";
    } else {
      input.type = "password";
      img.src = "/assets/img/eye-closed.svg";
    }
  });
});

// Submit crear contraseña
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
      if (!res.ok) throw new Error(data.message || "Error al guardar contraseña");

      // ✅ ÉXITO REAL
      sessionStorage.setItem("passwordReady", "true");

      // Cerrar modal y desbloquear UI
      modal.hidden = true;
      document.body.classList.remove("modal-lock");

      // 🔁 Sync final con backend (una sola vez)
      setTimeout(() => {
        location.reload();
      }, 300);

    } catch (err) {
      errorBox.textContent = err.message || "Error inesperado";
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
