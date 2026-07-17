import { PrismaService } from '../../infrastructure/prisma/prisma.service';
export declare class WebhooksService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private getBaseUrl;
    syncVendors(): Promise<{
        processed: number;
        failed: number;
        errors: string[];
    }>;
    syncParts(): Promise<{
        vendorsChecked: number;
        partsProcessed: number;
        partsFailed: number;
        errors: string[];
    }>;
    syncAll(): Promise<{
        vendorSync: {
            processed: number;
            failed: number;
            errors: string[];
        };
        partsSync: {
            vendorsChecked: number;
            partsProcessed: number;
            partsFailed: number;
            errors: string[];
        };
    }>;
}
