import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Ncr, NcrApprovalProgress, Prisma } from '@prisma/client';
export declare class NcrsService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(id: string): Promise<any>;
    findByCode(code: string): Promise<Ncr | null>;
    findAll(): Promise<any[]>;
    createNcr(data: any): Promise<Ncr>;
    updateNcr(id: string, data: Prisma.NcrUpdateInput): Promise<Ncr>;
    upsertApprovalProgress(ncrId: string, data: {
        checksumApprovalSectionHead?: Buffer;
        checksumApprovalDeptHead?: Buffer;
    }): Promise<NcrApprovalProgress>;
}
