import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PdfGeneratorService } from '../../infrastructure/pdf/pdf-generator.service';
import { EmailService } from '../../infrastructure/email/email.service';
import { Qpr, QprApprovalProgress, QprStatus } from '@prisma/client';

export const QPR_EMAIL_RECIPIENTS = {
  sectionHead: ['septian.nugraha@mtm.astra.co.id'],
  deptHead: ['septian.nugraha@mtm.astra.co.id'],
  divHead: ['putu.saputra@mtm.astra.co.id'],
  purchasing: ['irvan.hn@mtm.astra.co.id'],
  accounting: ['muhammad.chariri@mtm.astra.co.id', 'cicik.andria@mtm.astra.co.id'],
  deptAccounting: ['anindita.irnila@mtm.astra.co.id'],
  finance: ['bagas.pratama@mtm.astra.co.id'],
};

@Injectable()
export class QprsService implements OnModuleInit {
  private readonly logger = new Logger(QprsService.name);
  private notifiedDueDateClIds = new Set<string>();

  constructor(
    private prisma: PrismaService,
    private pdfGeneratorService: PdfGeneratorService,
    private emailService: EmailService,
  ) {}

  onModuleInit() {
    // Check for 10-day due dates on startup and every 1 hour
    setTimeout(() => this.checkDueDatesForFinance(), 5000);
    setInterval(() => this.checkDueDatesForFinance(), 60 * 60 * 1000);
  }

  async checkDueDatesForFinance(): Promise<number> {
    try {
      const cls = await this.prisma.confirmationLetter.findMany({
        where: {
          purchasingSentCl: true,
          vendorApproved: false,
          closedPaid: false,
        },
        include: {
          vendor: true,
          qpr: true,
        },
      });

      let countNotified = 0;
      const now = new Date();

      for (const cl of cls) {
        if (this.notifiedDueDateClIds.has(cl.id)) continue;

        const sentDateStr = cl.purchasingSentDate || (cl.dateSent ? cl.dateSent.toISOString().split('T')[0] : null);
        if (!sentDateStr) continue;

        const sentDate = new Date(sentDateStr);
        if (isNaN(sentDate.getTime())) continue;

        let workingDays = 0;
        const cur = new Date(sentDate);
        cur.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(0, 0, 0, 0);

        while (cur < end) {
          cur.setDate(cur.getDate() + 1);
          const day = cur.getDay();
          if (day !== 0 && day !== 6) {
            workingDays++;
          }
        }

        if (workingDays >= 10) {
          this.notifiedDueDateClIds.add(cl.id);
          countNotified++;
          this.logger.log(`CL ${cl.clNumber} reached 10 working days without vendor approval. Triggering Finance email...`);
          await this.emailService.notifyFinanceForSsc(cl, 'due_date', QPR_EMAIL_RECIPIENTS.finance);
        }
      }

      return countNotified;
    } catch (err: any) {
      this.logger.warn(`Error in checkDueDatesForFinance: ${err.message}`);
      return 0;
    }
  }

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

    const createdQpr = await this.prisma.qpr.create({
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

    // Step 1 Flow Trigger: create qpr -> email terkirim ke section (septian.nugraha@mtm.astra.co.id)
    try {
      const fullQpr = await this.prisma.qpr.findUnique({
        where: { id: createdQpr.id },
        include: { vendor: true, qprParts: true },
      });
      await this.emailService.notifyQprCreated(fullQpr || createdQpr, QPR_EMAIL_RECIPIENTS.sectionHead);
    } catch (err: any) {
      this.logger.warn(`Failed to trigger section head email after QPR creation: ${err.message}`);
    }

    return createdQpr;
  }

  async update(id: string, data: any): Promise<Qpr> {
    const {
      qprNumber,
      refNcrNumber,
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
        if (!p.partId) continue;
        
        let validPartId = p.partId;
        const partExists = await this.prisma.part.findUnique({ where: { id: validPartId } });
        if (!partExists) {
          const partByNum = await this.prisma.part.findFirst({
            where: { OR: [{ partNumber: String(p.partId) }, { partDesc: String(p.partId) }] }
          });
          if (partByNum) {
            validPartId = partByNum.id;
          } else {
            continue;
          }
        }

        const existingPart = await this.prisma.qprPart.findFirst({
          where: { qprId: id, partId: validPartId },
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
              partId: validPartId,
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

    const updated = await this.prisma.qpr.update({
      where: { id },
      data: {
        qprNumber,
        refNcrNumber,
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

    return updated;
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

    // Fetch previous progress to detect state transition
    const previousProgress = await this.prisma.qprApprovalProgress.findUnique({
      where: { qprId },
    });

    // 1. Update approval progress record
    const result = await this.prisma.qprApprovalProgress.update({
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

    // 2. Synchronize QPR status & requiredRole in QPR table and trigger notifications
    (async () => {
      try {
        const qpr = await this.prisma.qpr.findUnique({
          where: { id: qprId },
          include: { vendor: true, qprParts: true },
        });

        if (qpr) {
          let nextRequiredRole = qpr.requiredRole;
          let nextQprStatus = qpr.status;

          if (checksumPurchasing) {
            // Step 5: Purchasing Approved (QPR Full Approved) -> Purchasing creates CL
            nextRequiredRole = 'Purchasing';
            nextQprStatus = 'APPROVED';
          } else if (checksumDivHead) {
            // Step 4: Div Head Approved -> Purchasing Approver
            nextRequiredRole = 'Purchasing';
            nextQprStatus = 'WAITING_APPROVAL';
          } else if (checksumDeptHead) {
            // Step 3: Dept Head QA Approved -> Division Head QA
            nextRequiredRole = 'Div Head';
            nextQprStatus = 'WAITING_APPROVAL';
          } else if (checksumSectionHead) {
            // Step 2: Section Head QA Approved -> Dept Head QA
            nextRequiredRole = 'Dept Head';
            nextQprStatus = 'WAITING_APPROVAL';
          }

          // Ensure QPR record is synced
          if (nextRequiredRole !== qpr.requiredRole || nextQprStatus !== qpr.status) {
            await this.prisma.qpr.update({
              where: { id: qprId },
              data: {
                requiredRole: nextRequiredRole,
                status: nextQprStatus,
              },
            });
          }

          // Trigger appropriate email based on the newly submitted approval
          if (checksumPurchasing && (!previousProgress || !previousProgress.checksumPurchasing)) {
            // purcashing approval -> email terkirim ke accounting (muhammad.chariri & cicik.andria) untuk membuat cl
            await this.emailService.notifyPurchasingApproved(qpr, QPR_EMAIL_RECIPIENTS.accounting);
          } else if (checksumDivHead && (!previousProgress || !previousProgress.checksumDivHead)) {
            // div head approval -> email terkirim ke purchasing (irvan hn)
            await this.emailService.notifyDivApproved(qpr, QPR_EMAIL_RECIPIENTS.purchasing);
          } else if (checksumDeptHead && (!previousProgress || !previousProgress.checksumDeptHead)) {
            // dept head approval -> email terkirim ke div head (putu saputra)
            await this.emailService.notifyDeptApproved(qpr, QPR_EMAIL_RECIPIENTS.divHead);
          } else if (checksumSectionHead && (!previousProgress || !previousProgress.checksumSectionHead)) {
            // section approval -> email terkirim ke dept head (septian nugraha)
            await this.emailService.notifySectionApproved(qpr, QPR_EMAIL_RECIPIENTS.deptHead);
          }
        }
      } catch (err: any) {
        console.warn(`[QprsService] Notice: Error in updateApprovalProgress status sync/email:`, err.message);
      }
    })();

    return result;
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

    const parsedAmount = typeof amount === 'number' ? Math.round(amount) : (() => {
      const cleanStr = String(amount || '0').replace(/Rp/gi, '').replace(/\s/g, '');
      if (cleanStr.includes(',')) {
        const parts = cleanStr.split(',');
        return Math.round(parseFloat(`${parts[0].replace(/\./g, '')}.${parts[1]}`) || 0);
      }
      return Math.round(parseFloat(cleanStr.replace(/\./g, '')) || 0);
    })();

    const createdCl = await this.prisma.confirmationLetter.create({
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

    // Flow Trigger: cl sudah dibuat email terkirim ke dept accounting anindita.irnila@mtm.astra.co.id untuk melakukan approval
    try {
      await this.emailService.notifyClCreated(createdCl, QPR_EMAIL_RECIPIENTS.deptAccounting);
    } catch (err: any) {
      this.logger.warn(`Failed to trigger dept accounting email for created CL: ${err.message}`);
    }

    return createdCl;
  }
  async updateConfirmationLetter(id: string, data: any): Promise<any> {
    const { status, amount, purchasingSentCl, vendorApproved, closedPaid, purchasingSentDate, vendorApprovedDate } = data;
    const parsedAmount = amount !== undefined ? (typeof amount === 'number' ? Math.round(amount) : (() => {
      const cleanStr = String(amount || '0').replace(/Rp/gi, '').replace(/\s/g, '');
      if (cleanStr.includes(',')) {
        const parts = cleanStr.split(',');
        return Math.round(parseFloat(`${parts[0].replace(/\./g, '')}.${parts[1]}`) || 0);
      }
      return Math.round(parseFloat(cleanStr.replace(/\./g, '')) || 0);
    })()) : undefined;

    // Fetch existing state to detect transitions
    const existingCl = await this.prisma.confirmationLetter.findUnique({
      where: { id },
      include: { vendor: true, qpr: true },
    });
    
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

    if (closedPaid === true && updatedCl.qprId) {
      await this.prisma.qpr.update({
        where: { id: updatedCl.qprId },
        data: {
          status: 'CLOSED_PAID',
          requiredRole: 'Closed',
        },
      });
    }

    // Flow Trigger: dept accounting approval -> email terkirim ke accounting (muhammad.chariri@mtm.astra.co.id dan cicik.andria@mtm.astra.co.id) untuk mengirim kan cl ke vendor
    if (status === 'APPROVED' && (!existingCl || existingCl.status !== 'APPROVED') && !vendorApproved) {
      try {
        await this.emailService.notifyClDeptApproved(updatedCl, QPR_EMAIL_RECIPIENTS.accounting);
      } catch (err: any) {
        this.logger.warn(`Failed to trigger accounting email for Dept Accounting approved CL: ${err.message}`);
      }
    }

    // Flow Trigger: cl terkirim dan dapat approval dari vendor -> email akan terkirim ke finance (bagas.pratama@mtm.astra.co.id) untuk segera dibuatkan ssc billing dan ssc payment
    if (vendorApproved === true && (!existingCl || !existingCl.vendorApproved)) {
      try {
        this.notifiedDueDateClIds.add(updatedCl.id);
        await this.emailService.notifyFinanceForSsc(updatedCl, 'vendor_approved', QPR_EMAIL_RECIPIENTS.finance);
      } catch (err: any) {
        this.logger.warn(`Failed to trigger finance email for vendor-approved CL: ${err.message}`);
      }
    }

    return updatedCl;
  }

  private formatSupplierForLetter(name?: string): string {
    if (!name) return 'Anugerah Daya Industri Komponen Utama, PT.';
    let clean = name.trim();
    if (/^PT\.?\s+/i.test(clean)) {
      clean = clean.replace(/^PT\.?\s+/i, '').trim() + ', PT.';
    } else if (!clean.endsWith(', PT.') && !clean.endsWith(', PT')) {
      clean = `${clean}, PT.`;
    }
    return clean;
  }

  private generateConfirmationLetterHtml(cl: any, vendorNameInput?: string, dueDateInput?: string): string {
    const clNum = cl?.clNumber || 'CL-DRAFT';
    const qprNum = cl?.qpr?.qprNumber || '-';
    const rawVendorName = cl?.vendor?.vendorName || vendorNameInput || 'PT. ARAI RUBBER SEAL IND';
    const formattedVendor = this.formatSupplierForLetter(rawVendorName);
    const dateObj = cl?.dateSent ? new Date(cl.dateSent) : new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const formattedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    const parts = cl?.qpr?.qprParts || [];

    // Financial calculations matching system exactly
    let subtotalVal = 0;
    if (parts.length > 0) {
      parts.forEach((p: any) => {
        const qtyVal = p.qtyClaim !== undefined && p.qtyClaim !== null ? p.qtyClaim : (p.qtyNg || 0);
        const priceVal = typeof p.unitPrice === 'number' ? p.unitPrice : parseFloat(p.unitPrice) || 0;
        subtotalVal += qtyVal * priceVal;
      });
    }

    const rawTotalFromCl = Number(cl?.amount || 0);
    let dpp = subtotalVal > 0 ? subtotalVal : (rawTotalFromCl > 0 ? Math.round(rawTotalFromCl / 1.11) : 0);
    let vat = Math.round(dpp * 0.11);
    let total = dpp + vat;
    if (rawTotalFromCl > 0 && Math.abs(rawTotalFromCl - total) <= 2) {
      total = rawTotalFromCl;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Confirmation Letter - ${clNum}</title>
  <style>
    body { font-family: "Times New Roman", Times, serif; color: #000000; margin: 40px auto; max-width: 800px; line-height: 1.4; background: #ffffff; }
    .company-header { border-bottom: 2px solid #000000; padding-bottom: 8px; margin-bottom: 20px; }
    .company-name { font-size: 20px; font-weight: 900; letter-spacing: 0.5px; }
    .company-addr { font-size: 11px; font-weight: 600; line-height: 1.3; }
    .doc-title { text-align: center; font-size: 18px; font-weight: 900; margin: 24px 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .date-right { text-align: right; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .recipient-box { font-size: 12px; font-weight: 600; line-height: 1.35; margin-bottom: 16px; }
    .recipient-title { font-weight: 800; }
    .body-text { font-size: 12px; font-weight: 500; text-align: justify; margin-bottom: 16px; line-height: 1.4; }
    .items-table { width: 100%; border-collapse: collapse; border: 2px solid #000000; font-size: 11.5px; margin: 16px 0; }
    .items-table th { border: 1.5px solid #000000; padding: 6px 8px; background-color: #edf2f7; font-weight: 900; text-align: center; }
    .items-table td { border: 1.5px solid #000000; padding: 5px 8px; font-weight: 600; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .total-underline { border-bottom: 3.5px double #000000 !important; font-weight: 900; }
    .footer-desc { font-size: 12px; font-weight: 500; text-align: justify; margin: 16px 0; }
    .attachment-box { margin: 12px 0; font-size: 12px; font-weight: 700; }
    .signs-container { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; }
    .sign-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1.5px solid #000; text-align: center; }
    .sign-table th { border: 1px solid #000; padding: 4px; background: #f8fafc; font-size: 10px; }
    .sign-table td { border: 1px solid #000; height: 55px; vertical-align: bottom; padding: 4px; font-weight: bold; font-size: 10px; }
  </style>
</head>
<body>
  <div class="company-header">
    <div class="company-name">MenaraTerusMakmur, PT</div>
    <div class="company-addr">Jl. Jababeka XI Blok H-3 No. 12 Kawasan Industri Jababeka Cikarang - Bekasi 17530</div>
    <div class="company-addr">Phone: (021) 8934504, Fax: (021) 8934505</div>
  </div>

  <div class="doc-title">CONFIRMATION LETTER</div>

  <div class="date-right">Cikarang, ${formattedDate}</div>

  <div class="recipient-box">
    <div class="recipient-title">To:</div>
    <div class="recipient-title">${formattedVendor}</div>
    <div>Jl. Science Timur I Blok A 5H</div>
    <div>Cikarang Timur, Bekasi, Jawa Barat 17530</div>
  </div>

  <div class="body-text">
    <p>According to quality problem report (QPR) that we have checked at Menara Terus Makmur, PT.:</p>
    <p>We would like to confirm to you that we have agreed if it is found some NG parts which are not caused by our internal process. NG parts and loss can be seen as follows:</p>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 6%;">No</th>
        <th style="width: 44%;">Description</th>
        <th style="width: 12%;">Qty</th>
        <th style="width: 18%;">Claim Cost</th>
        <th style="width: 20%;">Amount (IDR)</th>
      </tr>
    </thead>
    <tbody>
      ${parts.length > 0 ? parts.map((p: any, idx: number) => {
        const desc = p.part?.partDesc || p.part?.partNumber || 'INNER TUBE,650 A';
        const qtyVal = p.qtyClaim !== undefined && p.qtyClaim !== null ? p.qtyClaim : (p.qtyNg || 25);
        const priceVal = typeof p.unitPrice === 'number' ? p.unitPrice : parseFloat(p.unitPrice) || 85000;
        const amountVal = qtyVal * priceVal;
        return `<tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-left" style="font-weight: 700;">${desc}</td>
          <td class="text-center">${qtyVal.toLocaleString('id-ID')}</td>
          <td class="text-center">${priceVal.toLocaleString('id-ID')}</td>
          <td class="text-right" style="font-weight: 700;">${amountVal.toLocaleString('id-ID')}</td>
        </tr>`;
      }).join('') : `<tr>
        <td class="text-center">1</td>
        <td class="text-left" style="font-weight: 700;">INNER TUBE,650 A</td>
        <td class="text-center">25</td>
        <td class="text-center">85.000</td>
        <td class="text-right" style="font-weight: 700;">${dpp.toLocaleString('id-ID')}</td>
      </tr>`}
      <tr>
        <td></td>
        <td colspan="3" class="text-left" style="font-weight: 800;">VAT (11%)</td>
        <td class="text-right">${vat.toLocaleString('id-ID')}</td>
      </tr>
      <tr>
        <td></td>
        <td colspan="3" class="text-left" style="font-weight: 900;">Total</td>
        <td class="text-right total-underline">${total.toLocaleString('id-ID')}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-desc">
    <p>Based on the data above, we will proceed with deducting the amount directly from the payment to ${formattedVendor} if we do not receive any confirmation within 10 (ten) working days. We look forward to your confirmation.</p>
  </div>

  <div class="attachment-box">
    <div>Attachment :</div>
    <div style="font-weight: 900; margin-top: 2px;">QPR Number : ${qprNum}</div>
  </div>

  <div style="margin-top: 24px;">
    <div style="font-size: 12px; font-weight: 600;">Yours Faithfully,</div>
    <div style="font-size: 13px; font-weight: 900; margin-top: 2px;">MenaraTerusMakmur, PT</div>
    
    <table class="sign-table">
      <thead>
        <tr>
          <th style="width: 25%;">Prepared By</th>
          <th style="width: 25%;">Checked By</th>
          <th style="width: 25%;">Approved By</th>
          <th style="width: 25%;">Confirmed By</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>( QA Sect. Head )</td>
          <td>( QA Dept. Head )</td>
          <td>( Purchasing Dept )</td>
          <td>( ${formattedVendor} )</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;
  }

  private generateQprHtml(qpr: any): string {
    const qprNum = qpr?.qprNumber || '01/QI/QPR/SUB/09/26';
    const supplierName = qpr?.vendor?.vendorName || 'PT. ARAI RUBBER SEAL IND';
    const dateStr = qpr?.date ? new Date(qpr.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '14 September 2026';
    const parts = qpr?.qprParts || [];
    const mainPart = parts[0]?.part?.partDesc || parts[0]?.part?.partNumber || 'RUBBER SEAL SUB';
    const mainPartNum = parts[0]?.part?.partNumber || 'IT-650';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quality Problem Report - ${qprNum}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #000; margin: 30px auto; max-width: 850px; font-size: 11px; background: #fff; }
    .box { border: 2px solid #000; padding: 12px; }
    .header-table { width: 100%; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 10px; }
    .title-banner { text-align: center; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 6px 0; font-size: 16px; font-weight: 900; text-transform: uppercase; background: #f8fafc; }
    .grid-info { display: flex; border: 1px solid #000; margin-top: 10px; }
    .col-left { flex: 1.2; border-right: 1px solid #000; padding: 8px; }
    .col-right { width: 320px; padding: 8px; }
    .section-title { font-weight: bold; font-size: 10px; text-transform: uppercase; background: #e2e8f0; padding: 3px 6px; margin-bottom: 6px; }
    .info-row { display: flex; margin-bottom: 4px; font-size: 10px; }
    .info-label { width: 100px; font-weight: bold; }
    .parts-table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 12px; font-size: 10px; }
    .parts-table th { border: 1px solid #000; padding: 6px; background: #edf2f7; font-weight: bold; text-align: center; }
    .parts-table td { border: 1px solid #000; padding: 6px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .sign-section { margin-top: 16px; border: 1px solid #000; display: flex; text-align: center; }
    .sign-col { flex: 1; border-right: 1px solid #000; padding: 6px; }
    .sign-col:last-child { border-right: none; }
    .sign-title { font-weight: bold; font-size: 9px; background: #f1f5f9; padding: 2px; border-bottom: 1px solid #000; margin-bottom: 30px; }
  </style>
</head>
<body>
  <div class="box">
    <table class="header-table">
      <tr>
        <td style="width: 25%; font-weight: 900; font-size: 14px; color: #1e3a8a;">PT MENARA TERUS MAKMUR</td>
        <td style="width: 55%; text-align: center; font-size: 9px; line-height: 1.3;">
          Jl. Jababeka XI Blok H 1 No. 12, Jababeka Industrial Estate<br/>
          17530 CIKARANG BEKASI INDONESIA | TELP: (62-21) 8934504
        </td>
        <td style="width: 20%; text-align: right; font-weight: bold; font-size: 9px;">(PR4-FRM-08101)</td>
      </tr>
    </table>

    <div class="title-banner">
      QUALITY PROBLEM REPORT (QPR)
    </div>

    <div class="grid-info">
      <div class="col-left">
        <div class="section-title">SUPPLIER / VENDOR DETAILS</div>
        <div style="font-size: 12px; font-weight: 900; margin-bottom: 8px;">${supplierName}</div>
        <div class="info-row"><span class="info-label">Part Name:</span><span>${mainPart}</span></div>
        <div class="info-row"><span class="info-label">Part Number:</span><span>${mainPartNum}</span></div>
        <div class="info-row"><span class="info-label">Problem:</span><span>${qpr?.problem || 'Claim Part NG / Out of Tolerance'}</span></div>
        <div class="info-row"><span class="info-label">Claim Type:</span><span>${qpr?.claimType || 'Material Claim'}</span></div>
        <div class="info-row"><span class="info-label">Ref. NCR No:</span><span>${qpr?.refNcrNumber || 'NCR/2026/09/001'}</span></div>
      </div>
      <div class="col-right">
        <div class="section-title">DOCUMENT INFORMATION</div>
        <div class="info-row"><span class="info-label">QPR Doc No:</span><span style="font-family: monospace; font-weight: bold;">${qprNum}</span></div>
        <div class="info-row"><span class="info-label">Issue Date:</span><span>${dateStr}</span></div>
        <div class="info-row"><span class="info-label">Status:</span><span style="color: #059669; font-weight: bold;">${qpr?.status || 'APPROVED (CLOSED)'}</span></div>
        <div class="info-row"><span class="info-label">Total Qty:</span><span>${Number(qpr?.totalQty || 1000).toLocaleString('id-ID')} Pcs</span></div>
        <div class="info-row"><span class="info-label">Qty NG:</span><span style="color: #dc2626; font-weight: bold;">${Number(qpr?.totalQtyNg || 25).toLocaleString('id-ID')} Pcs</span></div>
        <div class="info-row"><span class="info-label">Total Claim:</span><span style="font-weight: bold; color: #1e3a8a;">Rp ${Number(qpr?.claimAmount || 2125000).toLocaleString('id-ID')}</span></div>
      </div>
    </div>

    <table class="parts-table">
      <thead>
        <tr>
          <th style="width: 30px;">No</th>
          <th>Part Description</th>
          <th>Part Number</th>
          <th style="width: 70px;">Total Qty</th>
          <th style="width: 60px;">Qty NG</th>
          <th style="width: 60px;">Qty Claim</th>
          <th style="width: 90px;">Claim Cost</th>
          <th style="width: 100px;">Amount (IDR)</th>
        </tr>
      </thead>
      <tbody>
        ${parts.length > 0 ? parts.map((p: any, idx: number) => {
          const desc = p.part?.partDesc || 'RUBBER SEAL SUB';
          const num = p.part?.partNumber || 'IT-650';
          const tQty = p.totalQty || 1000;
          const ng = p.qtyNg || 25;
          const claim = p.qtyClaim !== undefined && p.qtyClaim !== null ? p.qtyClaim : ng;
          const price = p.unitPrice || 85000;
          return `<tr>
            <td class="text-center">${idx + 1}</td>
            <td><strong>${desc}</strong></td>
            <td class="text-center font-mono">${num}</td>
            <td class="text-center">${tQty.toLocaleString('id-ID')}</td>
            <td class="text-center">${ng.toLocaleString('id-ID')}</td>
            <td class="text-center">${claim.toLocaleString('id-ID')}</td>
            <td class="text-right">${price.toLocaleString('id-ID')}</td>
            <td class="text-right"><strong>${(claim * price).toLocaleString('id-ID')}</strong></td>
          </tr>`;
        }).join('') : `<tr>
          <td class="text-center">1</td>
          <td><strong>RUBBER SEAL SUB</strong></td>
          <td class="text-center">IT-650</td>
          <td class="text-center">1.000</td>
          <td class="text-center">25</td>
          <td class="text-center">25</td>
          <td class="text-right">85.000</td>
          <td class="text-right"><strong>2.125.000</strong></td>
        </tr>`}
      </tbody>
    </table>

    <div class="sign-section">
      <div class="sign-col"><div class="sign-title">PREPARED BY (QA)</div><div>[ SIGNED ]</div><div>Section Head QA</div></div>
      <div class="sign-col"><div class="sign-title">CHECKED BY (QA)</div><div>[ SIGNED ]</div><div>Dept Head QA</div></div>
      <div class="sign-col"><div class="sign-title">APPROVED BY (DIV)</div><div>[ SIGNED ]</div><div>Division Head</div></div>
      <div class="sign-col"><div class="sign-title">PURCHASING DEPT</div><div>[ SIGNED ]</div><div>Purchasing</div></div>
    </div>
  </div>
</body>
</html>`;
  }

  async markConfirmationLettersSent(data: {
    clId?: string;
    clIds?: string[];
    sendDate?: string;
  }): Promise<any> {
    const { clId, clIds, sendDate } = data;
    const idsToUpdate = clIds && clIds.length > 0 ? clIds : (clId ? [clId] : []);
    const effectiveSentDate = sendDate || new Date().toISOString().split('T')[0];

    for (const id of idsToUpdate) {
      try {
        await this.prisma.confirmationLetter.update({
          where: { id },
          data: {
            purchasingSentCl: true,
            purchasingSentDate: effectiveSentDate,
            dateSent: new Date(effectiveSentDate),
          },
        });
      } catch (err) {
        console.warn(`[QprsService] Failed to update purchasingSentCl for CL ${id}:`, err);
      }
    }

    return {
      success: true,
      updatedClIds: idsToUpdate,
      sentDate: effectiveSentDate,
    };
  }

  async sendTaskReminders(data: {
    targetRoleKey?: string;
    stuckRoles: Array<{
      roleKey: string;
      roleTitle: string;
      recipients?: string[];
      documents: Array<{
        docNumber: string;
        type: string;
        vendor: string;
        stuckSinceDate?: string;
        daysStuck?: number;
        amount?: string;
        requiredRole?: string;
      }>;
    }>;
  }): Promise<{ success: boolean; sentCount: number; sentDetails: any[]; message?: string }> {
    const targetRoleKey = data.targetRoleKey;
    const stuckRoles = data.stuckRoles || (data as any).roles;
    if (!stuckRoles || !Array.isArray(stuckRoles)) {
      return { success: false, sentCount: 0, sentDetails: [], message: 'Data stuckRoles tidak valid' };
    }

    const defaultRoleRecipients: Record<string, string[]> = {
      'Section Head QA': QPR_EMAIL_RECIPIENTS.sectionHead,
      'Dept. Head QA': QPR_EMAIL_RECIPIENTS.deptHead,
      'Div. Head': QPR_EMAIL_RECIPIENTS.divHead,
      'Purchasing': QPR_EMAIL_RECIPIENTS.purchasing,
      'Accounting (Create CL)': QPR_EMAIL_RECIPIENTS.accounting,
      'Dept Accounting': QPR_EMAIL_RECIPIENTS.deptAccounting,
      'Vendor': ['irvan.hn@mtm.astra.co.id', 'septian.nugraha@mtm.astra.co.id'],
      'Finance Accounting': QPR_EMAIL_RECIPIENTS.finance,
    };

    const actionUrls: Record<string, string> = {
      'Section Head QA': 'http://localhost:3000/qpr/approve-qpr',
      'Dept. Head QA': 'http://localhost:3000/qpr/approve-qpr',
      'Div. Head': 'http://localhost:3000/qpr/approve-qpr',
      'Purchasing': 'http://localhost:3000/qpr/approve-qpr',
      'Accounting (Create CL)': 'http://localhost:3000/qpr/confirmation-letter',
      'Dept Accounting': 'http://localhost:3000/qpr/approve-cl',
      'Vendor': 'http://localhost:3000/qpr/approve-cl',
      'Finance Accounting': 'http://localhost:3000/qpr/i-memo',
    };

    console.log(`[QprsService] sendTaskReminders invoked at ${new Date().toLocaleTimeString('id-ID')}. Total stuckRoles: ${stuckRoles.length}`);
    stuckRoles.forEach(r => {
      console.log(`  - Role: ${r.roleTitle || r.roleKey} | Dokumen: ${r.documents ? r.documents.length : 0}`);
    });

    // FILTER CRITICAL: Only process roles that actually have pending / stuck documents!
    const rolesToProcess = stuckRoles.filter(role => {
      if (!role.documents || role.documents.length === 0) return false;
      if (targetRoleKey && role.roleKey !== targetRoleKey && role.roleTitle !== targetRoleKey) return false;
      return true;
    });

    if (rolesToProcess.length === 0) {
      console.log(`[QprsService] ⚠️ Tidak ada peran dengan dokumen mengendap. Email reminder tidak dikirim.`);
      return {
        success: true,
        sentCount: 0,
        sentDetails: [],
        message: 'Tidak ada dokumen mengendap pada peran ini. Email reminder tidak dikirim.',
      };
    }

    console.log(`[QprsService] 🚀 Memproses pengiriman reminder untuk ${rolesToProcess.length} peran...`);

    const sentDetails: any[] = [];

    for (const role of rolesToProcess) {
      let recipients = role.recipients && role.recipients.length > 0
        ? role.recipients
        : (defaultRoleRecipients[role.roleKey] || defaultRoleRecipients[role.roleTitle] || QPR_EMAIL_RECIPIENTS.sectionHead);

      // If role is Vendor, also try to fetch any vendor email stored in DB
      if (role.roleKey === 'Vendor' || role.roleTitle === 'Vendor') {
        try {
          const vendorNames: string[] = Array.from(new Set(role.documents.map(d => String(d.vendor || '')).filter(Boolean)));
          const foundVendors = await this.prisma.vendor.findMany({
            where: { vendorName: { in: vendorNames } },
            select: { vendorName: true, email: true },
          });
          const vendorEmails = foundVendors.map(v => v.email).filter(Boolean) as string[];
          if (vendorEmails.length > 0) {
            recipients = Array.from(new Set([...vendorEmails, ...recipients]));
          }
        } catch (e: any) {
          this.logger.warn(`Failed to resolve vendor emails: ${e.message}`);
        }
      }

      const actionUrl = actionUrls[role.roleKey] || actionUrls[role.roleTitle] || 'http://localhost:3000/qpr/';

      await this.emailService.notifyTaskReminder(
        role.roleTitle || role.roleKey,
        recipients,
        role.documents,
        actionUrl,
      );

      sentDetails.push({
        roleKey: role.roleKey,
        roleTitle: role.roleTitle,
        recipients,
        documentCount: role.documents.length,
        documents: role.documents.map(d => d.docNumber),
      });
    }

    return {
      success: true,
      sentCount: sentDetails.length,
      sentDetails,
    };
  }
}

