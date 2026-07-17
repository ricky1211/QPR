import { UsersService } from './users.service';
import { User } from '@prisma/client';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getAllUsers(): Promise<User[]>;
    getUserById(id: string): Promise<User | null>;
    createUser(data: {
        name: string;
        npk: number;
    }): Promise<User>;
}
