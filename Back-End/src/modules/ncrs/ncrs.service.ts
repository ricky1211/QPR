import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Ncr, NcrApprovalProgress, Prisma } from '@prisma/client';

@Injectable()
export class NcrsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string): Promise<any> {
    return this.prisma.ncr.findUnique({
      where: { id },
      include: {
        ncrApprovalProgress: true,
        part: true,
        vendor: true,
        inspectors: true,
      },
    });
  }

  async findByCode(code: string): Promise<Ncr | null> {
    return this.prisma.ncr.findUnique({
      where: { code },
    });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.ncr.findMany({
      select: {
        id: true,
        code: true,
        date: true,
        partId: true,
        vendorId: true,
        description: true,
        isRequiredCustomerApproval: true,
        customerApproval: true,
        part: {
          select: {
            id: true,
            partNumber: true,
            partDesc: true,
          }
        },
        vendor: {
          select: {
            id: true,
            vendorCode: true,
            vendorName: true,
          }
        },
        ncrApprovalProgress: {
          select: {
            id: true,
            ncrId: true,
            checksumApprovalSectionHead: true,
            checksumApprovalDeptHead: true,
          }
        }
      }
    });
  }


  async createNcr(data: any): Promise<Ncr> {
    // 1. Resolve Vendor
    let vendor = await this.prisma.vendor.findFirst({
      where: {
        OR: [
          { id: data.vendorId },
          { vendorCode: data.vendorId },
          { vendorCode: data.vendorCode }
        ]
      }
    });

    if (!vendor) {
      const code = data.vendorCode || data.vendorId || `VND-${Math.floor(1000 + Math.random() * 9000)}`;
      vendor = await this.prisma.vendor.create({
        data: {
          vendorCode: code,
          vendorName: data.vendorName || `Vendor ${code}`,
        }
      });
    }

    // 2. Resolve Parts in partsDetail and upsert them
    let primaryPartId: string | null = data.partId || null;

    if (data.partsDetail && Array.isArray(data.partsDetail)) {
      for (const item of data.partsDetail) {
        const partNumber = item.partNumber;
        const partDesc = item.partName;

        if (partNumber) {
          const part = await this.prisma.part.upsert({
            where: { partNumber },
            update: { partDesc: partDesc || undefined },
            create: {
              partNumber,
              partDesc: partDesc || null,
            }
          });

          if (!primaryPartId) {
            primaryPartId = part.id;
          }

          // Ensure relationship in VendorPart exists
          await this.prisma.vendorPart.upsert({
            where: {
              vendorId_partId: {
                vendorId: vendor.id,
                partId: part.id,
              }
            },
            update: {},
            create: {
              vendorId: vendor.id,
              partId: part.id,
            }
          });
        }
      }
    }

    // 3. Resolve inspectors
    const inspectorConnect = data.inspectorIds && Array.isArray(data.inspectorIds)
      ? { connect: data.inspectorIds.map((id: string) => ({ id })) }
      : undefined;

    // 4. Generate Auto NCR Code: [Sequence]/[DDMMYY]/[SupplierCode]
    const ncrDate = data.date ? new Date(data.date) : new Date();
    const startOfDay = new Date(ncrDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(ncrDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyNcrCount = await this.prisma.ncr.count({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const nextSeq = String(dailyNcrCount + 1).padStart(4, '0');
    
    // Format date as DDMMYY
    const dd = String(ncrDate.getDate()).padStart(2, '0');
    const mm = String(ncrDate.getMonth() + 1).padStart(2, '0');
    const yy = String(ncrDate.getFullYear()).slice(-2);
    const dateStr = `${dd}${mm}${yy}`;
    
    const supplierCode = vendor.vendorCode || 'VND';
    const autoNcrCode = `${nextSeq}/${dateStr}/${supplierCode}`;

    // 5. Create the NCR record
    return this.prisma.ncr.create({
      data: {
        code: autoNcrCode,
        date: ncrDate,
        vendor: { connect: { id: vendor.id } },
        part: primaryPartId ? { connect: { id: primaryPartId } } : undefined,
        location: data.location || null,
        problemType: data.problemType || null,
        disposition: data.disposition || null,
        description: data.description || null,
        isRequiredCustomerApproval: data.isRequiredCustomerApproval ?? null,
        customerApproval: data.customerApproval || null,
        docsToRevise: data.docsToRevise || null,
        images: data.images || null,
        details: data.details || null,
        inspectors: inspectorConnect,
      }
    });
  }

  async updateNcr(id: string, data: Prisma.NcrUpdateInput): Promise<Ncr> {
    return this.prisma.ncr.update({
      where: { id },
      data,
    });
  }

  async upsertApprovalProgress(
    ncrId: string,
    data: {
      checksumApprovalSectionHead?: Buffer;
      checksumApprovalDeptHead?: Buffer;
    },
  ): Promise<NcrApprovalProgress> {
    const existing = await this.prisma.ncrApprovalProgress.findUnique({
      where: { ncrId },
    });

    if (existing) {
      return this.prisma.ncrApprovalProgress.update({
        where: { ncrId },
        data: {
          checksumApprovalSectionHead: data.checksumApprovalSectionHead,
          checksumApprovalDeptHead: data.checksumApprovalDeptHead,
        },
      });
    } else {
      return this.prisma.ncrApprovalProgress.create({
        data: {
          ncrId,
          checksumApprovalSectionHead: data.checksumApprovalSectionHead,
          checksumApprovalDeptHead: data.checksumApprovalDeptHead,
        },
      });
    }
  }
}
