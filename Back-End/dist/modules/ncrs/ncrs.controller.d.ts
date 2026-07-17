import { NcrsService } from './ncrs.service';
import { MinioService } from '../../infrastructure/minio/minio.service';
import { Ncr, NcrApprovalProgress } from '@prisma/client';
export declare class NcrsController {
    private readonly ncrsService;
    private readonly minioService;
    constructor(ncrsService: NcrsService, minioService: MinioService);
    uploadFile(file: Express.Multer.File): Promise<{
        relativePath: string;
    }>;
    getAllNcrs(): Promise<any[]>;
    getNcrById(id: string): Promise<Ncr | null>;
    createNcr(data: {
        code: string;
        date?: string;
        partId?: string;
        vendorId: string;
        vendorCode?: string;
        vendorName?: string;
        location?: any;
        problemType?: any;
        description?: string;
        disposition?: any;
        isRequiredCustomerApproval?: boolean;
        customerApproval?: string;
        docsToRevise?: any;
        images?: any;
        details?: any;
        partsDetail?: Array<{
            partNumber: string;
            partName: string;
            qtyNG: number;
            ngType: string;
        }>;
        inspectorIds?: string[];
    }): Promise<Ncr>;
    updateNcr(id: string, data: {
        location?: any;
        problemType?: any;
        description?: string;
        disposition?: any;
        isRequiredCustomerApproval?: boolean;
        details?: any;
    }): Promise<Ncr>;
    updateApprovalProgress(id: string, data: {
        checksumApprovalSectionHead?: string;
        checksumApprovalDeptHead?: string;
    }): Promise<NcrApprovalProgress>;
}
