"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  UserCheck,
  ChevronRight,
  DollarSign,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  Sparkles,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Check
} from "lucide-react";

interface LeadTimeTrackerProps {
  pendingQprs: any[];
  confirmationLetters: any[];
}

export default function LeadTimeTracker({ pendingQprs = [], confirmationLetters = [] }: LeadTimeTrackerProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>("hist-1");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, CLOSED_PAID

  // Today reference matching Dashboard.tsx
  const today = new Date("2026-07-10");

  // Historical Closed Paid Documents
  const historicalDocs = [
    {
      id: "hist-1",
      docNumber: "QPR/2026/04/JAYADI",
      supplierName: "PT JAYADI",
      dateCreated: "2026-04-10",
      dateClosed: "2026-04-22",
      claimAmount: "Rp 18.200.000",
      status: "CLOSED_PAID",
      requiredRole: "Closed",
      period: "April 2026",
      stages: {
        draft: { days: 1, status: "APPROVED", date: "2026-04-11" },
        approvals: { days: 4, status: "APPROVED", date: "2026-04-15" },
        cl: { days: 2, status: "APPROVED", date: "2026-04-17" },
        vendor: { days: 3, status: "APPROVED", date: "2026-04-20" },
        closePaid: { days: 2, status: "APPROVED", date: "2026-04-22" }
      }
    },
    {
      id: "hist-2",
      docNumber: "QPR/2026/05/IKAN_BAKAR",
      supplierName: "PT IKAN BAKAR",
      dateCreated: "2026-05-15",
      dateClosed: "2026-05-26",
      claimAmount: "Rp 24.000.000",
      status: "CLOSED_PAID",
      requiredRole: "Closed",
      period: "Mei 2026",
      stages: {
        draft: { days: 1, status: "APPROVED", date: "2026-05-16" },
        approvals: { days: 3, status: "APPROVED", date: "2026-05-19" },
        cl: { days: 2, status: "APPROVED", date: "2026-05-21" },
        vendor: { days: 4, status: "APPROVED", date: "2026-05-25" },
        closePaid: { days: 1, status: "APPROVED", date: "2026-05-26" }
      }
    },
    {
      id: "hist-3",
      docNumber: "QPR/2026/03/RUICHENG",
      supplierName: "SHIJIAZHUANG RUICHENG TRADE CO., LTD",
      dateCreated: "2026-03-05",
      dateClosed: "2026-03-19",
      claimAmount: "Rp 32.000.000",
      status: "CLOSED_PAID",
      requiredRole: "Closed",
      period: "Maret 2026",
      stages: {
        draft: { days: 2, status: "APPROVED", date: "2026-03-07" },
        approvals: { days: 5, status: "APPROVED", date: "2026-03-12" },
        cl: { days: 3, status: "APPROVED", date: "2026-03-15" },
        vendor: { days: 3, status: "APPROVED", date: "2026-03-18" },
        closePaid: { days: 1, status: "APPROVED", date: "2026-03-19" }
      }
    }
  ];

  // Dynamically calculate stages for active QPRs
  const activeDocs = pendingQprs.map(qpr => {
    const docDate = new Date(qpr.date || "2026-07-01");
    const diffTime = Math.abs(today.getTime() - docDate.getTime());
    const totalDaysElapsed = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Determine current role index
    const rolesOrder = ["Section Head", "Dept Head", "Div Head", "Purchasing", "Closed"];
    const currentRole = qpr.requiredRole;
    const currentIdx = rolesOrder.indexOf(currentRole);

    // Draft stage is always approved
    const draftDays = 1;
    let approvalsDays = 0;
    let approvalsStatus: "APPROVED" | "PENDING" | "UPCOMING" = "UPCOMING";

    let clDays = 0;
    let clStatus: "APPROVED" | "PENDING" | "UPCOMING" = "UPCOMING";

    let vendorDays = 0;
    let vendorStatus: "APPROVED" | "PENDING" | "UPCOMING" = "UPCOMING";

    let closePaidDays = 0;
    let closePaidStatus: "APPROVED" | "PENDING" | "UPCOMING" = "UPCOMING";

    // Sub-stage breakdown logic
    if (currentIdx < 3) {
      // Still in internal approvals (Section Head, Dept Head, Div Head)
      approvalsDays = Math.max(1, totalDaysElapsed - draftDays);
      approvalsStatus = "PENDING";
    } else if (currentIdx === 3) {
      // In Purchasing Acknowledge / CL creation
      approvalsDays = 4; // Mock internal approvals took 4 days
      approvalsStatus = "APPROVED";
      
      clDays = Math.max(1, totalDaysElapsed - draftDays - approvalsDays);
      clStatus = "PENDING";
    } else {
      // Internal and Purchasing are closed. Check Confirmation Letter status if exists
      approvalsDays = 4;
      approvalsStatus = "APPROVED";
      
      const assocCl = confirmationLetters.find(cl => cl.qprNumber === qpr.qprNumber);
      if (assocCl) {
        clDays = 3;
        clStatus = "APPROVED";
        if (assocCl.status === "PENDING") {
          vendorDays = Math.max(1, totalDaysElapsed - draftDays - approvalsDays - clDays);
          vendorStatus = "PENDING";
        } else {
          vendorDays = 4;
          vendorStatus = "APPROVED";
          closePaidDays = Math.max(1, totalDaysElapsed - draftDays - approvalsDays - clDays - vendorDays);
          closePaidStatus = "PENDING";
        }
      } else {
        clDays = Math.max(1, totalDaysElapsed - draftDays - approvalsDays);
        clStatus = "PENDING";
      }
    }

    return {
      id: `active-${qpr.id}`,
      docNumber: qpr.qprNumber,
      supplierName: qpr.supplierName,
      dateCreated: qpr.date,
      dateClosed: null,
      claimAmount: qpr.claimAmount || "-",
      status: qpr.status === "APPROVED" ? "CLOSED_PAID" : "ACTIVE",
      requiredRole: qpr.requiredRole,
      period: qpr.period || "Juni 2026",
      stages: {
        draft: { days: draftDays, status: "APPROVED" as const },
        approvals: { days: approvalsDays, status: approvalsStatus },
        cl: { days: clDays, status: clStatus },
        vendor: { days: vendorDays, status: vendorStatus },
        closePaid: { days: closePaidDays, status: closePaidStatus }
      }
    };
  });

  // Combine lists
  const allDocs = [...activeDocs, ...historicalDocs];

  // Apply filters
  const filteredDocs = allDocs.filter(doc => {
    const matchesSearch =
      doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && doc.status === "ACTIVE") ||
      (statusFilter === "CLOSED_PAID" && doc.status === "CLOSED_PAID");

    return matchesSearch && matchesStatus;
  });

  // Selected document info
  const selectedDoc = allDocs.find(d => d.id === selectedDocId) || allDocs[0];

  // Helper: calculate total lead time for a document
  const calculateTotalLeadTime = (doc: typeof allDocs[0]) => {
    const s = doc.stages;
    return s.draft.days + s.approvals.days + s.cl.days + s.vendor.days + s.closePaid.days;
  };

  // Helper: get SLA state
  const getSlaStatus = (doc: typeof allDocs[0]) => {
    const totalDays = calculateTotalLeadTime(doc);
    const targetSla = 15;
    
    if (doc.status === "CLOSED_PAID") {
      return totalDays <= targetSla 
        ? { text: "On SLA", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20" } 
        : { text: "Breached SLA", color: "bg-rose-500/15 text-rose-700 border-rose-500/20" };
    } else {
      if (totalDays > targetSla) {
        return { text: "Breached SLA", color: "bg-rose-500/15 text-rose-700 border-rose-500/20" };
      } else if (totalDays >= 12) {
        return { text: "Warning SLA", color: "bg-amber-500/15 text-amber-700 border-amber-500/20" };
      } else {
        return { text: "On Track", color: "bg-blue-500/15 text-blue-700 border-blue-500/20" };
      }
    }
  };

  // Global KPIs from all documents
  const closedDocs = allDocs.filter(d => d.status === "CLOSED_PAID");
  const avgLeadTime = closedDocs.length > 0
    ? (closedDocs.reduce((acc, doc) => acc + calculateTotalLeadTime(doc), 0) / closedDocs.length).toFixed(1)
    : "12.3";

  const slaCompliantCount = closedDocs.filter(doc => calculateTotalLeadTime(doc) <= 15).length;
  const slaRate = closedDocs.length > 0
    ? Math.round((slaCompliantCount / closedDocs.length) * 100)
    : 100;

  // Volume Statistics Calculations
  const totalQprCreated = allDocs.length;
  const totalQprApproved = allDocs.filter(d => d.stages.approvals.status === "APPROVED").length;
  const totalClCreated = allDocs.filter(d => d.stages.cl.status === "APPROVED" || d.stages.cl.status === "PENDING").length;
  const totalClosePaid = allDocs.filter(d => d.status === "CLOSED_PAID").length;

  return (
    <div className="bg-linear-to-b from-white via-white to-slate-50/50 border border-slate-200/80 rounded-2xl shadow-md p-6 text-left space-y-6 animate-in fade-in duration-300">
      
      {/* Header section with icon & Sparkle styling */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white rounded-xl shadow-md shadow-blue-500/10">
              <Clock size={18} className="animate-spin-slow" />
            </span>
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 tracking-tight flex items-center gap-2">
                Analisis Lead Time &amp; Siklus Dokumen
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 font-semibold leading-normal">
                Pantau efisiensi durasi dari draf denda QPR hingga penyelesaian pembayaran (Close Paid) oleh subkontraktor.
              </p>
            </div>
          </div>
        </div>

        {/* Global KPI Summary Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-150 rounded-xl shadow-xs flex items-center gap-2 transition-all hover:bg-slate-100/50">
            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Rerata Siklus</span>
            <strong className="text-xs font-black text-indigo-600 leading-none font-mono">
              {avgLeadTime} Hari
            </strong>
          </div>
          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-150 rounded-xl shadow-xs flex items-center gap-2 transition-all hover:bg-slate-100/50">
            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">SLA Target</span>
            <strong className="text-xs font-black text-slate-800 leading-none font-mono">
              &lt; 15 Hari
            </strong>
          </div>
          <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl shadow-xs flex items-center gap-2 transition-all hover:bg-emerald-100/60">
            <span className="text-[9px] font-black text-emerald-600 block uppercase tracking-wider">SLA Compliance</span>
            <strong className="text-xs font-black text-emerald-700 leading-none flex items-center gap-1 font-mono">
              <TrendingUp size={12} className="stroke-[3]" />
              {slaRate}%
            </strong>
          </div>
        </div>
      </div>

      {/* Volume Statistics Grid with accent lines */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-1.5 bg-slate-50/50 rounded-2xl border border-slate-150 shadow-inner">
        
        {/* Card 1: QPR Dibuat */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden group hover:-translate-y-1 hover:shadow-md hover:border-blue-300 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider">QPR Diterbitkan</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
              <FileText size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl font-black text-slate-800 font-mono tracking-tight">{totalQprCreated}</strong>
            <span className="text-[10px] font-bold text-slate-400">Kasus</span>
          </div>
          <p className="text-[9px] font-bold text-slate-450 leading-tight">Total usulan klaim denda draf</p>
        </div>

        {/* Card 2: QPR Disetujui */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden group hover:-translate-y-1 hover:shadow-md hover:border-indigo-300 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-600" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Internal Approved</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-650 rounded-lg group-hover:scale-110 transition-transform">
              <UserCheck size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl font-black text-slate-800 font-mono tracking-tight">{totalQprApproved}</strong>
            <span className="text-[10px] font-bold text-slate-400">Selesai</span>
          </div>
          <p className="text-[9px] font-bold text-slate-450 leading-tight">Otorisasi internal disetujui</p>
        </div>

        {/* Card 3: CL Diterbitkan */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden group hover:-translate-y-1 hover:shadow-md hover:border-amber-300 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider">CL Dikirim</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
              <Sparkles size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl font-black text-slate-800 font-mono tracking-tight">{totalClCreated}</strong>
            <span className="text-[10px] font-bold text-slate-400">Surat</span>
          </div>
          <p className="text-[9px] font-bold text-slate-450 leading-tight">Confirmation Letter diterbitkan</p>
        </div>

        {/* Card 4: Close Paid */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden group hover:-translate-y-1 hover:shadow-md hover:border-emerald-300 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Close Paid</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <strong className="text-2xl font-black text-slate-805 font-mono tracking-tight">{totalClosePaid}</strong>
            <span className="text-[10px] font-bold text-slate-400">Lunas</span>
          </div>
          <p className="text-[9px] font-bold text-slate-450 leading-tight">Transaksi denda closed paid</p>
        </div>

      </div>

      {/* Grid Content: Left selection, Right detailed timeline view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: List/Table of documents */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Cari QPR / Supplier..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-800 transition-all shadow-xs"
              />
            </div>
            {/* Status Filter buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 select-none self-start sm:self-auto shadow-xs">
              {(["ALL", "ACTIVE", "CLOSED_PAID"] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === tab
                      ? "bg-white text-indigo-700 shadow-xs border border-slate-200/40"
                      : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  {tab === "ALL" ? "Semua" : tab === "ACTIVE" ? "Aktif" : "Paid"}
                </button>
              ))}
            </div>
          </div>

          {/* Document list container */}
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden flex-1 max-h-[390px] overflow-y-auto bg-slate-50/30 shadow-inner">
            {filteredDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                <AlertCircle size={24} className="stroke-[1.5]" />
                <p className="text-xs italic font-semibold">Tidak ada dokumen yang cocok.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 bg-white">
                {filteredDocs.map(doc => {
                  const isSelected = doc.id === selectedDocId;
                  const totalLt = calculateTotalLeadTime(doc);
                  const sla = getSlaStatus(doc);
                  
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full p-4 text-left transition-all flex justify-between items-center gap-3 border-l-4 font-semibold text-xs cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50/40 border-indigo-600 shadow-xs"
                          : "hover:bg-slate-50/80 border-transparent"
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-800 font-bold font-mono truncate">{doc.docNumber}</strong>
                          <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wide border ${
                            doc.status === "CLOSED_PAID" 
                              ? "bg-green-500/10 text-emerald-700 border-emerald-250/20" 
                              : "bg-amber-500/10 text-amber-700 border-amber-250/20"
                          }`}>
                            {doc.status === "CLOSED_PAID" ? "Closed Paid" : "Active"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold truncate flex items-center gap-1.5">
                          <Building2 size={11} className="text-slate-400" />
                          {doc.supplierName}
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[8.5px] font-extrabold tracking-wide border uppercase ${sla.color}`}>
                          {sla.text}
                        </span>
                        <div className="text-[10px] text-slate-550 font-bold block">
                          Total: <span className="font-extrabold text-slate-850 font-mono">{totalLt} Hari</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Stage Timeline Stepper */}
        {selectedDoc && (
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-6">
            
            {/* Header info for selected document */}
            <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3.5">
              <div>
                <span className="text-[9px] font-black text-indigo-650 uppercase tracking-widest block">Rantai Siklus Dokumen</span>
                <h5 className="text-sm sm:text-base font-black text-slate-800 font-mono tracking-tight mt-0.5">
                  {selectedDoc.docNumber}
                </h5>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                  Supplier / Vendor: <span className="font-extrabold text-slate-700">{selectedDoc.supplierName}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Nilai Kompensasi</span>
                <strong className="text-base font-black text-red-600 tracking-tight font-mono">{selectedDoc.claimAmount}</strong>
              </div>
            </div>

            {/* Stepper container */}
            <div className="relative pl-7 border-l-2 border-slate-100 space-y-6 py-2 text-xs flex-1">
              
              {/* STAGE 1: DRAFTING */}
              <div className="relative">
                {/* Visual node status */}
                <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white ring-4 ring-emerald-500/10 shadow-sm">
                  <Check size={10} className="stroke-[3.5]" />
                </span>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h6 className="font-extrabold text-slate-800">Fase 1: Inisiasi &amp; Draf QPR</h6>
                    <span className="font-mono text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Selesai ({selectedDoc.stages.draft.days} Hari)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                    Pembuatan dokumen draf denda QPR didasarkan pada akumulasi NCR bulanan yang melampaui toleransi (allowance).
                  </p>
                </div>
              </div>

              {/* STAGE 2: INTERNAL APPROVALS */}
              <div className="relative">
                {/* Check node state */}
                {selectedDoc.stages.approvals.status === "APPROVED" ? (
                  <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white ring-4 ring-emerald-500/10 shadow-sm">
                    <Check size={10} className="stroke-[3.5]" />
                  </span>
                ) : selectedDoc.stages.approvals.status === "PENDING" ? (
                  <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white ring-4 ring-blue-500/20 shadow-md animate-pulse">
                    <Clock size={10} className="stroke-[3.5]" />
                  </span>
                ) : (
                  <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-slate-200 text-slate-450 flex items-center justify-center border-2 border-white ring-4 ring-slate-100 shadow-sm" />
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h6 className="font-extrabold text-slate-800">Fase 2: Otorisasi Internal Departemen</h6>
                    {selectedDoc.stages.approvals.status === "APPROVED" ? (
                      <span className="font-mono text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Selesai ({selectedDoc.stages.approvals.days} Hari)
                      </span>
                    ) : selectedDoc.stages.approvals.status === "PENDING" ? (
                      <span className="font-mono text-[9px] font-black text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 animate-pulse">
                        Proses ({selectedDoc.stages.approvals.days} Hari berjalan)
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        Menunggu
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                    Persetujuan berjenjang mulai dari Section Head, Dept Head, hingga tingkat Div Head untuk validasi denda.
                  </p>
                  
                  {/* Visual checklist showing approvals track */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mt-2.5 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-[9.5px] font-bold">
                      <span className="flex items-center gap-1.5 text-slate-650">
                        <UserCheck size={11} className="text-indigo-500/80" />
                        1. Section Head Approval
                      </span>
                      {selectedDoc.stages.approvals.status === "APPROVED" || selectedDoc.requiredRole !== "Section Head" ? (
                        <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                          <CheckCircle2 size={10} /> Disetujui
                        </span>
                      ) : (
                        <span className="text-blue-600 font-extrabold animate-pulse">Sedang Diajukan</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[9.5px] font-bold border-t border-slate-200/60 pt-2">
                      <span className="flex items-center gap-1.5 text-slate-650">
                        <UserCheck size={11} className="text-indigo-500/80" />
                        2. Dept Head Approval
                      </span>
                      {selectedDoc.stages.approvals.status === "APPROVED" || (selectedDoc.requiredRole !== "Section Head" && selectedDoc.requiredRole !== "Dept Head") ? (
                        <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                          <CheckCircle2 size={10} /> Disetujui
                        </span>
                      ) : selectedDoc.requiredRole === "Dept Head" ? (
                        <span className="text-blue-600 font-extrabold animate-pulse">Sedang Diajukan</span>
                      ) : (
                        <span className="text-slate-400">Belum Mulai</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[9.5px] font-bold border-t border-slate-200/60 pt-2">
                      <span className="flex items-center gap-1.5 text-slate-650">
                        <UserCheck size={11} className="text-indigo-500/80" />
                        3. Div Head Approval
                      </span>
                      {selectedDoc.stages.approvals.status === "APPROVED" || (selectedDoc.requiredRole === "Purchasing" || selectedDoc.requiredRole === "Closed") ? (
                        <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                          <CheckCircle2 size={10} /> Disetujui
                        </span>
                      ) : selectedDoc.requiredRole === "Div Head" ? (
                        <span className="text-blue-600 font-extrabold animate-pulse">Sedang Diajukan</span>
                      ) : (
                        <span className="text-slate-400">Belum Mulai</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* STAGE 3: CL POSTING */}
              <div className="relative">
                {/* Node state check */}
                {selectedDoc.stages.cl.status === "APPROVED" ? (
                  <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white ring-4 ring-emerald-500/10 shadow-sm">
                    <Check size={10} className="stroke-[3.5]" />
                  </span>
                ) : selectedDoc.stages.cl.status === "PENDING" ? (
                  <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white ring-4 ring-blue-500/20 shadow-md animate-pulse">
                    <Clock size={10} className="stroke-[3.5]" />
                  </span>
                ) : (
                  <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-slate-200 text-slate-455 flex items-center justify-center border-2 border-white ring-4 ring-slate-100 shadow-sm" />
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h6 className="font-extrabold text-slate-800">Fase 3: Konfirmasi Komersial (CL)</h6>
                    {selectedDoc.stages.cl.status === "APPROVED" ? (
                      <span className="font-mono text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Selesai ({selectedDoc.stages.cl.days} Hari)
                      </span>
                    ) : selectedDoc.stages.cl.status === "PENDING" ? (
                      <span className="font-mono text-[9px] font-black text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 animate-pulse">
                        Proses ({selectedDoc.stages.cl.days} Hari berjalan)
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        Menunggu
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                    Pembuatan dan pengiriman Confirmation Letter (Surat Konfirmasi Denda) kepada vendor oleh tim Accounting.
                  </p>
                </div>
              </div>

              {/* STAGE 4: VENDOR SETTLEMENT */}
              <div className="relative">
                {/* Node state check */}
                {selectedDoc.stages.vendor.status === "APPROVED" ? (
                  <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white ring-4 ring-emerald-500/10 shadow-sm">
                    <Check size={10} className="stroke-[3.5]" />
                  </span>
                ) : selectedDoc.stages.vendor.status === "PENDING" ? (
                  <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white ring-4 ring-blue-500/20 shadow-md animate-pulse">
                    <Clock size={10} className="stroke-[3.5]" />
                  </span>
                ) : (
                  <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-slate-200 text-slate-455 flex items-center justify-center border-2 border-white ring-4 ring-slate-100 shadow-sm" />
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h6 className="font-extrabold text-slate-800">Fase 4: Penyelesaian Vendor (PICA &amp; Pembayaran)</h6>
                    {selectedDoc.stages.vendor.status === "APPROVED" ? (
                      <span className="font-mono text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Selesai ({selectedDoc.stages.vendor.days} Hari)
                      </span>
                    ) : selectedDoc.stages.vendor.status === "PENDING" ? (
                      <span className="font-mono text-[9px] font-black text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 animate-pulse">
                        Proses ({selectedDoc.stages.vendor.days} Hari berjalan)
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        Menunggu
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                    Vendor menyubmit Laporan PICA perbaikan mutu serta memilih metode denda (Potong Tagihan / Transfer).
                  </p>
                </div>
              </div>

              {/* STAGE 5: CLOSED PAID */}
              <div className="relative">
                {/* Node state check */}
                {selectedDoc.stages.closePaid.status === "APPROVED" ? (
                  <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white ring-4 ring-emerald-500/10 shadow-sm">
                    <Check size={10} className="stroke-[3.5]" />
                  </span>
                ) : selectedDoc.stages.closePaid.status === "PENDING" ? (
                  <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white ring-4 ring-blue-500/20 shadow-md animate-pulse">
                    <Clock size={10} className="stroke-[3.5]" />
                  </span>
                ) : (
                  <span className="absolute -left-[36.5px] top-0.5 w-4 h-4 rounded-full bg-slate-200 text-slate-455 flex items-center justify-center border-2 border-white ring-4 ring-slate-100 shadow-sm" />
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h6 className="font-extrabold text-slate-800">Fase 5: Kasus Selesai (Closed Paid)</h6>
                    {selectedDoc.stages.closePaid.status === "APPROVED" ? (
                      <span className="font-mono text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Selesai ({selectedDoc.stages.closePaid.days} Hari)
                      </span>
                    ) : selectedDoc.stages.closePaid.status === "PENDING" ? (
                      <span className="font-mono text-[9px] font-black text-blue-600 bg-blue-505/10 px-2 py-0.5 rounded border border-blue-500/20 animate-pulse">
                        Proses ({selectedDoc.stages.closePaid.days} Hari berjalan)
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        Menunggu
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                    Verifikasi keuangan terhadap bukti potong tagihan / transfer dana subkontraktor dan menutup kasus secara permanen.
                  </p>
                </div>
              </div>

            </div>

            {/* Total SLA comparison statement */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex justify-between items-center text-[10.5px] font-bold text-slate-600 shadow-2xs">
              <span className="flex items-center gap-2">
                <Zap size={14} className="text-indigo-650 animate-pulse" />
                <span>Akumulasi Waktu Siklus:</span>
              </span>
              <span className="text-slate-800">
                <strong className="text-sm font-black font-mono text-indigo-700">{calculateTotalLeadTime(selectedDoc)} Hari</strong> 
                {" "}/ Target SLA: <span className="font-bold text-slate-450 font-mono">15 Hari</span>
              </span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
