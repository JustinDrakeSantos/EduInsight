import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: "http://54.177.46.189:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});

// routes
import studySessionRoutes from "./routes/studySessionRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import examScoreRoutes from "./routes/examScoreRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";

app.use("/api/study-sessions", studySessionRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/exam-scores", examScoreRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/recommendations", recommendationRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ message: err.message });
});