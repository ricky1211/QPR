import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Qpr, QprApprovalProgress, QprStatus } from '@prisma/client';

@Injectable()
export class QprsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    try {
      return await this.prisma.qpr.findMany({
        include: {
          vendor: true,
          user: true,
          qprParts: {
            include: {
              part: true,
            },
          },
          approvalProgress: true,
          confirmationLetter: {
            include: {
              sscBilling: true,
              sscPayment: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('[QprsService] Error in findAll():', error);
      return [];
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      return await this.prisma.qpr.findUnique({
        where: { id },
        include: {
          vendor: true,
          user: true,
          qprParts: {
            include: {
              part: true,
            },
          },
          approvalProgress: true,
          confirmationLetter: {
            include: {
              sscBilling: true,
              sscPayment: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`[QprsService] Error finding QPR by id (${id}):`, error);
      return null;
    }
  }

  async create(data: any): Promise<Qpr> {
    const {
      qprNumber,
      date,
      vendorId,
      userId,
      status,
      requiredRole,
      refNcrNumber,
      problem,
      claimType,
      totalQty,
      totalQtyNg,
      totalStdAllowance,
      billableQty,
      claimAmount,
      pdfFileName,
      pdfFileBase64,
      qprParts,
    } = data;

    // Create main QPR first
    return await this.prisma.qpr.create({
      data: {
        qprNumber,
        date: date ? new Date(date) : new Date(),
        vendorId,
        userId,
        status: status || QprStatus.WAITING_APPROVAL,
        requiredRole,
        refNcrNumber,
        problem,
        claimType,
        totalQty,
        totalQtyNg,
        totalStdAllowance,
        billableQty,
        claimAmount,
        pdfFileName,
        pdfFileBase64,
        qprParts: qprParts && Array.isArray(qprParts) ? {
          create: qprParts.map((part: any) => ({
            partId: part.partId,
            totalQty: part.totalQty || 0,
            qtyNg: part.qtyNg || 0,
            stdAllowance: part.stdAllowance || 0,
            qtyClaim: part.qtyClaim || 0,
            unitPrice: part.unitPrice || 0,
            taxRate: part.taxRate || 0,
          })),
        } : undefined,
        approvalProgress: {
          create: {},
        },
      },
      include: {
        qprParts: true,
        approvalProgress: true,
      },
    });
  }

  async update(id: string, data: any): Promise<Qpr> {
    const {
      status,
      requiredRole,
      problem,
      claimType,
      totalQty,
      totalQtyNg,
      totalStdAllowance,
      billableQty,
      claimAmount,
      pdfFileName,
      pdfFileBase64,
    } = data;

    return await this.prisma.qpr.update({
      where: { id },
      data: {
        status,
        requiredRole,
        problem,
        claimType,
        totalQty,
        totalQtyNg,
        totalStdAllowance,
        billableQty,
        claimAmount,
        pdfFileName,
        pdfFileBase64,
      },
    });
  }

  async updateApprovalProgress(qprId: string, data: any): Promise<QprApprovalProgress> {
    const {
      checksumSectionHead,
      remarksSectionHead,
      checksumDeptHead,
      remarksDeptHead,
      checksumDivHead,
      remarksDivHead,
      checksumVendor,
      remarksVendor,
    } = data;

    const convertBuffer = (str?: string) => (str ? Buffer.from(str, 'utf-8') : undefined);

    return await this.prisma.qprApprovalProgress.update({
      where: { qprId },
      data: {
        checksumSectionHead: convertBuffer(checksumSectionHead),
        remarksSectionHead,
        checksumDeptHead: convertBuffer(checksumDeptHead),
        remarksDeptHead,
        checksumDivHead: convertBuffer(checksumDivHead),
        remarksDivHead,
        checksumVendor: convertBuffer(checksumVendor),
        remarksVendor,
        approvedAtSectionHead: checksumSectionHead ? new Date() : undefined,
        approvedAtDeptHead: checksumDeptHead ? new Date() : undefined,
        approvedAtDivHead: checksumDivHead ? new Date() : undefined,
        approvedAtVendor: checksumVendor ? new Date() : undefined,
      },
    });
  }

  async findAllConfirmationLetters(): Promise<any[]> {
    try {
      return await this.prisma.confirmationLetter.findMany({
        include: {
          vendor: true,
          qpr: true,
          sscBilling: true,
          sscPayment: true,
        },
      });
    } catch (error) {
      console.error('[QprsService] Error in findAllConfirmationLetters():', error);
      return [];
    }
  }

  async createConfirmationLetter(data: any): Promise<any> {
    const { clNumber, dateSent, qprId, vendorId, amount, status } = data;
    return await this.prisma.confirmationLetter.create({
      data: {
        clNumber,
        dateSent: dateSent ? new Date(dateSent) : new Date(),
        qprId,
        vendorId,
        amount: parseFloat(String(amount || '0').replace(/[^0-9.]/g, '')),
        status: status || 'PENDING',
      },
    });
  }

  async updateConfirmationLetter(id: string, data: any): Promise<any> {
    const { status, amount } = data;
    return await this.prisma.confirmationLetter.update({
      where: { id },
      data: {
        status,
        amount: amount ? parseFloat(String(amount).replace(/[^0-9.]/g, '')) : undefined,
      },
    });
  }
}
