// public/pos-pago.js

(async () => {
  try {
    // 1️⃣ Leer session_id desde la URL
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      console.error("❌ No viene session_id en la URL");
      return;
    }

    // 2️⃣ Pedir al backend los datos reales del pago
    const res = await fetch(`/api/stripe/session?session_id=${sessionId}`);

    if (!res.ok) {
      throw new Error("No se pudo obtener la sesión");
    }

    const data = await res.json();

    // 3️⃣ Pintar email real en pantalla
    const emailEl = document.getElementById("posPagoUserEmail");
    if (emailEl && data.email) {
      emailEl.textContent = data.email;
    }

  } catch (err) {
    console.error("❌ Error pos-pago:", err);
  }
})();
