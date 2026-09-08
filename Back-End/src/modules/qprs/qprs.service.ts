import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Qpr, QprApprovalProgress, QprStatus } from '@prisma/client';

@Injectable()
export class QprsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    try {
      return await this.prisma.qpr.findMany({
        select: {
          id: true,
          qprNumber: true,
          date: true,
          vendorId: true,
          userId: true,
          status: true,
          requiredRole: true,
          refNcrNumber: true,
          problem: true,
          claimType: true,
          totalQty: true,
          totalQtyNg: true,
          totalStdAllowance: true,
          billableQty: true,
          claimAmount: true,
          pdfFileName: true,
          createdAt: true,
          updatedAt: true,
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
        orderBy: {
          createdAt: 'desc',
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

    // Filter only valid parts that have non-empty partId
    const validParts = qprParts && Array.isArray(qprParts)
      ? qprParts.filter((p: any) => p && p.partId && String(p.partId).trim() !== "")
      : [];

    const targetDate = date ? new Date(date) : new Date();
    const validDate = isNaN(targetDate.getTime()) ? new Date() : targetDate;
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const year = String(validDate.getFullYear()).slice(-2);

    // Ensure unique qprNumber if a duplicate exists or auto-generate resetting per month
    let finalQprNumber = qprNumber;
    if (!finalQprNumber) {
      const allQprs = await this.prisma.qpr.findMany({
        select: { qprNumber: true },
      });
      let maxSeq = 0;
      for (const q of allQprs) {
        const match = (q.qprNumber || '').match(/^(\d+)\/QI\/QPR\/SUB\/(\d+)\/(\d+)$/i);
        if (match) {
          const seq = parseInt(match[1], 10);
          const m = String(parseInt(match[2], 10)).padStart(2, '0');
          const y = String(match[3]).slice(-2);
          if (m === month && y === year && !isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
      finalQprNumber = `${String(maxSeq + 1).padStart(2, '0')}/QI/QPR/SUB/${month}/${year}`;
    }

    const existing = await this.prisma.qpr.findUnique({
      where: { qprNumber: finalQprNumber },
    });
    if (existing) {
      finalQprNumber = `${finalQprNumber}-${Math.floor(Math.random() * 900 + 100)}`;
    }

    return await this.prisma.qpr.create({
      data: {
        qprNumber: finalQprNumber,
        date: date ? new Date(date) : new Date(),
        vendorId,
        userId: userId || undefined,
        status: status || QprStatus.WAITING_APPROVAL,
        requiredRole: requiredRole || 'Section Head',
        refNcrNumber,
        problem,
        claimType,
        totalQty: totalQty || 0,
        totalQtyNg: totalQtyNg || 0,
        totalStdAllowance: totalStdAllowance || 0,
        billableQty: billableQty || 0,
        claimAmount: claimAmount || 0,
        pdfFileName,
        pdfFileBase64,
        qprParts: validParts.length > 0 ? {
          create: validParts.map((part: any) => ({
            partId: String(part.partId),
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
      checksumPurchasing,
      remarksPurchasing,
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
        checksumPurchasing: convertBuffer(checksumPurchasing),
        remarksPurchasing,
        checksumVendor: convertBuffer(checksumVendor),
        remarksVendor,
        approvedAtSectionHead: checksumSectionHead ? new Date() : undefined,
        approvedAtDeptHead: checksumDeptHead ? new Date() : undefined,
        approvedAtDivHead: checksumDivHead ? new Date() : undefined,
        approvedAtPurchasing: checksumPurchasing ? new Date() : undefined,
        approvedAtVendor: checksumVendor ? new Date() : undefined,
      },
    });
  }

  async findAllConfirmationLetters(): Promise<any[]> {
    try {
      return await this.prisma.confirmationLetter.findMany({
        include: {
          vendor: true,
          qpr: {
            select: {
              id: true,
              qprNumber: true,
              date: true,
              vendorId: true,
              userId: true,
              status: true,
              requiredRole: true,
              refNcrNumber: true,
              problem: true,
              claimType: true,
              totalQty: true,
              totalQtyNg: true,
              totalStdAllowance: true,
              billableQty: true,
              claimAmount: true,
              pdfFileName: true,
              createdAt: true,
              updatedAt: true,
              qprParts: {
                include: {
                  part: true,
                },
              },
            },
          },
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
    const { clNumber, dateSent, qprId, vendorId, amount, status, items } = data;

    // Check if the referenced Qpr exists in the database
    let qprExists = await this.prisma.qpr.findUnique({
      where: { id: qprId },
      include: { qprParts: true },
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
        include: { qprParts: true },
      });
    }

    // Save/update items to qprParts if provided
    if (items && Array.isArray(items)) {
      for (const item of items) {
        let targetPartId = item.partId;
        if (!targetPartId && item.partName) {
          const matchedPart = await this.prisma.part.findFirst({
            where: {
              OR: [
                { partDesc: item.partName },
                { partNumber: item.partName },
                { partNumber: item.partNumber || "" }
              ]
            }
          });
          if (matchedPart) targetPartId = matchedPart.id;
        }

        if (!targetPartId) {
          const fallbackPart = await this.prisma.part.findFirst();
          targetPartId = fallbackPart?.id;
        }

        if (targetPartId) {
          const existingQprPart = await this.prisma.qprPart.findFirst({
            where: { qprId: qprExists.id, partId: targetPartId },
          });

          if (existingQprPart) {
            await this.prisma.qprPart.update({
              where: { id: existingQprPart.id },
              data: {
                unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0,
                totalQty: item.totalQty !== undefined ? item.totalQty : undefined,
                qtyNg: item.qtyNg !== undefined ? item.qtyNg : (item.rejectCount !== undefined ? item.rejectCount : undefined),
                stdAllowance: item.stdAllowance !== undefined ? item.stdAllowance : undefined,
                qtyClaim: item.billableQty !== undefined ? item.billableQty : (item.qtyClaim !== undefined ? item.qtyClaim : undefined),
              },
            });
          } else {
            await this.prisma.qprPart.create({
              data: {
                qprId: qprExists.id,
                partId: targetPartId,
                totalQty: item.totalQty || 1000,
                qtyNg: item.qtyNg || item.rejectCount || 0,
                stdAllowance: item.stdAllowance || 0,
                qtyClaim: item.billableQty || item.qtyClaim || 0,
                unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0,
                taxRate: 0.11,
              },
            });
          }
        }
      }
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
      include: {
        vendor: true,
        qpr: {
          include: {
            qprParts: {
              include: {
                part: true,
              },
            },
          },
        },
      },
    });
  }
  async updateConfirmationLetter(id: string, data: any): Promise<any> {
    const { status, amount, purchasingSentCl, vendorApproved, closedPaid, purchasingSentDate, vendorApprovedDate } = data;
    const parsedAmount = amount !== undefined ? (typeof amount === 'number' ? amount : parseFloat(String(amount || '0').replace(/Rp/g, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.')) || 0) : undefined;
    
    const updatedCl = await this.prisma.confirmationLetter.update({
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

    if (closedPaid === true && updatedCl.qprId) {
      await this.prisma.qpr.update({
        where: { id: updatedCl.qprId },
        data: {
          status: 'CLOSED_PAID',
          requiredRole: 'Closed',
        },
      });
    }

    return updatedCl;
  }
}
