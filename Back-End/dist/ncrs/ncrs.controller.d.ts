import { NcrsService } from './ncrs.service';
import { Ncr, NcrApprovalProgress } from '@prisma/client';
export declare class NcrsController {
    private readonly ncrsService;
    constructor(ncrsService: NcrsService);
    getAllNcrs(): Promise<Ncr[]>;
    getNcrById(id: string): Promise<Ncr | null>;
    createNcr(data: {
        code: string;
        partId: string;
        vendorId: string;
        location?: any;
        problemType?: any;
        description?: string;
        disposition?: any;
        isRequiredCustomerApproval?: boolean;
        details?: any;
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
