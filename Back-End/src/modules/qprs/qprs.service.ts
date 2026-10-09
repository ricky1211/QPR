import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { PdfGeneratorService } from '../../infrastructure/pdf/pdf-generator.service';
import { Qpr, QprApprovalProgress, QprStatus } from '@prisma/client';

@Injectable()
export class QprsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private pdfGeneratorService: PdfGeneratorService,
  ) {}

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

    // Send task notification email to Section Head QA (Step 1)
    (async () => {
      try {
        const vendor = vendorId ? await this.prisma.vendor.findUnique({ where: { id: vendorId } }) : null;
        const supName = vendor?.vendorName || `Vendor ${vendorId || ''}`;
        const claimStr = `Rp ${(claimAmount || 0).toLocaleString('id-ID')}`;

        await this.sendSystemNotificationEmail({
          subject: `[TUGAS APPROVAL QPR] No. ${finalQprNumber} - Menunggu Review & Approval Section Head QA (${supName})`,
          title: `Tugas Approval Dokumen QPR - Menunggu Review & Approval Section Head QA`,
          docNumber: finalQprNumber,
          docType: 'QPR',
          supplierName: supName,
          targetRoleName: 'Section Head QA',
          targetRoleKeywords: ['section_head', 'septian.nugraha', 'Section Head'],
          stepBadge: 'Tugas Dokumen (Langkah 1/5): Approval Section Head QA',
          statusText: 'WAITING_APPROVAL',
          nextStepText: 'Dokumen QPR telah dibuat / diajukan dan membutuhkan verifikasi & persetujuan Anda sebagai Section Head QA. Mohon segera login ke Portal QPR untuk memproses.',
          details: [
            { label: 'Ref. No. NCR', value: refNcrNumber || '-' },
            { label: 'Problem / Defect', value: problem || '-' },
            { label: 'Total NG', value: `${totalQtyNg || 0} pcs` },
            { label: 'Estimasi Nilai Klaim', value: claimStr },
          ],
        });
      } catch (err: any) {
        console.warn(`[QprsService] Notice: Error sending QPR create email:`, err.message);
      }
    })();

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

    // Fetch current state before update to detect status transitions
    const prevQpr = await this.prisma.qpr.findUnique({
      where: { id },
      include: { vendor: true },
    });

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

    // Notify upon task transition
    (async () => {
      try {
        const supName = prevQpr?.vendor?.vendorName || updated.vendorId || 'Vendor';
        const docNum = updated.qprNumber || id;

        // 1. If QPR is re-submitted for approval (from UNDER_REVISION / DRAFT -> WAITING_APPROVAL)
        if (
          status === 'WAITING_APPROVAL' &&
          (requiredRole === 'Section Head' || !requiredRole) &&
          prevQpr?.status === 'UNDER_REVISION'
        ) {
          await this.sendSystemNotificationEmail({
            subject: `[TUGAS APPROVAL QPR] Revisi No. ${docNum} Diajukan Kembali - Menunggu Section Head QA (${supName})`,
            title: `Tugas Approval QPR - Revisi Dokumen Telah Diajukan Kembali`,
            docNumber: docNum,
            docType: 'QPR',
            supplierName: supName,
            targetRoleName: 'Section Head QA',
            targetRoleKeywords: ['section_head', 'septian.nugraha', 'Section Head'],
            stepBadge: 'Tugas Dokumen: Review & Approval Revisi Section Head QA',
            statusText: 'WAITING_APPROVAL',
            nextStepText: 'Revisi draf QPR telah diperbaiki dan diajukan kembali oleh Operator/Foreman. Section Head QA bertugas untuk melakukan review dan persetujuan.',
            details: [
              { label: 'Problem / Defect', value: updated.problem || '-' },
              { label: 'Total NG', value: `${updated.totalQtyNg || 0} pcs` },
            ],
          });
        }

        // 2. If QPR is returned for revision (UNDER_REVISION)
        if (status === 'UNDER_REVISION' && prevQpr?.status !== 'UNDER_REVISION') {
          await this.sendSystemNotificationEmail({
            subject: `[TUGAS REVISI QPR] No. ${docNum} Dikembalikan untuk Perbaikan Data (${supName})`,
            title: `Tugas Revisi Dokumen QPR - Dikembalikan oleh Reviewer`,
            docNumber: docNum,
            docType: 'QPR',
            supplierName: supName,
            targetRoleName: 'Operator / Foreman QA (Pembuat QPR)',
            targetRoleKeywords: ['creator', 'operator', 'foreman', 'hendrik.firdaus'],
            stepBadge: 'Tugas Dokumen: Perbaikan & Pengajuan Ulang QPR',
            statusText: 'UNDER_REVISION',
            nextStepText: 'Dokumen QPR dikembalikan oleh reviewer untuk perbaikan data. Mohon buka Portal QPR untuk merevisi dan mengajukan kembali.',
          });
        }

        // 3. If QPR is rejected
        if ((status === 'REJECTED' || status === 'CLOSED') && String(prevQpr?.status) !== 'REJECTED' && String(prevQpr?.status) !== 'CLOSED') {
          await this.sendSystemNotificationEmail({
            subject: `[QPR Ditolak] QPR No. ${docNum} Telah Ditolak (${supName})`,
            title: `Dokumen QPR Ditolak (Rejected)`,
            docNumber: docNum,
            docType: 'QPR',
            supplierName: supName,
            targetRoleName: 'Operator QA & Tim Terkait',
            targetRoleKeywords: ['creator', 'operator', 'hendrik.firdaus', 'section_head', 'septian.nugraha'],
            stepBadge: 'Status Dokumen: Ditolak (Closed Rejected)',
            statusText: 'REJECTED',
            nextStepText: 'Dokumen klaim QPR telah ditolak dan ditutup.',
          });
        }
      } catch (e: any) {
        console.warn('[QprsService] Error in update notification:', e.message);
      }
    })();

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

    // 2. Synchronize QPR status & requiredRole in QPR table and dispatch task email
    (async () => {
      try {
        const qpr = await this.prisma.qpr.findUnique({
          where: { id: qprId },
          include: { vendor: true },
        });

        if (qpr) {
          const supName = qpr.vendor?.vendorName || `Vendor ${qpr.vendorId || ''}`;
          let stageTitle = '';
          let emailSubject = '';
          let statusText = qpr.status;
          let nextStep = '';
          let notes = '';
          let targetRoleName = '';
          let targetRoleKeywords: string[] = [];
          let stepBadge = '';
          let nextRequiredRole = qpr.requiredRole;
          let nextQprStatus = qpr.status;

          if (checksumPurchasing) {
            // Step 5: Purchasing Approved (QPR Full Approved) -> Task for Purchasing (Cicik Andria / M. Chariri) to create CL
            nextRequiredRole = 'Purchasing';
            nextQprStatus = 'APPROVED';
            stageTitle = 'Tugas Pembuatan Confirmation Letter (CL) - QPR Full Approved';
            emailSubject = `[TUGAS BUAT CL] QPR No. ${qpr.qprNumber} Full Approved - Segera Buat Confirmation Letter (${supName})`;
            statusText = 'APPROVED';
            nextStep = 'Dokumen QPR telah Full Approved oleh QA & Purchasing. Anda memiliki tugas untuk segera membuat Confirmation Letter (CL) resmi di sistem untuk diproses ke Accounting.';
            notes = remarksPurchasing;
            targetRoleName = 'Purchasing (Pembuat CL & Kirim ke Vendor)';
            targetRoleKeywords = ['purchasing_cl', 'cicik.andria', 'muhammad.chariri', 'cicik', 'chariri'];
            stepBadge = 'Tugas Dokumen: Pembuatan Surat Confirmation Letter (CL)';
          } else if (checksumDivHead) {
            // Step 4: Div Head Approved -> Task for Purchasing Approver (Irvan HN) to approve QPR
            nextRequiredRole = 'Purchasing';
            nextQprStatus = 'WAITING_APPROVAL';
            stageTitle = 'Tugas Approval QPR - Menunggu Persetujuan Purchasing';
            emailSubject = `[TUGAS APPROVAL QPR] No. ${qpr.qprNumber} - Menunggu Review & Approval Purchasing (${supName})`;
            statusText = 'WAITING_APPROVAL';
            nextStep = 'Dokumen QPR telah disetujui Division Head QA dan diteruskan kepada Anda sebagai Purchasing Approver (Irvan HN) untuk persetujuan komersial klaim.';
            notes = remarksDivHead;
            targetRoleName = 'Purchasing (Approver QPR)';
            targetRoleKeywords = ['purchasing_approve', 'irvan.hn', 'irvan'];
            stepBadge = 'Tugas Dokumen (Langkah 4/5): Review & Persetujuan Purchasing';
          } else if (checksumDeptHead) {
            // Step 3: Dept Head QA Approved -> Task for Division Head QA (Putu Saputra) to approve QPR
            nextRequiredRole = 'Div Head';
            nextQprStatus = 'WAITING_APPROVAL';
            stageTitle = 'Tugas Approval QPR - Menunggu Persetujuan Division Head QA';
            emailSubject = `[TUGAS APPROVAL QPR] No. ${qpr.qprNumber} - Menunggu Review & Approval Division Head QA (${supName})`;
            statusText = 'WAITING_APPROVAL';
            nextStep = 'Dokumen QPR telah disetujui Dept Head QA dan diteruskan kepada Anda sebagai Division Head QA (Putu Saputra) untuk persetujuan eksekutif.';
            notes = remarksDeptHead;
            targetRoleName = 'Division Head QA';
            targetRoleKeywords = ['div_head', 'putu.saputra', 'putu'];
            stepBadge = 'Tugas Dokumen (Langkah 3/5): Review & Persetujuan Division Head QA';
          } else if (checksumSectionHead) {
            // Step 2: Section Head QA Approved -> Task for Dept Head QA (Septian Nugraha) to approve QPR
            nextRequiredRole = 'Dept Head';
            nextQprStatus = 'WAITING_APPROVAL';
            stageTitle = 'Tugas Approval QPR - Menunggu Persetujuan Dept Head QA';
            emailSubject = `[TUGAS APPROVAL QPR] No. ${qpr.qprNumber} - Menunggu Review & Approval Dept Head QA (${supName})`;
            statusText = 'WAITING_APPROVAL';
            nextStep = 'Dokumen QPR telah disetujui Section Head QA dan diteruskan kepada Anda sebagai Dept Head QA (Septian Nugraha) untuk review dan persetujuan.';
            notes = remarksSectionHead;
            targetRoleName = 'Dept Head QA';
            targetRoleKeywords = ['dept_head', 'septian.nugraha', 'septian'];
            stepBadge = 'Tugas Dokumen (Langkah 2/5): Review & Persetujuan Dept Head QA';
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

          // Send task email
          if (stageTitle) {
            await this.sendSystemNotificationEmail({
              subject: emailSubject,
              title: stageTitle,
              docNumber: qpr.qprNumber,
              docType: 'QPR',
              supplierName: supName,
              targetRoleName,
              targetRoleKeywords,
              stepBadge,
              statusText: statusText,
              nextStepText: nextStep,
              notes: notes,
              details: [
                { label: 'Problem / Defect', value: qpr.problem || '-' },
                { label: 'Total NG', value: `${qpr.totalQtyNg || 0} pcs` },
                { label: 'Jenis Klaim', value: qpr.claimType || 'Material / Defect' },
              ],
            });
          }
        }
      } catch (err: any) {
        console.warn(`[QprsService] Notice: Error in updateApprovalProgress task email:`, err.message);
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

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || '0').replace(/Rp/g, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.')) || 0;

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

    // Send task email notification for CL creation (Step 6: Purchasing create CL -> Dept Accounting)
    (async () => {
      try {
        const clVendor = vendorId ? await this.prisma.vendor.findUnique({ where: { id: vendorId } }) : null;
        const supName = clVendor?.vendorName || `Vendor ${vendorId || ''}`;
        const amountStr = `Rp ${(Number(parsedAmount) || 0).toLocaleString('id-ID')}`;

        await this.sendSystemNotificationEmail({
          subject: `[TUGAS APPROVAL CL] Surat Confirmation Letter No. ${clNumber} - Menunggu Approval Dept Accounting (${supName})`,
          title: `Tugas Approval Confirmation Letter - Menunggu Review & Approval Dept Accounting`,
          docNumber: clNumber,
          docType: 'Confirmation Letter',
          supplierName: supName,
          targetRoleName: 'Dept Head Accounting (Approval CL)',
          targetRoleKeywords: ['accounting', 'dept_accounting', 'anindita.irnila', 'anindita'],
          stepBadge: 'Tugas Dokumen (Langkah 6): Review & Approval Dept Accounting',
          statusText: 'PENDING',
          nextStepText: 'Dokumen Confirmation Letter telah dibuat oleh Purchasing dan diterima oleh Dept Head Accounting (Anindita Irnila) untuk verifikasi nilai klaim dan persetujuan.',
          details: [
            { label: 'Ref. No. QPR', value: data.qprNumber || qprExists.qprNumber || '-' },
            { label: 'Nilai Klaim', value: amountStr },
            { label: 'Tanggal Dokumen', value: dateSent ? String(dateSent).split('T')[0] : new Date().toISOString().split('T')[0] },
          ],
        });
      } catch (err: any) {
        console.warn(`[QprsService] Notice: Error sending CL create email:`, err.message);
      }
    })();

    return createdCl;
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

    // Send email notification for CL updates
    (async () => {
      try {
        const fullCl = await this.prisma.confirmationLetter.findUnique({
          where: { id },
          include: { vendor: true, qpr: true },
        });

        if (fullCl) {
          const supName = fullCl.vendor?.vendorName || `Vendor ${fullCl.vendorId || ''}`;

          // Step 7: Dept Accounting approve CL -> Task for Purchasing (Cicik Andria / M. Chariri) to send CL to vendor
          if (status === 'APPROVED' || status === 'FULLY_APPROVED') {
            if (!vendorApproved && !closedPaid) {
              await this.sendSystemNotificationEmail({
                subject: `[TUGAS KIRIM CL] Confirmation Letter No. ${fullCl.clNumber} Disetujui Accounting - Segera Kirim ke Vendor (${supName})`,
                title: `Tugas Pengiriman Confirmation Letter ke Vendor - Disetujui Dept Accounting`,
                docNumber: fullCl.clNumber,
                docType: 'Confirmation Letter',
                supplierName: supName,
                targetRoleName: 'Purchasing (Kirim Surat CL ke Vendor)',
                targetRoleKeywords: ['purchasing_cl', 'cicik.andria', 'muhammad.chariri', 'cicik', 'chariri'],
                stepBadge: 'Tugas Dokumen (Langkah 7): Kirim Surat CL ke Vendor',
                statusText: 'FULLY_APPROVED',
                nextStepText: 'Confirmation Letter telah disetujui Dept Head Accounting. Purchasing bertugas segera mengirimkan surat CL resmi beserta lampiran ke pihak Vendor melalui sistem.',
                details: [
                  { label: 'Ref. QPR', value: fullCl.qpr?.qprNumber || '-' },
                  { label: 'Tanggal Terbit', value: fullCl.dateSent ? String(fullCl.dateSent).split('T')[0] : '-' },
                ],
              });
            }
          }

          // Step 8: Purchasing sent CL to Vendor -> Notify Vendor & Stakeholders
          if (purchasingSentCl) {
            await this.sendSystemNotificationEmail({
              subject: `[CL Notifikasi] Dokumen Confirmation Letter No. ${fullCl.clNumber} Resmi Diterima oleh Vendor (${supName})`,
              title: `Dokumen Confirmation Letter Resmi Telah Diterima oleh Vendor`,
              docNumber: fullCl.clNumber,
              docType: 'Confirmation Letter',
              supplierName: supName,
              targetRoleName: 'Vendor & Stakeholders',
              targetRoleKeywords: ['purchasing_cl', 'creator_qpr'],
              stepBadge: 'Dokumen Masuk (Langkah 8): Menunggu Konfirmasi Vendor',
              statusText: 'WAITING_VENDOR_APPROVAL',
              nextStepText: 'Dokumen resmi Confirmation Letter telah dikirimkan ke pihak Vendor. Menunggu konfirmasi penerimaan dan persetujuan dari Vendor.',
              details: [
                { label: 'Ref. QPR', value: fullCl.qpr?.qprNumber || '-' },
                { label: 'Tanggal Pengiriman', value: fullCl.purchasingSentDate || new Date().toISOString().split('T')[0] },
              ],
            });
          }

          if (vendorApproved) {
            // Step 9: Vendor Approved -> Task for Finance (Bagas Pratama) to create SSC Billing & Payment
            await this.sendSystemNotificationEmail({
              subject: `[TUGAS PROSES SSC] Confirmation Letter No. ${fullCl.clNumber} Disetujui Vendor - Tugas Pembuatan SSC Billing & Payment (${supName})`,
              title: `Tugas Pembuatan SSC Billing & Eksekusi Pembayaran - CL Disetujui Vendor`,
              docNumber: fullCl.clNumber,
              docType: 'Confirmation Letter',
              supplierName: supName,
              targetRoleName: 'Finance (Creator SSC Billing & SSC Payments)',
              targetRoleKeywords: ['finance_ssc', 'bagas.pratama', 'finance', 'bagas'],
              stepBadge: 'Tugas Dokumen: Pembuatan SSC Billing & Payment',
              statusText: 'APPROVED_BY_VENDOR',
              nextStepText: 'Dokumen Confirmation Letter telah disetujui oleh pihak Vendor. Finance (Bagas Pratama) bertugas membuat debit note / SSC Billing dan mengeksekusi pencatatan pembayaran klaim.',
              details: [
                { label: 'Ref. QPR', value: fullCl.qpr?.qprNumber || '-' },
                { label: 'Tanggal Persetujuan Vendor', value: fullCl.vendorApprovedDate || new Date().toISOString().split('T')[0] },
              ],
            });
          }

          if (closedPaid) {
            await this.sendSystemNotificationEmail({
              subject: `[CL Selesai] Confirmation Letter No. ${fullCl.clNumber} Telah Lunas & Selesai (Closed Paid)`,
              title: `Confirmation Letter Lunas (Closed Paid)`,
              docNumber: fullCl.clNumber,
              docType: 'Confirmation Letter',
              supplierName: supName,
              targetRoleName: 'Semua Departemen (Closed)',
              stepBadge: 'Siklus Klaim Selesai & Lunas',
              statusText: 'CLOSED_PAID',
              nextStepText: 'Seluruh tahapan klaim mutu dan penyelesaian tagihan Confirmation Letter telah selesai dan tercatat lunas.',
              details: [
                { label: 'Ref. QPR', value: fullCl.qpr?.qprNumber || '-' },
                { label: 'Status Akhir', value: 'Lunas & Selesai' },
              ],
            });
          }
        }
      } catch (err: any) {
        console.warn(`[QprsService] Notice: Error sending CL update email:`, err.message);
      }
    })();

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

  async sendConfirmationLetterEmail(data: {
    clId?: string;
    clIds?: string[];
    to: string;
    subject: string;
    body: string;
    vendorName?: string;
    sendDate?: string;
    dueDate?: string;
    attachments?: Array<{ filename: string; content?: string | Buffer; path?: string; contentType?: string }>;
  }): Promise<any> {
    const { clId, clIds, to, subject, body, vendorName, sendDate, dueDate, attachments: clientAttachments } = data;

    const idsToUpdate = clIds && clIds.length > 0 ? clIds : (clId ? [clId] : []);
    const finalAttachments: Array<{ filename: string; content?: string | Buffer; path?: string; contentType?: string }> = [];

    // 1. Add any client provided attachments
    if (clientAttachments && Array.isArray(clientAttachments)) {
      clientAttachments.forEach(att => {
        if (att && att.filename) {
          if (typeof att.content === 'string' && att.content.startsWith('data:')) {
            const base64Data = att.content.split(';base64,')[1] || att.content;
            finalAttachments.push({
              filename: att.filename,
              content: Buffer.from(base64Data, 'base64'),
              contentType: att.filename.endsWith('.pdf') ? 'application/pdf' : 'image/png',
            });
          } else if (att.content || att.path) {
            finalAttachments.push(att);
          }
        }
      });
    }

    // 2. Fetch Confirmation Letters and QPR attachments from DB
    try {
      let cls = await this.prisma.confirmationLetter.findMany({
        where: {
          OR: [
            { id: { in: idsToUpdate } },
            { clNumber: { in: idsToUpdate } },
            { qpr: { qprNumber: { in: idsToUpdate } } },
            ...(vendorName ? [{ vendor: { vendorName: { contains: vendorName, mode: 'insensitive' as const } } }] : [])
          ]
        },
        include: {
          vendor: true,
          qpr: {
            include: {
              qprParts: {
                include: {
                  part: true,
                }
              }
            }
          }
        }
      });

      // Fallback: If no DB match, synthesize an active document object
      if (cls.length === 0) {
        const fallbackVendor = await this.prisma.vendor.findFirst({
          where: vendorName ? { vendorName: { contains: vendorName, mode: 'insensitive' as const } } : undefined,
        });

        const fallbackQpr = await this.prisma.qpr.findFirst({
          where: fallbackVendor ? { vendorId: fallbackVendor.id } : undefined,
          include: {
            qprParts: {
              include: {
                part: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        cls = [{
          id: idsToUpdate[0] || 'cl-synth-1',
          clNumber: idsToUpdate[0] || 'CL/2026/09/VENDOR_CL_PREVIEW',
          dateSent: new Date(),
          qprId: fallbackQpr?.id || 'qpr-fallback',
          vendorId: fallbackVendor?.id || 'vendor-fallback',
          amount: 801975,
          status: 'PENDING',
          purchasingSentCl: false,
          vendorApproved: false,
          closedPaid: false,
          purchasingSentDate: null,
          vendorApprovedDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          vendor: fallbackVendor || { vendorName: vendorName || 'PT. ARAI RUBBER SEAL IND' },
          qpr: fallbackQpr || {
            qprNumber: 'QPR/2026/09/VENDOR_QPR_PREVIEW',
            qprParts: []
          }
        }] as any;
      }

      // Generate PDF buffer for each Confirmation Letter
      for (const cl of cls) {
        try {
          const pdfBuffer = await this.pdfGeneratorService.generateConfirmationLetterPdf({
            clNumber: cl.clNumber || 'CL-PREVIEW',
            dateSent: cl.dateSent ? cl.dateSent.toISOString() : new Date().toISOString(),
            vendorName: cl.vendor?.vendorName || vendorName || 'Vendor',
            qprNumber: cl.qpr?.qprNumber || 'QPR-REF',
            amount: cl.amount || 0,
            dueDate: dueDate,
            items: (cl.qpr?.qprParts || []).map((qp: any) => ({
              partNumber: qp.part?.partNumber || 'PART-01',
              partName: qp.part?.partDesc || qp.part?.partNumber || 'Part Material NG',
              totalQty: qp.totalQty || 0,
              qtyNg: qp.qtyNg || 0,
              stdAllowance: qp.stdAllowance || 0,
              qtyClaim: qp.qtyClaim !== undefined ? qp.qtyClaim : Math.max(0, (qp.qtyNg || 0) - (qp.stdAllowance || 0)),
              unitPrice: qp.unitPrice || 85000,
              amount: (qp.qtyClaim !== undefined ? qp.qtyClaim : Math.max(0, (qp.qtyNg || 0) - (qp.stdAllowance || 0))) * (qp.unitPrice || 85000),
            })),
          });

          const cleanDocNumber = (cl.clNumber || 'Confirmation_Letter').replace(/[^a-zA-Z0-9_-]/g, '_');
          finalAttachments.push({
            filename: `Surat_CL_${cleanDocNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          });
        } catch (pdfErr) {
          console.warn(`[QprsService] Failed to generate PDF for CL ${cl.clNumber}:`, pdfErr);
        }

        // Attach QPR evidence if exists
        if (cl.qpr?.pdfFileBase64) {
          try {
            if (cl.qpr.pdfFileBase64.startsWith('[')) {
              const parsed = JSON.parse(cl.qpr.pdfFileBase64);
              if (Array.isArray(parsed)) {
                parsed.forEach((item: any, idx: number) => {
                  if (item.base64) {
                    const base64Data = item.base64.split(';base64,')[1] || item.base64;
                    finalAttachments.push({
                      filename: item.name || `Bukti_Lampiran_QPR_${idx + 1}.png`,
                      content: Buffer.from(base64Data, 'base64'),
                      contentType: (item.name || '').endsWith('.pdf') ? 'application/pdf' : 'image/png',
                    });
                  }
                });
              }
            } else {
              const base64Data = cl.qpr.pdfFileBase64.split(';base64,')[1] || cl.qpr.pdfFileBase64;
              finalAttachments.push({
                filename: cl.qpr.pdfFileName || `Bukti_Lampiran_QPR_${(cl.qpr.qprNumber || 'Ref').replace(/[^a-zA-Z0-9_-]/g, '_')}.png`,
                content: Buffer.from(base64Data, 'base64'),
                contentType: (cl.qpr.pdfFileName || '').endsWith('.pdf') ? 'application/pdf' : 'image/png',
              });
            }
          } catch (err) {
            console.warn('[QprsService] Failed to parse QPR attachments from base64:', err);
          }
        }
      }
    } catch (dbErr) {
      console.warn('[QprsService] Error fetching CLs for email attachments:', dbErr);
    }

    // Remove duplicates by filename if any
    const seenFilenames = new Set<string>();
    const deduplicatedAttachments = finalAttachments.filter(att => {
      if (seenFilenames.has(att.filename)) return false;
      seenFilenames.add(att.filename);
      return true;
    });

    // 3. Send mail via MailService
    const mailResult = await this.mailService.sendMail({
      to,
      subject,
      text: body,
      attachments: deduplicatedAttachments,
    });

    const effectiveSentDate = sendDate || new Date().toISOString().split('T')[0];

    // 4. Mark CL(s) as sent in DB
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
      success: mailResult.success,
      simulated: mailResult.simulated,
      message: mailResult.message,
      messageId: mailResult.messageId,
      updatedClIds: idsToUpdate,
      attachmentsCount: deduplicatedAttachments.length,
      attachments: deduplicatedAttachments.map(a => a.filename),
      sentDate: effectiveSentDate,
    };
  }

  async sendQprReminder(qprId: string, customNotes?: string): Promise<any> {
    const qpr = await this.prisma.qpr.findFirst({
      where: {
        OR: [
          { id: qprId },
          { qprNumber: qprId }
        ]
      },
      include: {
        vendor: true,
        approvalProgress: true,
        qprParts: {
          include: { part: true }
        }
      }
    });

    if (!qpr) {
      throw new NotFoundException(`QPR dengan ID / Nomor ${qprId} tidak ditemukan.`);
    }

    const supName = qpr.vendor?.vendorName || 'Vendor / Subcont';
    const reqRole = qpr.requiredRole || 'Section Head';
    let targetRoleName = reqRole;
    let targetRoleKeywords: string[] = [reqRole];
    let nextStepText = 'Mohon segera login ke Portal QPR MTM untuk melakukan review dan persetujuan dokumen ini.';
    let stepBadge = `REMINDER: Menunggu Tindakan ${reqRole}`;
    let taskActionName = 'Review & Approval';

    if (reqRole === 'Section Head' || reqRole.includes('Section')) {
      targetRoleName = 'Section Head QA';
      targetRoleKeywords = ['section_head', 'septian.nugraha', 'Section Head'];
      stepBadge = 'REMINDER TUGAS (Langkah 1/5): Approval Section Head QA';
      nextStepText = 'Dokumen QPR ini menunggu tindakan review dan persetujuan Anda sebagai Section Head QA. Mohon segera diproses di Portal QPR.';
    } else if (reqRole === 'Dept Head' || reqRole.includes('Dept')) {
      targetRoleName = 'Dept Head QA';
      targetRoleKeywords = ['dept_head', 'septian.nugraha', 'Dept Head'];
      stepBadge = 'REMINDER TUGAS (Langkah 2/5): Approval Dept Head QA';
      nextStepText = 'Dokumen QPR ini menunggu tindakan review dan persetujuan Anda sebagai Dept Head QA. Mohon segera diproses di Portal QPR.';
    } else if (reqRole === 'Div Head' || reqRole.includes('Div')) {
      targetRoleName = 'Division Head QA';
      targetRoleKeywords = ['div_head', 'putu.saputra', 'Division Head'];
      stepBadge = 'REMINDER TUGAS (Langkah 3/5): Approval Division Head QA';
      nextStepText = 'Dokumen QPR ini menunggu tindakan persetujuan eksekutif Anda sebagai Division Head QA. Mohon segera diproses di Portal QPR.';
    } else if (reqRole === 'Purchasing') {
      if (qpr.status === 'APPROVED') {
        targetRoleName = 'Purchasing (Pembuat CL)';
        targetRoleKeywords = ['purchasing_cl', 'cicik.andria', 'muhammad.chariri', 'cicik', 'chariri'];
        stepBadge = 'REMINDER TUGAS: Pembuatan Surat Confirmation Letter (CL)';
        taskActionName = 'Pembuatan Confirmation Letter (CL)';
        nextStepText = 'Dokumen QPR telah Full Approved dan menunggu Anda dari tim Purchasing (Cicik Andria / M. Chariri) untuk segera membuatkan Confirmation Letter (CL).';
      } else {
        targetRoleName = 'Purchasing (Approver QPR)';
        targetRoleKeywords = ['purchasing_approve', 'irvan.hn', 'irvan'];
        stepBadge = 'REMINDER TUGAS (Langkah 4/5): Review & Approval Purchasing';
        nextStepText = 'Dokumen QPR ini menunggu persetujuan komersial dari Anda sebagai Purchasing Approver (Irvan HN). Mohon segera diproses di Portal QPR.';
      }
    } else if (qpr.status === 'UNDER_REVISION' || reqRole === 'Operator') {
      targetRoleName = 'Operator / Foreman QA (Pembuat QPR)';
      targetRoleKeywords = ['creator', 'operator', 'foreman', 'hendrik.firdaus'];
      stepBadge = 'REMINDER TUGAS: Revisi Draf Dokumen QPR';
      taskActionName = 'Revisi Data QPR';
      nextStepText = 'Dokumen QPR ini telah dikembalikan oleh reviewer untuk revisi data. Mohon segera buka Portal QPR untuk merevisi dan mengajukan kembali.';
    }

    const emailSubject = `[REMINDER TUGAS] ${taskActionName} Dokumen QPR No. ${qpr.qprNumber} (${supName})`;

    await this.sendSystemNotificationEmail({
      subject: emailSubject,
      title: `Pengingat Tugas: ${taskActionName} Dokumen QPR`,
      docNumber: qpr.qprNumber,
      docType: 'QPR',
      supplierName: supName,
      targetRoleName,
      targetRoleKeywords,
      stepBadge,
      statusText: qpr.status,
      nextStepText,
      details: [
        { label: 'No. Dokumen QPR', value: qpr.qprNumber },
        { label: 'Vendor / Subcontractor', value: supName },
        { label: 'Problem Defect', value: qpr.problem || '-' },
        { label: 'Menunggu Tugas Dari', value: targetRoleName },
        { label: 'Status Saat Ini', value: qpr.status },
      ],
      notes: customNotes || `Pesan pengingat tugas ini dikirim melalui sistem Portal QPR agar antrean dokumen dapat segera terselesaikan tepat waktu.`,
    });

    return {
      success: true,
      message: `Email Reminder Tugas QPR ${qpr.qprNumber} berhasil dikirim ke ${targetRoleName}.`,
    };
  }

  async sendClReminder(clId: string, customNotes?: string): Promise<any> {
    const cl = await this.prisma.confirmationLetter.findFirst({
      where: {
        OR: [
          { id: clId },
          { clNumber: clId }
        ]
      },
      include: {
        vendor: true,
        qpr: true,
      }
    });

    if (!cl) {
      throw new NotFoundException(`Confirmation Letter dengan ID / Nomor ${clId} tidak ditemukan.`);
    }

    const supName = cl.vendor?.vendorName || 'Vendor';
    let targetRoleName = 'Dept Head Accounting';
    let targetRoleKeywords: string[] = ['accounting', 'dept_accounting', 'anindita.irnila', 'anindita'];
    let taskActionName = 'Approval Confirmation Letter';
    let stepBadge = 'REMINDER TUGAS (Langkah 6): Approval Dept Head Accounting';
    let nextStepText = 'Dokumen Confirmation Letter ini menunggu verifikasi klaim dan persetujuan dari Dept Head Accounting (Anindita Irnila).';

    if (cl.status === 'APPROVED' || String(cl.status) === 'FULLY_APPROVED') {
      if (!cl.purchasingSentCl) {
        targetRoleName = 'Purchasing (Pengirim CL)';
        targetRoleKeywords = ['purchasing_cl', 'cicik.andria', 'muhammad.chariri', 'cicik', 'chariri'];
        taskActionName = 'Pengiriman Dokumen CL ke Vendor';
        stepBadge = 'REMINDER TUGAS (Langkah 7): Kirim Surat CL ke Vendor';
        nextStepText = 'Dokumen Confirmation Letter telah disetujui Accounting. Purchasing bertugas segera mengirimkan surat CL resmi beserta lampiran ke Vendor melalui sistem.';
      } else if (!cl.vendorApproved) {
        targetRoleName = 'Vendor & Purchasing PIC';
        targetRoleKeywords = ['purchasing_cl', 'cicik.andria'];
        taskActionName = 'Konfirmasi & Approval Vendor';
        stepBadge = 'REMINDER TUGAS (Langkah 8): Menunggu Konfirmasi Vendor';
        nextStepText = 'Dokumen Confirmation Letter telah dikirimkan ke pihak Vendor. Mohon segera follow-up dan pastikan konfirmasi persetujuan dari Vendor diunggah.';
      } else if (!cl.closedPaid) {
        targetRoleName = 'Finance (SSC Billing & Payments)';
        targetRoleKeywords = ['finance_ssc', 'bagas.pratama', 'finance', 'bagas'];
        taskActionName = 'Pembuatan SSC Billing & Payment';
        stepBadge = 'REMINDER TUGAS: Pembuatan SSC Billing & Eksekusi Pembayaran';
        nextStepText = 'Dokumen Confirmation Letter telah disetujui Vendor. Finance (Bagas Pratama) bertugas membuat SSC Billing (Debit Note) dan mengeksekusi penyelesaian pembayaran.';
      }
    }

    const emailSubject = `[REMINDER TUGAS] ${taskActionName} Surat CL No. ${cl.clNumber} (${supName})`;

    await this.sendSystemNotificationEmail({
      subject: emailSubject,
      title: `Pengingat Tugas: ${taskActionName}`,
      docNumber: cl.clNumber,
      docType: 'Confirmation Letter',
      supplierName: supName,
      targetRoleName,
      targetRoleKeywords,
      stepBadge,
      statusText: cl.vendorApproved ? 'APPROVED BY VENDOR' : (cl.purchasingSentCl ? 'MENUNGGU APPROVAL VENDOR' : (cl.status === 'APPROVED' ? 'APPROVED BY ACCOUNTING' : 'PENDING APPROVAL ACCOUNTING')),
      nextStepText,
      details: [
        { label: 'No. Confirmation Letter', value: cl.clNumber },
        { label: 'No. QPR Referensi', value: cl.qpr?.qprNumber || '-' },
        { label: 'Nama Vendor', value: supName },
        { label: 'Menunggu Tugas Dari', value: targetRoleName },
      ],
      notes: customNotes || `Pesan pengingat tugas ini dikirim melalui sistem Portal QPR untuk mempercepat penyelesaian tagihan klaim biaya mutu.`,
    });

    return {
      success: true,
      message: `Email Reminder Tugas CL ${cl.clNumber} berhasil dikirim ke ${targetRoleName}.`,
    };
  }

  private async sendSystemNotificationEmail(payload: {
    subject: string;
    title: string;
    docNumber: string;
    docType: 'QPR' | 'Confirmation Letter' | 'NCR';
    supplierName: string;
    targetRoleName?: string;
    targetRoleKeywords?: string[];
    targetEmails?: string[];
    stepBadge?: string;
    statusText: string;
    nextStepText: string;
    details?: Array<{ label: string; value: string | number }>;
    notes?: string;
  }) {
    try {
      // 1. Resolve direct official corporate role emails from designated mapping
      let directRoleEmails: string[] = [];
      if (payload.targetEmails && payload.targetEmails.length > 0) {
        directRoleEmails.push(...payload.targetEmails);
      }

      if (payload.targetRoleKeywords && payload.targetRoleKeywords.length > 0) {
        for (const kw of payload.targetRoleKeywords) {
          const lk = kw.toLowerCase();
          if (lk.includes('creator') || lk.includes('foreman') || lk.includes('operator') || lk.includes('hendrik')) {
            directRoleEmails.push('hendrik.firdaus@mtm.astra.co.id');
          }
          if (lk.includes('section') || lk.includes('sect.head') || lk.includes('septian')) {
            directRoleEmails.push('septian.nugraha@mtm.astra.co.id');
          }
          if (lk.includes('dept_head') || lk.includes('department head')) {
            directRoleEmails.push('septian.nugraha@mtm.astra.co.id');
          }
          if (lk.includes('div') || lk.includes('putu')) {
            directRoleEmails.push('putu.saputra@mtm.astra.co.id');
          }
          if (lk.includes('purchasing_approve') || lk.includes('irvan')) {
            directRoleEmails.push('irvan.hn@mtm.astra.co.id');
          }
          if (lk.includes('purchasing_cl') || lk.includes('cicik') || lk.includes('chariri') || (lk.includes('purchasing') && !lk.includes('approve') && !lk.includes('irvan'))) {
            directRoleEmails.push('cicik.andria@mtm.astra.co.id');
            directRoleEmails.push('muhammad.chariri@mtm.astra.co.id');
          }
          if (lk.includes('accounting') || lk.includes('anindita')) {
            directRoleEmails.push('anindita.irnila@mtm.astra.co.id');
          }
          if (lk.includes('finance') || lk.includes('ssc') || lk.includes('bagas')) {
            directRoleEmails.push('bagas.pratama@mtm.astra.co.id');
          }
        }
      }

      // 2. Resolve DB users matching target role keywords
      let dbRoleEmails: string[] = [];
      if (payload.targetRoleKeywords && payload.targetRoleKeywords.length > 0) {
        try {
          const matchedUsers = await this.prisma.user.findMany({
            where: {
              status: 'Aktif',
              OR: payload.targetRoleKeywords.map((kw) => ({
                role: { contains: kw, mode: 'insensitive' },
              })),
            },
            select: { email: true, name: true },
          });
          dbRoleEmails = matchedUsers.map((u) => u.email).filter(Boolean) as string[];
        } catch (dbErr) {
          console.warn('[QprsService] Error fetching role user emails for notification:', dbErr);
        }
      }

      // Filter and deduplicate: Send strictly to the target section's designated recipient(s)
      let recipientEmails = Array.from(new Set([...directRoleEmails, ...dbRoleEmails])).filter(Boolean);

      // Fallback only if no specific section email was resolved
      if (recipientEmails.length === 0) {
        recipientEmails = (process.env.NOTIFICATION_EMAIL_TO || process.env.SMTP_USER || '')
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean);
      }

      const detailRows = (payload.details || [])
        .map(
          (d) => `<tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #475569; width: 35%; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${d.label}</td>
            <td style="padding: 8px 12px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${d.value}</td>
          </tr>`
        )
        .join('');

      const notesHtml = payload.notes
        ? `<div style="margin-top: 14px; padding: 12px; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; font-size: 13px; color: #92400e;">
            <strong>Catatan / Reviewer Remarks:</strong><br/>${payload.notes}
          </div>`
        : '';

      const targetRoleHtml = payload.targetRoleName
        ? `<div style="margin-bottom: 14px; padding: 10px 14px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #2563eb; border-radius: 4px; font-size: 13px; color: #1e40af; font-weight: 700;">
            👤 <span>Ditujukan Kepada Role:</span> <strong style="color: #1d4ed8; text-decoration: underline;">${payload.targetRoleName}</strong>
          </div>`
        : '';

      const stepBadgeHtml = payload.stepBadge
        ? `<div style="display: inline-block; padding: 4px 10px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; color: #334155; font-size: 11px; font-weight: 700; margin-left: 8px;">
            ${payload.stepBadge}
          </div>`
        : '';

      const htmlBody = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${payload.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 24px 0;">
    <tr>
      <td align="center" style="padding: 0 16px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color: #1e3a8a; padding: 20px 24px; text-align: left;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">PT MENARA TERUS MAKMUR</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #bfdbfe;">Quality &amp; Purchasing Automated Notification System</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px; text-align: left;">
              <div style="margin-bottom: 12px;">
                <span style="display: inline-block; padding: 4px 10px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; color: #1d4ed8; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                  ${payload.docType} Notification
                </span>
                ${stepBadgeHtml}
              </div>

              <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 800; color: #0f172a;">
                ${payload.title}
              </h2>

              ${targetRoleHtml}

              <p style="margin: 0 0 16px 0; font-size: 13.5px; color: #334155; line-height: 1.5;">
                Pemberitahuan pembaruan status data dokumen sistem:
              </p>

              <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 16px;">
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #475569; width: 35%; border-bottom: 1px solid #e2e8f0; font-size: 13px;">No. Dokumen</td>
                  <td style="padding: 8px 12px; color: #1e40af; font-weight: 800; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${payload.docNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 13px;">Supplier / Vendor</td>
                  <td style="padding: 8px 12px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${payload.supplierName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 13px;">Status Dokumen</td>
                  <td style="padding: 8px 12px; color: #059669; font-weight: 700; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${payload.statusText}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 13px;">Tindakan Lanjutan</td>
                  <td style="padding: 8px 12px; color: #d97706; font-weight: 700; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${payload.nextStepText}</td>
                </tr>
                ${detailRows}
              </table>

              ${notesHtml}

              <div style="margin-top: 20px; padding: 14px; background-color: #f1f5f9; border-radius: 6px; font-size: 12.5px; color: #475569; line-height: 1.5;">
                ℹ️ Silakan buka <strong>Portal QPR &amp; Purchasing MTM</strong> untuk melakukan verifikasi, approval digital, pembuatan CL, atau mengunduh dokumen PDF resmi.
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 14px 24px; border-top: 1px solid #e2e8f0; text-align: left;">
              <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 600;">PT Menara Terus Makmur - Astra Otoparts Group</p>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #94a3b8;">Email otomatis dari Quality &amp; Purchasing Automated Notification System</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await this.mailService.sendMail({
        to: recipientEmails,
        subject: payload.subject,
        html: htmlBody,
      });
    } catch (err: any) {
      console.warn(`[QprsService] Notice: Could not send notification email:`, err.message);
    }
  }
}
