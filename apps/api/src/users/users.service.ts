import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { Prisma, type User } from "@hussain/database";
import { PrismaService } from "../prisma/prisma.service";
import type { UpdateProfileDto } from "./dto/update-profile.dto";
import type { ChangePasswordDto } from "./dto/change-password.dto";
import type { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import type { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import type { QueryUsersDto } from "./dto/query-users.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return this.toPublicUser(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    const data: Prisma.UserUpdateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    };

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailTaken) {
        throw new ConflictException("An account with this email already exists");
      }
      data.email = dto.email;
      data.isEmailVerified = false;
    }

    const user = await this.prisma.user.update({ where: { id }, data });
    return this.toPublicUser(user);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    await this.prisma.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async findAll(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.UserWhereInput = {};
    if (query.role) {
      where.role = query.role;
    }
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => this.toPublicUser(user)),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async updateRole(id: string, dto: UpdateUserRoleDto, actingUserId: string) {
    if (id === actingUserId) {
      throw new BadRequestException("You cannot change your own role");
    }
    await this.assertExists(id);
    const user = await this.prisma.user.update({ where: { id }, data: { role: dto.role } });
    return this.toPublicUser(user);
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, actingUserId: string) {
    if (id === actingUserId) {
      throw new BadRequestException("You cannot change your own account status");
    }
    await this.assertExists(id);
    const user = await this.prisma.user.update({ where: { id }, data: { isActive: dto.isActive } });

    if (!dto.isActive) {
      await this.prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return this.toPublicUser(user);
  }

  private async assertExists(id: string) {
    const exists = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
  }

  private toPublicUser(user: User) {
    const { passwordHash: _passwordHash, emailVerifyToken: _emailVerifyToken, passwordResetToken: _passwordResetToken, ...publicUser } = user;
    return publicUser;
  }
}
