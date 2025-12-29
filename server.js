const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const Stripe = require("stripe");
const { execSync } = require("child_process");
require("dotenv").config();

try {
  console.log("🟢 Aplicando migraciones Prisma...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  console.log("✅ Migraciones aplicadas");
} catch (e) {
  console.error("❌ Error aplicando migraciones", e);
}

// ================================
// App
// ================================
const app = express();
const PORT = process.env.PORT || 3000;

// ================================
// Prisma
// ================================
const prisma = new PrismaClient();

// ================================
// Stripe
// ================================
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ Falta STRIPE_SECRET_KEY en .env");
  process.exit(1);
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.error("❌ Falta STRIPE_WEBHOOK_SECRET (whsec_) en .env");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ================================
// Helpers
// ================================
function priceIdToPlan(priceId) {
  if (!priceId) return null;

  if (priceId === process.env.STRIPE_PRICE_WHATSAPP_AI) return "BASIC";
  if (priceId === process.env.STRIPE_PRICE_WHATSAPP_EMAIL) return "PREMIUM";
  if (priceId === process.env.STRIPE_PRICE_CORP_AI) return "BUSINESS";

  return null;
}

function computeExpiresAtFromNow(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ================================
// STRIPE WEBHOOK (AUTORIDAD REAL)
// OJO: express.raw DEBE ir ANTES de express.json
// ================================
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    // 1) Verificar firma (whsec_)
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // Email real del cliente
        const email = session.customer_details?.email
          ? session.customer_details.email.toLowerCase().trim()
          : null;

        console.log("✅ PAGO CONFIRMADO:", session.id);
        console.log("Email:", email);

        if (!email) {
          console.error("❌ No llegó email en customer_details");
          return res.json({ received: true });
        }

        // 2) Obtener line items reales (FORMA CORRECTA)
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id,
          { limit: 1 }
        );

        const priceId = lineItems.data[0]?.price?.id || null;
        const plan = priceIdToPlan(priceId);

        console.log("PriceId:", priceId);
        console.log("Plan:", plan);

        if (!plan) {
          console.error("❌ PriceId no mapeado a Plan:", priceId);
          return res.json({ received: true });
        }

        // 3) Crear o asegurar usuario
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email },
        });

        // 4) Crear o actualizar suscripción
        const expiresAt = computeExpiresAtFromNow(30);

        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {
            plan,
            status: "ACTIVE",
            expiresAt,
          },
          create: {
            userId: user.id,
            plan,
            status: "ACTIVE",
            expiresAt,
          },
        });

        // 5) Asegurar perfil (opcional)
        await prisma.profile.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
          },
        });

        console.log(
          "✅ Prisma OK: user + subscription creados/actualizados:",
          email
        );
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ Webhook processing error:", err);
      res.status(500).send("Webhook handler failed");
    }
  }
);

// ================================
// Middlewares normales (DESPUÉS)
// ================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ================================
// RUTAS FRONTEND
// ================================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/landing", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "landing.html"));
});

// ================================
// API LOGIN (NO SE TOCA)
// ================================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        code: "MISSING_FIELDS",
        message: "Correo y contraseña son obligatorios",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user) {
      return res.status(404).json({
        code: "USER_NOT_FOUND",
        message: "No existe una cuenta activa con este correo",
        action: "PLANES",
      });
    }

    if (!user.passwordHash) {
      return res.status(403).json({
        code: "ACCOUNT_NOT_ACTIVATED",
        message: "Esta cuenta aún no fue activada",
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({
        code: "INVALID_PASSWORD",
        message: "Contraseña incorrecta",
      });
    }

    if (
      !user.subscription ||
      user.subscription.status !== "ACTIVE" ||
      user.subscription.expiresAt < new Date()
    ) {
      return res.status(403).json({
        code: "PLAN_EXPIRED",
        message: "Tu plan ha expirado",
        action: "PLANES",
      });
    }

    return res.status(200).json({
      code: "LOGIN_OK",
      redirect: "/panel",
    });
  } catch (err) {
    console.error("❌ Error login:", err);
    res.status(500).json({
      code: "SERVER_ERROR",
      message: "Error interno del servidor",
    });
  }
});

// ================================
// API — CREAR CONTRASEÑA (POST-PAGO)
// ================================
app.post("/api/set-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son obligatorios",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 8 caracteres",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    // Seguridad: solo permitir si aún NO tiene contraseña
    if (user.passwordHash) {
      return res.status(403).json({
        message: "Esta cuenta ya tiene contraseña configurada",
      });
    }

    // Hashear contraseña
    const hash = await bcrypt.hash(password, 10);

    // Guardar en BD
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hash,
      },
    });

    return res.status(200).json({
      message: "Contraseña creada correctamente",
    });

  } catch (err) {
    console.error("❌ Error set-password:", err);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
});


// ================================
// PANEL — REDIRECCIÓN SEGÚN PLAN
// ================================
app.get("/panel", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.redirect("/login");

    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user || !user.subscription) {
      return res.redirect("/login");
    }

    const plan = user.subscription.plan;

    if (plan === "BUSINESS") {
      return res.sendFile(path.join(__dirname, "public", "panelcorp.html"));
    }

    if (plan === "PREMIUM") {
      return res.sendFile(path.join(__dirname, "public", "panelbusi.html"));
    }

    if (plan === "BASIC") {
      return res.sendFile(path.join(__dirname, "public", "panelbasi.html"));
    }

    return res.redirect("/login");
  } catch (err) {
    console.error("❌ Error panel:", err);
    return res.redirect("/login");
  }
});

// ================================
// STRIPE CHECKOUT
// ================================
app.post("/api/stripe/checkout", async (req, res) => {
  try {
    const { plan } = req.body;

    let priceId = null;

    if (plan === "whatsapp_ai") priceId = process.env.STRIPE_PRICE_WHATSAPP_AI;
    if (plan === "whatsapp_email")
      priceId = process.env.STRIPE_PRICE_WHATSAPP_EMAIL;
    if (plan === "corp_ai") priceId = process.env.STRIPE_PRICE_CORP_AI;

    if (!priceId) {
      return res.status(400).json({ error: "PLAN_INVALIDO" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.BASE_URL}/pos-pago.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/landing`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe checkout error:", err);
    res.status(500).json({ error: "STRIPE_ERROR" });
  }
});

// ================================
// STRIPE SESSION → POS-PAGO
// (solo LEE datos, no crea nada)
// ================================
app.get("/api/stripe/session", async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: "MISSING_SESSION_ID" });
    }

    // 1️⃣ Traer sesión desde Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const email = session.customer_details?.email;

    if (!email) {
      return res.status(404).json({ error: "EMAIL_NOT_FOUND" });
    }

    // 2️⃣ Confirmar que el usuario YA existe en Prisma
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "USER_NOT_CREATED_YET" });
    }

    // 3️⃣ Responder al frontend
    res.json({
      email: user.email,
    });

  } catch (err) {
    console.error("❌ Error stripe session:", err);
    res.status(500).json({ error: "SESSION_ERROR" });
  }
});


// ================================
// START
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Genesis corriendo en puerto ${PORT}`);
});
