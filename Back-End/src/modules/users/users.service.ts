import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';

export interface CreateUserInput {
  name: string;
  npk: number;
  email?: string | null;
  role?: string | null;
  roles?: string[] | string;
  status?: string;
}

export interface UpdateUserInput {
  name?: string;
  npk?: number;
  email?: string | null;
  role?: string | null;
  roles?: string[] | string;
  status?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAllRoles(): Promise<Role[]> {
    try {
      return await this.prisma.role.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error: any) {
      console.warn('[UsersService] Database not available in findAllRoles():', error.message);
      return [];
    }
  }

  private formatUser(user: any) {
    const roleList = user.userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || [];
    return {
      ...user,
      roles: roleList,
      role: roleList.length > 0 ? roleList.join(', ') : user.role || null,
    };
  }

  async findOne(id: string): Promise<any | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });
      return user ? this.formatUser(user) : null;
    } catch (error: any) {
      console.warn('[UsersService] Database not available in findOne():', error.message);
      return null;
    }
  }

  async findByNpk(npk: number): Promise<any | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { npk },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });
      return user ? this.formatUser(user) : null;
    } catch (error: any) {
      console.warn('[UsersService] Database not available in findByNpk():', error.message);
      return null;
    }
  }

  async findAll(): Promise<any[]> {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          userRoles: {
            include: { role: true },
          },
        },
        orderBy: { npk: 'asc' },
      });
      return users.map((u) => this.formatUser(u));
    } catch (error: any) {
      console.warn('[UsersService] Database not available in findAll():', error.message);
      return [];
    }
  }

  async createUser(data: CreateUserInput): Promise<any> {
    const npkNum = Number(data.npk);
    if (isNaN(npkNum) || !npkNum) {
      throw new BadRequestException('NPK harus berupa angka yang valid.');
    }

    const cleanEmail = data.email && typeof data.email === 'string' && data.email.trim().length > 0
      ? data.email.trim()
      : null;

    const roleNames: string[] = Array.isArray(data.roles)
      ? data.roles
      : typeof data.roles === 'string' && data.roles.trim()
      ? data.roles.split(',').map((r) => r.trim()).filter(Boolean)
      : typeof data.role === 'string' && data.role.trim()
      ? data.role.split(',').map((r) => r.trim()).filter(Boolean)
      : [];

    const joinedRole = roleNames.length > 0 ? roleNames.join(', ') : data.role || null;

    try {
      const user = await this.prisma.user.create({
        data: {
          name: data.name.trim(),
          npk: npkNum,
          email: cleanEmail,
          role: joinedRole,
          status: data.status || 'Aktif',
        },
      });

      if (roleNames.length > 0) {
        for (const rName of roleNames) {
          let role = await this.prisma.role.findFirst({
            where: {
              OR: [
                { name: { equals: rName, mode: 'insensitive' } },
                { code: { equals: rName, mode: 'insensitive' } },
              ],
            },
          });
          if (!role) {
            role = await this.prisma.role.create({
              data: {
                name: rName,
                code: rName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              },
            });
          }

          await this.prisma.userRole.upsert({
            where: {
              userId_roleId: {
                userId: user.id,
                roleId: role.id,
              },
            },
            update: {},
            create: {
              userId: user.id,
              roleId: role.id,
            },
          });
        }
      }

      return this.findOne(user.id);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          if (target.includes('npk') || String(error.message).includes('npk')) {
            throw new ConflictException(`NPK ${npkNum} sudah terdaftar untuk karyawan lain.`);
          }
          if (target.includes('email') || String(error.message).includes('email')) {
            throw new ConflictException(`Email ${cleanEmail} sudah digunakan oleh karyawan lain.`);
          }
          throw new ConflictException('Data NPK atau Email sudah terdaftar dalam sistem.');
        }
      }
      console.error('UsersService.createUser error:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<any> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.npk !== undefined) {
      const npkNum = Number(data.npk);
      if (isNaN(npkNum) || !npkNum) {
        throw new BadRequestException('NPK harus berupa angka yang valid.');
      }
      updateData.npk = npkNum;
    }
    if (data.email !== undefined) {
      updateData.email = data.email && typeof data.email === 'string' && data.email.trim().length > 0
        ? data.email.trim()
        : null;
    }
    if (data.status !== undefined) updateData.status = data.status;

    let roleNames: string[] | null = null;
    if (data.roles !== undefined) {
      roleNames = Array.isArray(data.roles)
        ? data.roles
        : typeof data.roles === 'string' && data.roles.trim()
        ? data.roles.split(',').map((r) => r.trim()).filter(Boolean)
        : [];
    } else if (data.role !== undefined) {
      roleNames = typeof data.role === 'string' && data.role.trim()
        ? data.role.split(',').map((r) => r.trim()).filter(Boolean)
        : [];
    }

    if (roleNames !== null) {
      updateData.role = roleNames.length > 0 ? roleNames.join(', ') : null;
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      if (roleNames !== null) {
        await this.prisma.userRole.deleteMany({ where: { userId: id } });
        for (const rName of roleNames) {
          let role = await this.prisma.role.findFirst({
            where: {
              OR: [
                { name: { equals: rName, mode: 'insensitive' } },
                { code: { equals: rName, mode: 'insensitive' } },
              ],
            },
          });
          if (!role) {
            role = await this.prisma.role.create({
              data: {
                name: rName,
                code: rName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              },
            });
          }

          await this.prisma.userRole.upsert({
            where: {
              userId_roleId: {
                userId: id,
                roleId: role.id,
              },
            },
            update: {},
            create: {
              userId: id,
              roleId: role.id,
            },
          });
        }
      }

      return this.findOne(updatedUser.id);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          if (target.includes('npk') || String(error.message).includes('npk')) {
            throw new ConflictException(`NPK ${data.npk} sudah terdaftar untuk karyawan lain.`);
          }
          if (target.includes('email') || String(error.message).includes('email')) {
            throw new ConflictException(`Email ${data.email} sudah digunakan oleh karyawan lain.`);
          }
          throw new ConflictException('Data NPK atau Email sudah terdaftar dalam sistem.');
        }
      }
      console.error('UsersService.updateUser error:', error);
      throw error;
    }
  }
}
