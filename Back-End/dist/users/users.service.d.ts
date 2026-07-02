import { PrismaService } from '../prisma.service';
import { User, Prisma } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(id: string): Promise<User | null>;
    findByNpk(npk: number): Promise<User | null>;
    findAll(): Promise<User[]>;
    createUser(data: Prisma.UserCreateInput): Promise<User>;
}
