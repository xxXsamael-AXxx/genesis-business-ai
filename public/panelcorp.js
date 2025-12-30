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
// PERFIL DEL USUARIO (NOMBRE + AVATAR)
// ===============================
const nameSpan = document.getElementById("panel-user-name");
const avatarDiv = document.getElementById("panel-user-avatar");

async function loadUserProfile() {
  if (!email) return;

  try {
    console.log("👤 [PROFILE] cargando perfil del usuario");

    const res = await fetch(
      `/api/user/profile?email=${encodeURIComponent(email)}`
    );
    const data = await res.json();

    console.log("📩 [PROFILE] respuesta backend:", data);

    const displayName =
      data.businessName && data.businessName.trim().length > 0
        ? data.businessName
        : "Corporación";

    // Nombre visible
    if (nameSpan) {
      nameSpan.textContent = displayName;
    }

    // Avatar = inicial del nombre (fallback email)
    if (avatarDiv) {
      const letter = displayName !== "Corporación"
        ? displayName.charAt(0)
        : email.charAt(0);

      avatarDiv.textContent = letter.toUpperCase();
    }

  } catch (err) {
    console.error("❌ [PROFILE] error cargando perfil:", err);
  }
}

// 🚀 cargar perfil al iniciar panel
loadUserProfile();


// ===============================
// MODAL — CREAR CONTRASEÑA (POST-PAGO) — FIX DEFINITIVO CON LOGS
// ===============================
const modal = document.getElementById("create-password-modal");
const form = document.getElementById("create-password-form");
const newPass = document.getElementById("new-password");
const confirmPass = document.getElementById("confirm-password");
const errorBox = document.getElementById("create-password-error");

function closePasswordModal(reason = "unknown") {
  console.log("🟢 [MODAL] cerrando modal | motivo:", reason);
  modal.hidden = true;
  document.body.classList.remove("modal-lock");
}

function openPasswordModal() {
  console.log("🔴 [MODAL] abriendo modal (no tiene contraseña)");
  modal.hidden = false;
  document.body.classList.add("modal-lock");
}

// ===============================
// CHECK INICIAL
// ===============================
async function checkPasswordAndToggleModal() {
  try {
    console.log("🔍 [CHECK] verificando si el usuario tiene contraseña…");

    const res = await fetch(
      `/api/user/has-password?email=${encodeURIComponent(email)}`
    );
    const data = await res.json();

    console.log("📩 [CHECK] respuesta backend:", data);

    if (data.hasPassword) {
      sessionStorage.setItem("passwordCreated", "true");
      closePasswordModal("backend-confirmed");
      return;
    }

    openPasswordModal();

  } catch (err) {
    console.error("❌ [CHECK] error verificando contraseña:", err);
  }
}

// 🔒 si en esta sesión ya se creó la contraseña → no mostrar modal
if (sessionStorage.getItem("passwordCreated") === "true") {
  console.log("🟢 [SESSION] contraseña ya creada en esta sesión");
  closePasswordModal("session-flag");
} else {
  checkPasswordAndToggleModal();
}

// ===============================
// SUBMIT — CREAR CONTRASEÑA
// ===============================
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.style.display = "none";

    console.log("🟡 [SUBMIT] intento de guardar contraseña");

    if (newPass.value.length < 8) {
      errorBox.textContent = "La contraseña debe tener al menos 8 caracteres.";
      errorBox.style.display = "block";
      console.warn("⚠️ [VALIDACIÓN] contraseña muy corta");
      return;
    }

    if (newPass.value !== confirmPass.value) {
      errorBox.textContent = "Las contraseñas no coinciden.";
      errorBox.style.display = "block";
      console.warn("⚠️ [VALIDACIÓN] contraseñas no coinciden");
      return;
    }

    try {
      console.log("📤 [API] enviando /api/set-password");

      const res = await fetch("/api/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: newPass.value
        })
      });

      const data = await res.json();
      console.log("📩 [API] respuesta set-password:", data);

      if (!res.ok) {
        errorBox.textContent = data.message || "Error al guardar contraseña";
        errorBox.style.display = "block";
        console.error("❌ [API] error guardando contraseña");
        return;
      }

      // ✅ CONTRASEÑA GUARDADA — CIERRE INMEDIATO
      console.log("✅ [SUCCESS] contraseña guardada correctamente");

      sessionStorage.setItem("passwordCreated", "true");
      closePasswordModal("password-saved");

      // 🔁 verificación final SIN recargar
      setTimeout(() => {
        checkPasswordAndToggleModal();
      }, 200);

    } catch (err) {
      console.error("❌ [API] error set-password:", err);
      errorBox.textContent = "Error de conexión";
      errorBox.style.display = "block";
    }
  });
}

// ===============================
// TOGGLE OJOS — MOSTRAR / OCULTAR CONTRASEÑA
// ===============================
document.querySelectorAll(".modal-password-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    const img = btn.querySelector("img");

    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      img.src = "/assets/img/eye-open.svg";
      img.alt = "Ocultar contraseña";
    } else {
      input.type = "password";
      img.src = "/assets/img/eye-closed.svg";
      img.alt = "Mostrar contraseña";
    }
  });
});


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
