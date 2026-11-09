import { AuthSessionPayload } from "../schemas/auth.schema";

declare global {
  namespace Express {
    interface Request {
      user?: AuthSessionPayload;
    }
  }
}

