import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import campusRoutes from "./routes/campus.routes";
import userRoutes from "./routes/user.routes";
import departmentRoutes from "./routes/department.routes";
import memberRoutes from "./routes/member.routes";
import importRoutes from "./routes/import.routes";
import allocationRoutes from "./routes/allocation.routes";
import evaluationRoutes from "./routes/evaluation.routes";
import reportRoutes from "./routes/report.routes";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Mount Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/campuses", campusRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/members", memberRoutes);
app.use("/api/v1/imports", importRoutes);
app.use("/api/v1/allocations", allocationRoutes);
app.use("/api/v1/evaluations", evaluationRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/users", userRoutes);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled API Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "An unexpected error occurred",
  });
});
