import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { Role } from "@hussain/database";
import { PrismaService } from "../prisma/prisma.service";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import type { JwtPayload, RefreshJwtPayload } from "./types/jwt-payload.type";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends TokenPair {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
}

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, context: { userAgent?: string; ipAddress?: string }): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: Role.CUSTOMER,
      },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role, context);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  async login(dto: LoginDto, context: { userAgent?: string; ipAddress?: string }): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role, context);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  async refresh(payload: RefreshJwtPayload, presentedToken: string): Promise<TokenPair> {
    const session = await this.prisma.session.findUnique({ where: { id: payload.sessionId } });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired or revoked");
    }

    const isTokenValid = await bcrypt.compare(presentedToken, session.refreshTokenHash);
    if (!isTokenValid) {
      // Presented token doesn't match the stored hash for this session: possible reuse of a
      // stale/stolen token. Revoke the session defensively.
      await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Account is no longer active");
    }

    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });

    return this.issueTokens(user.id, user.email, user.role, {});
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: Role,
    context: { userAgent?: string; ipAddress?: string },
  ): Promise<TokenPair> {
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: "pending",
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    const basePayload: JwtPayload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(basePayload, {
      secret: this.configService.getOrThrow<string>("jwt.accessSecret"),
      expiresIn: this.configService.getOrThrow<string>("jwt.accessExpiresIn"),
    });

    const refreshPayload: RefreshJwtPayload = { ...basePayload, sessionId: session.id };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.getOrThrow<string>("jwt.refreshSecret"),
      expiresIn: this.configService.getOrThrow<string>("jwt.refreshExpiresIn"),
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.prisma.session.update({ where: { id: session.id }, data: { refreshTokenHash } });

    return { accessToken, refreshToken };
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}
