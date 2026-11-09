import { Request, Response, NextFunction } from "express";

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "User session required" });
    }

    // Super Admin has universal capability
    if (req.user.role === "SUPER_ADMIN") {
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

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "User session required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Access denied. Requires one of roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
}

