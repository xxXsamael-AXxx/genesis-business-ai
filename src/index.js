require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");

const { runBrain } = require("./core/brain");

const app = express();
app.use(express.json());

// ================================
// 🧠 Perfil negocio
// ================================
const businessProfile = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "./data/business.profile.json"),
    "utf8"
  )
);

// ================================
// 🧠 API cerebro
// ================================
app.post("/message", async (req, res) => {
  try {
    const { message, userId = "anon" } = req.body;
    if (!message) return res.status(400).json({ error: "Mensaje vacío" });

    const reply = await runBrain({
      message,
      userId,
      business: businessProfile,
    });

    res.json({ reply });
  } catch (err) {
    console.error("❌ Error cerebro:", err);
    res.sendStatus(500);
  }
});

// ================================
// 📲 WhatsApp (send manual)
// ================================
app.use("/whatsapp", require("./routes/whatsapp"));

// ================================
// 🔔 Webhook Meta (SOLO UNO)
// ================================
app.use("/webhook/whatsapp", require("./routes/webhook"));

// ================================
app.get("/", (_, res) => {
  res.send("🧠 Genesis Business AI activo");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Corriendo en puerto ${PORT}`);
});
