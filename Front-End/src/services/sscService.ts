import { apiRequest } from './apiClient';

export const sscService = {
  getAllBillings: () => apiRequest('/ssc/billings'),
  getBillingById: (id: string) => apiRequest(`/ssc/billings/${id}`),
  createBilling: (data: any) => apiRequest('/ssc/billings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateBilling: (id: string, data: any) => apiRequest(`/ssc/billings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  getAllPayments: () => apiRequest('/ssc/payments'),
  getPaymentById: (id: string) => apiRequest(`/ssc/payments/${id}`),
  createPayment: (data: any) => apiRequest('/ssc/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePayment: (id: string, data: any) => apiRequest(`/ssc/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

export const mapBillingFromDb = (dbBilling: any) => {
  return {
    id: dbBilling.id,
    clId: dbBilling.clId,
    clNumber: dbBilling.cl?.clNumber || "",
    supplierName: dbBilling.cl?.vendor?.vendorName || "",
    dateSent: dbBilling.billingDate ? dbBilling.billingDate.split("T")[0] : new Date().toISOString().split("T")[0],
    amount: `Rp ${dbBilling.totalAmount.toLocaleString("id-ID")}`,
    status: dbBilling.status === 'PAID' ? "CLOSED_PAID" : "WAITING_PAYMENT",
    closedPaid: dbBilling.status === 'PAID',
    
    // Memo fields
    memoCompany: dbBilling.memoCompany,
    memoBusinessArea: dbBilling.memoBusinessArea,
    memoRequestDate: dbBilling.memoRequestDate,
    memoBillingType: dbBilling.memoBillingType,
    memoPeriod: dbBilling.memoPeriod,
    memoTitle: dbBilling.memoTitle,
    memoRequestTo: dbBilling.memoRequestTo,
    memoDescription: dbBilling.memoDescription,
    memoCustomerType: dbBilling.memoCustomerType,
    memoNpwp: dbBilling.memoNpwp,
    memoSupportingDoc: dbBilling.memoSupportingDoc,
    memoBillingAddressedTo: dbBilling.memoBillingAddressedTo,
    memoCustomerName: dbBilling.memoCustomerName,
    memoCurrency: dbBilling.memoCurrency,
    memoAmount: dbBilling.memoAmount,
    memoSays: dbBilling.memoSays,
    
    acctCustomerCode: dbBilling.acctCustomerCode,
    acctCustomerType: dbBilling.acctCustomerType,
    acctTradingPartner: dbBilling.acctTradingPartner,
    acctExchangeRate: dbBilling.acctExchangeRate,
    acctJournal: dbBilling.acctJournal,
    glRows: typeof dbBilling.glRows === 'string' ? JSON.parse(dbBilling.glRows) : dbBilling.glRows || [],
    
    sigPrepared: dbBilling.sigPrepared,
    sigPreparedRole: dbBilling.sigPreparedRole,
    sigApproved1: dbBilling.sigApproved1,
    sigApproved1Role: dbBilling.sigApproved1Role,
    sigApproved2: dbBilling.sigApproved2,
    sigApproved2Role: dbBilling.sigApproved2Role,
    sigEntry: dbBilling.sigEntry,
    sigEntryRole: dbBilling.sigEntryRole,
    sigChecked: dbBilling.sigChecked,
    sigCheckedRole: dbBilling.sigCheckedRole
  };
};
