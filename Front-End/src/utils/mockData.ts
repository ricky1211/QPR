// Mock data for QPR Portal Dashboard
export const mockSuppliers = [
  { id: 3, name: "SHIJIAZHUANG RUICHENG TRADE CO., LTD", email: "ruicheng@trade.com", code: "SUP003", phone: "+86-311-8588241", address: "Shijiazhuang, Hebei, China" }
];

export const mockParts = [
  {
    id: 6,
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    supplierId: 3,
    supplierName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    allowanceRatio: 1.0, // 1.0%
    status: "WAITING QPR CREATION",
    hasNcrActive: false
  }
];

export const mockDeliveries = {
  // Key format: YYYY-MM
  "2026-06": [
  ],
  "2026-05": [
  ]
};

export const mockNotifications = [
  {
    id: 1,
    message: "Batas waktu pembuatan QPR bulan Mei 2026 terlewati (> 10 hari). Transaksi tertunda karena masih ada 1 NCR yang belum CLOSED.",
    time: "3 jam yang lalu",
    type: "warning",
    unread: true
  }
];

export const mockAllowanceHistory = [
];

export const mockPendingNcrs = [
  {
    id: 4,
    ncrNumber: "NCR/2026/06/009",
    date: "2026-06-04",
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    supplierName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    qty: 1000,
    reject: 25,
    defectType: "Rust",
    disposition: "REWORK",
    status: "DRAFT",
    requiredRole: "Foreman"
  }
];

export const mockPendingQprs = [
  {
    id: 3,
    qprNumber: "QPR/2026/05/RUA_BIASA",
    date: "2026-06-12",
    supplierName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    period: "Mei 2026",
    totalItems: 1200,
    rejectItems: 40,
    allowanceRatio: "0.6%",
    claimAmount: "Rp 32.000.000",
    status: "WAITING_APPROVAL",
    requiredRole: "Purchasing"
  },
  {
    id: 4,
    qprNumber: "QPR/2026/05/MAKMUR_JAYA",
    date: "2026-06-15",
    supplierName: "PT MENARA TERUS MAKMUR",
    period: "Mei 2026",
    totalItems: 2000,
    rejectItems: 50,
    allowanceRatio: "0.4%",
    claimAmount: "Rp 45.000.000",
    status: "WAITING_APPROVAL",
    requiredRole: "Div Head"
  }
];
