
/** backend/src/index.js
 *  - Điểm vào Express
 *  - Việt hoá 404 API & Error handler JSON
 */
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");
const apiRoutes = require("./routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production";

// Ẩn fingerprint server
app.disable("x-powered-by");

// trust proxy an toàn
if (isProd) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 1));
} else {
  app.set("trust proxy", false);
}

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Nén response
app.use(compression());

// CORS (nhiều origin ngăn cách dấu phẩy)
const allowed = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      cb(new Error("Không được phép bởi CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    optionsSuccessStatus: 204,
  })
);

// Parsers & logger
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// Static /uploads (immutable 7 ngày)
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    fallthrough: false,
    index: false,
    etag: true,
    maxAge: "7d",
    setHeaders(res) {
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    },
  })
);

// Mount API
app.use("/api", apiRoutes);

// 404 cho /api/*
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "Không tìm thấy API" });
  }
  next();
});

// Error handler JSON (VI)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const baseMsg = status >= 500 ? "Lỗi máy chủ" : (err.message || "Lỗi yêu cầu");
  const time = new Date().toISOString();
  // Log ra terminal
  console.error(`[${time}] [error]`, baseMsg, "-", err?.stack || err);

  res.status(status).json({
    message: baseMsg,
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
});

// Start
(async () => {
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () => console.log(`🚀 Backend chạy tại http://localhost:${PORT}`));
})();
