// backend/src/index.js

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");
const apiRoutes = require("./routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// (Tuỳ hạ tầng proxy/CDN) giúp đọc x-forwarded-* khi dựng canonical, rate-limit...
app.set("trust proxy", true);

// ---- Middlewares nền tảng
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// ---- Serve tĩnh thư mục uploads (lưu trực tiếp trên máy chủ)
//  Thư mục vật lý: backend/src/uploads
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Express không có option "immutable" -> set qua setHeaders
app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    fallthrough: false, // 404 nếu không có file
    index: false,       // không serve index.html
    etag: true,
    maxAge: "7d",       // backup, sẽ ghi đè bằng setHeaders
    setHeaders(res /*, filePath */) {
      // 7 ngày = 604800 giây
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    },
  })
);

// ---- Mount API
app.use("/api", apiRoutes);

// ---- 404 API fallback
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "API route not found" });
  }
  next();
});

// ---- Error handler chuẩn JSON
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[Error]", err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
});

// ---- Start
(async () => {
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () =>
    console.log(`🚀 Backend chạy tại http://localhost:${PORT}`)
  );
})();
