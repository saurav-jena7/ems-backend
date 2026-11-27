require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const errorHandler = require("./middleware/errorHandler");

// Connect to MongoDB
connectDB();

const app = express();

// ── Middleware ──────────────────────────────────────────────
// CORS: allow origins listed in CLIENT_URL (comma-separated) or localhost fallback
const rawOrigins = process.env.CLIENT_URL || "http://localhost:3000";
const allowedOrigins = rawOrigins.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);

// Root welcome route — shown when visiting the base URL
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Employee Management System API is live!",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health:    "GET  /api/health",
      signup:    "POST /api/auth/signup",
      login:     "POST /api/auth/login",
      me:        "GET  /api/auth/me",
      employees: "GET  /api/employees",
    },
    docs: "Use the endpoints above with a valid JWT Bearer token where required.",
  });
});

// Health check
app.get("/api/health", (req, res) =>
  res.json({
    success: true,
    message: "EMS API is healthy",
    uptime:  `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Central error handler
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
