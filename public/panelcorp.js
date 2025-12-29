// ==================================================
// PANEL CORPORATIVO — JS (COMPATIBLE CON EL HTML NUEVO)
// - Colapso sidebar (is-collapsed)
// - Tooltips (ya los trae data-label en HTML)
// - Cambio de vistas (panelcorp-panel-view--active + panelcorp-panel-item--active)
// - Email desde query ?email=
// - Logout a landing
// ==================================================

document.addEventListener("DOMContentLoaded", () => {
  // ===============================
  // ELEMENTOS BASE
  // ===============================
  const sidebar = document.getElementById("panelcorp-sidebar");
  const toggleBtn = document.getElementById("panelcorp-toggle-btn");

  // Botones del menú (HTML nuevo)
  const menuButtons = document.querySelectorAll(".panelcorp-panel-menu .panelcorp-panel-item");
  const views = document.querySelectorAll(".panelcorp-panel-view");

  // ===============================
  // CAMBIO DE VISTAS
  // ===============================
  function activateView(viewId) {
    if (!viewId) return;

    // Oculta/activa vistas
    views.forEach(v => v.classList.remove("panelcorp-panel-view--active"));
    const target = document.getElementById(viewId);
    if (target) target.classList.add("panelcorp-panel-view--active");

    // Activo en menú
    menuButtons.forEach(b => b.classList.remove("panelcorp-panel-item--active"));
    const btn = document.querySelector(`.panelcorp-panel-item[data-view="${viewId}"]`);
    if (btn) btn.classList.add("panelcorp-panel-item--active");
  }

  menuButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const viewId = btn.dataset.view;
      activateView(viewId);
    });
  });

  // Si el HTML trae una vista activa, sincroniza el botón.
  // Si no, activa corp-home por default.
  const currentActiveView = document.querySelector(".panelcorp-panel-view.panelcorp-panel-view--active");
  if (currentActiveView && currentActiveView.id) {
    activateView(currentActiveView.id);
  } else {
    activateView("corp-home");
  }

  // ===============================
  // COLAPSO SIDEBAR
  // ===============================
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

  if (emailSpan) {
    emailSpan.textContent = email ? email : "—";
  }

  // ===============================
  // LOGOUT (A LANDING)
  // ===============================
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Recomendado: landing en "/"
      window.location.href = "/";
      // Si tu server NO sirve / como index, usa:
      // window.location.href = "/index.html";
    });
  }
});
