const express = require("express");
const router = express.Router();
const { runBrain } = require("../core/brain");
const fs = require("fs");
const path = require("path");

// cargar perfil
const businessProfile = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../data/business.profile.json"),
    "utf8"
  )
);

// 🔐 Verificación inicial de Meta
router.get("/", (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado");
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// 📩 Mensajes entrantes
router.post("/", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from; // número del usuario
    const text = message.text?.body;

    if (!text) return res.sendStatus(200);

    console.log("📩 Mensaje entrante:", from, text);

    const reply = await runBrain({
      message: text,
      userId: from,
      business: businessProfile
    });

    // responder
    await fetch(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          text: { body: reply }
        })
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.sendStatus(500);
  }
});

module.exports = router;
