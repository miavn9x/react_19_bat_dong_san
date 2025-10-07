const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");
const apiRoutes = require("./routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Routes prefix
app.use("/api", apiRoutes);

// Start server
(async () => {
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`🚀 Backend chạy tại http://localhost:${PORT}`);
  });
})();
