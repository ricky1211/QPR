import { apiRequest } from './apiClient';

export interface CreateNcrPayload {
  code: string;
  date?: string;
  vendorId: string;
  vendorCode?: string;
  vendorName?: string;
  location?: string[];
  problemType?: string[];
  description?: string;
  disposition?: string[];
  isRequiredCustomerApproval?: boolean;
  customerApproval?: string;
  docsToRevise?: string[];
  images?: string[]; // relative paths
  details?: any;
  partsDetail?: Array<{
    partNumber: string;
    partName: string;
    qtyNG: number;
    ngType: string;
  }>;
  inspectorIds?: string[];
}

export const ncrService = {
  getAll: () => apiRequest('/ncrs'),
  getById: (id: string) => apiRequest(`/ncrs/${id}`),
  create: (data: CreateNcrPayload) => apiRequest('/ncrs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<CreateNcrPayload>) => apiRequest(`/ncrs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateApprovalProgress: (id: string, data: { checksumApprovalSectionHead?: string; checksumApprovalDeptHead?: string }) => 
    apiRequest(`/ncrs/${id}/approval-progress`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadImage: (file: File): Promise<{ relativePath: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/ncrs/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

export const mapNcrFromDb = (dbNcr: any) => {
  let status = "WAITING_APPROVAL";
  let requiredRole = "Section Head";
  
  const progress = dbNcr.ncrApprovalProgress;
  if (progress) {
    if (progress.checksumApprovalDeptHead) {
      status = "APPROVED";
      requiredRole = "Closed";
    } else if (progress.checksumApprovalSectionHead) {
      status = "WAITING_APPROVAL";
      requiredRole = "Dept Head";
    }
  }

  const partsDetail = dbNcr.details?.partsDetail || [];
  const isAllParts = dbNcr.details?.isAllParts || false;
  
  const qty = partsDetail.reduce((sum: number, item: any) => sum + (item.qtyNG || 0), 0) || 1;
  const reject = partsDetail.map((p: any) => p.ngType).join(", ") || "-";

  return {
    id: dbNcr.id,
    ncrNumber: dbNcr.code,
    date: dbNcr.date ? dbNcr.date.split("T")[0] : new Date().toISOString().split("T")[0],
    partNumber: dbNcr.part?.partNumber || "-",
    partName: dbNcr.part?.partDesc || "-",
    supplierName: dbNcr.vendor?.vendorName || "Unknown Vendor",
    qty: qty,
    reject: reject,
    locationFound: Array.isArray(dbNcr.location) ? dbNcr.location.join(", ") : (dbNcr.location || "-"),
    problemType: Array.isArray(dbNcr.problemType) ? dbNcr.problemType.join(", ") : (dbNcr.problemType || "-"),
    defectType: dbNcr.description || "-",
    disposition: Array.isArray(dbNcr.disposition) ? dbNcr.disposition.join(", ") : (dbNcr.disposition || "-"),
    customerApproval: dbNcr.customerApproval || "-",
    docsToRevise: Array.isArray(dbNcr.docsToRevise) ? dbNcr.docsToRevise.join(", ") : (dbNcr.docsToRevise || "-"),
    images: Array.isArray(dbNcr.images) ? dbNcr.images : [],
    status: status,
    requiredRole: requiredRole,
    partsDetail: partsDetail,
    isAllParts: isAllParts,
    foundBy: dbNcr.inspectors && Array.isArray(dbNcr.inspectors) && dbNcr.inspectors.length > 0
      ? dbNcr.inspectors.map((ins: any) => ins.name).join(", ")
      : (dbNcr.foundBy || "-"),
  };
};

