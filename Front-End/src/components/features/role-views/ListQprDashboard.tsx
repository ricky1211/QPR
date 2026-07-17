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
  AlertCircle,
  ShieldAlert
} from "lucide-react";

import ClPrintPreview from "./ClPrintPreview";
import QprPrintPreview from "./QprPrintPreview";
import NcrPrintPreview from "./NcrPrintPreview";
import { ncrService, mapNcrFromDb } from "@/services/ncrService";


// Helper to map requiredRole -> human-readable stage label
const stageLabel = (type: string, requiredRole?: string, status?: string): string => {
  if (status === "DRAFT") return "Draf";
  if (status === "APPROVED" || status === "CLOSED") return "Disetujui";
  if (type === "CL") {
    if (requiredRole === "Vendor") return "Menunggu Vendor";
    if (requiredRole === "Accounting Approval") return "Menunggu Accounting";
    return "Disetujui";
  }
  if (type === "NCR") {
    if (requiredRole === "Foreman") return "Menunggu Foreman";
    if (requiredRole === "Section Head") return "Menunggu Section Head";
    if (requiredRole === "Dept Head") return "Menunggu Dept Head";
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

interface ApprovalStage {
  name: string;
  status: "APPROVED" | "PENDING" | "UPCOMING" | "DRAFT";
}

const getApprovalStages = (
  type: string,
  requiredRole?: string,
  approvedBy: string[] = [],
  status?: string
): ApprovalStage[] => {
  if (status === "DRAFT") {
    const chain = type === "CL" ? ["Vendor", "Accounting"] : type === "NCR" ? ["Foreman", "Section Head", "Dept Head"] : ["Section Head", "Dept Head", "Div Head", "Accounting"];
    return chain.map((name, idx) => ({ name, status: idx === 0 ? "DRAFT" : "UPCOMING" }));
  }

  if (status === "APPROVED" || status === "CLOSED") {
    const defaultChain =
      type === "CL"
        ? ["Vendor", "Accounting"]
        : type === "NCR"
        ? ["Foreman", "Section Head", "Dept Head"]
        : ["Section Head", "Dept Head", "Div Head", "Accounting"];
    return defaultChain.map((name) => ({ name, status: "APPROVED" }));
  }

  if (type === "CL") {
    const chain = ["Vendor", "Accounting"];
    let currentIndex = 0;
    if (requiredRole === "Accounting Approval") currentIndex = 1;

    return chain.map((name, idx) => {
      if (idx < currentIndex || (idx === 0 && approvedBy.includes("Vendor"))) {
        return { name, status: "APPROVED" };
      } else if (idx === currentIndex) {
        return { name, status: "PENDING" };
      } else {
        return { name, status: "UPCOMING" };
      }
    });
  } else if (type === "NCR") {
    const chain = ["Foreman", "Section Head", "Dept Head"];
    let currentIndex = 0;
    if (requiredRole === "Section Head") currentIndex = 1;
    if (requiredRole === "Dept Head") currentIndex = 2;

    return chain.map((name, idx) => {
      if (idx < currentIndex) {
        return { name, status: "APPROVED" };
      } else if (idx === currentIndex) {
        return { name, status: "PENDING" };
      } else {
        return { name, status: "UPCOMING" };
      }
    });
  } else {
    const chain = ["Section Head", "Dept Head", "Div Head", "Accounting"];
    let currentIndex = 0;
    if (requiredRole === "Dept Head") currentIndex = 1;
    if (requiredRole === "Div Head") currentIndex = 2;
    if (requiredRole === "Accounting") currentIndex = 3;

    return chain.map((name, idx) => {
      if (idx < currentIndex) {
        return { name, status: "APPROVED" };
      } else if (idx === currentIndex) {
        return { name, status: "PENDING" };
      } else {
        return { name, status: "UPCOMING" };
      }
    });
  }
};


interface ListQprDashboardProps {
  pendingNcrs?: any[];
  pendingQprs?: any[];
  confirmationLetters?: any[];
}

export default function ListQprDashboard({
  pendingNcrs = [],
  pendingQprs = [],
  confirmationLetters = []
}: ListQprDashboardProps) {
  // Combine all NCR, QPR, and CL documents dynamically from active state (drafts & in-progress) + fallback baseline data
  const allDocuments = React.useMemo(() => {
    const list: any[] = [];

    // 1. Add NCRs
    pendingNcrs.forEach((ncr) => {
      list.push({
        id: `ncr-${ncr.id}`,
        type: "NCR",
        docNumber: ncr.ncrNumber,
        date: ncr.date,
        vendorName: ncr.supplierName,
        partNumber: ncr.partNumber || "-",
        partName: ncr.partName || "-",
        period: "Juni 2026",
        qty: ncr.qty || 1,
        reject: ncr.reject || 0,
        allowanceRatio: "0.5%",
        claimAmount: "-",
        defectType: ncr.defectType || "-",
        disposition: ncr.disposition || "-",
        status: ncr.status,
        requiredRole: ncr.requiredRole,
        approvedBy: ncr.status === "APPROVED" || ncr.status === "CLOSED" ? ["QC Staff", "Section Head", "Dept Head"] : [],
        locationFound: ncr.locationFound || "-",
        problemType: ncr.problemType || "-",
        foundBy: ncr.foundBy || "-",
        docsToRevise: ncr.docsToRevise || "-",
        images: ncr.images || []
      });
    });


    // 2. Add QPRs
    pendingQprs.forEach((qpr) => {
      list.push({
        id: `qpr-${qpr.id}`,
        type: "QPR",
        docNumber: qpr.qprNumber,
        date: qpr.date,
        vendorName: qpr.supplierName,
        partNumber: qpr.partNumber || "MB-001",
        partName: qpr.partName || "Motherboard X1",
        period: qpr.period || "Juni 2026",
        qty: qpr.totalItems || 1000,
        reject: qpr.rejectItems || 30,
        allowanceRatio: qpr.allowanceRatio || "0.5%",
        claimAmount: qpr.claimAmount || "Rp 0",
        defectType: "-",
        disposition: "-",
        status: qpr.status,
        requiredRole: qpr.requiredRole,
        approvedBy: qpr.status === "APPROVED" || qpr.status === "CLOSED" || qpr.status === "APPROVED_INTERNAL" ? ["Section Head", "Dept Head", "Div Head", "Accounting"] : []
      });
    });

    // 3. Add CLs
    confirmationLetters.forEach((cl) => {
      list.push({
        id: `cl-${cl.id}`,
        type: "CL",
        docNumber: cl.clNumber,
        date: cl.dateSent,
        vendorName: cl.supplierName,
        partNumber: cl.partNumber || "MB-001",
        partName: cl.partName || "Motherboard X1",
        period: "Juni 2026",
        qty: cl.qty || 1000,
        reject: cl.reject || 10,
        allowanceRatio: "0.5%",
        claimAmount: cl.amount || "Rp 0",
        defectType: cl.defectType || "-",
        disposition: "-",
        status: cl.status,
        requiredRole: cl.requiredRole,
        approvedBy: cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID" ? ["Vendor", "Accounting"] : []
      });
    });

    // Add baseline closed items if list is empty, just for UX preview
    if (list.length === 0) {
      list.push(
        {
          id: "hist-qpr-1",
          type: "QPR",
          docNumber: "QPR/2026/04/JAYADI",
          date: "2026-04-10",
          vendorName: "PT JAYADI",
          partNumber: "MB-001",
          partName: "Motherboard X1",
          period: "April 2026",
          qty: 10000,
          reject: 50,
          allowanceRatio: "0.5%",
          claimAmount: "Rp 18.200.000",
          defectType: "-",
          disposition: "-",
          status: "APPROVED",
          requiredRole: "Closed",
          approvedBy: ["Section Head", "Dept Head", "Div Head", "Accounting"]
        },
        {
          id: "hist-cl-1",
          type: "CL",
          docNumber: "CL/2026/06/001",
          date: "2026-06-10",
          vendorName: "PT JAYADI",
          partNumber: "MB-001",
          partName: "Motherboard X1",
          period: "Juni 2026",
          qty: 1000,
          reject: 10,
          allowanceRatio: "0.5%",
          claimAmount: "Rp 18.200.000",
          defectType: "Dent / Scratch",
          disposition: "-",
          status: "APPROVED",
          requiredRole: "Closed",
          approvedBy: ["Vendor", "Accounting"]
        }
      );
    }

    return list;
  }, [pendingNcrs, pendingQprs, confirmationLetters]);
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("qpr"); // 'cl' or 'qpr'
  const [filterVendor, setFilterVendor] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // '' | 'APPROVED' | 'WAITING_APPROVAL'

  // Details modal state
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const handleViewDetail = (doc: any) => {
    if (doc.type === "NCR" && typeof doc.id === "string" && doc.id.includes("-")) {
      const dbId = doc.id.split("-")[1];
      ncrService.getById(dbId)
        .then((realNcr) => {
          const mapped = mapNcrFromDb(realNcr);
          setSelectedDoc({
            id: `ncr-${mapped.id}`,
            type: "NCR",
            docNumber: mapped.ncrNumber,
            date: mapped.date,
            vendorName: mapped.supplierName,
            partNumber: mapped.partNumber,
            partName: mapped.partName,
            qty: mapped.qty,
            reject: mapped.reject,
            defectType: mapped.defectType,
            disposition: mapped.disposition,
            status: mapped.status,
            requiredRole: mapped.requiredRole,
            locationFound: mapped.locationFound,
            problemType: mapped.problemType,
            foundBy: mapped.foundBy,
            docsToRevise: mapped.docsToRevise,
            images: mapped.images
          });
        })
        .catch(err => {
          console.error("Failed to load NCR details:", err);
          alert("Gagal memuat detail NCR.");
        });
    } else {
      setSelectedDoc(doc);
    }
  };


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
  const clCount = baseFiltered.filter(d => d.type === "CL").length;
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
            <h3 className="text-base font-black uppercase tracking-wider">Arsip Laporan QPR &amp; Confirmation Letter</h3>
          </div>
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
              QPR & CL
            </span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-650 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
            <Layers size={18} />
          </div>
        </div>

        {/* Total CL */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Laporan CL</span>
            <h4 className="text-2xl font-black text-slate-800">{clCount}</h4>
            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block">
              Confirmation Letter
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
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker();
                } catch (err) {}
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-semibold bg-slate-50 cursor-pointer"
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
              <option value="DRAFT">Draf (Belum Dikirim)</option>
              <option value="WAITING_APPROVAL">Proses Approval</option>
              <option value="APPROVED">Disetujui / Selesai</option>
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
          <ShieldAlert size={14} className="text-red-500" />
          ARSIP DRAF & LAPORAN NCR
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
        <button
          onClick={() => {
            setActiveTab("cl");
            setSelectedDoc(null);
          }}
          className={`flex-1 sm:flex-initial px-6 py-3 font-bold text-xs border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "cl"
              ? "border-blue-600 text-blue-650 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-900 bg-slate-50/50"
          }`}
        >
          <AlertCircle size={14} className="text-emerald-500" />
          ARSIP CONFIRMATION LETTER
        </button>
      </div>

      {/* Main Table List */}
      <div className="bg-white border border-slate-350 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-800 text-left uppercase tracking-wide">
            {activeTab === "ncr" ? "Daftar Semua Draf & Laporan NCR" : activeTab === "qpr" ? "Daftar Semua Klaim QPR" : "Daftar Semua Confirmation Letter"}
          </h4>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded shadow-sm">
            Ditemukan: {filteredData.length} Dokumen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3 w-28 text-center">Tanggal</th>
                <th className="px-4 py-3">No. Dokumen</th>
                <th className="px-4 py-3">Nama Vendor / Subcont</th>
                <th className="px-4 py-3">Part Item</th>
                <th className="px-4 py-3 text-right">Allowance Ratio</th>
                <th className="px-4 py-3 text-center">Status / Tracking</th>
                <th className="px-4 py-3 text-center w-24">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 font-bold italic">
                    Tidak ditemukan data arsip {activeTab.toUpperCase()} yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((doc, idx) => {
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/75 transition-colors font-semibold whitespace-nowrap">
                      <td className="px-4 py-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{formatDateIndo(doc.date)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{doc.docNumber}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{doc.vendorName}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {doc.partName} <span className="text-[10px] text-slate-450 font-normal font-mono ml-1">({doc.partNumber})</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-600">{doc.allowanceRatio}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 justify-center">
                          {doc.status === "APPROVED" || doc.status === "CLOSED" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold shadow-sm shrink-0">
                              <CheckCircle2 size={10} className="text-green-600" />
                              Disetujui
                            </span>
                          ) : doc.status === "DRAFT" || doc.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-650 border border-slate-200 rounded-full text-[10px] font-bold shadow-sm shrink-0">
                              Draf
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold shadow-sm shrink-0">
                              <Clock size={10} className="text-amber-600 animate-pulse" />
                              Proses
                            </span>
                          )}

                          {/* Divider */}
                          <span className="text-slate-300 font-bold shrink-0">|</span>

                          {/* Approval Stages Timeline Flow */}
                          <div className="flex items-center gap-1 text-[8.5px] shrink-0">
                            {getApprovalStages(doc.type, doc.requiredRole, doc.approvedBy, doc.status).map((stage, i, arr) => (
                              <React.Fragment key={i}>
                                <span
                                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold transition-all border shrink-0 ${
                                    stage.status === "APPROVED"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : stage.status === "PENDING"
                                      ? "bg-amber-50 text-amber-800 border-amber-350 ring-1 ring-amber-100"
                                      : stage.status === "DRAFT"
                                      ? "bg-slate-50 text-slate-500 border-slate-250 border-dashed"
                                      : "bg-slate-50 text-slate-400 border-slate-200 border-dashed"
                                  }`}
                                >
                                  {stage.status === "APPROVED" && <CheckCircle2 size={7} className="text-emerald-500" />}
                                  {stage.status === "PENDING" && <Clock size={7} className="text-amber-500" />}
                                  {stage.name}
                                </span>
                                {i < arr.length - 1 && (
                                  <span className="text-slate-350 font-black text-[9px] select-none shrink-0">→</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewDetail(doc)}
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

      {selectedDoc && selectedDoc.type === "CL" && (
        <ClPrintPreview
          cl={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}

      {selectedDoc && selectedDoc.type === "NCR" && (
        <NcrPrintPreview
          ncr={{
            ncrNumber: selectedDoc.docNumber,
            supplierName: selectedDoc.vendorName,
            partNumber: selectedDoc.partNumber,
            partName: selectedDoc.partName,
            qty: selectedDoc.qty,
            reject: selectedDoc.reject,
            defectType: selectedDoc.defectType,
            disposition: selectedDoc.disposition,
            status: selectedDoc.status,
            date: selectedDoc.date,
            locationFound: selectedDoc.locationFound,
            problemType: selectedDoc.problemType,
            foundBy: selectedDoc.foundBy,
            docsToRevise: selectedDoc.docsToRevise,
            images: selectedDoc.images
          }}
          onClose={() => setSelectedDoc(null)}
        />
      )}

    </div>
  );
}
