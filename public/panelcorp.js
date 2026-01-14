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
    // ocultar todas
    views.forEach(v => v.classList.remove("active"));

    // mostrar target
    const target = document.getElementById(viewId);
    if (target) target.classList.add("active");

    // botones activos
    buttons.forEach(b => b.classList.remove("active"));
    const btn = document.querySelector(`[data-view="${viewId}"]`);
    if (btn) btn.classList.add("active");

    // ✅ inicializar gráficas SOLO al entrar a Analítica
    if (viewId === "corp-analytics") {
      initAnalyticsCharts();
    }
  }

  // listeners sidebar
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const viewId = btn.dataset.view;
      if (viewId) activateView(viewId);
    });
  });

  // ===============================
// CHARTS (ANALÍTICA) — SIEMPRE RENDER AUN EN 0
// ===============================
let chartConversations = null;
let chartStatus = null;

function initAnalyticsCharts() {

  // ===============================
  // 1) LINE CHART — Evolución
  // ===============================
  const c1 = document.getElementById("chart-conversations");
  if (c1 && !chartConversations) {
    const ctx1 = c1.getContext("2d");

    chartConversations = new Chart(ctx1, {
      type: "line",
      data: {
        labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        datasets: [{
          label: "Conversaciones",
          data: [0, 0, 0, 0, 0, 0, 0], // ← luego vienen datos reales
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          borderColor: "#22d3ee",
          backgroundColor: "rgba(34,211,238,0.15)"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255,255,255,0.05)" }
          },
          x: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: true }
        }
      }
    });
  }

  // ===============================
  // 2) BAR CHART — Estados (REEMPLAZA AL DOUGHNUT)
  // ===============================
  const c2 = document.getElementById("chart-status");
  if (c2 && !chartStatus) {
    const ctx2 = c2.getContext("2d");

    chartStatus = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: [
          "Activo",
          "En seguimiento",
          "Escalado a humano",
          "Cerrado"
        ],
        datasets: [{
          label: "Conversaciones",
          data: [12, 8, 3, 5], // ← datos ejemplo (NO 0 para que se vea)
          backgroundColor: [
            "#22d3ee",
            "#fb7185",
            "#fb923c",
            "#facc15"
          ],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y", // 🔥 barras horizontales
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: "rgba(255,255,255,0.05)" }
          },
          y: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

// ===============================
// SIDEBAR — estado inicial + toggle
// ===============================
const sidebar = document.getElementById("panelcorp-sidebar");
const toggleBtn = document.getElementById("panelcorp-toggle-btn");

// Detectar mobile
const isMobile = window.matchMedia("(max-width: 768px)").matches;

// 📱 Estado inicial
if (isMobile && sidebar) {
  sidebar.classList.add("is-collapsed"); // mobile inicia cerrado
  if (toggleBtn) toggleBtn.textContent = "❯";
}

// 🖱️ Toggle manual (funciona igual en mobile y desktop)
if (sidebar && toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const collapsed = sidebar.classList.toggle("is-collapsed");
    toggleBtn.textContent = collapsed ? "❯" : "❮";
    toggleBtn.blur();
  });
}

// ===============================
// MOBILE — tooltips 1s (no se quedan pegados)
// ===============================
if (isMobile && sidebar) {
  const tipTargets = sidebar.querySelectorAll(".panelcorp-nav button[data-label], .panelcorp-logout[data-label]");

  tipTargets.forEach((el) => {
    let t = null;

    const showForASecond = () => {
      // solo si está colapsado
      if (!sidebar.classList.contains("is-collapsed")) return;

      el.classList.add("show-tip");
      clearTimeout(t);
      t = setTimeout(() => el.classList.remove("show-tip"), 1000);
    };

    // touch
    el.addEventListener("touchstart", showForASecond, { passive: true });

    // por si acaso (algunos navegadores disparan click)
    el.addEventListener("click", showForASecond);
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
// CHECK INICIAL — robusto mobile / desktop (FIX)
// ===============================

// safe storage (por si el navegador bloquea sessionStorage)
function ssGet(key) {
  try { return sessionStorage.getItem(key); } catch (e) { return null; }
}
function ssSet(key, val) {
  try { sessionStorage.setItem(key, val); } catch (e) {}
}

async function checkPasswordAndToggleModal() {
  // proteger todo
  if (!modal) {
    console.error("❌ [MODAL] no existe #create-password-modal en el HTML");
    return;
  }

  if (!email) {
    console.warn("⚠️ [CHECK] email no disponible aún, reintentando…");
    return;
  }

  try {
    console.log("🔍 [CHECK] verificando si el usuario tiene contraseña…", email);

    const res = await fetch(`/api/user/has-password?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    console.log("📩 [CHECK] respuesta backend:", data);

    if (data.hasPassword) {
      ssSet("passwordCreated", "true");
      closePasswordModal("backend-confirmed");
      return;
    }

    openPasswordModal();

  } catch (err) {
    console.error("❌ [CHECK] falló verificación, abriendo modal por seguridad:", err);
    // si el check falla en móvil, mejor abrir modal que bloquear el panel
    openPasswordModal();
  }
}

// 🔒 ejecución controlada (con reintentos)
if (ssGet("passwordCreated") === "true") {
  console.log("🟢 [SESSION] contraseña ya creada en esta sesión");
  closePasswordModal("session-flag");
} else {
  // primer intento
  checkPasswordAndToggleModal();

  // reintentos cortos para móviles (params/DOM/listeners tardan)
  let tries = 0;
  const t = setInterval(() => {
    tries++;
    if (ssGet("passwordCreated") === "true") { clearInterval(t); return; }
    checkPasswordAndToggleModal();
    if (tries >= 10) clearInterval(t); // ~1.5s total
  }, 150);
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
