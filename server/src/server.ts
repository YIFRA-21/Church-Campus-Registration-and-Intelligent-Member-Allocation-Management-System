import { app } from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[C-CIMAS Backend] Express API server running on http://localhost:${PORT}`);
  console.log(`[C-CIMAS Backend] Environment: ${process.env.NODE_ENV || "development"}`);
});

