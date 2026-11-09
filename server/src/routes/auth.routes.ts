import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// Public Authentication endpoints
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

// Protected session inspection
router.get("/me", authenticateJWT, AuthController.me);

export default router;

