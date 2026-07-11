// Mock data for QPR Portal Dashboard
export const mockSuppliers = [
  { id: 1, name: "PT JAYADI", email: "jayadi@gmail.com", code: "SUP001", phone: "08123456789", address: "Jl. Industri No. 12, Cikarang" },
  { id: 2, name: "PT IKAN BAKAR", email: "bakar@gmail.com", code: "SUP002", phone: "021-9876543", address: "Kawasan Jababeka Blok A" },
  { id: 3, name: "SHIJIAZHUANG RUICHENG TRADE CO., LTD", email: "ruicheng@trade.com", code: "SUP003", phone: "+86-311-8588241", address: "Shijiazhuang, Hebei, China" }
];

export const mockParts = [
  {
    id: 1,
    partNumber: "MB-001",
    partName: "Motherboard X1",
    supplierId: 1,
    supplierName: "PT JAYADI",
    allowanceRatio: 0.5, // 0.5%
    status: "WAITING QPR CREATION", // All NCRs closed, waiting QPR
    hasNcrActive: false
  },
  {
    id: 6,
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    supplierId: 3,
    supplierName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    allowanceRatio: 1.0, // 1.0%
    status: "WAITING QPR CREATION",
    hasNcrActive: false
  },
  {
    id: 2,
    partNumber: "GL-001",
    partName: "Gelas Kaca",
    supplierId: 1,
    supplierName: "PT JAYADI",
    allowanceRatio: 0.5, // 0.5%
    status: "UNDER ALLOWANCE", // Reject below 0.5%
    hasNcrActive: false
  },
  {
    id: 3,
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    supplierId: 2,
    supplierName: "PT IKAN BAKAR",
    allowanceRatio: 0.8, // 0.8%
    status: "WAITING NCRs", // Defect above limit, NCR not yet approved
    hasNcrActive: true
  },
  {
    id: 4,
    partNumber: "CP-003",
    partName: "CPU Fan Cooler",
    supplierId: 2,
    supplierName: "PT IKAN BAKAR",
    allowanceRatio: null, // Error state: NO ALLOWANCE configured
    status: "WAITING QPR CREATION",
    hasNcrActive: false
  },
  {
    id: 5,
    partNumber: "KB-004",
    partName: "Keyboard Mechanical",
    supplierId: 1,
    supplierName: "PT JAYADI",
    allowanceRatio: 0.5,
    status: "OVERDUE 10 HARI", // Blinking red warning: month ended and no QPR made
    hasNcrActive: false
  }
];

export const mockDeliveries = {
  // Key format: YYYY-MM
  "2026-06": [
    {
      id: 101,
      date: "2026-06-02",
      partNumber: "MB-001",
      partName: "Motherboard X1",
      supplierName: "PT JAYADI",
      qty: 200,
      reject: 0,
      hasReject: false,
      ncrNumber: null,
      ncrStatus: null
    },
    {
      id: 102,
      date: "2026-06-05",
      partNumber: "MB-001",
      partName: "Motherboard X1",
      supplierName: "PT JAYADI",
      qty: 180,
      reject: 4, // 2.2% (> 0.5%)
      hasReject: true,
      ncrNumber: "NCR/2026/06/012",
      ncrStatus: "PENDING_APPROVAL",
      defectType: "Dent / Scratch",
      disposition: "RETURN TO VENDOR"
    },
    {
      id: 103,
      date: "2026-06-09",
      partNumber: "GL-001",
      partName: "Gelas Kaca",
      supplierName: "PT JAYADI",
      qty: 220,
      reject: 1, // 0.45% (< 0.5%)
      hasReject: true,
      ncrNumber: null,
      ncrStatus: null,
      defectType: "Minor Bubble",
      disposition: "ACCEPT AS IS"
    },
    {
      id: 104,
      date: "2026-06-12",
      partNumber: "MB-001",
      partName: "Motherboard X1",
      supplierName: "PT JAYADI",
      qty: 300,
      reject: 9, // 3.0% (> 0.5%)
      hasReject: true,
      ncrNumber: "NCR/2026/06/015",
      ncrStatus: "APPROVED",
      defectType: "No Power / SMD Damage",
      disposition: "RETURN TO VENDOR"
    },
    {
      id: 105,
      date: "2026-06-18",
      partNumber: "HD-002",
      partName: "Harddisk 1TB",
      supplierName: "PT IKAN BAKAR",
      qty: 150,
      reject: 0,
      hasReject: false,
      ncrNumber: null,
      ncrStatus: null
    },
    {
      id: 106,
      date: "2026-06-22",
      partNumber: "HD-002",
      partName: "Harddisk 1TB",
      supplierName: "PT IKAN BAKAR",
      qty: 240,
      reject: 8, // 3.3% (> 0.8%)
      hasReject: true,
      ncrNumber: "NCR/2026/06/020",
      ncrStatus: "PENDING_APPROVAL",
      defectType: "Bad Sector / Noise",
      disposition: "REWORK"
    },
    {
      id: 107,
      date: "2026-06-26",
      partNumber: "GL-001",
      partName: "Gelas Kaca",
      supplierName: "PT JAYADI",
      qty: 190,
      reject: 0,
      hasReject: false,
      ncrNumber: null,
      ncrStatus: null
    }
  ],
  "2026-05": [
    {
      id: 201,
      date: "2026-05-04",
      partNumber: "KB-004",
      partName: "Keyboard Mechanical",
      supplierName: "PT JAYADI",
      qty: 500,
      reject: 15, // 3% (> 0.5%)
      hasReject: true,
      ncrNumber: "NCR/2026/05/008",
      ncrStatus: "PENDING_APPROVAL",
      defectType: "Double Keypress",
      disposition: "RETURN TO VENDOR"
    }
  ]
};

export const mockNotifications = [
  {
    id: 1,
    message: "Batas waktu pembuatan QPR bulan Mei 2026 terlewati (> 10 hari). Transaksi tertunda karena masih ada 1 NCR yang belum CLOSED.",
    time: "3 jam yang lalu",
    type: "warning",
    unread: true
  },
  {
    id: 2,
    message: "NCR baru berhasil diterbitkan: NCR/2026/06/020 untuk PT IKAN BAKAR (Harddisk 1TB).",
    time: "1 hari yang lalu",
    type: "info",
    unread: true
  },
  {
    id: 3,
    message: "PICA Response telah diunggah oleh PT JAYADI untuk NCR/2026/06/015 dan menunggu verifikasi Anda.",
    time: "2 hari yang lalu",
    type: "success",
    unread: false
  }
];

export const mockAllowanceHistory = [
  { id: 1, partNumber: "MB-001", allowance: "0.5%", updatedBy: "System Admin", updatedAt: "2026-03-12" },
  { id: 2, partNumber: "GL-001", allowance: "0.5%", updatedBy: "System Admin", updatedAt: "2026-03-12" },
  { id: 3, partNumber: "HD-002", allowance: "0.8%", updatedBy: "System Admin", updatedAt: "2026-04-18" }
];

export const mockPendingNcrs = [
  {
    id: 1,
    ncrNumber: "NCR/2026/06/012",
    date: "2026-06-05",
    partNumber: "MB-001",
    partName: "Motherboard X1",
    supplierName: "PT JAYADI",
    qty: 180,
    reject: 4,
    defectType: "Dent / Scratch",
    disposition: "RETURN TO VENDOR",
    status: "WAITING_APPROVAL",
    requiredRole: "Section Head"
  },
  {
    id: 2,
    ncrNumber: "NCR/2026/06/020",
    date: "2026-06-22",
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    supplierName: "PT IKAN BAKAR",
    qty: 240,
    reject: 8,
    defectType: "Bad Sector / Noise",
    disposition: "REWORK",
    status: "WAITING_APPROVAL",
    requiredRole: "Dept Head"
  }
];

export const mockPendingQprs = [
  {
    id: 1,
    qprNumber: "QPR/2026/05/JAYADI",
    date: "2026-06-10",
    supplierName: "PT JAYADI",
    period: "Mei 2026",
    totalItems: 500,
    rejectItems: 15,
    allowanceRatio: "0.5%",
    claimAmount: "Rp 12.500.000",
    status: "WAITING_APPROVAL",
    requiredRole: "Section Head"
  },
  {
    id: 2,
    qprNumber: "QPR/2026/05/IKAN_BAKAR",
    date: "2026-06-10",
    supplierName: "PT IKAN BAKAR",
    period: "Mei 2026",
    totalItems: 800,
    rejectItems: 25,
    allowanceRatio: "0.8%",
    claimAmount: "Rp 24.000.000",
    status: "WAITING_APPROVAL",
    requiredRole: "Dept Head"
  },
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
