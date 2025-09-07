import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://chithanh:chithanh@cluster0.bpqowys.mongodb.net/english_center?retryWrites=true&w=majority&appName=Cluster0";

export const connectDB = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    console.log(
      "📍 Connection URI:",
      MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")
    );

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB connected successfully");
    console.log("📊 Database name:", mongoose.connection.db.databaseName);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);

    if (error.message.includes("Authentication failed")) {
      console.error("🔐 Authentication failed. Please check:");
      console.error("   1. Username and password are correct");
      console.error("   2. User has proper permissions");
      console.error("   3. IP address is whitelisted in MongoDB Atlas");
    }

    // Don't exit process in development to allow fallback
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.log("⚠️  Running in development mode without database");
    }
  }
};

export default connectDB;
