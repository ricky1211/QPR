"use client";

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  X, 
  Eye, 
  FileCheck, 
  RefreshCw, 
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
  AlertCircle
} from "lucide-react";

import NcrPrintPreview from "./NcrPrintPreview";
import QprPrintPreview from "./QprPrintPreview";

// Helper to map requiredRole â†’ human-readable stage label
const stageLabel = (type: string, requiredRole?: string, status?: string): string => {
  if (status === "APPROVED") return "Disetujui";
  if (type === "NCR") {
    if (requiredRole === "Foreman") return "Menunggu QC Staff";
    if (requiredRole === "Section Head") return "Menunggu SPV QA";
    if (requiredRole === "Dept Head") return "Menunggu MNG QA";
    return "Disetujui";
  }
  // QPR
  if (requiredRole === "Section Head") return "Menunggu Section Head";
  if (requiredRole === "Dept Head") return "Menunggu Dept Head";
  if (requiredRole === "Div Head") return "Menunggu Div Head";
  if (requiredRole === "Purchasing") return "Acknowledge Purchasing";
  if (requiredRole === "Accounting") return "Menunggu Accounting";
  return "Disetujui";
};

// All NCR + QPR documents (approved + in-progress)
const allDocuments = [
  // --- IN-PROGRESS NCRs ---
  {
    id: "ncr-pending-1",
    type: "NCR",
    docNumber: "NCR/2026/06/031",
    date: "2026-07-10",
    vendorName: "PT JAYADI",
    partNumber: "MB-001",
    partName: "Motherboard X1",
    period: "-",
    qty: 180,
    reject: 4,
    allowanceRatio: "0.5%",
    claimAmount: "-",
    defectType: "Dent / Scratch",
    disposition: "RETURN TO VENDOR",
    status: "WAITING_APPROVAL",
    requiredRole: "Section Head",
    approvedBy: []
  },
  {
    id: "ncr-pending-2",
    type: "NCR",
    docNumber: "NCR/2026/06/032",
    date: "2026-07-09",
    vendorName: "PT IKAN BAKAR",
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    period: "-",
    qty: 240,
    reject: 8,
    allowanceRatio: "0.8%",
    claimAmount: "-",
    defectType: "Bad Sector / Noise",
    disposition: "REWORK",
    status: "WAITING_APPROVAL",
    requiredRole: "Dept Head",
    approvedBy: ["QC Staff"]
  },
  // --- IN-PROGRESS QPRs ---
  {
    id: "qpr-pending-1",
    type: "QPR",
    docNumber: "QPR/2026/05/JAYADI",
    date: "2026-07-10",
    vendorName: "PT JAYADI",
    partNumber: "MB-001",
    partName: "Motherboard X1",
    period: "Mei 2026",
    qty: 500,
    reject: 15,
    allowanceRatio: "0.5%",
    claimAmount: "Rp 12.500.000",
    defectType: "-",
    disposition: "-",
    status: "WAITING_APPROVAL",
    requiredRole: "Section Head",
    approvedBy: []
  },
  {
    id: "qpr-pending-2",
    type: "QPR",
    docNumber: "QPR/2026/05/IKAN_BAKAR",
    date: "2026-07-09",
    vendorName: "PT IKAN BAKAR",
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    period: "Mei 2026",
    qty: 800,
    reject: 25,
    allowanceRatio: "0.8%",
    claimAmount: "Rp 24.000.000",
    defectType: "-",
    disposition: "-",
    status: "WAITING_APPROVAL",
    requiredRole: "Dept Head",
    approvedBy: ["Section Head"]
  },
  {
    id: "qpr-pending-3",
    type: "QPR",
    docNumber: "QPR/2026/05/RUICHENG",
    date: "2026-07-08",
    vendorName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    period: "Mei 2026",
    qty: 1200,
    reject: 40,
    allowanceRatio: "0.6%",
    claimAmount: "Rp 32.000.000",
    defectType: "-",
    disposition: "-",
    status: "WAITING_APPROVAL",
    requiredRole: "Purchasing",
    approvedBy: ["Section Head", "Dept Head"]
  },
  // --- APPROVED documents (June 2026) ---
  {
    id: "qpr-30",
    type: "QPR",
    docNumber: "QPR/2026/06/030",
    date: "2026-06-30",
    vendorName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    period: "Juni 2026",
    qty: 1150,
    reject: 23,
    allowanceRatio: "1.0%",
    claimAmount: "Rp 31.000.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["Quality Dept", "Dept Head", "Purchasing", "Accounting"]
  },
  {
    id: "ncr-29",
    type: "NCR",
    docNumber: "NCR/2026/06/029",
    date: "2026-06-29",
    vendorName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    period: "-",
    qty: 950,
    reject: 14,
    allowanceRatio: "1.0%",
    claimAmount: "-",
    defectType: "Coating Peel",
    disposition: "ACCEPT AS IS",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["QC Staff", "SPV QA", "MNG QA"]
  },
  {
    id: "qpr-28",
    type: "QPR",
    docNumber: "QPR/2026/06/028",
    date: "2026-06-28",
    vendorName: "PT JAYADI",
    partNumber: "KB-004",
    partName: "Keyboard Mechanical",
    period: "Juni 2026",
    qty: 620,
    reject: 12,
    allowanceRatio: "0.5%",
    claimAmount: "Rp 24.800.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["Quality Dept", "Dept Head", "Purchasing", "Accounting"]
  },
  {
    id: "ncr-27",
    type: "NCR",
    docNumber: "NCR/2026/06/027",
    date: "2026-06-27",
    vendorName: "PT IKAN BAKAR",
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    period: "-",
    qty: 310,
    reject: 7,
    allowanceRatio: "0.8%",
    claimAmount: "-",
    defectType: "Firmware Error",
    disposition: "REWORK",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["QC Staff", "SPV QA", "MNG QA"]
  },
  {
    id: "qpr-26",
    type: "QPR",
    docNumber: "QPR/2026/06/026",
    date: "2026-06-26",
    vendorName: "PT IKAN BAKAR",
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    period: "Juni 2026",
    qty: 500,
    reject: 10,
    allowanceRatio: "0.8%",
    claimAmount: "Rp 20.000.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["Quality Dept", "Dept Head", "Purchasing", "Accounting"]
  },
  {
    id: "ncr-25",
    type: "NCR",
    docNumber: "NCR/2026/06/025",
    date: "2026-06-25",
    vendorName: "PT JAYADI",
    partNumber: "KB-004",
    partName: "Keyboard Mechanical",
    period: "-",
    qty: 220,
    reject: 8,
    allowanceRatio: "0.5%",
    claimAmount: "-",
    defectType: "LED Broken",
    disposition: "REWORK",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["QC Staff", "SPV QA", "MNG QA"]
  },
  {
    id: "qpr-24",
    type: "QPR",
    docNumber: "QPR/2026/06/024",
    date: "2026-06-24",
    vendorName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    period: "Juni 2026",
    qty: 1050,
    reject: 21,
    allowanceRatio: "1.0%",
    claimAmount: "Rp 29.400.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["Quality Dept", "Dept Head", "Purchasing", "Accounting"]
  },
  {
    id: "ncr-23",
    type: "NCR",
    docNumber: "NCR/2026/06/023",
    date: "2026-06-23",
    vendorName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    period: "-",
    qty: 900,
    reject: 16,
    allowanceRatio: "1.0%",
    claimAmount: "-",
    defectType: "Thread Damage",
    disposition: "RETURN TO VENDOR",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["QC Staff", "SPV QA", "MNG QA"]
  },
  {
    id: "qpr-22",
    type: "QPR",
    docNumber: "QPR/2026/06/022",
    date: "2026-06-22",
    vendorName: "PT JAYADI",
    partNumber: "MB-001",
    partName: "Motherboard X1",
    period: "Juni 2026",
    qty: 550,
    reject: 11,
    allowanceRatio: "0.5%",
    claimAmount: "Rp 18.500.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["Quality Dept", "Dept Head", "Purchasing", "Accounting"]
  },
  {
    id: "ncr-21",
    type: "NCR",
    docNumber: "NCR/2026/06/021",
    date: "2026-06-21",
    vendorName: "PT IKAN BAKAR",
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    period: "-",
    qty: 280,
    reject: 9,
    allowanceRatio: "0.8%",
    claimAmount: "-",
    defectType: "Connector Damaged",
    disposition: "REWORK",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["QC Staff", "SPV QA", "MNG QA"]
  },
  {
    id: "qpr-20",
    type: "QPR",
    docNumber: "QPR/2026/06/020",
    date: "2026-06-20",
    vendorName: "PT IKAN BAKAR",
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    period: "Juni 2026",
    qty: 420,
    reject: 8,
    allowanceRatio: "0.8%",
    claimAmount: "Rp 16.800.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["Quality Dept", "Dept Head", "Purchasing", "Accounting"]
  },
  {
    id: "ncr-19",
    type: "NCR",
    docNumber: "NCR/2026/06/019",
    date: "2026-06-19",
    vendorName: "PT JAYADI",
    partNumber: "GL-001",
    partName: "Gelas Kaca",
    period: "-",
    qty: 320,
    reject: 5,
    allowanceRatio: "0.5%",
    claimAmount: "-",
    defectType: "Scratch",
    disposition: "ACCEPT AS IS",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["QC Staff", "SPV QA", "MNG QA"]
  },
  {
    id: "qpr-18",
    type: "QPR",
    docNumber: "QPR/2026/06/018",
    date: "2026-06-18",
    vendorName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    period: "Juni 2026",
    qty: 1300,
    reject: 25,
    allowanceRatio: "1.0%",
    claimAmount: "Rp 32.500.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["Quality Dept", "Dept Head", "Purchasing", "Accounting"]
  },
  {
    id: "ncr-17",
    type: "NCR",
    docNumber: "NCR/2026/06/017",
    date: "2026-06-17",
    vendorName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    period: "-",
    qty: 1100,
    reject: 22,
    allowanceRatio: "1.0%",
    claimAmount: "-",
    defectType: "Crack",
    disposition: "SCRAP",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["QC Staff", "SPV QA", "MNG QA"]
  },
  {
    id: "qpr-16",
    type: "QPR",
    docNumber: "QPR/2026/06/016",
    date: "2026-06-16",
    vendorName: "PT JAYADI",
    partNumber: "MB-001",
    partName: "Motherboard X1",
    period: "Juni 2026",
    qty: 480,
    reject: 10,
    allowanceRatio: "0.5%",
    claimAmount: "Rp 16.000.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["Quality Dept", "Dept Head", "Purchasing", "Accounting"]
  },
  {
    id: "ncr-15",
    type: "NCR",
    docNumber: "NCR/2026/06/015",
    date: "2026-06-15",
    vendorName: "PT IKAN BAKAR",
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    period: "-",
    qty: 210,
    reject: 6,
    allowanceRatio: "0.8%",
    claimAmount: "-",
    defectType: "No Power",
    disposition: "RETURN TO VENDOR",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["QC Staff", "SPV QA", "MNG QA"]
  },
  {
    id: "ncr-01",
    type: "NCR",
    docNumber: "NCR/2026/06/001",
    date: "2026-06-01",
    vendorName: "PT JAYADI",
    partNumber: "MB-001",
    partName: "Motherboard X1",
    period: "-",
    qty: 200,
    reject: 4,
    allowanceRatio: "0.5%",
    claimAmount: "-",
    defectType: "Dent / Scratch",
    disposition: "RETURN TO VENDOR",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["QC Staff", "SPV QA", "MNG QA"]
  }
];

export default function ListQprDashboard() {
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ncr"); // 'ncr' or 'qpr'
  const [filterVendor, setFilterVendor] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // '' | 'APPROVED' | 'WAITING_APPROVAL'

  // Details modal state
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  // Unique vendors for the dropdown
  const vendors = Array.from(new Set(allDocuments.map(doc => doc.vendorName)));

  // Filtering Logic
  const filteredData = allDocuments.filter(doc => {
    const matchesSearch = searchQuery
      ? doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesType = doc.type.toLowerCase() === activeTab.toLowerCase();
    const matchesVendor = filterVendor ? doc.vendorName === filterVendor : true;
    const matchesDate = filterDate ? doc.date === filterDate : true;
    const matchesStatus = filterStatus ? doc.status === filterStatus : true;

    return matchesSearch && matchesType && matchesVendor && matchesDate && matchesStatus;
  });

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterVendor("");
    setFilterDate("");
    setFilterStatus("");
  };

  // KPI Calculations (all docs, ignoring type-tab, respecting search/vendor/date)
  const baseFiltered = allDocuments.filter(doc => {
    const matchesSearch = searchQuery
      ? doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesVendor = filterVendor ? doc.vendorName === filterVendor : true;
    const matchesDate = filterDate ? doc.date === filterDate : true;
    return matchesSearch && matchesVendor && matchesDate;
  });

  const totalCount = baseFiltered.length;
  const ncrCount = baseFiltered.filter(d => d.type === "NCR").length;
  const qprCount = baseFiltered.filter(d => d.type === "QPR").length;
  const pendingCount = baseFiltered.filter(d => d.status === "WAITING_APPROVAL").length;

  // Format date helper (e.g. 2026-06-01 to 01 Juni 2026)
  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header and description */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white border border-indigo-900 rounded-xl shadow-md gap-4">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/10 text-white rounded-lg"><FileCheck size={18} /></span>
            <h3 className="text-base font-black uppercase tracking-wider">Arsip Laporan NCR &amp; Klaim QPR</h3>
          </div>
          <p className="text-xs text-indigo-200 mt-1 font-semibold">
            Daftar seluruh dokumen NCR dan QPR yang telah dibuat — termasuk yang sedang proses approval maupun yang sudah disetujui.
          </p>
        </div>
        <button
          onClick={handleResetFilters}
          disabled={!searchQuery && !filterVendor && !filterDate && !filterStatus}
          className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer ${
            !searchQuery && !filterVendor && !filterDate && !filterStatus
              ? "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
              : "bg-white text-indigo-800 border-white hover:bg-indigo-50 active:scale-95"
          }`}
        >
          <RefreshCw size={12} className={searchQuery || filterVendor || filterDate || filterStatus ? "animate-spin-slow" : ""} />
          Reset Filter
        </button>
      </div>

      {/* KPI Counters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Arsip Dokumen</span>
            <h4 className="text-2xl font-black text-slate-800">{totalCount}</h4>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
              NCR & QPR
            </span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-650 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
            <Layers size={18} />
          </div>
        </div>

        {/* Total NCR */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Laporan NCR</span>
            <h4 className="text-2xl font-black text-slate-800">{ncrCount}</h4>
            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block">
              Kualitas / Kuantitas
            </span>
          </div>
          <div className="w-10 h-10 bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
            <AlertCircle size={18} />
          </div>
        </div>

        {/* Total QPR */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Klaim QPR</span>
            <h4 className="text-2xl font-black text-slate-800">{qprCount}</h4>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
              Semua Status
            </span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
            <FileText size={18} />
          </div>
        </div>

        {/* Proses Approval */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proses Approval</span>
            <h4 className="text-2xl font-black text-amber-600">{pendingCount}</h4>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
              Menunggu Tanda Tangan
            </span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
            <Clock size={18} />
          </div>
        </div>
      </div>

      {/* Advanced Filters Block */}
      <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-sm space-y-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block text-left">
          Filter Arsip Dokumen
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          {/* Search filter */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pencarian
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 pointer-events-none">
                <Search size={12} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="No Dokumen, part, dll..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-semibold bg-slate-50 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Vendor filter */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Vendor / Subcont
            </label>
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-semibold bg-slate-50"
            >
              <option value="">Semua Vendor</option>
              {vendors.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tanggal Kejadian
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-semibold bg-slate-50"
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-semibold bg-slate-50"
            >
              <option value="">Semua Status</option>
              <option value="WAITING_APPROVAL">Proses Approval</option>
              <option value="APPROVED">Disetujui</option>
            </select>
          </div>

        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab("ncr");
            setSelectedDoc(null);
          }}
          className={`flex-1 sm:flex-initial px-6 py-3 font-bold text-xs border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "ncr"
              ? "border-blue-600 text-blue-650 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-900 bg-slate-50/50"
          }`}
        >
          <AlertCircle size={14} className="text-orange-500" />
          ARSIP LAPORAN NCR
        </button>
        <button
          onClick={() => {
            setActiveTab("qpr");
            setSelectedDoc(null);
          }}
          className={`flex-1 sm:flex-initial px-6 py-3 font-bold text-xs border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "qpr"
              ? "border-blue-600 text-blue-650 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-900 bg-slate-50/50"
          }`}
        >
          <FileText size={14} className="text-blue-500" />
          ARSIP KLAIM QPR
        </button>
      </div>

      {/* Main Table List */}
      <div className="bg-white border border-slate-350 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-800 text-left uppercase tracking-wide">
            {activeTab === "ncr" ? "Daftar Semua Laporan NCR" : "Daftar Semua Klaim QPR"}
          </h4>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded shadow-sm">
            Ditemukan: {filteredData.length} Dokumen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3 w-28 text-center">Tanggal</th>
                <th className="px-4 py-3">No. Dokumen</th>
                <th className="px-4 py-3">Nama Vendor / Subcont</th>
                <th className="px-4 py-3">Part Item</th>
                {activeTab === "ncr" ? (
                  <th className="px-4 py-3">Detail Defect</th>
                ) : (
                  <>
                    <th className="px-4 py-3 text-right">Allowance Ratio</th>
                    <th className="px-4 py-3 text-right">Nilai Klaim</th>
                  </>
                )}
                <th className="px-4 py-3 text-center w-28">Status</th>
                <th className="px-4 py-3 text-center w-24">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "ncr" ? 8 : 9} className="px-5 py-12 text-center text-slate-400 font-bold italic">
                    Tidak ditemukan data arsip {activeTab.toUpperCase()} yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((doc, idx) => {
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/75 transition-colors font-semibold">
                      <td className="px-4 py-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{formatDateIndo(doc.date)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{doc.docNumber}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{doc.vendorName}</td>
                      <td className="px-4 py-3 text-slate-600">{doc.partName} <span className="text-[10px] text-slate-400 font-normal block mt-0.5 font-mono">({doc.partNumber})</span></td>
                      {activeTab === "ncr" ? (
                        <td className="px-4 py-3 text-slate-650">
                          <span className="font-bold">Reject: {doc.reject} pcs</span> / Total: {doc.qty} pcs
                          <span className="text-[10px] text-slate-450 font-semibold block mt-0.5 italic">NG: {doc.defectType}</span>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-right font-bold text-slate-600">{doc.allowanceRatio}</td>
                          <td className="px-4 py-3 text-right font-black text-emerald-650">
                            {doc.claimAmount}
                            <span className="text-[9px] text-slate-450 block font-normal mt-0.5">NG: {doc.reject} pcs / {doc.qty} pcs</span>
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-center">
                        {doc.status === "APPROVED" ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold">
                              <CheckCircle2 size={10} className="text-green-600" />
                              Disetujui
                            </span>
                            <div className="flex flex-wrap justify-center gap-1 mt-1">
                              {(doc.approvedBy || []).map((role: string, i: number) => (
                                <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[8.5px] font-bold">
                                  <CheckCircle2 size={7} className="text-emerald-500" />
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            {/* Already approved roles */}
                            {(doc.approvedBy || []).length > 0 && (
                              <div className="flex flex-wrap justify-center gap-1">
                                {(doc.approvedBy || []).map((role: string, i: number) => (
                                  <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[8.5px] font-bold">
                                    <CheckCircle2 size={7} className="text-emerald-500" />
                                    {role}
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Current pending role */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-bold whitespace-nowrap">
                              <Clock size={9} className="text-amber-500 shrink-0" />
                              {stageLabel(doc.type, doc.requiredRole, doc.status)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-750 text-white rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto text-[10px] font-bold shadow-sm"
                        >
                          <Eye size={12} />
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF View Modal Overlays */}
      {selectedDoc && selectedDoc.type === "QPR" && (
        <QprPrintPreview
          qpr={{
            qprNumber: selectedDoc.docNumber,
            supplierName: selectedDoc.vendorName,
            period: selectedDoc.period || "Juni 2026",
            date: selectedDoc.date,
            totalItems: selectedDoc.qty,
            rejectItems: selectedDoc.reject,
            allowanceRatio: selectedDoc.allowanceRatio,
            claimAmount: selectedDoc.claimAmount
          }}
          onClose={() => setSelectedDoc(null)}
        />
      )}

      {selectedDoc && selectedDoc.type === "NCR" && (
        <NcrPrintPreview
          ncr={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}

    </div>
  );
}
