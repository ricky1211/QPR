import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  private getBaseUrl() {
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
      errors: [] as string[],
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
        } catch (err) {
          const errMsg = `Failed to upsert vendor ${vendorCode}: ${err.message}`;
          this.logger.error(errMsg);
          stats.errors.push(errMsg);
          stats.failed++;
        }
      }

      this.logger.log(`Vendor synchronization finished. Stats: ${JSON.stringify(stats)}`);
      return stats;
    } catch (globalErr) {
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
      errors: [] as string[],
    };

    try {
      // Get all vendors currently in our QPR database
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
              // 1. Upsert Part
              const dbPart = await this.prisma.part.upsert({
                where: { partNumber },
                update: { partDesc: partDesc || undefined },
                create: {
                  partNumber,
                  partDesc: partDesc || null,
                },
              });

              // 2. Upsert VendorPart
              await this.prisma.vendorPart.upsert({
                where: {
                  vendorId_partId: {
                    vendorId: vendor.id,
                    partId: dbPart.id,
                  },
                },
                update: {}, // nothing to update
                create: {
                  vendorId: vendor.id,
                  partId: dbPart.id,
                },
              });
              stats.partsProcessed++;
            } catch (partErr) {
              const errMsg = `Failed to save part ${partNumber} for vendor ${vendorCode}: ${partErr.message}`;
              this.logger.error(errMsg);
              stats.errors.push(errMsg);
              stats.partsFailed++;
            }
          }
        } catch (vendorErr) {
          const errMsg = `Failed to fetch/process parts for vendor ${vendorCode}: ${vendorErr.message}`;
          this.logger.error(errMsg);
          stats.errors.push(errMsg);
          stats.partsFailed++;
        }
      }

      this.logger.log(`Parts synchronization finished. Stats: ${JSON.stringify(stats)}`);
      return stats;
    } catch (globalErr) {
      this.logger.error(`Parts sync failed: ${globalErr.message}`);
      stats.errors.push(`Global parts sync error: ${globalErr.message}`);
      return stats;
    }
  }

  async syncAll() {
    this.logger.log('Starting full synchronization (Vendors + Parts)...');
    
    // 1. Sync Vendors
    const vendorStats = await this.syncVendors();
    
    // 2. Sync Parts
    const partStats = await this.syncParts();

    return {
      vendorSync: vendorStats,
      partsSync: partStats,
    };
  }
}
