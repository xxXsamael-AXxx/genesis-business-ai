// public/pos-pago.js
(async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      console.error("❌ No viene session_id en la URL");
      return;
    }

    const res = await fetch(`/api/stripe/session?session_id=${sessionId}`);

    if (!res.ok) {
      throw new Error("No se pudo obtener la sesión");
    }

    const data = await res.json();

    console.log("📦 Datos sesión:", data); // 👈 importante para debug

    const emailEl = document.getElementById("posPagoUserEmail");
    if (emailEl) {
      emailEl.textContent = data.email || "—";
    }

  } catch (err) {
    console.error("❌ Error pos-pago:", err);
  }
})();
