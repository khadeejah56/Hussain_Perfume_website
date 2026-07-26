import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { RefreshJwtPayload } from "../types/jwt-payload.type";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField("refreshToken"),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("jwt.refreshSecret"),
    });
  }

  validate(payload: RefreshJwtPayload): RefreshJwtPayload {
    return payload;
  }
}
