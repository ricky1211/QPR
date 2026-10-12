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
  purchasingSentCl?: boolean;
  purchasingSentDate?: string;
  vendorApproved?: boolean;
  vendorApprovedDate?: string;
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
  sendEmail: (data: {
    clId?: string;
    clIds?: string[];
    to: string;
    subject: string;
    body: string;
    vendorName?: string;
    sendDate?: string;
    dueDate?: string;
    attachments?: Array<{ filename: string; content?: string; path?: string; contentType?: string }>;
  }) => apiRequest('/qprs/confirmation-letters/send-email', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const mapClFromDb = (dbCl: any) => {
  const isApproved = dbCl.status === 'APPROVED';
  const qprParts = dbCl.qpr?.qprParts || [];
  const firstPart = qprParts[0]?.part?.partDesc || qprParts[0]?.part?.partNumber || "ALL TYPE PART FINISH";
  const numAmount = typeof dbCl.amount === 'number' ? dbCl.amount : parseFloat(String(dbCl.amount || '0').replace(/[^0-9]/g, '')) || 0;
  
  const isSent = !!dbCl.purchasingSentCl || !!dbCl.purchasingSentDate || !!dbCl.dateSent;
  const sentDate = dbCl.purchasingSentDate || dbCl.dateSent;
  let isDue10Days = false;
  if (isSent && sentDate) {
    const start = new Date(sentDate);
    const now = new Date();
    if (!isNaN(start.getTime())) {
      let count = 0;
      const cur = new Date(start);
      cur.setHours(0, 0, 0, 0);
      const finish = new Date(now);
      finish.setHours(0, 0, 0, 0);
      while (cur < finish) {
        cur.setDate(cur.getDate() + 1);
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
      }
      if (count >= 10) isDue10Days = true;
    }
  }

  return {
    id: dbCl.id,
    clNumber: dbCl.clNumber,
    qprNumber: dbCl.qpr?.qprNumber || "",
    supplierName: dbCl.vendor?.vendorName || `Vendor ${dbCl.vendor?.vendorCode}`,
    partName: firstPart,
    dateSent: dbCl.dateSent ? dbCl.dateSent.split("T")[0] : new Date().toISOString().split("T")[0],
    amount: numAmount > 0 ? `Rp ${numAmount.toLocaleString("id-ID")}` : (dbCl.amount ? `Rp ${dbCl.amount}` : "-"),
    rawAmount: numAmount,
    totalClaimAmount: numAmount,
    claimAmount: numAmount,
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
    readyForSSC: !!dbCl.vendorApproved || isDue10Days,
    isDue10Days,
    clApprovalProgress: { 
      sectAccounting: isApproved, 
      deptAccounting: isApproved 
    },
    closedPaid: !!dbCl.closedPaid,
    debitNoteCount: 0,
    reminderCount: 1,
    items: (dbCl.qpr?.qprParts || []).map((qp: any) => {
      const qtyClaim = qp.qtyClaim !== undefined && qp.qtyClaim !== null ? qp.qtyClaim : (qp.qtyNg ? Math.max(0, qp.qtyNg - (qp.stdAllowance || 0)) : 0);
      const unitPrice = qp.unitPrice || 85000;
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
    createdAt: dbCl.createdAt || dbCl.dateSent,
    updatedAt: dbCl.updatedAt,
  };
};
