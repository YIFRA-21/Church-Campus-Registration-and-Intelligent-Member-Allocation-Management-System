import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// Public Authentication endpoints
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

// Protected session inspection & security
router.get("/me", authenticateJWT, AuthController.me);
router.put("/profile", authenticateJWT, AuthController.updateProfile);
router.post("/change-password", authenticateJWT, AuthController.changePassword);

export default router;

