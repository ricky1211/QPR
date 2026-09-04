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
    checksumVendor?: string;
    remarksVendor?: string;
  }) => apiRequest(`/qprs/${id}/approval-progress`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const getPeriodFromDate = (dateStr?: string) => {
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  if (!dateStr) {
    const d = new Date();
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  }
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
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

  return {
    id: dbQpr.id,
    qprNumber: dbQpr.qprNumber,
    date: dbQpr.date ? dbQpr.date.split("T")[0] : new Date().toISOString().split("T")[0],
    supplierName: dbQpr.vendor?.vendorName || `Vendor ${dbQpr.vendor?.vendorCode}`,
    supplierId: dbQpr.vendorId,
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
    updatedAt: dbQpr.updatedAt,
  };
};
