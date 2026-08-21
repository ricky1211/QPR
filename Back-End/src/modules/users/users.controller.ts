import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }

  @Post()
  async createUser(
    @Body()
    data: {
      name: string;
      npk: number;
      email?: string;
      role?: string;
      status?: string;
    },
  ): Promise<User> {
    return this.usersService.createUser({
      name: data.name,
      npk: Number(data.npk),
      email: data.email || null,
      role: data.role || null,
      status: data.status || 'Aktif',
    });
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      npk?: number;
      email?: string;
      role?: string;
      status?: string;
    },
  ): Promise<User> {
    return this.usersService.updateUser(id, {
      name: data.name,
      npk: data.npk !== undefined ? Number(data.npk) : undefined,
      email: data.email === '' ? null : data.email,
      role: data.role,
      status: data.status,
    });
  }
}
