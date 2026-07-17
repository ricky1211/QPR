"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(WebhooksService_1.name);
    }
    getBaseUrl() {
        const baseUrl = process.env.DOV_API_BASE_URL;
        if (!baseUrl) {
            const errMsg = 'DOV_API_BASE_URL is not defined in the environment variables.';
            this.logger.error(errMsg);
            throw new Error(errMsg);
        }
        return baseUrl;
    }
    async syncVendors() {
        const baseUrl = this.getBaseUrl();
        this.logger.log('Starting synchronization of Vendors from DOV API...');
        const stats = {
            processed: 0,
            failed: 0,
            errors: [],
        };
        try {
            const vendorsUrl = `${baseUrl}/vendors`;
            this.logger.log(`Fetching vendors from: ${vendorsUrl}`);
            const response = await fetch(vendorsUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch vendors. Status: ${response.status} ${response.statusText}`);
            }
            const rawVendors = await response.json();
            if (!Array.isArray(rawVendors)) {
                throw new Error('Invalid response format for vendors. Expected an array.');
            }
            this.logger.log(`Found ${rawVendors.length} vendors from DOV.`);
            for (const item of rawVendors) {
                const vendorCode = item.code || item.vendorCode || item.vendor_code;
                const vendorName = item.name || item.vendorName || item.vendor_name;
                if (!vendorCode) {
                    const errMsg = `Skipping vendor item because it does not have a vendor code: ${JSON.stringify(item)}`;
                    this.logger.warn(errMsg);
                    stats.errors.push(errMsg);
                    stats.failed++;
                    continue;
                }
                try {
                    await this.prisma.vendor.upsert({
                        where: { vendorCode },
                        update: { vendorName: vendorName || undefined },
                        create: {
                            vendorCode,
                            vendorName: vendorName || null,
                        },
                    });
                    stats.processed++;
                }
                catch (err) {
                    const errMsg = `Failed to upsert vendor ${vendorCode}: ${err.message}`;
                    this.logger.error(errMsg);
                    stats.errors.push(errMsg);
                    stats.failed++;
                }
            }
            this.logger.log(`Vendor synchronization finished. Stats: ${JSON.stringify(stats)}`);
            return stats;
        }
        catch (globalErr) {
            this.logger.error(`Vendor sync failed: ${globalErr.message}`);
            stats.errors.push(`Global vendor sync error: ${globalErr.message}`);
            return stats;
        }
    }
    async syncParts() {
        const baseUrl = this.getBaseUrl();
        this.logger.log('Starting synchronization of Parts & VendorParts relations...');
        const stats = {
            vendorsChecked: 0,
            partsProcessed: 0,
            partsFailed: 0,
            errors: [],
        };
        try {
            const dbVendors = await this.prisma.vendor.findMany();
            this.logger.log(`Found ${dbVendors.length} vendors in local database to sync parts for.`);
            for (const vendor of dbVendors) {
                const vendorCode = vendor.vendorCode;
                stats.vendorsChecked++;
                try {
                    const partsUrl = `${baseUrl}/vendors/${vendorCode}/parts`;
                    this.logger.log(`Fetching parts for vendor ${vendorCode} from: ${partsUrl}`);
                    const partsResponse = await fetch(partsUrl);
                    if (!partsResponse.ok) {
                        const errMsg = `Failed to fetch parts for vendor ${vendorCode}. Status: ${partsResponse.status} ${partsResponse.statusText}`;
                        this.logger.warn(errMsg);
                        stats.errors.push(errMsg);
                        stats.partsFailed++;
                        continue;
                    }
                    const rawParts = await partsResponse.json();
                    if (!Array.isArray(rawParts)) {
                        const errMsg = `Invalid parts response format for vendor ${vendorCode}. Expected an array.`;
                        this.logger.error(errMsg);
                        stats.errors.push(errMsg);
                        stats.partsFailed++;
                        continue;
                    }
                    this.logger.log(`Found ${rawParts.length} parts for vendor ${vendorCode}. Syncing...`);
                    for (const partItem of rawParts) {
                        const partNumber = partItem.partNumber || partItem.number || partItem.part_number;
                        const partDesc = partItem.name || partItem.partDesc || partItem.description || partItem.part_desc;
                        if (!partNumber) {
                            const errMsg = `Skipping part item for vendor ${vendorCode} because it does not have a part number: ${JSON.stringify(partItem)}`;
                            this.logger.warn(errMsg);
                            stats.errors.push(errMsg);
                            continue;
                        }
                        try {
                            const dbPart = await this.prisma.part.upsert({
                                where: { partNumber },
                                update: { partDesc: partDesc || undefined },
                                create: {
                                    partNumber,
                                    partDesc: partDesc || null,
                                },
                            });
                            await this.prisma.vendorPart.upsert({
                                where: {
                                    vendorId_partId: {
                                        vendorId: vendor.id,
                                        partId: dbPart.id,
                                    },
                                },
                                update: {},
                                create: {
                                    vendorId: vendor.id,
                                    partId: dbPart.id,
                                },
                            });
                            stats.partsProcessed++;
                        }
                        catch (partErr) {
                            const errMsg = `Failed to save part ${partNumber} for vendor ${vendorCode}: ${partErr.message}`;
                            this.logger.error(errMsg);
                            stats.errors.push(errMsg);
                            stats.partsFailed++;
                        }
                    }
                }
                catch (vendorErr) {
                    const errMsg = `Failed to fetch/process parts for vendor ${vendorCode}: ${vendorErr.message}`;
                    this.logger.error(errMsg);
                    stats.errors.push(errMsg);
                    stats.partsFailed++;
                }
            }
            this.logger.log(`Parts synchronization finished. Stats: ${JSON.stringify(stats)}`);
            return stats;
        }
        catch (globalErr) {
            this.logger.error(`Parts sync failed: ${globalErr.message}`);
            stats.errors.push(`Global parts sync error: ${globalErr.message}`);
            return stats;
        }
    }
    async syncAll() {
        this.logger.log('Starting full synchronization (Vendors + Parts)...');
        const vendorStats = await this.syncVendors();
        const partStats = await this.syncParts();
        return {
            vendorSync: vendorStats,
            partsSync: partStats,
        };
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map