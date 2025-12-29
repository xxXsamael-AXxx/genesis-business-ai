// ==================================================
// PANEL CORPORATIVO — JS BASE
// ==================================================

document.addEventListener("DOMContentLoaded", () => {
  // ===============================
  // CAMBIO DE VISTAS
  // ===============================
  const buttons = document.querySelectorAll(".panelcorp-nav button");
  const views = document.querySelectorAll(".panelcorp-view");

  function activateView(viewId) {
    views.forEach(v => {
      v.classList.remove("active");
    });

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
  // EMAIL DEL USUARIO (DESDE URL)
  // ===============================
  const emailSpan = document.getElementById("panel-user-email");
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");

  if (email && emailSpan) {
    emailSpan.textContent = email;
  }

  // ===============================
  // LOGOUT
  // ===============================
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      window.location.href = "/login";
    });
  }
});
