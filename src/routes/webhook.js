const express = require("express");
const router = express.Router();
const { runBrain } = require("../core/brain");
const fs = require("fs");
const path = require("path");

// Perfil del negocio
const businessProfile = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../data/business.profile.json"),
    "utf8"
  )
);

// ================================
// ✅ VERIFICACIÓN META
// ================================
router.get("/", (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado correctamente");
    return res.status(200).send(challenge);
  }

  console.log("❌ Verificación fallida", { mode, token });
  return res.sendStatus(403);
});

// ================================
// 📩 MENSAJES ENTRANTES
// ================================
router.post("/", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body;

    if (!text) return res.sendStatus(200);

    console.log("📩 Mensaje entrante:", from, text);

    const reply = await runBrain({
      message: text,
      userId: from,
      business: businessProfile,
    });

    await fetch(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          text: { body: reply },
        }),
      }
    );

    console.log("✅ Respuesta enviada a WhatsApp");
    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.sendStatus(500);
  }
});

module.exports = router;
