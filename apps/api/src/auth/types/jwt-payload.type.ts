import { Role } from "@hussain/database";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface RefreshJwtPayload extends JwtPayload {
  sessionId: string;
}
