const express = require("express");

// Node 18+ ya trae fetch global. Si te marca error, me dices y lo ajustamos.
const router = express.Router();

router.post("/send", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: "Faltan campos: to y message" });
  }

  try {
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!phoneId || !token) {
      return res.status(500).json({ error: "Faltan WHATSAPP_PHONE_ID o WHATSAPP_TOKEN en .env" });
    }

    const url = `https://graph.facebook.com/v22.0/${phoneId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Meta API error", details: data });
    }

    return res.json(data);
  } catch (err) {
    console.error("❌ WhatsApp send error:", err);
    return res.status(500).json({ error: "Error enviando WhatsApp" });
  }
});

module.exports = router;
