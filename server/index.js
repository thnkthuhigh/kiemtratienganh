import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/database.js";
import exerciseRoutes from "./routes/exercises.js";
import uploadRoutes from "./routes/upload.js";
import userRoutes from "./routes/users.js";

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files (only if you really need to serve custom folders)
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use("/audio", express.static(path.join(__dirname, "public/audio")));

// API Routes
app.use("/api/exercises", exerciseRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);

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
    database: dbStates[dbStatus] || "unknown",
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 for API
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// Serve React build (if you deploy fullstack in one server)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
