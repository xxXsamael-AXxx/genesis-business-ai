document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // MODAL (NO SE TOCA)
  // ===============================
  const modal = document.getElementById("plansModal");
  const closeBtn = document.getElementById("closePlansModal");
  const overlay = modal?.querySelector(".plans-modal-overlay");
  const detailButtons = document.querySelectorAll(".plan-details-btn");

  function openModal() {
    modal?.classList.add("active");
  }

  function closeModal() {
    modal?.classList.remove("active");
  }

  detailButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });

  closeBtn?.addEventListener("click", closeModal);
  overlay?.addEventListener("click", closeModal);

  // ===============================
  // STRIPE CHECKOUT (MINIMAL)
  // ===============================
  document.querySelectorAll("[data-plan]").forEach(btn => {

    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      const originalText = btn.textContent;
      btn.textContent = "Redirigiendo…";
      btn.style.pointerEvents = "none";

      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: btn.dataset.plan
          })
        });

        if (!res.ok) throw new Error("Stripe checkout error");

        const { url } = await res.json();

        // 👉 Stripe abre su panel (nueva pantalla)
        window.location.href = url;

      } catch (err) {
        console.error(err);
        alert("No se pudo iniciar el pago");
        btn.textContent = originalText;
        btn.style.pointerEvents = "auto";
      }
    });

  });

});
