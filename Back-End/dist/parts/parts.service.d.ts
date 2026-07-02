import { PrismaService } from '../prisma.service';
import { Part, Prisma } from '@prisma/client';
export declare class PartsService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(id: string): Promise<Part | null>;
    findByPartNumber(partNumber: string): Promise<Part | null>;
    findAll(): Promise<Part[]>;
    createPart(data: Prisma.PartCreateInput): Promise<Part>;
    updatePart(id: string, data: Prisma.PartUpdateInput): Promise<Part>;
}
