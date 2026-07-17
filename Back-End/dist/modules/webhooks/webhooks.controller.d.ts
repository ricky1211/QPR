import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
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
    triggerSync(): Promise<{
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
