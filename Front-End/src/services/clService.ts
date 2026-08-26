import { apiRequest } from './apiClient';
import { getPeriodFromDate } from './qprService';

export interface CreateClPayload {
  clNumber: string;
  dateSent?: string;
  qprId: string;
  vendorId: string;
  amount: number;
  status?: string;
  closedPaid?: boolean;
  items?: any[];
  qprNumber?: string;
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
    status: dbCl.closedPaid ? "CLOSED_PAID" : (isApproved ? "FULLY_APPROVED" : dbCl.status === 'REJECTED' ? "REJECTED" : "PENDING"),
    requiredRole: isApproved ? "Closed" : "Dept Accounting",
    memoStatus: "SENT_AOP",
    reminderSentCount: 1,
    purchasingSentCl: !!dbCl.purchasingSentCl,
    purchasingSentDate: dbCl.purchasingSentDate || null,
    sentToVendor: !!dbCl.purchasingSentCl,
    vendorApproved: !!dbCl.vendorApproved,
    vendorApprovedDate: dbCl.vendorApprovedDate || null,
    vendorApprovedDocName: dbCl.signedClFileName || null,
    readyForSSC: !!dbCl.vendorApproved,
    clApprovalProgress: { 
      sectAccounting: isApproved, 
      deptAccounting: isApproved 
    },
    closedPaid: !!dbCl.closedPaid,
    debitNoteCount: 0,
    reminderCount: 1,
    items: (dbCl.qpr?.qprParts || []).map((qp: any) => {
      const qtyClaim = qp.qtyClaim !== undefined && qp.qtyClaim !== null ? qp.qtyClaim : (qp.qtyNg ? Math.max(0, qp.qtyNg - (qp.stdAllowance || 0)) : 0);
      const unitPrice = qp.unitPrice || 250000;
      return {
        id: qp.id,
        partId: qp.partId,
        partName: qp.part?.partDesc || qp.part?.partNumber || "Part Material NG",
        partNumber: qp.part?.partNumber || "",
        totalQty: qp.totalQty || 0,
        qtyNg: qp.qtyNg || 0,
        qtyNG: qp.qtyNg || 0,
        stdAllowance: qp.stdAllowance || 0,
        qtyClaim: qtyClaim,
        billableQty: qtyClaim,
        unitPrice: unitPrice,
        amount: qtyClaim * unitPrice,
        subtotal: qtyClaim * unitPrice,
      };
    }),
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
    },
    updatedAt: dbCl.updatedAt,
  };
};
