import { VendorsService } from './vendors.service';
import { Vendor } from '@prisma/client';
export declare class VendorsController {
    private readonly vendorsService;
    constructor(vendorsService: VendorsService);
    getAllVendors(): Promise<Vendor[]>;
    getVendorById(id: string): Promise<Vendor | null>;
    createVendor(data: {
        vendorCode: string;
        vendorName?: string;
    }): Promise<Vendor>;
}
