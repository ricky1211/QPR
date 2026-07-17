import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Vendor, Prisma } from '@prisma/client';
export declare class VendorsService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(id: string): Promise<Vendor | null>;
    findByCode(vendorCode: string): Promise<Vendor | null>;
    findAll(): Promise<Vendor[]>;
    createVendor(data: Prisma.VendorCreateInput): Promise<Vendor>;
}
