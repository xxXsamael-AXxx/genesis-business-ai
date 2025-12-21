const express = require("express");
const router = express.Router();

router.post("/send", async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: "Faltan campos" });
  }

  try {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          text: { body: message },
        }),
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Send error:", err);
    res.sendStatus(500);
  }
});

module.exports = router;
