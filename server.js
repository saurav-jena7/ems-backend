require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const connectDB        = require("./config/db");
const authRoutes       = require("./routes/authRoutes");
const employeeRoutes   = require("./routes/employeeRoutes");
const errorHandler     = require("./middleware/errorHandler");

// Connect to MongoDB
connectDB();

const app = express();

// ── CORS ────────────────────────────────────────────────────────────────────
// Read allowed origins from env (comma-separated).
// If CLIENT_URL is not set we allow ALL origins so the app works without config.
const rawOrigins = process.env.CLIENT_URL || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // No Origin header → same-origin / server-to-server / Postman → allow
    if (!origin) return callback(null, true);

    // No allow-list configured → allow everything (dev / first deploy)
    if (allowedOrigins.length === 0) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Unknown origin — return false (no throw) so the preflight gets a
    // proper 403 instead of a 500 from an unhandled error
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Handle ALL preflight OPTIONS requests globally — must be before any routes
app.options("*", cors(corsOptions));

// Apply CORS to every request
app.use(cors(corsOptions));

// ── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────���────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/employees", employeeRoutes);

// Root — quick sanity check when visiting the base URL
app.get("/", (req, res) => {
  res.json({
    success:   true,
    message:   "🚀 Employee Management System API is live!",
    version:   "1.0.0",
    status:    "running",
    endpoints: {
      health:    "GET  /api/health",
      signup:    "POST /api/auth/signup",
      login:     "POST /api/auth/login",
      me:        "GET  /api/auth/me",
      employees: "GET  /api/employees",
    },
    docs: "Protected endpoints require a Bearer token in the Authorization header.",
  });
});

// Health check — also useful for Render's health-check ping URL
app.get("/api/health", (req, res) =>
  res.json({
    success:   true,
    message:   "EMS API is healthy",
    uptime:    `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  })
);

// 404 — catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Central error handler
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Allowed origins: ${allowedOrigins.length ? allowedOrigins.join(", ") : "ALL (CLIENT_URL not set)"}`
  );
});
