import { apiRequest } from './apiClient';

export interface CreateQprPayload {
  qprNumber: string;
  date?: string;
  vendorId: string;
  userId?: string;
  status?: string;
  requiredRole: string;
  refNcrNumber?: string;
  problem?: string;
  claimType?: string;
  totalQty: number;
  totalQtyNg: number;
  totalStdAllowance: number;
  billableQty: number;
  claimAmount?: number;
  pdfFileName?: string;
  pdfFileBase64?: string;
  qprParts?: Array<{
    partId: string;
    totalQty?: number;
    qtyNg?: number;
    stdAllowance?: number;
    qtyClaim?: number;
    unitPrice?: number;
    taxRate?: number;
  }>;
}

export const qprService = {
  getAll: () => apiRequest('/qprs'),
  getById: (id: string) => apiRequest(`/qprs/${id}`),
  create: (data: CreateQprPayload) => apiRequest('/qprs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<CreateQprPayload>) => apiRequest(`/qprs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateApprovalProgress: (id: string, data: {
    checksumSectionHead?: string;
    remarksSectionHead?: string;
    checksumDeptHead?: string;
    remarksDeptHead?: string;
    checksumDivHead?: string;
    remarksDivHead?: string;
    checksumPurchasing?: string;
    remarksPurchasing?: string;
    checksumVendor?: string;
    remarksVendor?: string;
  }) => apiRequest(`/qprs/${id}/approval-progress`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  sendReminder: (id: string, notes?: string) => apiRequest(`/qprs/${id}/send-reminder`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  }),
};

export const generateNextQprNumber = (qprs: any[] = [], dateStr?: string): string => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const month = String(validDate.getMonth() + 1).padStart(2, "0");
  const year = String(validDate.getFullYear()).slice(-2);
  
  // Format target: (NO dokumen contoh 01)/QI/QPR/SUB/MM/YY
  let maxSeq = 0;

  if (Array.isArray(qprs)) {
    qprs.forEach((q) => {
      const qNum = String(q.qprNumber || q.docNumber || "").trim();
      const match = qNum.match(/^(\d+)\/QI\/QPR\/SUB\/(\d+)\/(\d+)$/i);
      if (match) {
        const seq = parseInt(match[1], 10);
        const m = String(parseInt(match[2], 10)).padStart(2, "0");
        const y = String(match[3]).slice(-2);
        if (m === month && y === year && !isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      } else {
        const matchAnyMonth = qNum.match(new RegExp(`/${month}/${year}`, "i"));
        if (matchAnyMonth) {
          const leadingDigits = qNum.match(/^(\d+)/);
          if (leadingDigits) {
            const seq = parseInt(leadingDigits[1], 10);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }
        }
      }
    });
  }

  // Setiap ganti bulan, nomor QPR dimulai / reset dari 1 (01)
  const nextSeq = maxSeq + 1;
  const paddedSeq = String(nextSeq).padStart(2, "0");
  
  return `${paddedSeq}/QI/QPR/SUB/${month}/${year}`;
};

export const getPeriodFromDate = (dateStr?: string) => {
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  if (!dateStr) {
    const d = new Date();
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    return `${months[fallback.getMonth()]} ${fallback.getFullYear()}`;
  }
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatLeadTime = (totalHours: number | string | null | undefined): string => {
  if (totalHours === null || totalHours === undefined || totalHours === "") return "-";
  const h = typeof totalHours === "number" ? totalHours : parseFloat(String(totalHours));
  if (isNaN(h) || h < 0) return "-";
  
  const totalSec = Math.round(h * 3600);
  if (totalSec < 60) {
    return `${totalSec} Detik`;
  }
  if (totalSec < 3600) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return secs > 0 ? `${mins} Menit ${secs} Detik` : `${mins} Menit`;
  }
  if (totalSec < 86400) {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    return mins > 0 ? `${hours} Jam ${mins} Menit` : `${hours} Jam`;
  }
  const days = Math.floor(totalSec / 86400);
  const remainingHours = Math.floor((totalSec % 86400) / 3600);
  if (remainingHours === 0) {
    return `${days} Hari`;
  }
  return `${days} Hari ${remainingHours} Jam`;
};

export const mapQprFromDb = (dbQpr: any) => {
  const parts = (dbQpr.qprParts || []).map((qp: any, idx: number) => ({
    no: idx + 1,
    partName: qp.part?.partDesc || qp.part?.partNumber || "ALL TYPE PART FINISH",
    partNumber: qp.part?.partNumber || "",
    totalQty: qp.totalQty || 0,
    qtyNG: qp.qtyNg || 0,
    ngActual: qp.totalQty > 0 ? (qp.qtyNg / qp.totalQty) * 100 : 0.0,
    stdAllowance: qp.stdAllowance || 0,
    qtyClaim: qp.qtyClaim || 0
  }));

  // Parse claim type
  let parsedClaimType: string[] = [];
  if (dbQpr.claimType) {
    try {
      if (dbQpr.claimType.startsWith('[')) {
        parsedClaimType = JSON.parse(dbQpr.claimType);
      } else {
        parsedClaimType = dbQpr.claimType.split(',').map((s: string) => s.trim());
      }
    } catch {
      parsedClaimType = dbQpr.claimType.split(',').map((s: string) => s.trim());
    }
  }

  // Parse pdfFiles
  let pdfFiles: Array<{ name: string; base64: string }> = [];
  if (dbQpr.pdfFileBase64) {
    try {
      if (dbQpr.pdfFileBase64.startsWith('[')) {
        pdfFiles = JSON.parse(dbQpr.pdfFileBase64);
      } else {
        pdfFiles = [{
          name: dbQpr.pdfFileName || "attachment.pdf",
          base64: dbQpr.pdfFileBase64
        }];
      }
    } catch {
      pdfFiles = [{
        name: dbQpr.pdfFileName || "attachment.pdf",
        base64: dbQpr.pdfFileBase64
      }];
    }
  }

  const isMultipleParts = parts.length > 1;
  const partName = isMultipleParts ? "All Type" : (parts[0]?.partName || "ALL TYPE PART FINISH");
  const partNumber = (dbQpr.partNumber && dbQpr.partNumber !== "All Type" && dbQpr.partNumber !== "ALL TYPE")
    ? dbQpr.partNumber
    : (parts[0]?.partNumber || "-");

  return {
    id: dbQpr.id,
    qprNumber: dbQpr.qprNumber,
    date: dbQpr.date ? dbQpr.date.split("T")[0] : new Date().toISOString().split("T")[0],
    supplierName: dbQpr.vendor?.vendorName || `Vendor ${dbQpr.vendor?.vendorCode}`,
    supplierId: dbQpr.vendorId,
    partName,
    partNumber,
    period: getPeriodFromDate(dbQpr.date),
    totalItems: dbQpr.totalQty || 0,
    rejectItems: dbQpr.totalQtyNg || 0,
    allowanceRatio: `${(((dbQpr.totalStdAllowance || 0) / (dbQpr.totalQty || 1)) * 100).toFixed(1)}%`,
    claimAmount: dbQpr.claimAmount ? `Rp ${dbQpr.claimAmount.toLocaleString("id-ID")}` : "-",
    status: dbQpr.status,
    requiredRole: dbQpr.requiredRole,
    parts,
    refNcrNumber: dbQpr.refNcrNumber,
    problem: dbQpr.problem,
    claimType: parsedClaimType,
    pdfFileName: pdfFiles.map(f => f.name).join(", "),
    pdfFileBase64: pdfFiles.length > 0 ? pdfFiles[0].base64 : "",
    pdfFiles,
    remarks: dbQpr.approvalProgress?.remarksSectionHead || "", // fallback to remarks
    approvalProgress: dbQpr.approvalProgress || null,
    createdAt: dbQpr.createdAt || dbQpr.date,
    updatedAt: dbQpr.updatedAt,
  };
};
