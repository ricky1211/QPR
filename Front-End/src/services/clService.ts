import { apiRequest } from './apiClient';
import { getPeriodFromDate } from './qprService';

export interface CreateClPayload {
  clNumber: string;
  dateSent?: string;
  qprId: string;
  vendorId: string;
  amount: number;
  status?: string;
}

export const clService = {
  getAll: () => apiRequest('/qprs/confirmation-letters/all'),
  create: (data: CreateClPayload) => apiRequest('/qprs/confirmation-letters', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<CreateClPayload>) => apiRequest(`/qprs/confirmation-letters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

export const mapClFromDb = (dbCl: any) => {
  const isApproved = dbCl.status === 'APPROVED';
  
  return {
    id: dbCl.id,
    clNumber: dbCl.clNumber,
    qprNumber: dbCl.qpr?.qprNumber || "",
    supplierName: dbCl.vendor?.vendorName || `Vendor ${dbCl.vendor?.vendorCode}`,
    dateSent: dbCl.dateSent ? dbCl.dateSent.split("T")[0] : new Date().toISOString().split("T")[0],
    amount: dbCl.amount ? `Rp ${dbCl.amount.toLocaleString("id-ID")}` : "-",
    status: isApproved ? "FULLY_APPROVED" : dbCl.status === 'REJECTED' ? "REJECTED" : "PENDING",
    requiredRole: isApproved ? "Closed" : "Dept Accounting",
    memoStatus: "SENT_AOP",
    reminderSentCount: 1,
    sentToVendor: isApproved,
    vendorApproved: isApproved,
    vendorApprovedDocName: null,
    readyForSSC: isApproved,
    clApprovalProgress: { 
      sectAccounting: isApproved, 
      deptAccounting: isApproved 
    },
    closedPaid: dbCl.status === 'CLOSED_PAID',
    debitNoteCount: 0,
    reminderCount: 1,
    qprSourceData: {
      parts: (dbCl.qpr?.qprParts || []).map((qp: any) => ({
        partName: qp.part?.partDesc || qp.part?.partNumber || "ALL TYPE PART FINISH",
        partNumber: qp.part?.partNumber || "",
        totalQty: qp.totalQty || 0,
        qtyNG: qp.qtyNg || 0,
        stdAllowance: qp.stdAllowance || 0,
        qtyClaim: qp.qtyClaim || 0
      })),
      problem: dbCl.qpr?.problem || "",
      claimType: dbCl.qpr?.claimType ? dbCl.qpr.claimType.split(",") : [],
      refNcrNumber: dbCl.qpr?.refNcrNumber || "",
      pdfFileName: dbCl.qpr?.pdfFileName || null,
      pdfFileBase64: dbCl.qpr?.pdfFileBase64 || null,
      period: getPeriodFromDate(dbCl.qpr?.date),
      date: dbCl.qpr?.date ? dbCl.qpr.date.split("T")[0] : "",
      totalItems: dbCl.qpr?.totalQty || 0,
      rejectItems: dbCl.qpr?.totalQtyNg || 0,
      allowanceRatio: `${(((dbCl.qpr?.totalStdAllowance || 0) / (dbCl.qpr?.totalQty || 1)) * 100).toFixed(1)}%`,
      remarks: ""
    }
  };
};
