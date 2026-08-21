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
      qprParts,
    } = data;

    // Update QprParts if provided in the update request
    if (qprParts && Array.isArray(qprParts)) {
      for (const p of qprParts) {
        const existingPart = await this.prisma.qprPart.findFirst({
          where: { qprId: id, partId: p.partId },
        });
        if (existingPart) {
          await this.prisma.qprPart.update({
            where: { id: existingPart.id },
            data: {
              unitPrice: p.unitPrice !== undefined ? p.unitPrice : undefined,
              taxRate: p.taxRate !== undefined ? p.taxRate : undefined,
              totalQty: p.totalQty !== undefined ? p.totalQty : undefined,
              qtyNg: p.qtyNg !== undefined ? p.qtyNg : undefined,
              stdAllowance: p.stdAllowance !== undefined ? p.stdAllowance : undefined,
              qtyClaim: p.qtyClaim !== undefined ? p.qtyClaim : undefined,
            },
          });
        } else {
          await this.prisma.qprPart.create({
            data: {
              qprId: id,
              partId: p.partId,
              totalQty: p.totalQty || 1000,
              qtyNg: p.qtyNg || 0,
              stdAllowance: p.stdAllowance || 0,
              qtyClaim: p.qtyClaim || 0,
              unitPrice: p.unitPrice || 0,
              taxRate: p.taxRate || 0.11,
            },
          });
        }
      }
    }

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

    // Check if the referenced Qpr exists in the database
    let qprExists = await this.prisma.qpr.findUnique({
      where: { id: qprId },
    });

    if (!qprExists) {
      // If it doesn't exist (e.g. mock ID or manual QPR ID), create a placeholder Qpr first
      const clQprNumber = data.qprNumber || `QPR-CL-MOCK-${Date.now()}`;
      
      // Check for uniqueness of the QPR number
      let qprNumExists = await this.prisma.qpr.findUnique({
        where: { qprNumber: clQprNumber },
      });
      const finalQprNum = qprNumExists ? `${clQprNumber}-${Math.floor(Math.random() * 1000)}` : clQprNumber;

      qprExists = await this.prisma.qpr.create({
        data: {
          id: qprId,
          qprNumber: finalQprNum,
          vendorId: vendorId,
          totalQty: 1000,
          totalQtyNg: 50,
          totalStdAllowance: 5,
          billableQty: 45,
          status: 'CLOSED',
          requiredRole: 'Closed',
        },
      });
    }

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || '0').replace(/Rp/g, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.')) || 0;

    return await this.prisma.confirmationLetter.create({
      data: {
        clNumber,
        dateSent: dateSent ? new Date(dateSent) : new Date(),
        qpr: {
          connect: { id: qprExists.id }
        },
        vendor: {
          connect: { id: vendorId }
        },
        amount: parsedAmount,
        status: status || 'PENDING',
      },
    });
  }

  async updateConfirmationLetter(id: string, data: any): Promise<any> {
    const { status, amount, purchasingSentCl, vendorApproved, closedPaid, purchasingSentDate, vendorApprovedDate } = data;
    const parsedAmount = amount !== undefined ? (typeof amount === 'number' ? amount : parseFloat(String(amount || '0').replace(/Rp/g, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.')) || 0) : undefined;
    return await this.prisma.confirmationLetter.update({
      where: { id },
      data: {
        status,
        amount: parsedAmount,
        purchasingSentCl: purchasingSentCl !== undefined ? purchasingSentCl : undefined,
        vendorApproved: vendorApproved !== undefined ? vendorApproved : undefined,
        closedPaid: closedPaid !== undefined ? closedPaid : undefined,
        purchasingSentDate: purchasingSentDate !== undefined ? purchasingSentDate : undefined,
        vendorApprovedDate: vendorApprovedDate !== undefined ? vendorApprovedDate : undefined,
      },
    });
  }
}
