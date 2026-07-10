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

// Mock data of approved documents (NCR and QPR) per day and per vendor for one month (June 2026)
const mockApprovedDocuments = [
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
    approvedBy: ["PPIC Staff", "Dept Head"]
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
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
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
    approvedBy: ["PPIC Staff", "Dept Head"]
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
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
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
    approvedBy: ["PPIC Staff", "Dept Head"]
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
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
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
    approvedBy: ["PPIC Staff", "Dept Head"]
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
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
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
    approvedBy: ["PPIC Staff", "Dept Head"]
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
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
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
    approvedBy: ["PPIC Staff", "Dept Head"]
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
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
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
    approvedBy: ["PPIC Staff", "Dept Head"]
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
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
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
    approvedBy: ["PPIC Staff", "Dept Head"]
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
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
  },
  {
    id: "qpr-14",
    type: "QPR",
    docNumber: "QPR/2026/06/014",
    date: "2026-06-14",
    vendorName: "PT IKAN BAKAR",
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    period: "Juni 2026",
    qty: 380,
    reject: 7,
    allowanceRatio: "0.8%",
    claimAmount: "Rp 14.500.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    approvedBy: ["PPIC Staff", "Dept Head"]
  },
  {
    id: "ncr-13",
    type: "NCR",
    docNumber: "NCR/2026/06/013",
    date: "2026-06-13",
    vendorName: "PT JAYADI",
    partNumber: "MB-001",
    partName: "Motherboard X1",
    period: "-",
    qty: 180,
    reject: 3,
    allowanceRatio: "0.5%",
    claimAmount: "-",
    defectType: "Solder Bridge",
    disposition: "REWORK",
    status: "APPROVED",
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
  },
  {
    id: "qpr-12",
    type: "QPR",
    docNumber: "QPR/2026/06/012",
    date: "2026-06-12",
    vendorName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    period: "Juni 2026",
    qty: 950,
    reject: 18,
    allowanceRatio: "1.0%",
    claimAmount: "Rp 27.000.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    approvedBy: ["PPIC Staff", "Dept Head"]
  },
  {
    id: "ncr-11",
    type: "NCR",
    docNumber: "NCR/2026/06/011",
    date: "2026-06-11",
    vendorName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    period: "-",
    qty: 800,
    reject: 12,
    allowanceRatio: "1.0%",
    claimAmount: "-",
    defectType: "Rust",
    disposition: "REWORK",
    status: "APPROVED",
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
  },
  {
    id: "qpr-10",
    type: "QPR",
    docNumber: "QPR/2026/06/010",
    date: "2026-06-10",
    vendorName: "PT JAYADI",
    partNumber: "KB-004",
    partName: "Keyboard Mechanical",
    period: "Juni 2026",
    qty: 600,
    reject: 14,
    allowanceRatio: "0.5%",
    claimAmount: "Rp 21.000.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    approvedBy: ["PPIC Staff", "Dept Head"]
  },
  {
    id: "ncr-9",
    type: "NCR",
    docNumber: "NCR/2026/06/009",
    date: "2026-06-09",
    vendorName: "PT JAYADI",
    partNumber: "KB-004",
    partName: "Keyboard Mechanical",
    period: "-",
    qty: 250,
    reject: 7,
    allowanceRatio: "0.5%",
    claimAmount: "-",
    defectType: "Key Stick",
    disposition: "RETURN TO VENDOR",
    status: "APPROVED",
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
  },
  {
    id: "qpr-08",
    type: "QPR",
    docNumber: "QPR/2026/06/008",
    date: "2026-06-08",
    vendorName: "PT IKAN BAKAR",
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    period: "Juni 2026",
    qty: 450,
    reject: 9,
    allowanceRatio: "0.8%",
    claimAmount: "Rp 18.000.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    approvedBy: ["PPIC Staff", "Dept Head"]
  },
  {
    id: "ncr-07",
    type: "NCR",
    docNumber: "NCR/2026/06/007",
    date: "2026-06-07",
    vendorName: "PT IKAN BAKAR",
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    period: "-",
    qty: 150,
    reject: 5,
    allowanceRatio: "0.8%",
    claimAmount: "-",
    defectType: "Bad Sector",
    disposition: "REWORK",
    status: "APPROVED",
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
  },
  {
    id: "qpr-06",
    type: "QPR",
    docNumber: "QPR/2026/06/006",
    date: "2026-06-06",
    vendorName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    period: "Juni 2026",
    qty: 1200,
    reject: 20,
    allowanceRatio: "1.0%",
    claimAmount: "Rp 30.000.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    approvedBy: ["PPIC Staff", "Dept Head"]
  },
  {
    id: "ncr-05",
    type: "NCR",
    docNumber: "NCR/2026/06/005",
    date: "2026-06-05",
    vendorName: "PT JAYADI",
    partNumber: "GL-001",
    partName: "Gelas Kaca",
    period: "-",
    qty: 300,
    reject: 6,
    allowanceRatio: "0.5%",
    claimAmount: "-",
    defectType: "Minor Bubble",
    disposition: "ACCEPT AS IS",
    status: "APPROVED",
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
  },
  {
    id: "qpr-04",
    type: "QPR",
    docNumber: "QPR/2026/06/004",
    date: "2026-06-04",
    vendorName: "PT JAYADI",
    partNumber: "MB-001",
    partName: "Motherboard X1",
    period: "Juni 2026",
    qty: 400,
    reject: 8,
    allowanceRatio: "0.5%",
    claimAmount: "Rp 12.000.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    approvedBy: ["PPIC Staff", "Dept Head"]
  },
  {
    id: "ncr-03",
    type: "NCR",
    docNumber: "NCR/2026/06/003",
    date: "2026-06-03",
    vendorName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
    partNumber: "CR-001",
    partName: "CONE RACE ALL TYPE",
    period: "-",
    qty: 1000,
    reject: 15,
    allowanceRatio: "1.0%",
    claimAmount: "-",
    defectType: "Dimension Out",
    disposition: "REWORK",
    status: "APPROVED",
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
  },
  {
    id: "qpr-02",
    type: "QPR",
    docNumber: "QPR/2026/06/002",
    date: "2026-06-02",
    vendorName: "PT IKAN BAKAR",
    partNumber: "HD-002",
    partName: "Harddisk 1TB",
    period: "Juni 2026",
    qty: 500,
    reject: 12,
    allowanceRatio: "0.8%",
    claimAmount: "Rp 15.000.000",
    defectType: "-",
    disposition: "-",
    status: "APPROVED",
    approvedBy: ["PPIC Staff", "Dept Head"]
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
    approvedBy: ["Inspector QA", "Section Head", "QA Dept Head"]
  }
];

export default function ListQprDashboard() {
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Details modal state
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  // Unique vendors for the dropdown
  const vendors = Array.from(new Set(mockApprovedDocuments.map(doc => doc.vendorName)));

  // Filtering Logic
  const filteredData = mockApprovedDocuments.filter(doc => {
    const matchesSearch = searchQuery
      ? doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesType = filterType ? doc.type === filterType : true;
    const matchesVendor = filterVendor ? doc.vendorName === filterVendor : true;
    const matchesDate = filterDate ? doc.date === filterDate : true;

    return matchesSearch && matchesType && matchesVendor && matchesDate;
  });

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterType("");
    setFilterVendor("");
    setFilterDate("");
  };

  // KPI Calculations
  const totalCount = filteredData.length;
  const ncrCount = filteredData.filter(d => d.type === "NCR").length;
  const qprCount = filteredData.filter(d => d.type === "QPR").length;
  const totalClaimAmountVal = filteredData
    .filter(d => d.type === "QPR")
    .reduce((sum, item) => {
      const val = parseInt(item.claimAmount.replace(/[^0-9]/g, ""), 10) || 0;
      return sum + val;
    }, 0);

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
            <h3 className="text-base font-black uppercase tracking-wider">Arsip NCR & QPR Disetujui (Approved)</h3>
          </div>
          <p className="text-xs text-indigo-200 mt-1 font-semibold">
            Daftar dokumen NCR dan QPR yang telah diterbitkan, diselesaikan, dan disetujui sepenuhnya oleh pihak berwenang.
          </p>
        </div>
        <button
          onClick={handleResetFilters}
          disabled={!searchQuery && !filterType && !filterVendor && !filterDate}
          className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer ${
            !searchQuery && !filterType && !filterVendor && !filterDate
              ? "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
              : "bg-white text-indigo-800 border-white hover:bg-indigo-50 active:scale-95"
          }`}
        >
          <RefreshCw size={12} className={searchQuery || filterType || filterVendor || filterDate ? "animate-spin-slow" : ""} />
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

        {/* Total Approved NCR */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NCR Disetujui</span>
            <h4 className="text-2xl font-black text-slate-800">{ncrCount}</h4>
            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block">
              Kualitas / Kuantitas
            </span>
          </div>
          <div className="w-10 h-10 bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
            <AlertCircle size={18} />
          </div>
        </div>

        {/* Total Approved QPR */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">QPR Disetujui</span>
            <h4 className="text-2xl font-black text-slate-800">{qprCount}</h4>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
              Fase 4 Selesai
            </span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
            <FileText size={18} />
          </div>
        </div>

        {/* Total Claim Amount */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Denda Klaim</span>
            <h4 className="text-lg font-black text-emerald-600">Rp {totalClaimAmountVal.toLocaleString("id-ID")}</h4>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
              Terakumulasi Terbayar
            </span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
            <TrendingUp size={18} />
          </div>
        </div>
      </div>

      {/* Advanced Filters Block */}
      <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-sm space-y-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block text-left">
          Filter Arsip Dokumen
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          
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

          {/* Type filter */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tipe Dokumen
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-semibold bg-slate-50"
            >
              <option value="">Semua Tipe</option>
              <option value="NCR">NCR (Non-Conformance Report)</option>
              <option value="QPR">QPR (Quality Problem Report)</option>
            </select>
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
              min="2026-06-01"
              max="2026-06-30"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-semibold bg-slate-50"
            />
          </div>

        </div>
      </div>

      {/* Main Table List */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-800 text-left">
            Daftar Arsip Dokumen NCR & QPR Terverifikasi
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
                <th className="px-4 py-3 w-24 text-center">Tipe</th>
                <th className="px-4 py-3">No. Dokumen</th>
                <th className="px-4 py-3">Nama Vendor / Subcont</th>
                <th className="px-4 py-3">Part Item / Rincian</th>
                <th className="px-4 py-3 text-center w-28">Status</th>
                <th className="px-4 py-3 text-center w-24">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 font-bold italic">
                    Tidak ditemukan data yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((doc, idx) => {
                  const isNcr = doc.type === "NCR";
                  const typeBadge = isNcr
                    ? "bg-orange-50 text-orange-700 border border-orange-200/80"
                    : "bg-blue-50 text-blue-700 border border-blue-200/80";

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/75 transition-colors font-semibold">
                      <td className="px-4 py-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                      <td className="px-4 py-3 text-center text-slate-650">{formatDateIndo(doc.date)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${typeBadge}`}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{doc.docNumber}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{doc.vendorName}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {isNcr ? (
                          <div className="flex flex-col text-left">
                            <span>{doc.partName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">Reject: {doc.reject} pcs ({doc.defectType})</span>
                          </div>
                        ) : (
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-emerald-600">{doc.claimAmount}</span>
                            <span className="text-[10px] text-slate-400 font-normal">Periode: {doc.period}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold">
                          <CheckCircle2 size={10} className="text-green-600" />
                          Disetujui
                        </span>
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
