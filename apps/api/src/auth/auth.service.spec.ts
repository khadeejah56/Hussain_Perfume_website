import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@hussain/database";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";

type MockPrisma = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  session: {
    create: jest.Mock;
    update: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
};

describe("AuthService", () => {
  let authService: AuthService;
  let prisma: MockPrisma;

  const CONFIG: Record<string, string> = {
    "jwt.accessSecret": "test-access-secret",
    "jwt.accessExpiresIn": "15m",
    "jwt.refreshSecret": "test-refresh-secret",
    "jwt.refreshExpiresIn": "30d",
  };

  const configService = {
    getOrThrow: (key: string) => CONFIG[key],
  } as unknown as ConfigService;

  const baseUser = {
    id: "user-1",
    email: "customer@example.com",
    firstName: "Jane",
    lastName: "Doe",
    role: Role.CUSTOMER,
    isActive: true,
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      session: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
    };

    let sessionCounter = 0;
    prisma.session.create.mockImplementation(() =>
      Promise.resolve({ id: `session-${++sessionCounter}` }),
    );
    prisma.session.update.mockImplementation(({ where, data }) =>
      Promise.resolve({ id: where.id, ...data }),
    );

    authService = new AuthService(
      prisma as unknown as PrismaService,
      new JwtService(),
      configService,
    );
  });

  describe("register", () => {
    it("creates a new customer and returns tokens", async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValueOnce({ ...baseUser, passwordHash: "hashed" });

      const result = await authService.register(
        { email: baseUser.email, password: "StrongP@ss1", firstName: "Jane", lastName: "Doe" },
        {},
      );

      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.user.email).toBe(baseUser.email);
      expect(result.user.role).toBe(Role.CUSTOMER);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: Role.CUSTOMER }) }),
      );
    });

    it("rejects registration when the email is already taken", async () => {
      prisma.user.findUnique.mockResolvedValueOnce(baseUser);

      await expect(
        authService.register(
          { email: baseUser.email, password: "StrongP@ss1", firstName: "Jane", lastName: "Doe" },
          {},
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("login", () => {
    it("rejects an unknown email", async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        authService.login({ email: "nobody@example.com", password: "whatever" }, {}),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a deactivated account", async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ ...baseUser, isActive: false, passwordHash: "x" });

      await expect(
        authService.login({ email: baseUser.email, password: "whatever" }, {}),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects an incorrect password", async () => {
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash("CorrectPassword1", 4);
      prisma.user.findUnique.mockResolvedValueOnce({ ...baseUser, passwordHash });

      await expect(
        authService.login({ email: baseUser.email, password: "WrongPassword1" }, {}),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("issues tokens for correct credentials", async () => {
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash("CorrectPassword1", 4);
      prisma.user.findUnique.mockResolvedValueOnce({ ...baseUser, passwordHash });

      const result = await authService.login(
        { email: baseUser.email, password: "CorrectPassword1" },
        {},
      );

      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
    });
  });

  describe("refresh", () => {
    it("rotates the refresh token on valid presentation", async () => {
      const bcrypt = await import("bcryptjs");
      const presentedToken = "refresh-token-value";
      const tokenHash = await bcrypt.hash(presentedToken, 4);

      prisma.session.findUnique.mockResolvedValueOnce({
        id: "session-1",
        userId: baseUser.id,
        refreshTokenHash: tokenHash,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });
      prisma.user.findUnique.mockResolvedValueOnce(baseUser);

      const result = await authService.refresh(
        { sub: baseUser.id, email: baseUser.email, role: baseUser.role, sessionId: "session-1" },
        presentedToken,
      );

      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "session-1" }, data: { revokedAt: expect.any(Date) } }),
      );
    });

    it("rejects a revoked session", async () => {
      prisma.session.findUnique.mockResolvedValueOnce({
        id: "session-1",
        userId: baseUser.id,
        refreshTokenHash: "irrelevant",
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });

      await expect(
        authService.refresh(
          { sub: baseUser.id, email: baseUser.email, role: baseUser.role, sessionId: "session-1" },
          "any-token",
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a token that doesn't match the stored hash (reuse/tampering)", async () => {
      const bcrypt = await import("bcryptjs");
      const tokenHash = await bcrypt.hash("the-real-token", 4);

      prisma.session.findUnique.mockResolvedValueOnce({
        id: "session-1",
        userId: baseUser.id,
        refreshTokenHash: tokenHash,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });

      await expect(
        authService.refresh(
          { sub: baseUser.id, email: baseUser.email, role: baseUser.role, sessionId: "session-1" },
          "a-different-token",
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "session-1" }, data: { revokedAt: expect.any(Date) } }),
      );
    });
  });

  describe("logout", () => {
    it("revokes only the active session with matching id", async () => {
      prisma.session.updateMany.mockResolvedValueOnce({ count: 1 });

      await authService.logout("session-1");

      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { id: "session-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
