import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import exerciseRoutes from "./routes/exercises.js";

// Load environment variables
dotenv.config();

// Debug environment variables
console.log("🔍 Environment Check:");
console.log("📁 NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("🔌 PORT:", process.env.PORT || "using default 5000");
console.log(
  "🗃️  MONGODB_URI:",
  process.env.MONGODB_URI ? "loaded from .env" : "using fallback"
);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/exercises", exerciseRoutes);

// Test route
app.post("/api/test", (req, res) => {
  console.log("🧪 Test endpoint called");
  console.log("Body:", req.body);
  res.json({
    message: "Test successful",
    received: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.json({
    status: "OK",
    message: "Server is running",
    database: {
      status: dbStates[dbStatus] || "unknown",
      connected: dbStatus === 1,
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});
