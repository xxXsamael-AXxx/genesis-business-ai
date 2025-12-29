// public/pos-pago.js
(async () => {
  try {
    // =========================
    // 1️⃣ Leer session_id
    // =========================
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      console.error("❌ No viene session_id en la URL");
      return;
    }

    // =========================
    // 2️⃣ Pedir datos reales al backend
    // =========================
    const res = await fetch(`/api/stripe/session?session_id=${sessionId}`);

    if (!res.ok) {
      throw new Error("No se pudo obtener la sesión desde el backend");
    }

    const data = await res.json();
    console.log("📦 Datos sesión:", data);

    if (!data.email) {
      console.error("❌ No llegó email validado");
      return;
    }

    // =========================
    // 3️⃣ Pintar email en el card
    // =========================
    const emailEl = document.getElementById("posPagoUserEmail");
    if (emailEl) {
      emailEl.textContent = data.email;
    }

    // =========================
    // 4️⃣ Redirección a panel correcto
    // (el backend decide el panel según plan)
    // =========================
    const btn = document.querySelector(".pos-pago-btn");

    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();

        // Mandamos email validado al backend
        window.location.href = `/panel?email=${encodeURIComponent(
          data.email
        )}`;
      });
    }

  } catch (err) {
    console.error("❌ Error pos-pago:", err);
  }
})();
