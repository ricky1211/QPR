import { PartsService } from './parts.service';
import { Part } from '@prisma/client';
export declare class PartsController {
    private readonly partsService;
    constructor(partsService: PartsService);
    getAllParts(): Promise<Part[]>;
    getPartById(id: string): Promise<Part | null>;
    createPart(data: {
        partNumber: string;
        partDesc?: string;
    }): Promise<Part>;
    updatePart(id: string, data: {
        partNumber?: string;
        partDesc?: string;
    }): Promise<Part>;
}
