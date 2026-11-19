import { Request, Response, NextFunction } from "express";

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "User session required" });
    }

    // Admin has full universal capability per Master Specification
    if (req.user.role === "ADMIN") {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Missing required capability permission: ${permission}`,
      });
    }

    next();
  };
}

export function requireRole(allowedRoles: ("ADMIN" | "EVALUATOR")[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "User session required" });
    }

    if (!allowedRoles.includes(req.user.role as "ADMIN" | "EVALUATOR")) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Access denied. Requires role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
}

export const requireAdmin = requireRole(["ADMIN"]);
export const requireEvaluator = requireRole(["ADMIN", "EVALUATOR"]);
