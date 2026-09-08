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
  ShieldAlert,
  Printer,
  Edit
} from "lucide-react";

import ClPrintPreview from "./ClPrintPreview";
import QprPrintPreview from "./QprPrintPreview";
import { clService } from "@/services/clService";
import { sscService } from "@/services/sscService";
import { getPeriodFromDate } from "@/services/qprService";


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
  if (requiredRole === "Purchasing") return "Menunggu Purchasing";
  if (requiredRole === "Accounting") return "Menunggu Accounting";
  return "Disetujui";
};

interface ApprovalStage {
  name: string;
  status: "APPROVED" | "PENDING" | "UPCOMING" | "DRAFT" | "REVISE";
}

const getApprovalStages = (
  type: string,
  requiredRole?: string,
  approvedBy: string[] = [],
  status?: string
): ApprovalStage[] => {
  if (status === "DRAFT") {
    const chain = type === "CL" ? ["Vendor", "Accounting"] : type === "NCR" ? ["Foreman", "Section Head", "Dept Head"] : ["Section Head", "Dept Head", "Div Head", "Purchasing"];
    return chain.map((name, idx) => ({ name, status: idx === 0 ? "DRAFT" : "UPCOMING" }));
  }

  if (status === "APPROVED" || status === "CLOSED" || status === "CLOSED_PAID") {
    const defaultChain =
      type === "CL"
        ? ["Vendor", "Accounting"]
        : type === "NCR"
        ? ["Foreman", "Section Head", "Dept Head"]
        : type === "SSC Billing"
        ? ["Accounting BU", "Accounting Dept Head"]
        : type === "SSC Payment"
        ? ["Accounting BU", "Accounting Dept Head", "Admin Div/BOD"]
        : ["Section Head", "Dept Head", "Div Head", "Purchasing"];
    return defaultChain.map((name) => ({ name, status: "APPROVED" }));
  }

  if (type === "SSC Billing" || type === "SSC Payment") {
    const isClosed = status === "CLOSED_PAID";
    return [
      { name: "Created", status: "APPROVED" },
      { name: "Close Paid", status: isClosed ? "APPROVED" : "PENDING" }
    ];
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
    const chain = ["Section Head", "Dept Head", "Div Head", "Purchasing"];
    if (status === "UNDER_REVISION" || status === "REVISE") {
      return chain.map((name) => ({ name, status: "REVISE" }));
    }
    let currentIndex = 0;
    if (requiredRole === "Dept Head") currentIndex = 1;
    if (requiredRole === "Div Head") currentIndex = 2;
    if (requiredRole === "Purchasing") currentIndex = 3;

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
  createdSscBillings?: any[];
  setCreatedSscBillings?: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedQprForEdit?: (qpr: any) => void;
  parentSetActiveTab?: (tab: string) => void;
  setConfirmationLetters?: React.Dispatch<React.SetStateAction<any[]>>;
  setPendingQprs?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function ListQprDashboard({
  pendingNcrs = [],
  pendingQprs = [],
  confirmationLetters = [],
  createdSscBillings = [],
  setCreatedSscBillings = () => {},
  setSelectedQprForEdit = () => {},
  parentSetActiveTab = () => {},
  setConfirmationLetters,
  setPendingQprs
}: ListQprDashboardProps) {
  // Calculate claim count for each vendor dynamically based on QPRs and Confirmation Letters
  const vendorClaimCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    
    pendingQprs.forEach((q) => {
      const name = q.supplierName;
      if (name) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });

    confirmationLetters.forEach((cl) => {
      const name = cl.supplierName;
      if (name && !pendingQprs.some(q => q.qprNumber === cl.qprNumber)) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });

    return counts;
  }, [pendingQprs, confirmationLetters]);

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
        partNumber: ncr.partNumber || "—",
        partName: ncr.partName || "—",
        period: ncr.period || getPeriodFromDate(ncr.date),
        qty: ncr.totalItems || ncr.qty || 1000,
        reject: ncr.rejectItems || ncr.qtyNg || 30,
        allowanceRatio: ncr.allowanceRatio || "—",
        claimAmount: "—",
        defectType: ncr.problem || "—",
        disposition: ncr.disposition || "—",
        status: ncr.status,
        requiredRole: ncr.requiredRole,
        approvedBy: ncr.status === "APPROVED" || ncr.status === "CLOSED" ? ["Foreman", "Section Head", "Dept Head"] : [],
        refObject: ncr
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
        partNumber: qpr.parts?.[0]?.partNumber || qpr.partNumber || "MB-001",
        partName: qpr.parts?.[0]?.partName || qpr.partName || "Motherboard X1",
        period: qpr.period || getPeriodFromDate(qpr.date),
        qty: qpr.totalItems || 1000,
        reject: qpr.rejectItems || 30,
        allowanceRatio: qpr.allowanceRatio || "0.5%",
        claimAmount: qpr.claimAmount || "Rp 0",
        defectType: "-",
        disposition: "-",
        status: qpr.status,
        requiredRole: qpr.requiredRole,
        approvalProgress: qpr.approvalProgress,
        approvedBy: qpr.approvedBy || (qpr.status === "APPROVED" || qpr.status === "CLOSED" || qpr.status === "APPROVED_INTERNAL" ? ["Section Head", "Dept Head", "Div Head", "Purchasing"] : []),
        refObject: qpr
      });
    });

    // 3. Add CLs
    confirmationLetters.forEach((cl) => {
      const firstItem = cl.items?.[0] || {};
      list.push({
        id: `cl-${cl.id}`,
        type: "CL",
        docNumber: cl.clNumber,
        date: cl.dateSent,
        vendorName: cl.supplierName || cl.vendorName,
        qprNumber: cl.qprNumber || cl.qprSourceData?.qprNumber || "—",
        partNumber: firstItem.partNumber || cl.qprSourceData?.parts?.[0]?.partNumber || cl.partNumber || "IT-650",
        partName: firstItem.partName || firstItem.description || cl.qprSourceData?.parts?.[0]?.partName || cl.partName || "INNER TUBE,650 A",
        period: cl.qprSourceData?.period || getPeriodFromDate(cl.dateSent || cl.date),
        qty: firstItem.totalQty || cl.qty || 1000,
        reject: firstItem.qtyNg || firstItem.billableQty || cl.reject || 30,
        allowanceRatio: `${firstItem.allowanceRatio || 0.5}%`,
        claimAmount: cl.amount || "Rp 0",
        defectType: cl.defectType || "-",
        disposition: "-",
        status: cl.status,
        requiredRole: cl.requiredRole,
        clApprovalProgress: cl.clApprovalProgress,
        vendorApproved: cl.vendorApproved,
        approvedBy: cl.approvedBy || (cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID" ? ["Vendor", "Accounting"] : []),
        refObject: cl
      });
    });

    // 4. Add I-Memos from createdSscBillings
    createdSscBillings.forEach((bill) => {
      const billPeriod = bill.memoPeriod || getPeriodFromDate(bill.dateSent) || "—";
      
      // Split into SSC Billing vs SSC Payment representation
      list.push({
        id: `billing-${bill.id}`,
        type: "SSC Billing",
        docNumber: bill.clNumber || `BILL-${bill.id}`,
        date: bill.dateSent || new Date().toISOString().split("T")[0],
        vendorName: bill.supplierName || "—",
        partNumber: "—",
        partName: bill.memoTitle || "Manual Billing",
        period: billPeriod,
        qty: 1,
        reject: 0,
        allowanceRatio: "—",
        claimAmount: bill.amount || "Rp 0",
        defectType: "—",
        disposition: "—",
        status: bill.closedPaid || bill.status === "CLOSED_PAID" ? "CLOSED_PAID" : "APPROVED",
        requiredRole: "Closed",
        approvedBy: ["Accounting BU", "Accounting Dept Head"],
        refObject: bill
      });

      list.push({
        id: `payment-${bill.id}`,
        type: "SSC Payment",
        docNumber: `PAY-${bill.clNumber}` || `PAY-${bill.id}`,
        date: bill.dateSent || new Date().toISOString().split("T")[0],
        vendorName: bill.supplierName || "—",
        partNumber: "—",
        partName: "Permohonan Pemotongan Invoice",
        period: billPeriod,
        qty: 1,
        reject: 0,
        allowanceRatio: "—",
        claimAmount: bill.amount || "Rp 0",
        defectType: "—",
        disposition: "—",
        status: bill.closedPaid || bill.status === "CLOSED_PAID" ? "CLOSED_PAID" : "PENDING",
        requiredRole: bill.closedPaid || bill.status === "CLOSED_PAID" ? "Closed" : "Accounting Dept Head",
        approvedBy: bill.closedPaid || bill.status === "CLOSED_PAID" ? ["Accounting BU", "Accounting Dept Head", "Admin Div/BOD"] : [],
        refObject: bill
      });
    });



    return list;
  }, [pendingNcrs, pendingQprs, confirmationLetters, createdSscBillings]);
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("qpr"); // 'cl' or 'qpr'
  const [filterVendor, setFilterVendor] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // '' | 'APPROVED' | 'WAITING_APPROVAL'

  // Details modal state
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const handleViewDetail = (doc: any) => {
    setSelectedDoc(doc);
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
      </div>

      {/* KPI Counters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center group hover:shadow-md transition-all">
          <div className="space-y-1.5 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Arsip Dokumen</span>
            <h4 className="text-2xl font-black text-slate-800">{totalCount}</h4>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full inline-block">
              QPR &amp; CL
            </span>
          </div>
        </div>

        {/* Total CL */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center group hover:shadow-md transition-all">
          <div className="space-y-1.5 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Laporan CL</span>
            <h4 className="text-2xl font-black text-slate-800">{clCount}</h4>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full inline-block">
              Confirmation Letter
            </span>
          </div>
        </div>

        {/* Total QPR */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center group hover:shadow-md transition-all">
          <div className="space-y-1.5 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Klaim QPR</span>
            <h4 className="text-2xl font-black text-slate-800">{qprCount}</h4>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full inline-block">
              Semua Status
            </span>
          </div>
        </div>

        {/* Proses Approval */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center group hover:shadow-md transition-all">
          <div className="space-y-1.5 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Proses Approval</span>
            <h4 className="text-2xl font-black text-amber-600">{pendingCount}</h4>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full inline-block">
              Menunggu Tanda Tangan
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filters Block */}
      <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block text-left">
            Filter Arsip Dokumen
          </span>
          <button
            onClick={handleResetFilters}
            disabled={!searchQuery && !filterVendor && !filterDate && !filterStatus}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer ${
              !searchQuery && !filterVendor && !filterDate && !filterStatus
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95 shadow-sm"
            }`}
          >
            <RefreshCw size={12} className={searchQuery || filterVendor || filterDate || filterStatus ? "animate-spin-slow" : ""} />
            Reset Filter
          </button>
        </div>
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
              Tanggal Pembuatan
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
        <button
          onClick={() => {
            setActiveTab("ssc billing");
            setSelectedDoc(null);
          }}
          className={`flex-1 sm:flex-initial px-6 py-3 font-bold text-xs border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "ssc billing"
              ? "border-blue-600 text-blue-650 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-900 bg-slate-50/50"
          }`}
        >
          <FileText size={14} className="text-indigo-550" />
          I-MEMO: SSC BILLING
        </button>
        <button
          onClick={() => {
            setActiveTab("ssc payment");
            setSelectedDoc(null);
          }}
          className={`flex-1 sm:flex-initial px-6 py-3 font-bold text-xs border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "ssc payment"
              ? "border-blue-600 text-blue-650 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-900 bg-slate-50/50"
          }`}
        >
          <AlertCircle size={14} className="text-teal-550" />
          I-MEMO: SSC PAYMENT
        </button>
      </div>

      {/* Main Table List */}
      <div className="bg-white border border-slate-350 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-800 text-left uppercase tracking-wide">
            {activeTab === "qpr" ? "Daftar Semua Klaim QPR" : activeTab === "cl" ? "Daftar Semua Confirmation Letter" : activeTab === "ssc billing" ? "Daftar I-Memo SSC Billing" : "Daftar I-Memo SSC Payment"}
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
                {activeTab !== "ssc billing" && activeTab !== "ssc payment" && (
                  <>
                    <th className="px-4 py-3">Part Item</th>
                    <th className="px-4 py-3 text-right">Allowance Ratio</th>
                  </>
                )}
                <th className="px-4 py-3 text-center">Status / Tracking</th>
                <th className="px-4 py-3 text-center w-24">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "ssc billing" || activeTab === "ssc payment" ? 6 : 8} className="px-5 py-12 text-center text-slate-400 font-bold italic">
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
                      <td className="px-4 py-3 font-bold text-slate-700">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{doc.vendorName}</span>
                          {(() => {
                            const count = vendorClaimCounts[doc.vendorName] || 1;
                            if (count > 1) {
                              return (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-black uppercase tracking-wider" title={`${count} Claims in one year`}>
                                  More Than One ({count}x)
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded text-[9px] font-black uppercase tracking-wider" title="1 Claim in one year">
                                  1st Time
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </td>
                      {doc.type !== "SSC Billing" && doc.type !== "SSC Payment" && (
                        <>
                          <td className="px-4 py-3 text-slate-600">
                            {doc.partName} <span className="text-[10px] text-slate-450 font-normal font-mono ml-1">({doc.partNumber})</span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-600">
                            {doc.allowanceRatio}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-center py-1">
                          {(() => {
                            if (doc.status === "UNDER_REVISION" || doc.status === "REVISE") {
                              return (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-250 rounded-md text-[11px] font-black uppercase tracking-wider animate-pulse shadow-sm">
                                  <AlertCircle size={12} className="text-rose-600 shrink-0" />
                                  REVISE
                                </span>
                              );
                            }

                            const stages = getApprovalStages(doc.type, doc.requiredRole, doc.approvedBy, doc.status);
                            let totalDaysSum = 0;
                            
                            // Helper to calculate days spent
                            const getDaysBetween = (startStr?: string | Date, endStr?: string | Date): number => {
                              if (!startStr) return 0;
                              const start = new Date(startStr);
                              const end = endStr ? new Date(endStr) : new Date();
                              if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
                              start.setHours(0, 0, 0, 0);
                              end.setHours(0, 0, 0, 0);
                              const diffTime = end.getTime() - start.getTime();
                              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                              return Math.max(0, diffDays);
                            };

                            const stageElements = stages.map((stage, i, arr) => {
                              let stepDaysNum = 0;
                              if (doc.type === "QPR" && doc.refObject) {
                                const qpr = doc.refObject;
                                const progress = qpr.approvalProgress;
                                if (i === 0) {
                                  // Section Head
                                  if (stage.status === "APPROVED") {
                                    stepDaysNum = getDaysBetween(qpr.date, progress?.approvedAtSectionHead || qpr.date);
                                  } else if (stage.status === "PENDING") {
                                    stepDaysNum = getDaysBetween(qpr.date, new Date());
                                  }
                                } else if (i === 1) {
                                  // Dept Head
                                  if (stage.status === "APPROVED") {
                                    stepDaysNum = getDaysBetween(progress?.approvedAtSectionHead, progress?.approvedAtDeptHead || progress?.approvedAtSectionHead);
                                  } else if (stage.status === "PENDING") {
                                    stepDaysNum = getDaysBetween(progress?.approvedAtSectionHead, new Date());
                                  }
                                } else if (i === 2) {
                                  // Div Head
                                  if (stage.status === "APPROVED") {
                                    stepDaysNum = getDaysBetween(progress?.approvedAtDeptHead, progress?.approvedAtDivHead || progress?.approvedAtDeptHead);
                                  } else if (stage.status === "PENDING") {
                                    stepDaysNum = getDaysBetween(progress?.approvedAtDeptHead, new Date());
                                  }
                                } else if (i === 3) {
                                  // Accounting
                                  if (stage.status === "APPROVED") {
                                    stepDaysNum = getDaysBetween(progress?.approvedAtDivHead, progress?.approvedAtVendor || progress?.approvedAtDivHead);
                                  } else if (stage.status === "PENDING") {
                                    stepDaysNum = getDaysBetween(progress?.approvedAtDivHead, new Date());
                                  }
                                }
                              } else {
                                // Default fallback for other documents or mock items
                                stepDaysNum = stage.status === "APPROVED" ? 1 : (stage.status === "PENDING" ? getDaysBetween(doc.date, new Date()) : 0);
                              }

                              totalDaysSum += stepDaysNum;
                              
                              // Custom text for final/closed stage showing date document was created/marked
                              let displayText = stage.name;
                              if (stage.status === "APPROVED" && (i === arr.length - 1 || doc.status === "CLOSED_PAID")) {
                                  displayText = `${stage.name} (${doc.date})`;
                              }

                              return (
                                <React.Fragment key={i}>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition-all border shrink-0 ${
                                      stage.status === "APPROVED"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : stage.status === "PENDING"
                                        ? "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-100 font-extrabold"
                                        : "bg-slate-50 text-slate-400 border-slate-200 opacity-60"
                                    }`}
                                  >
                                    {stage.status === "APPROVED" && <CheckCircle2 size={10} className="text-emerald-600 shrink-0" />}
                                    {stage.status === "PENDING" && <Clock size={10} className="text-amber-500 shrink-0" />}
                                    {displayText}
                                  </span>
                                  {i < arr.length - 1 && (
                                    <div className="flex flex-col items-center justify-center shrink-0 px-1 select-none">
                                      <span className="text-slate-400 text-xs font-black leading-none">→</span>
                                      <span className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded mt-0.5 leading-none">
                                        {doc.type === "SSC Payment" && i === arr.length - 2
                                          ? "Tgl 10 Bln Depan"
                                          : (stage.status === "APPROVED" ? `${stepDaysNum} Hari` : (stage.status === "PENDING" ? `${stepDaysNum} Hari` : "-"))
                                        }
                                      </span>
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            });

                            return (
                              <>
                                {stageElements}
                                <span className="text-slate-300 font-bold ml-1 shrink-0">|</span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-[10px] font-extrabold shadow-sm shrink-0 ml-0.5">
                                  ⏳ Total: {doc.type === "SSC Payment" ? "Lead Time" : `${totalDaysSum} Hari`}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Always show Detail button */}
                          <button
                            onClick={() => handleViewDetail(doc)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold shadow-sm"
                            title="Lihat Detail Dokumen"
                          >
                            <Eye size={12} />
                            Detail
                          </button>

                          {/* Show REVISI action button when QPR is under revision */}
                          {doc.type === "QPR" && (doc.status === "UNDER_REVISION" || doc.status === "REVISE") && (
                            <button
                              onClick={() => {
                                  if (doc.refObject) {
                                    setSelectedQprForEdit(doc.refObject);
                                    if (typeof window !== "undefined") {
                                      try { sessionStorage.setItem("selectedQprForEdit", JSON.stringify(doc.refObject)); } catch {}
                                    }
                                    parentSetActiveTab("buat-qpr");
                                  }
                              }}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold shadow-sm animate-pulse"
                              title="Edit & Revisi Dokumen QPR"
                            >
                              <Edit size={12} />
                              Revisi
                            </button>
                          )}

                          {/* Close Paid Manual Button for SSC Billing/Payment before Auto Date 10 */}
                          {(doc.type === "SSC Billing" || doc.type === "SSC Payment") && doc.status !== "CLOSED_PAID" && (
                            <button
                              onClick={() => {
                                const matchedId = doc.id.replace("billing-", "").replace("payment-", "");
                                const billingObj = doc.refObject;
                                const clNumber = billingObj?.clNumber;
                                
                                // Find the corresponding CL to retrieve correct CL ID and QPR Number
                                const targetCl = confirmationLetters.find(cl => cl.clNumber === clNumber);
                                const clId = targetCl?.id || billingObj?.clId;
                                const qprNumber = targetCl?.qprNumber;

                                // 1. Update SscBilling status to PAID in DB
                                sscService.updateBilling(matchedId, { status: "PAID" })
                                  .catch(err => console.error("Failed to update billing in DB:", err));

                                // 2. Update ConfirmationLetter status to closedPaid: true in DB
                                if (clId) {
                                  clService.update(clId, { closedPaid: true })
                                    .catch(err => console.error("Failed to update CL in DB:", err));
                                }

                                // 3. Update local state createdSscBillings
                                setCreatedSscBillings(prev => prev.map(bill => {
                                  if (bill.id === matchedId) {
                                    return { ...bill, closedPaid: true, status: "CLOSED_PAID" };
                                  }
                                  return bill;
                                }));

                                // 4. Update local state confirmationLetters
                                if (clId && setConfirmationLetters) {
                                  setConfirmationLetters(prev => prev.map(cl => {
                                    if (cl.id === clId) {
                                      return { ...cl, closedPaid: true, status: "CLOSED_PAID" };
                                    }
                                    return cl;
                                  }));
                                }

                                // 5. Update local state pendingQprs
                                if (qprNumber && setPendingQprs) {
                                  setPendingQprs(prev => prev.map(q => {
                                    if (q.qprNumber === qprNumber) {
                                      return { ...q, status: "CLOSED_PAID", requiredRole: "Closed" };
                                    }
                                    return q;
                                  }));
                                }

                                alert(`Status ${doc.type} ${doc.docNumber} berhasil diubah secara manual menjadi Close Paid.`);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold shadow-sm"
                              title="Set Close Paid Secara Manual"
                            >
                              ✓ Close Paid
                            </button>
                          )}
                        </div>
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
            ...(selectedDoc.refObject || {}),
            qprNumber: selectedDoc.docNumber || selectedDoc.refObject?.qprNumber,
            supplierName: selectedDoc.vendorName || selectedDoc.refObject?.supplierName,
            partName: selectedDoc.partName || selectedDoc.refObject?.partName,
            partNumber: selectedDoc.partNumber || selectedDoc.refObject?.partNumber,
            period: selectedDoc.period || selectedDoc.refObject?.period || getPeriodFromDate(selectedDoc.date),
            date: selectedDoc.date || selectedDoc.refObject?.date,
            totalItems: selectedDoc.qty || selectedDoc.refObject?.totalItems,
            rejectItems: selectedDoc.reject || selectedDoc.refObject?.rejectItems,
            allowanceRatio: selectedDoc.allowanceRatio || selectedDoc.refObject?.allowanceRatio,
            claimAmount: selectedDoc.claimAmount || selectedDoc.refObject?.claimAmount,
            vendorClaimCount: vendorClaimCounts[selectedDoc.vendorName] || 1,
            status: selectedDoc.status || selectedDoc.refObject?.status,
            requiredRole: selectedDoc.requiredRole || selectedDoc.refObject?.requiredRole,
            approvalProgress: selectedDoc.approvalProgress || selectedDoc.refObject?.approvalProgress,
            approvedBy: selectedDoc.approvedBy || selectedDoc.refObject?.approvedBy,
            parts: selectedDoc.refObject?.parts || [],
            problem: selectedDoc.refObject?.problem || "",
            claimType: selectedDoc.refObject?.claimType || [],
            refNcrNumber: selectedDoc.refObject?.refNcrNumber || "",
            pdfFileName: selectedDoc.refObject?.pdfFileName || null,
            remarks: selectedDoc.refObject?.remarks || ""
          }}
          onClose={() => setSelectedDoc(null)}
          onEditRevision={() => {
            if (selectedDoc.refObject) {
              setSelectedQprForEdit(selectedDoc.refObject);
              if (typeof window !== "undefined") {
                try { sessionStorage.setItem("selectedQprForEdit", JSON.stringify(selectedDoc.refObject)); } catch {}
              }
              parentSetActiveTab("buat-qpr");
              setSelectedDoc(null);
            }
          }}
        />
      )}

      {selectedDoc && selectedDoc.type === "CL" && (
        <ClPrintPreview
          cl={{
            ...(selectedDoc.refObject || {}),
            ...selectedDoc,
            clNumber: selectedDoc.docNumber || selectedDoc.refObject?.clNumber,
            qprNumber: selectedDoc.qprNumber || selectedDoc.refObject?.qprNumber,
            supplierName: selectedDoc.vendorName || selectedDoc.refObject?.supplierName,
            amount: selectedDoc.claimAmount || selectedDoc.refObject?.amount,
            status: selectedDoc.status || selectedDoc.refObject?.status,
            requiredRole: selectedDoc.requiredRole || selectedDoc.refObject?.requiredRole,
            clApprovalProgress: selectedDoc.clApprovalProgress || selectedDoc.refObject?.clApprovalProgress,
            vendorApproved: selectedDoc.vendorApproved || selectedDoc.refObject?.vendorApproved,
            approvedBy: selectedDoc.approvedBy || selectedDoc.refObject?.approvedBy,
            items: selectedDoc.refObject?.items || selectedDoc.items
          }}
          onClose={() => setSelectedDoc(null)}
        />
      )}

      {selectedDoc && (selectedDoc.type === "SSC Billing" || selectedDoc.type === "SSC Payment") && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Detail Internal Memo ({selectedDoc.type})</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{selectedDoc.docNumber} | {selectedDoc.vendorName}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-200 flex justify-center shadow-inner print:p-0 print:bg-white">
              {selectedDoc.type === "SSC Billing" ? (
                <div 
                  id="internal-memo-sheet"
                  className="bg-white text-black p-[12mm] shadow-lg border border-slate-450 w-[210mm] min-h-[297mm] text-left mx-auto relative flex flex-col print:shadow-none print:border-none print:w-[198mm] print:h-[280mm] print:p-[8mm] print:m-0"
                  style={{ fontFamily: '"Times New Roman", Times, serif', lineHeight: '1.2' }}
                >
                  {/* Top Section */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1.5 w-[55%]">
                      <div className="flex text-xs items-center">
                        <span className="font-bold w-24 shrink-0 font-sans">Company</span>
                        <span className="mr-2">:</span>
                        <span className="font-bold border-b border-black flex-1 min-h-[16px]">{selectedDoc.refObject?.memoCompany || "PT. MENARA TERUS MAKMUR"}</span>
                      </div>
                      <div className="flex text-xs items-center">
                        <span className="font-bold w-24 shrink-0 font-sans">Business Area</span>
                        <span className="mr-2">:</span>
                        <span className="font-bold border-b border-black flex-1 min-h-[16px]">{selectedDoc.refObject?.memoBusinessArea || "MT"}</span>
                      </div>
                      <div className="flex text-xs items-center">
                        <span className="font-bold w-24 shrink-0 font-sans">Request Date</span>
                        <span className="mr-2">:</span>
                        <div className="flex items-center gap-0.5 font-bold font-mono text-xs select-none border-b border-black flex-1 pb-0.5">
                          {(selectedDoc.refObject?.memoRequestDate || selectedDoc.date || "").replace(/[^0-9]/g, "").slice(0, 8).padEnd(8, " ").split("").map((char, charIdx) => (
                            <React.Fragment key={charIdx}>
                              <span className="w-3.5 h-4.5 border border-black flex items-center justify-center bg-white text-black text-[10px]">{char}</span>
                              {(charIdx === 1 || charIdx === 3) && <span className="mx-0.5">/</span>}
                            </React.Fragment>
                          ))}
                          <span className="text-[8px] text-slate-400 font-sans font-normal ml-2">(dd/mm/yyyy)</span>
                        </div>
                      </div>
                      <div className="flex text-xs items-center">
                        <span className="font-bold w-24 shrink-0 font-sans">Billing Type</span>
                        <span className="mr-2">:</span>
                        <div className="flex items-center gap-4 border-b border-black flex-1 pb-0.5">
                          <label className="flex items-center gap-1 font-bold text-[10px]">
                            <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center text-[9px] ${(!selectedDoc.refObject?.memoBillingType || selectedDoc.refObject?.memoBillingType === "One Time") ? "bg-black text-white" : ""}`}>
                              {(!selectedDoc.refObject?.memoBillingType || selectedDoc.refObject?.memoBillingType === "One Time") ? "✓" : ""}
                            </span>
                            One Time
                          </label>
                          <label className="flex items-center gap-1 font-bold text-[10px]">
                            <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center text-[9px] ${(selectedDoc.refObject?.memoBillingType === "Recurring") ? "bg-black text-white" : ""}`}>
                              {(selectedDoc.refObject?.memoBillingType === "Recurring") ? "✓" : ""}
                            </span>
                            Recurring
                          </label>
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="font-sans text-[8px] text-slate-500 font-bold">Period *) (mm/yy):</span>
                            {(selectedDoc.refObject?.memoPeriod || selectedDoc.period || "").replace(/[^0-9]/g, "").slice(0, 4).padEnd(4, " ").split("").map((char, charIdx) => (
                              <React.Fragment key={charIdx}>
                                <span className="w-3 h-4 border border-black flex items-center justify-center bg-white text-black text-[9px] font-mono">{char}</span>
                                {charIdx === 1 && <span className="mx-0.5">/</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-[185px] h-[52px] border border-dashed border-black/80 flex flex-col items-center justify-center p-2 text-center text-black/75">
                      <span className="text-[7px] font-bold tracking-widest leading-none font-sans">PLEASE PUT <span className="underline font-black">FA01 BARCODE</span> HERE</span>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h2 className="text-sm font-extrabold tracking-wider border-b border-black pb-0.5 inline-block uppercase text-black font-sans">
                      INTERNAL MEMO - MANUAL BILLING TO CUSTOMER
                    </h2>
                  </div>

                  <div className="border border-black flex flex-col divide-y divide-black text-[10.5px] mb-4">
                    <div className="flex divide-x divide-black">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Title</div>
                      <div className="flex-1 p-2 font-bold bg-white min-h-[28px] uppercase">{selectedDoc.refObject?.memoTitle || "PERMINTAAN PEMBUATAN INVOICE CLAIM NG PART"}</div>
                    </div>
                    <div className="flex divide-x divide-black">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Request Addressed to</div>
                      <div className="flex-1 p-2 font-semibold bg-white min-h-[28px]">{selectedDoc.refObject?.memoRequestTo || "SSC Billing"}</div>
                    </div>
                    <div className="flex divide-x divide-black">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Description</div>
                      <div className="flex-1 p-2 bg-white min-h-[48px] font-semibold leading-relaxed">{selectedDoc.refObject?.memoDescription || "Mohon dibuatkan Invoice untuk Claim Part NG"}</div>
                    </div>
                    <div className="flex divide-x divide-black items-center">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Customer Type</div>
                      <div className="flex-1 p-2 flex items-center justify-between bg-white min-h-[28px]">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1 font-bold">
                            <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center text-[10px] ${(selectedDoc.refObject?.memoCustomerType === "PKP" || !selectedDoc.refObject?.memoCustomerType) ? "bg-black text-white" : ""}`}>
                              {(selectedDoc.refObject?.memoCustomerType === "PKP" || !selectedDoc.refObject?.memoCustomerType) ? "✓" : ""}
                            </span>
                            PKP
                          </label>
                          <label className="flex items-center gap-1 font-bold">
                            <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center text-[10px] ${selectedDoc.refObject?.memoCustomerType === "Non PKP" ? "bg-black text-white" : ""}`}>
                              {selectedDoc.refObject?.memoCustomerType === "Non PKP" ? "✓" : ""}
                            </span>
                            Non PKP
                          </label>
                        </div>
                        <div className="flex items-center gap-1.5 mr-2 font-sans">
                          <span className="font-bold">NPWP:</span>
                          <div className="flex items-center gap-0.5 font-bold font-mono text-[10px] select-none">
                            {(selectedDoc.refObject?.memoNpwp || "815710249408000").replace(/[^0-9]/g, "").slice(0, 15).padEnd(15, " ").split("").map((char, charIdx) => (
                              <React.Fragment key={charIdx}>
                                <span className="w-3 h-4 border border-black flex items-center justify-center bg-white text-black text-[9px] font-mono">{char}</span>
                                {(charIdx === 1 || charIdx === 4 || charIdx === 7 || charIdx === 8 || charIdx === 11) && <span className="mx-0.2">-</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex py-1 px-2 text-[9px] text-slate-500 font-semibold bg-slate-50 italic font-sans">
                      *lampirkan NPWP u/ customer yg belum terdaftar pada customer master (OTC)
                    </div>
                    <div className="flex divide-x divide-black">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Supporting Document</div>
                      <div className="flex-1 p-2 bg-white font-semibold">{selectedDoc.refObject?.memoSupportingDoc || "-"}</div>
                    </div>
                    <div className="flex divide-x divide-black">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Billing Addressed to</div>
                      <div className="flex-1 p-2 bg-white font-semibold min-h-[28px]">{selectedDoc.refObject?.memoBillingAddressedTo || ""}</div>
                    </div>
                    <div className="flex divide-x divide-black">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Customer Name</div>
                      <div className="flex-1 p-2 bg-white font-extrabold text-[12px] uppercase min-h-[28px]">{selectedDoc.refObject?.memoCustomerName || selectedDoc.vendorName}</div>
                    </div>
                    <div className="flex divide-x divide-black items-center">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Currency</div>
                      <div className="flex-1 p-2 bg-white flex items-center gap-0.5 min-h-[28px]">
                        {(selectedDoc.refObject?.memoCurrency || "IDR").split("").map((c, i) => (
                          <span key={i} className="w-3.5 h-4.5 border border-black flex items-center justify-center bg-white text-black text-[9px] font-bold font-mono">{c}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex divide-x divide-black">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Amount</div>
                      <div className="flex-1 p-2 bg-white font-extrabold text-[12px] min-h-[28px]">{selectedDoc.claimAmount}</div>
                    </div>
                    <div className="flex divide-x divide-black">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Says</div>
                      <div className="flex-1 p-2 bg-white font-semibold italic min-h-[28px]">{selectedDoc.refObject?.memoSays || ""}</div>
                    </div>
                  </div>

                  {/* Data Accounting Block */}
                  <div className="border border-black text-[10.5px] mb-4 font-sans">
                    <div className="p-1.5 font-extrabold bg-slate-100 border-b border-black uppercase tracking-wider text-[8px] font-sans">
                      DATA ACCOUNTING (Filled In by Accounting BU)
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-black">
                      <div className="flex flex-col divide-y divide-black">
                        <div className="flex items-center p-1.5 gap-2">
                          <span className="font-bold w-[120px] shrink-0 font-sans">Customer Code</span>
                          <span className="mr-1.5 font-sans">:</span>
                          <div className="flex items-center gap-0.5 font-bold font-mono text-xs select-none">
                            {(selectedDoc.refObject?.acctCustomerCode || "OTC08002").split("").map((char, charIdx) => (
                              <span key={charIdx} className="w-3.5 h-4.5 border border-black flex items-center justify-center bg-white text-black text-[10px]">{char}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center p-1.5 font-sans gap-2">
                          <span className="font-bold w-[120px] shrink-0 font-sans">Customer Type</span>
                          <span className="mr-1.5 font-sans">:</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 font-bold">
                              <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center text-[10px] ${selectedDoc.refObject?.acctCustomerType === "Trade" ? "bg-black text-white" : ""}`}>
                                {selectedDoc.refObject?.acctCustomerType === "Trade" ? "✓" : ""}
                              </span>
                              Trade
                            </label>
                            <label className="flex items-center gap-1 font-bold">
                              <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center text-[10px] ${(selectedDoc.refObject?.acctCustomerType === "Non Trade" || !selectedDoc.refObject?.acctCustomerType) ? "bg-black text-white" : ""}`}>
                                {(selectedDoc.refObject?.acctCustomerType === "Non Trade" || !selectedDoc.refObject?.acctCustomerType) ? "✓" : ""}
                              </span>
                              Non Trade
                            </label>
                          </div>
                        </div>
                        <div className="flex items-center p-1.5 font-sans gap-2">
                          <span className="font-bold w-[120px] shrink-0 font-sans">Trading Partner</span>
                          <span className="mr-1.5 font-sans">:</span>
                          <div className="flex items-center gap-0.5 font-bold font-mono text-xs select-none">
                            {(selectedDoc.refObject?.acctTradingPartner || "").padEnd(5, " ").split("").map((char, charIdx) => (
                              <span key={charIdx} className="w-3.5 h-4.5 border border-black flex items-center justify-center bg-white text-black text-[10px]">{char}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col divide-y divide-black font-sans">
                        <div className="flex items-center p-2 min-h-[32px] font-sans gap-2">
                          <span className="font-bold w-[120px] shrink-0 font-sans">Exchange Rate*</span>
                          <span className="mr-1.5 font-sans">:</span>
                          <span className="font-semibold">{selectedDoc.refObject?.acctExchangeRate || "—"}</span>
                        </div>
                        <div className="flex items-center p-2 min-h-[32px] font-sans gap-2">
                          <span className="font-bold w-[120px] shrink-0 font-sans">Journal</span>
                          <span className="mr-1.5 font-sans">:</span>
                          <span className="font-semibold">{selectedDoc.refObject?.acctJournal || "—"}</span>
                        </div>
                        <div className="p-1.5 px-2 text-[7.5px] text-slate-500 italic bg-slate-50/50 flex-1 flex items-center leading-normal font-sans">
                          *if foreign currency applied and exchange rate is left blank, then exchange rate at SAP will be used
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GL Account Table matching requested image */}
                  <div className="border border-black overflow-hidden mb-6 text-[10px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#f08a00] text-white uppercase font-extrabold border-b border-black text-center text-[8px] tracking-wider font-sans">
                          <th className="border-r border-black p-1.5 w-[110px]">GL Account Code</th>
                          <th className="border-r border-black p-1.5">GL Account Name</th>
                          <th className="border-r border-black p-1.5 w-[90px]">Cost Center</th>
                          <th className="border-r border-black p-1.5 w-[95px]">Amount (Dr.)</th>
                          <th className="border-r border-black p-1.5 w-[95px]">Amount (Cr.)</th>
                          <th className="p-1.5 w-[130px]">Text</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const defaultGlRows = [
                            { code: "OTC08002", name: "PT TEMARU ENGINEER", costCenter: "", amountDr: String(selectedDoc.claimAmount || "0").replace("Rp ", ""), amountCr: "", text: "Claim Part NG" },
                            { code: "545-102-0000", name: "FOH Subcont Fee", costCenter: "MT015FOHGE", amountDr: "", amountCr: (parseFloat(String(selectedDoc.claimAmount || "0").replace(/[^0-9]/g, "")) * 0.9).toLocaleString("id-ID"), text: "Claim Part NG" },
                            { code: "211-310-0000", name: "Tax Pay VAT Out", costCenter: "", amountDr: "", amountCr: (parseFloat(String(selectedDoc.claimAmount || "0").replace(/[^0-9]/g, "")) * 0.1).toLocaleString("id-ID"), text: "ppn 11%" }
                          ];
                          const rows = selectedDoc.refObject?.glRows && selectedDoc.refObject.glRows.length > 0 ? selectedDoc.refObject.glRows : defaultGlRows;
                          return Array.from({ length: Math.max(5, rows.length) }).map((_, i) => {
                            const row = rows[i] || { code: "", name: "", costCenter: "", amountDr: "", amountCr: "", text: "" };
                            return (
                              <tr key={i} className="border-b border-black font-semibold h-[24px] text-black">
                                <td className="border-r border-black p-1 text-center font-mono">{row.code}</td>
                                <td className="border-r border-black p-1 text-left font-sans">{row.name}</td>
                                <td className="border-r border-black p-1 text-center font-mono">{row.costCenter}</td>
                                <td className="border-r border-black p-1 text-right font-mono">{row.amountDr}</td>
                                <td className="border-r border-black p-1 text-right font-mono">{row.amountCr}</td>
                                <td className="p-1 text-left font-sans">{row.text}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Dynamic Signature box panel (5 columns layout) */}
                  <div className="border border-black overflow-hidden mb-6 text-[10px] mt-auto font-sans">
                    <div className="grid grid-cols-5 text-center divide-x divide-black font-bold font-sans">
                      <div className="p-1 border-b border-black bg-slate-50/50">Prepared by <sup>1)</sup></div>
                      <div className="p-1 border-b border-black bg-slate-50/50 col-span-2">Approved by <sup>1)</sup></div>
                      <div className="p-1 border-b border-black bg-slate-50/50">Entry by <sup>1)</sup></div>
                      <div className="p-1 border-b border-black bg-slate-50/50">Checked by <sup>1)</sup></div>
                    </div>
                    <div className="grid grid-cols-5 text-center divide-x divide-black h-[58px] items-end pb-2 bg-white">
                      <div className="px-1 text-center font-sans font-bold border-b border-dashed border-slate-350 mx-1">{selectedDoc.refObject?.sigPrepared || "Bagas"}</div>
                      <div className="px-1 text-center font-sans font-bold border-b border-dashed border-slate-350 mx-1">{selectedDoc.refObject?.sigApproved1 || "Anindita"}</div>
                      <div className="px-1 text-center font-sans font-bold border-b border-dashed border-slate-350 mx-1">{selectedDoc.refObject?.sigApproved2 || "Evi Sulistyorini"}</div>
                      <div className="px-1 text-center font-sans font-bold border-b border-dashed border-slate-350 mx-1">{selectedDoc.refObject?.sigEntry || "—"}</div>
                      <div className="px-1 text-center font-sans font-bold border-b border-dashed border-slate-350 mx-1">{selectedDoc.refObject?.sigChecked || "—"}</div>
                    </div>
                    <div className="grid grid-cols-5 text-center divide-x divide-black text-[9px] font-bold text-white bg-blue-600/90 border-t border-black font-sans">
                      <div className="p-1 py-1.5 truncate text-center">Accounting BU</div>
                      <div className="p-1 py-1.5 truncate text-center">Accounting Dept Head</div>
                      <div className="p-1 py-1.5 truncate text-center">Admin Div/BOD</div>
                      <div className="p-1 py-1.5 truncate text-center">SSC Billing Admin</div>
                      <div className="p-1 py-1.5 truncate text-center">AR Function Lead</div>
                    </div>
                  </div>

                  {/* Footer / Remark */}
                  <div className="text-[8px] text-slate-500 leading-tight space-y-0.5 font-sans">
                    <div><strong>Remark:</strong></div>
                    <div>*) Only filled if billing type is recurring</div>
                    <div>1) Every signing person must write down his / her full name in the grey box and his/her function in the blue box</div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 mt-2 text-[7.5px] font-mono text-slate-450 font-sans">
                      <span>Approved by System {new Date(selectedDoc.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} 17:02</span>
                      <span>Internal Memo - Onetime Billing {selectedDoc.refObject?.acctCustomerCode || "TEIN"}1 of 1</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  id="internal-memo-sheet"
                  className="bg-white text-black p-[12mm] shadow-lg border border-slate-455 w-[210mm] min-h-[297mm] text-left mx-auto relative flex flex-col print:shadow-none print:border-none print:w-[198mm] print:h-[280mm] print:p-[8mm] print:m-0"
                  style={{ fontFamily: '"Times New Roman", Times, serif', lineHeight: '1.2' }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1.5 w-[55%]">
                      <div className="flex text-xs">
                        <span className="font-bold w-24 shrink-0 font-sans">Company</span>
                        <span className="mr-2">:</span>
                        <span className="font-bold border-b border-black flex-1 min-h-[16px]">{selectedDoc.refObject?.memoCompany || "PT. MENARA TERUS MAKMUR"}</span>
                      </div>
                      <div className="flex text-xs">
                        <span className="font-bold w-24 shrink-0 font-sans">Business Area</span>
                        <span className="mr-2">:</span>
                        <span className="font-bold border-b border-black flex-1 min-h-[16px]">{selectedDoc.refObject?.memoBusinessArea || "MT"}</span>
                      </div>
                      <div className="flex text-xs">
                        <span className="font-bold w-24 shrink-0 font-sans">Request Date</span>
                        <span className="mr-2">:</span>
                        <div className="flex items-center gap-0.5 font-bold font-mono text-xs select-none border-b border-black flex-1 pb-0.5">
                          {(selectedDoc.refObject?.memoRequestDate || selectedDoc.date || "").replace(/[^0-9]/g, "").slice(0, 8).padEnd(8, " ").split("").map((char, charIdx) => (
                            <React.Fragment key={charIdx}>
                              <span className="w-3.5 h-4.5 border border-black flex items-center justify-center bg-white text-black text-[10px]">{char}</span>
                              {(charIdx === 1 || charIdx === 3) && <span className="mx-0.5">/</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="w-[185px] h-[52px] border border-dashed border-black/80 flex flex-col items-center justify-center p-2 text-center text-black/75">
                      <span className="text-[7px] font-bold tracking-widest leading-none font-sans">PLEASE PUT <span className="underline font-black">FA BARCODE</span> HERE</span>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h2 className="text-sm font-extrabold tracking-wider border-b border-black pb-0.5 inline-block uppercase text-black font-sans">
                      INTERNAL MEMO - OTHERS
                    </h2>
                  </div>

                  <div className="border border-black flex flex-col divide-y divide-black text-[11px] mb-4">
                    <div className="flex divide-x divide-black">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Title</div>
                      <div className="flex-1 p-2 font-bold bg-white min-h-[28px] uppercase">{selectedDoc.refObject?.memoTitle || "Permintaan Pemotongan Tagihan Reject Vendor"}</div>
                    </div>
                    <div className="flex divide-x divide-black">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">To</div>
                      <div className="flex-1 p-2 font-semibold bg-white min-h-[28px]">SSC Invoicing & Payment</div>
                    </div>
                    <div className="flex divide-x divide-black">
                      <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Instruction</div>
                      <div className="flex-1 p-2 bg-white leading-relaxed font-sans pr-4">{selectedDoc.refObject?.memoInstruction || `Mohon diproses untuk pemotongan tagihan terhadap vendor ${selectedDoc.supplierName || "terkait"} sebesar ${selectedDoc.claimAmount || selectedDoc.amount || "-"} atas denda kualitas reject part.`}</div>
                    </div>
                    
                    {/* Gold nested table matching ssc payment template preview */}
                    <div className="w-full p-2 bg-white flex flex-col font-sans">
                      <div className="pl-16 pr-2 py-2">
                        <table className="w-full text-[9px] border-collapse border border-black">
                          <thead>
                            <tr className="text-black border border-black text-[8.5px] text-center font-bold">
                              <th className="border border-black px-1.5 py-1 font-bold" style={{ backgroundColor: '#f2c811' }}>Customer</th>
                              <th className="border border-black px-1.5 py-1 font-bold" style={{ backgroundColor: '#f2c811' }}>DocumentNo</th>
                              <th className="border border-black px-1.5 py-1 font-bold" style={{ backgroundColor: '#f2c811' }}>Text</th>
                              <th className="border border-black px-1.5 py-1 font-bold" style={{ backgroundColor: '#f2c811' }}>Vendor</th>
                              <th className="border border-black px-1.5 py-1 font-bold" style={{ backgroundColor: '#f2c811' }}>Doc. Date</th>
                              <th className="border border-black px-1.5 py-1 text-right font-bold" style={{ backgroundColor: '#f2c811' }}>Local Crcy Amt</th>
                              <th className="border border-black px-1.5 py-1 font-bold" style={{ backgroundColor: '#f2c811' }}>Potong tagih payment date</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white border border-black text-black">
                              <td className="border border-black px-1.5 py-1 text-center font-mono font-bold">OTC08002</td>
                              <td className="border border-black px-1.5 py-1 text-center font-mono font-bold">{selectedDoc.docNumber.replace("PAY-", "")}</td>
                              <td className="border border-black px-1.5 py-1 text-left font-mono font-bold uppercase">POTONG TAGIH DENDA REJECT</td>
                              <td className="border border-black px-1.5 py-1 text-left font-sans font-bold">{selectedDoc.vendorName}</td>
                              <td className="border border-black px-1.5 py-1 text-center font-mono font-semibold">{selectedDoc.date}</td>
                              <td className="border border-black px-1.5 py-1 text-right font-mono font-bold">{String(selectedDoc.claimAmount || "0").replace("Rp ", "")}</td>
                              <td className="border border-black px-1.5 py-1 text-center font-mono font-bold">10/{parseInt(selectedDoc.date.split("/")[1] || "6") + 1}/26</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto border border-black overflow-hidden mb-6 text-[10px] font-sans">
                    <div className="grid grid-cols-5 text-center divide-x divide-black font-bold font-sans">
                      <div className="p-1 border-b border-black bg-slate-50/50">Prepared by <sup>1)</sup></div>
                      <div className="p-1 border-b border-black bg-slate-50/50 col-span-2">Approved by <sup>1)</sup></div>
                      <div className="p-1 border-b border-black bg-slate-50/50">Entry by <sup>1)</sup></div>
                      <div className="p-1 border-b border-black bg-slate-50/50">Checked by <sup>1)</sup></div>
                    </div>
                    <div className="grid grid-cols-5 text-center divide-x divide-black h-[58px] items-end pb-2 bg-white">
                      <div className="px-1 text-center font-sans font-bold border-b border-dashed border-slate-350 mx-1">{selectedDoc.refObject?.sigPrepared || "Bagas"}</div>
                      <div className="px-1 text-center font-sans font-bold border-b border-dashed border-slate-350 mx-1">{selectedDoc.refObject?.sigApproved1 || "Anindita"}</div>
                      <div className="px-1 text-center font-sans font-bold border-b border-dashed border-slate-350 mx-1">{selectedDoc.refObject?.sigApproved2 || "Evi Sulistyorini"}</div>
                      <div className="px-1 text-center font-sans font-bold border-b border-dashed border-slate-350 mx-1">{selectedDoc.refObject?.sigEntry || "—"}</div>
                      <div className="px-1 text-center font-sans font-bold border-b border-dashed border-slate-350 mx-1">{selectedDoc.refObject?.sigChecked || "—"}</div>
                    </div>
                    <div className="grid grid-cols-5 text-center divide-x divide-black text-[9px] font-bold text-white bg-blue-600/90 border-t border-black font-sans">
                      <div className="p-1 py-1.5 truncate text-center">Accounting BU</div>
                      <div className="p-1 py-1.5 truncate text-center">Accounting Dept Head</div>
                      <div className="p-1 py-1.5 truncate text-center">Admin Div/BOD</div>
                      <div className="p-1 py-1.5 truncate text-center">SSC Billing Admin</div>
                      <div className="p-1 py-1.5 truncate text-center">AR Function Lead</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0 print:hidden">
              <button
                onClick={() => {
                  const el = document.getElementById("internal-memo-sheet");
                  if (!el) return;
                  const content = el.innerHTML;
                  const styles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
                    .map(s => s.outerHTML)
                    .join("\n");
                  const pw = window.open("", "_blank", "width=900,height=1200");
                  if (!pw) return;
                  pw.document.open();
                  pw.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Internal Memo</title>
    ${styles}
    <style>
      *{box-sizing:border-box;}
      html,body{margin:0;padding:0;background:white;font-family:Arial,sans-serif;}
      @page{size:A4 portrait;margin:0;}
      body>div{width:210mm;min-height:297mm;padding:12mm;background:white;font-family:Arial,sans-serif;line-height:1.2;font-size:12px;color:black;}
    </style>
  </head>
  <body><div>${content}</div></body>
</html>`);
                  pw.document.close();
                  pw.focus();
                  setTimeout(() => { pw.print(); pw.close(); }, 500);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer active:scale-95"
              >
                Print PDF
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-white hover:bg-slate-150 text-slate-700 border border-slate-300 font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
          <style>{`
            @media print {
              /* Sembunyikan semua elemen di luar modal dialog */
              body > div:not(.fixed),
              aside,
              nav,
              header,
              footer,
              .print\\:hidden,
              button {
                display: none !important;
              }

              /* Atur kontainer dialog agar membiarkan children terlihat */
              .fixed {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
                overflow: visible !important;
                display: block !important;
              }

              .fixed > div {
                background: white !important;
                border: none !important;
                box-shadow: none !important;
                max-height: none !important;
                overflow: visible !important;
                display: block !important;
              }

              /* Hilangkan header modal berwarna gelap */
              .bg-slate-800, .shrink-0 {
                display: none !important;
              }

              /* Pastikan sheet terlihat dan berukuran pas A4 */
              #internal-memo-sheet {
                visibility: visible !important;
                display: flex !important;
                margin: 0 auto !important;
                padding: 10mm !important;
                width: 198mm !important;
                height: 280mm !important;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
                page-break-inside: avoid !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              #internal-memo-sheet * {
                visibility: visible !important;
              }
            }
          `}</style>
        </div>
      )}



    </div>
  );
}
