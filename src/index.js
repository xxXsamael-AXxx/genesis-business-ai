require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");

const { runBrain } = require("./core/brain");
const whatsappRoutes = require("./routes/whatsapp");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ================================
// 🧠 Cargar perfil del negocio
// ================================
const businessProfile = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "./data/business.profile.json"),
    "utf8"
  )
);

// ================================
// 🧠 Endpoint del cerebro (API interna / web / pruebas)
// ================================
app.post("/message", async (req, res) => {
  try {
    const { message, userId = "anon" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensaje vacío" });
    }

    const reply = await runBrain({
      message,
      userId,
      business: businessProfile,
    });

    res.json({ reply });
  } catch (err) {
    console.error("❌ Error cerebro:", err);
    res.status(500).json({ error: "Error interno del cerebro" });
  }
});

// ================================
// 📲 Rutas WhatsApp
// ================================
app.use("/whatsapp", whatsappRoutes);

// ================================
// ❤️ Health check
// ================================
app.get("/", (req, res) => {
  res.send("🧠 Genesis Business AI — cerebro activo");
});

const webhookRoutes = require("./routes/webhook");
app.use("/webhook/whatsapp", webhookRoutes);

// ================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Genesis Business AI corriendo en puerto ${PORT}`);
});
