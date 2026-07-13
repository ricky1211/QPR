"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Activity,
  UserCheck,
  Search,
  Sparkles,
  ShieldAlert,
  Layers,
  FileCheck,
  CheckCircle2,
  Clock,
  X,
  Eye
} from "lucide-react";

import ConfirmationLetterPrintPreview from "../role-views/ConfirmationLetterPrintPreview";

interface PipelineStage {
  name: string;
  status: "APPROVED" | "PENDING" | "UPCOMING";
}

const getDocPipelineStages = (
  type: string,
  requiredRole?: string,
  status?: string
): PipelineStage[] => {
  const isApproved = status === "APPROVED" || status === "CLOSED" || status === "CLOSED_PAID" || requiredRole === "Closed";

  if (type === "NCR") {
    const chain = ["QC Staff", "SPV QA", "MNG QA"];
    if (isApproved) return chain.map(name => ({ name, status: "APPROVED" }));
    let currentIndex = 0;
    if (requiredRole === "Section Head") currentIndex = 1;
    if (requiredRole === "Dept Head") currentIndex = 2;

    return chain.map((name, idx) => {
      if (idx < currentIndex) return { name, status: "APPROVED" };
      if (idx === currentIndex) return { name, status: "PENDING" };
      return { name, status: "UPCOMING" };
    });
  } else if (type === "QPR") {
    const chain = ["Sec. Head", "Dept. Head", "Div. Head", "Accounting"];
    if (isApproved) return chain.map(name => ({ name, status: "APPROVED" }));
    let currentIndex = 0;
    if (requiredRole === "Dept Head") currentIndex = 1;
    if (requiredRole === "Div Head") currentIndex = 2;
    if (requiredRole === "Accounting") currentIndex = 3;

    return chain.map((name, idx) => {
      if (idx < currentIndex) return { name, status: "APPROVED" };
      if (idx === currentIndex) return { name, status: "PENDING" };
      return { name, status: "UPCOMING" };
    });
  } else {
    // Confirmation Letter (CL)
    const chain = ["Vendor Conf.", "Accounting"];
    if (isApproved) return chain.map(name => ({ name, status: "APPROVED" }));
    let currentIndex = 0;
    if (requiredRole === "Accounting Approval") currentIndex = 1;

    return chain.map((name, idx) => {
      if (idx < currentIndex) return { name, status: "APPROVED" };
      if (idx === currentIndex) return { name, status: "PENDING" };
      return { name, status: "UPCOMING" };
    });
  }
};

interface DashboardProps {
  pendingNcrs: any[];
  pendingQprs: any[];
  parts: any[];
  setActiveTab: (tab: string) => void;
  confirmationLetters?: any[];
  setConfirmationLetters?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function Dashboard({
  pendingNcrs,
  pendingQprs,
  parts,
  setActiveTab,
  confirmationLetters = [],
  setConfirmationLetters
}: DashboardProps) {
  const [previewClDoc, setPreviewClDoc] = useState<any | null>(null);
  const [selectedRoleCard, setSelectedRoleCard] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedPipelineDoc, setSelectedPipelineDoc] = useState<any | null>(null);

  const periods = [
    "Januari 2026",
    "Februari 2026",
    "Maret 2026",
    "April 2026",
    "Mei 2026",
    "Juni 2026",
    "Juli 2026",
    "Agustus 2026",
    "September 2026",
    "Oktober 2026",
    "November 2026",
    "Desember 2026"
  ];
  
  const [periodIndex, setPeriodIndex] = useState(5);
  const activePeriod = periods[periodIndex];

  const periodConfig: { [key: string]: any } = {
    "Januari 2026": {
      baselineClosedNcrs: 8, activeNcrs: [], baselineClosedQprs: 2, activeQprs: [],
      aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0,
      claimClosedPaidCount: 2, claimPendingCount: 0, claimRejectedCount: 0,
      dynamicClaimsValue: 12000000
    },
    "Februari 2026": {
      baselineClosedNcrs: 11, activeNcrs: [], baselineClosedQprs: 3, activeQprs: [],
      aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0,
      claimClosedPaidCount: 3, claimPendingCount: 0, claimRejectedCount: 1,
      dynamicClaimsValue: 15500000
    },
    "Maret 2026": {
      baselineClosedNcrs: 14, activeNcrs: [], baselineClosedQprs: 4, activeQprs: [],
      aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0,
      claimClosedPaidCount: 4, claimPendingCount: 0, claimRejectedCount: 0,
      dynamicClaimsValue: 18000000
    },
    "April 2026": {
      baselineClosedNcrs: 18, activeNcrs: [], baselineClosedQprs: 5, activeQprs: [],
      aprilClaims: 18200000, mayClaimsClosed: 0, mayClaimsPending: 0,
      claimClosedPaidCount: 1, claimPendingCount: 0, claimRejectedCount: 0,
      dynamicClaimsValue: 0
    },
    "Mei 2026": {
      baselineClosedNcrs: 15, activeNcrs: [], baselineClosedQprs: 7, activeQprs: [],
      aprilClaims: 0, mayClaimsClosed: 24000000, mayClaimsPending: 12500000,
      claimClosedPaidCount: 1, claimPendingCount: 1, claimRejectedCount: 0,
      dynamicClaimsValue: 0
    },
    "Juni 2026": {
      baselineClosedNcrs: 20,
      activeNcrs: pendingNcrs,
      baselineClosedQprs: 0,
      activeQprs: pendingQprs,
      aprilClaims: 0,
      mayClaimsClosed: 0,
      mayClaimsPending: 0,
      claimClosedPaidCount: 2,
      claimPendingCount: 1 + pendingQprs.length,
      claimRejectedCount: 0,
      dynamicClaimsValue: pendingQprs.reduce((acc, q) => acc + parseInt(q.claimAmount?.replace(/[^0-9]/g, "") || "0", 10), 0)
    },
    "Juli 2026": { baselineClosedNcrs: 0, activeNcrs: [], baselineClosedQprs: 0, activeQprs: [], aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0, claimClosedPaidCount: 0, claimPendingCount: 0, claimRejectedCount: 0, dynamicClaimsValue: 0 },
    "Agustus 2026": { baselineClosedNcrs: 0, activeNcrs: [], baselineClosedQprs: 0, activeQprs: [], aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0, claimClosedPaidCount: 0, claimPendingCount: 0, claimRejectedCount: 0, dynamicClaimsValue: 0 },
    "September 2026": { baselineClosedNcrs: 0, activeNcrs: [], baselineClosedQprs: 0, activeQprs: [], aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0, claimClosedPaidCount: 0, claimPendingCount: 0, claimRejectedCount: 0, dynamicClaimsValue: 0 },
    "Oktober 2026": { baselineClosedNcrs: 0, activeNcrs: [], baselineClosedQprs: 0, activeQprs: [], aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0, claimClosedPaidCount: 0, claimPendingCount: 0, claimRejectedCount: 0, dynamicClaimsValue: 0 },
    "November 2026": { baselineClosedNcrs: 0, activeNcrs: [], baselineClosedQprs: 0, activeQprs: [], aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0, claimClosedPaidCount: 0, claimPendingCount: 0, claimRejectedCount: 0, dynamicClaimsValue: 0 },
    "Desember 2026": { baselineClosedNcrs: 0, activeNcrs: [], baselineClosedQprs: 0, activeQprs: [], aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0, claimClosedPaidCount: 0, claimPendingCount: 0, claimRejectedCount: 0, dynamicClaimsValue: 0 }
  };

  const currentConfig = periodConfig[activePeriod] || periodConfig["Juni 2026"];
  const baselineClosedNcrs = currentConfig.baselineClosedNcrs;
  const baselineClosedQprs = currentConfig.baselineClosedQprs;
  
  const currentActiveNcrs = currentConfig.activeNcrs;
  const totalActiveNcrs = currentActiveNcrs.length;
  const totalNcrs = baselineClosedNcrs + totalActiveNcrs;
  const ncrInProgress = currentActiveNcrs.filter((n: any) => n.status === "WAITING_APPROVAL").length;
  const ncrClosed = totalNcrs - ncrInProgress;

  const currentActiveQprs = currentConfig.activeQprs;
  const totalActiveQprs = currentActiveQprs.length;
  const totalQprs = baselineClosedQprs + totalActiveQprs;
  const qprInProgress = currentActiveQprs.filter((q: any) => q.status === "WAITING_APPROVAL").length;
  const qprClosed = totalQprs - qprInProgress;

  const aprilClaims = currentConfig.aprilClaims;
  const mayClaimsClosed = currentConfig.mayClaimsClosed;
  const mayClaimsPending = currentConfig.mayClaimsPending;
  const dynamicClaimsValue = currentConfig.dynamicClaimsValue;
  const totalClaimsVal = aprilClaims + mayClaimsClosed + mayClaimsPending + dynamicClaimsValue;

  const claimClosedPaidCount = currentConfig.claimClosedPaidCount;
  const claimPendingCount = currentConfig.claimPendingCount;
  const claimRejectedCount = currentConfig.claimRejectedCount;
  const totalClaimsCount = claimClosedPaidCount + claimPendingCount + claimRejectedCount;

  // Helper to calculate elapsed days dynamically
  const getDocLeadTimes = (doc: any) => {
    const docDate = new Date(doc.date || doc.dateSent || "2026-07-01");
    const today = new Date("2026-07-10");
    const diffTime = Math.abs(today.getTime() - docDate.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    if (doc.clNumber) {
      // It is a Confirmation Letter! Lead time is diffDays
      return {
        roles: ["Accounting"],
        leadTimes: {
          "Accounting": { days: diffDays, status: "PENDING" as const }
        },
        totalLeadTime: diffDays
      };
    }

    if (doc.qprNumber) {
      const roles = ["Section Head", "Dept Head", "Div Head"];
      const currentRole = doc.requiredRole;
      const leadTimes: Record<string, { days: number; status: "APPROVED" | "PENDING" | "UPCOMING" }> = {};
      let currentIdx = roles.indexOf(currentRole);
      if (currentIdx === -1) currentIdx = 0;

      roles.forEach((role, idx) => {
        if (idx < currentIdx) {
          leadTimes[role] = { days: Math.min(3, Math.max(1, idx + 1)), status: "APPROVED" };
        } else if (idx === currentIdx) {
          const approvedSum = idx === 0 ? 0 : Array.from({ length: idx }, (_, i) => Math.min(3, Math.max(1, i + 1))).reduce((a, b) => a + b, 0);
          leadTimes[role] = { days: Math.max(1, diffDays - approvedSum), status: "PENDING" };
        } else {
          leadTimes[role] = { days: 0, status: "UPCOMING" };
        }
      });
      const totalLeadTime = Object.values(leadTimes).reduce((sum, item) => sum + item.days, 0);
      return { roles, leadTimes, totalLeadTime };
    } else {
      const roles = ["QC Staff", "Section Head", "Dept Head"];
      const currentRole = doc.requiredRole || "Section Head";
      const leadTimes: Record<string, { days: number; status: "APPROVED" | "PENDING" | "UPCOMING" }> = {};
      let currentIdx = roles.indexOf(currentRole);
      if (currentIdx === -1) currentIdx = 1;

      roles.forEach((role, idx) => {
        if (idx < currentIdx) {
          leadTimes[role] = { days: Math.min(2, idx + 1), status: "APPROVED" };
        } else if (idx === currentIdx) {
          const approvedSum = idx === 0 ? 0 : Array.from({ length: idx }, (_, i) => Math.min(2, i + 1)).reduce((a, b) => a + b, 0);
          leadTimes[role] = { days: Math.max(1, diffDays - approvedSum), status: "PENDING" };
        } else {
          leadTimes[role] = { days: 0, status: "UPCOMING" };
        }
      });
      const totalLeadTime = Object.values(leadTimes).reduce((sum, item) => sum + item.days, 0);
      return { roles, leadTimes, totalLeadTime };
    }
  };

  // Define authorization roles for lead time cards (Section Head, Dept Head, Div Head, Accounting CL)
  const authRoles = [
    {
      key: "Section Head",
      title: "Section Head",
      qprRoles: ["Section Head"],
      color: "border-teal-200 hover:border-teal-500 bg-teal-50/30 text-teal-800",
      iconColor: "bg-teal-500 text-white",
      type: "QPR"
    },
    {
      key: "Dept Head",
      title: "Dept Head",
      qprRoles: ["Dept Head"],
      color: "border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 text-indigo-800",
      iconColor: "bg-indigo-500 text-white",
      type: "QPR"
    },
    {
      key: "Div Head",
      title: "Div Head",
      qprRoles: ["Div Head"],
      color: "border-amber-200 hover:border-amber-500 bg-amber-50/30 text-amber-800",
      iconColor: "bg-amber-500 text-white",
      type: "QPR"
    },
    {
      key: "Accounting (CL)",
      title: "Accounting (CL)",
      qprRoles: [],
      color: "border-rose-200 hover:border-rose-500 bg-rose-50/30 text-rose-800",
      iconColor: "bg-rose-500 text-white",
      type: "CL"
    }
  ];

  // Helper to extract documents pending for a specific role card
  const getPendingDocsForRole = (role: typeof authRoles[0]) => {
    const docs: any[] = [];
    
    if (role.type === "QPR") {
      pendingQprs.forEach(qpr => {
        if (role.qprRoles.includes(qpr.requiredRole)) {
          const lt = getDocLeadTimes(qpr);
          const daysStuck = lt.leadTimes[qpr.requiredRole]?.days || lt.totalLeadTime;
          docs.push({
            id: qpr.id,
            docNumber: qpr.qprNumber,
            type: "QPR",
            vendor: qpr.supplierName,
            date: qpr.date,
            requiredRole: qpr.requiredRole,
            daysStuck,
            amount: qpr.claimAmount || "-",
            activeTab: "approve-qpr"
          });
        }
      });
    } else if (role.type === "CL") {
      // Show pending Confirmation Letters!
      confirmationLetters.forEach(cl => {
        if (cl.status === "PENDING") {
          const lt = getDocLeadTimes(cl);
          const daysStuck = lt.totalLeadTime;
          docs.push({
            id: cl.id,
            docNumber: cl.clNumber,
            type: "Confirmation Letter",
            vendor: cl.supplierName,
            date: cl.dateSent,
            requiredRole: "Accounting Approval",
            daysStuck,
            amount: cl.amount,
            activeTab: "confirmation-letter"
          });
        }
      });
    }

    return docs;
  };

  // Build the list of all global system pipeline events
  const globalPipelines = [
    ...pendingNcrs.map(n => ({
      id: `ncr-${n.id}`,
      docNumber: n.ncrNumber,
      type: "NCR",
      vendor: n.supplierName,
      date: n.date,
      status: "WAITING_APPROVAL",
      requiredRole: n.requiredRole,
      stage: "Otorisasi Mutu",
      amount: "-"
    })),
    ...pendingQprs.map(q => ({
      id: `qpr-${q.id}`,
      docNumber: q.qprNumber,
      type: "QPR",
      vendor: q.supplierName,
      date: q.date,
      status: "WAITING_APPROVAL",
      requiredRole: q.requiredRole,
      stage: "Klaim Kompensasi",
      amount: q.claimAmount
    })),
    ...confirmationLetters.map(cl => ({
      id: `cl-${cl.id}`,
      docNumber: cl.clNumber,
      type: "Confirmation Letter",
      vendor: cl.supplierName,
      date: cl.dateSent,
      status: cl.status,
      requiredRole: cl.status === "PENDING" ? "Vendor Confirmation" : "Closed",
      stage: "Konfirmasi Komersial",
      amount: cl.amount
    }))
  ];

  // Combined list of all documents with their pipeline stages and lead time status
  const documentPipelineList = [
    ...pendingNcrs.map(n => {
      const lt = getDocLeadTimes(n);
      return {
        id: `ncr-${n.id}`,
        docNumber: n.ncrNumber,
        type: "NCR",
        vendor: n.supplierName,
        date: n.date,
        requiredRole: n.requiredRole,
        status: n.status,
        leadTime: lt.totalLeadTime,
        isClosed: n.status === "APPROVED" || n.status === "CLOSED_PAID"
      };
    }),
    ...pendingQprs.map(q => {
      const lt = getDocLeadTimes(q);
      return {
        id: `qpr-${q.id}`,
        docNumber: q.qprNumber,
        type: "QPR",
        vendor: q.supplierName,
        date: q.date,
        requiredRole: q.requiredRole,
        status: q.status,
        leadTime: lt.totalLeadTime,
        isClosed: q.status === "APPROVED" || q.status === "CLOSED_PAID"
      };
    }),
    ...confirmationLetters.map(cl => {
      const lt = getDocLeadTimes(cl);
      return {
        id: `cl-${cl.id}`,
        docNumber: cl.clNumber,
        type: "CL",
        vendor: cl.supplierName,
        date: cl.dateSent,
        requiredRole: cl.status === "PENDING" ? "Vendor Confirmation" : "Closed",
        status: cl.status,
        leadTime: lt.totalLeadTime,
        isClosed: cl.status === "APPROVED" || cl.status === "CLOSED_PAID"
      };
    })
  ];

  const historicalClosedDocs = [
    {
      id: "hist-1",
      docNumber: "QPR/2026/04/JAYADI",
      type: "QPR",
      vendor: "PT JAYADI",
      date: "2026-04-10",
      requiredRole: "Closed",
      status: "APPROVED",
      leadTime: 12,
      isClosed: true
    },
    {
      id: "hist-2",
      docNumber: "QPR/2026/05/IKAN_BAKAR",
      type: "QPR",
      vendor: "PT IKAN BAKAR",
      date: "2026-05-15",
      requiredRole: "Closed",
      status: "APPROVED",
      leadTime: 11,
      isClosed: true
    },
    {
      id: "hist-3",
      docNumber: "NCR/2026/06/015",
      type: "NCR",
      vendor: "PT IKAN BAKAR",
      date: "2026-06-15",
      requiredRole: "Closed",
      status: "APPROVED",
      leadTime: 8,
      isClosed: true
    }
  ];

  const allDocPipelines = [
    ...documentPipelineList,
    ...historicalClosedDocs
  ];

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 text-white rounded-lg"><Sparkles size={16} /></span>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Dashboard Utama &amp; Global Tracking</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Pemantauan aktivitas real-time, status otorisasi, penumpukan dokumen, dan metrik lead time secara terpadu.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={() => setPeriodIndex(prev => Math.max(0, prev - 1))}
            disabled={periodIndex === 0}
            className="p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all active:scale-90 shadow-sm flex items-center justify-center"
          >
            <ChevronLeft size={14} className="stroke-[2.5] text-slate-500" />
          </button>
          
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-750 shadow-sm select-none">
            <Calendar size={14} className="text-blue-600" />
            <span>Periode: {activePeriod}</span>
          </div>

          <button 
            type="button"
            onClick={() => setPeriodIndex(prev => Math.min(periods.length - 1, prev + 1))}
            disabled={periodIndex === periods.length - 1}
            className="p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all active:scale-90 shadow-sm flex items-center justify-center"
          >
            <ChevronRight size={14} className="stroke-[2.5] text-slate-500" />
          </button>
        </div>
      </div>

      {/* Grid: 5 Lead Time Role Cards (Interactive) */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest block mb-1">
            Status Lead Time &amp; Dokumen Mengendap Berdasarkan Peran Otorisasi
          </h4>
          <p className="text-xs text-slate-500 font-semibold">
            Pilih atau tekan salah satu kartu otorisasi di bawah ini untuk melihat rincian dokumen yang mengendap pada tahapan tersebut.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {authRoles.map((role) => {
            const docs = getPendingDocsForRole(role);
            const totalStuckDocs = docs.length;
            const totalStuckDays = docs.reduce((sum, d) => sum + d.daysStuck, 0);
            const isSelected = selectedRoleCard === role.key;

            return (
              <button
                key={role.key}
                onClick={() => setSelectedRoleCard(isSelected ? null : role.key)}
                className={`border text-left rounded-xl p-4 transition-all duration-200 flex flex-col justify-between h-32 cursor-pointer shadow-sm relative overflow-hidden group ${
                  isSelected 
                    ? "bg-white border-blue-650 ring-2 ring-blue-550/20" 
                    : role.color
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <div className={`w-8 h-8 rounded-lg ${role.iconColor} flex items-center justify-center shadow-sm shrink-0`}>
                    <UserCheck size={16} />
                  </div>
                  <span className="text-[11px] font-black uppercase bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 shadow-sm">
                    Step
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  <h5 className="text-xs font-black text-slate-850 tracking-tight leading-tight truncate group-hover:text-blue-600 transition-colors">
                    {role.title}
                  </h5>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <strong className="text-xl font-black text-slate-900 leading-none">
                      {totalStuckDocs}
                    </strong>
                    <span className="text-xs font-bold text-slate-550">
                      Dokumen Mengendap
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Akumulasi: <span className="font-bold text-red-650">{totalStuckDays} Hari</span>
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute top-0 right-0 w-2 h-full bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Role Card Details Area */}
        {selectedRoleCard && (() => {
          const activeRole = authRoles.find(r => r.key === selectedRoleCard)!;
          const docs = getPendingDocsForRole(activeRole);

          return (
            <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-md animate-in slide-in-from-top-2 duration-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <div>
                  <h5 className="text-xs font-black text-slate-900 uppercase">
                    Rincian Dokumen Mengendap di Otorisasi: {activeRole.title}
                  </h5>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Menampilkan total {docs.length} dokumen yang butuh tindak lanjut otorisasi segera.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRoleCard(null)}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Tutup Rincian
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="text-[10px] text-slate-400 bg-slate-50 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-4 py-2.5 border-b border-slate-100">No. Dokumen</th>
                      <th className="px-4 py-2.5 border-b border-slate-100">Tipe</th>
                      <th className="px-4 py-2.5 border-b border-slate-100">Supplier / Vendor</th>
                      <th className="px-4 py-2.5 border-b border-slate-100">Tgl Pembuatan</th>
                      <th className="px-4 py-2.5 border-b border-slate-100 text-center">Durasi Mengendap</th>
                      <th className="px-4 py-2.5 border-b border-slate-100">Nilai Klaim</th>
                      <th className="px-4 py-2.5 border-b border-slate-100 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                          Tidak ada dokumen yang mengendap pada otorisasi ini.
                        </td>
                      </tr>
                    ) : (
                      docs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors font-semibold">
                          <td className="px-4 py-3 text-slate-900 font-bold font-mono">{doc.docNumber}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              doc.type === "NCR" 
                                ? "bg-blue-50 text-blue-700 border border-blue-100" 
                                : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            }`}>
                              {doc.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-800 font-bold">{doc.vendor}</td>
                          <td className="px-4 py-3 font-mono">{doc.date}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-bold text-[10px]">
                              {doc.daysStuck} Hari
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700">{doc.amount}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setActiveTab(doc.activeTab)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-750 text-white rounded text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                            >
                              Buka Approval
                              <ArrowRight size={10} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Visual Pipeline & Lead Time tracking per document */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-sm p-6 text-left space-y-4">
        <div>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Activity size={16} className="text-blue-650 animate-pulse" />
            Pelacakan Pipeline &amp; Lead Time Durasi per Dokumen
          </h4>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Menampilkan status pelacakan alur otorisasi dokumen beserta akumulasi waktu pengerjaan hingga selesai (Close Paid).
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200 whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3">No. Dokumen</th>
                <th className="px-4 py-3">Vendor / Supplier</th>
                <th className="px-4 py-3 text-center w-24">Tipe</th>
                <th className="px-4 py-3 text-center w-40">Lead Time / Durasi</th>
                <th className="px-4 py-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 whitespace-nowrap">
              {allDocPipelines.map((doc, idx) => {
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/40 transition-colors font-semibold">
                    <td className="px-4 py-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{doc.docNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{doc.vendor}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        doc.type === "NCR" 
                          ? "bg-blue-50 text-blue-700 border border-blue-100" 
                          : doc.type === "QPR" 
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {doc.isClosed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold shadow-sm">
                          <CheckCircle2 size={10} className="text-green-600" />
                          Close Paid: {doc.leadTime} Hari
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold shadow-sm">
                          <Clock size={10} className="text-amber-500" />
                          Aktif: {doc.leadTime} Hari
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedPipelineDoc(doc)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Eye size={12} />
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPipelineDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-zoom-in text-left">
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-150">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200/50">
                  {selectedPipelineDoc.type} Pipeline
                </span>
                <h4 className="text-sm font-black text-slate-805 mt-1.5 font-mono">
                  {selectedPipelineDoc.docNumber}
                </h4>
              </div>
              <button
                onClick={() => setSelectedPipelineDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-205 rounded-lg transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Document Summary Row */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/55 p-4 border border-slate-150 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Vendor / Supplier</span>
                  <strong className="text-sm font-bold text-slate-800 mt-0.5 block">{selectedPipelineDoc.vendor}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Lead Time / Durasi</span>
                  <div className="mt-1">
                    {selectedPipelineDoc.isClosed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-bold">
                        <CheckCircle2 size={11} className="text-green-600" />
                        Close Paid: {selectedPipelineDoc.leadTime} Hari
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold animate-pulse">
                        <Clock size={11} className="text-amber-500" />
                        Aktif: {selectedPipelineDoc.leadTime} Hari
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Approval Stages Visualization */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">Alur Persetujuan Dokumen</span>
                
                <div className="flex flex-col md:flex-row md:items-center gap-2 p-4 bg-white border border-slate-150 rounded-xl overflow-x-auto">
                  {getDocPipelineStages(selectedPipelineDoc.type, selectedPipelineDoc.requiredRole, selectedPipelineDoc.status).map((stage, i, arr) => (
                    <React.Fragment key={i}>
                      <div
                        className={`flex flex-col p-3 rounded-lg border flex-1 min-w-[120px] transition-all ${
                          stage.status === "APPROVED"
                            ? "bg-green-50/40 text-green-800 border-green-200 shadow-sm"
                            : stage.status === "PENDING"
                            ? "bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-100 shadow-sm"
                            : "bg-slate-50 text-slate-400 border-slate-200 border-dashed"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] font-black uppercase tracking-wider">Stage {i + 1}</span>
                          {stage.status === "APPROVED" && <CheckCircle2 size={12} className="text-green-600" />}
                          {stage.status === "PENDING" && <Clock size={12} className="text-amber-500" />}
                        </div>
                        <strong className="text-xs font-bold mt-1.5 leading-tight truncate">{stage.name}</strong>
                        <span className="text-[9px] text-slate-400 font-semibold mt-1 uppercase">
                          {stage.status === "APPROVED" ? "Selesai" : stage.status === "PENDING" ? "Sedang Diproses" : "Belum Mulai"}
                        </span>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="hidden md:flex text-slate-300 font-black text-lg select-none shrink-0 mx-1">→</div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex justify-end gap-3">
              <button
                onClick={() => setSelectedPipelineDoc(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-750 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {previewClDoc && (
        <ConfirmationLetterPrintPreview
          cl={previewClDoc}
          onClose={() => setPreviewClDoc(null)}
        />
      )}

    </div>
  );
}
