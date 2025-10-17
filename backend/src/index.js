/** backend/src/index.js
 *  - Điểm vào Express
 *  - Việt hoá 404 API & Error handler JSON
 *  - Fix CORS để hỗ trợ local network (192.168.x.x)
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

// CORS - Hỗ trợ nhiều origin + local network
const corsOriginConfig = process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173";
const allowedOrigins = corsOriginConfig
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Regex để match local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
const LOCAL_NETWORK_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      // Cho phép request không có origin (như Postman, curl, mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      // Kiểm tra origin có trong danh sách allowed
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Trong môi trường development, cho phép local network
      if (!isProd && LOCAL_NETWORK_REGEX.test(origin)) {
        return callback(null, true);
      }

      // Reject origin không hợp lệ
      const error = new Error(`CORS: Origin không được phép - ${origin}`);
      error.status = 403;
      return callback(error, false);
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
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

// Mount API
app.use("/api", apiRoutes);

// 404 cho /api/*
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ 
      success: false,
      message: "Không tìm thấy API endpoint" 
    });
  }
  next();
});

// 404 cho tất cả routes khác
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Trang không tồn tại" 
  });
});

// Error handler JSON (VI)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const isServerError = status >= 500;
  const baseMsg = isServerError 
    ? "Lỗi máy chủ nội bộ" 
    : (err.message || "Yêu cầu không hợp lệ");
  
  const time = new Date().toISOString();
  
  // Log chi tiết cho server errors
  if (isServerError || !isProd) {
    console.error(`[${time}] [ERROR ${status}]`, baseMsg);
    console.error(err.stack || err);
  }

  // Response
  const response = {
    success: false,
    message: baseMsg,
  };

  // Thêm stack trace trong dev mode
  if (!isProd && err.stack) {
    response.stack = err.stack;
    response.details = err.details || undefined;
  }

  res.status(status).json(response);
});

// Start server
(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Backend đang chạy:`);
      console.log(`   - Local:   http://localhost:${PORT}`);
      console.log(`   - Network: http://192.168.1.17:${PORT}`);
      console.log(`   - Mode:    ${process.env.NODE_ENV || "development"}`);
      
      if (!isProd) {
        console.log(`\n📱 CORS cho phép tất cả local network trong dev mode`);
      }
    });
  } catch (error) {
    console.error("❌ Không thể khởi động server:", error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n⚠️  SIGTERM nhận được, đang tắt server...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n⚠️  SIGINT nhận được, đang tắt server...");
  process.exit(0);
});