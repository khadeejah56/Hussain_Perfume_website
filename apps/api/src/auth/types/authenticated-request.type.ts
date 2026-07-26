import type { Request } from "express";
import type { JwtPayload, RefreshJwtPayload } from "./jwt-payload.type";

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export interface RefreshAuthenticatedRequest extends Request {
  user: RefreshJwtPayload;
}
