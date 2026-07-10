"use client";

import React, { useState } from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
  Sparkles,
  FileCheck
} from "lucide-react";

import ConfirmationLetterPrintPreview from "../role-views/ConfirmationLetterPrintPreview";

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
  // Available Periods
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
  
  // Default is "Juni 2026" (index 5)
  const [periodIndex, setPeriodIndex] = useState(5);
  const activePeriod = periods[periodIndex];

  // Custom mock data config per period
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
      // June contains live states from current session!
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
    "Juli 2026": {
      baselineClosedNcrs: 0, activeNcrs: [], baselineClosedQprs: 0, activeQprs: [],
      aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0,
      claimClosedPaidCount: 0, claimPendingCount: 0, claimRejectedCount: 0,
      dynamicClaimsValue: 0
    },
    "Agustus 2026": {
      baselineClosedNcrs: 0, activeNcrs: [], baselineClosedQprs: 0, activeQprs: [],
      aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0,
      claimClosedPaidCount: 0, claimPendingCount: 0, claimRejectedCount: 0,
      dynamicClaimsValue: 0
    },
    "September 2026": {
      baselineClosedNcrs: 0, activeNcrs: [], baselineClosedQprs: 0, activeQprs: [],
      aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0,
      claimClosedPaidCount: 0, claimPendingCount: 0, claimRejectedCount: 0,
      dynamicClaimsValue: 0
    },
    "Oktober 2026": {
      baselineClosedNcrs: 0, activeNcrs: [], baselineClosedQprs: 0, activeQprs: [],
      aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0,
      claimClosedPaidCount: 0, claimPendingCount: 0, claimRejectedCount: 0,
      dynamicClaimsValue: 0
    },
    "November 2026": {
      baselineClosedNcrs: 0, activeNcrs: [], baselineClosedQprs: 0, activeQprs: [],
      aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0,
      claimClosedPaidCount: 0, claimPendingCount: 0, claimRejectedCount: 0,
      dynamicClaimsValue: 0
    },
    "Desember 2026": {
      baselineClosedNcrs: 0, activeNcrs: [], baselineClosedQprs: 0, activeQprs: [],
      aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0,
      claimClosedPaidCount: 0, claimPendingCount: 0, claimRejectedCount: 0,
      dynamicClaimsValue: 0
    }
  };

  const currentConfig = periodConfig[activePeriod] || periodConfig["Juni 2026"];

  // Configurable Baseline (historical data) to merge with live state
  const baselineClosedNcrs = currentConfig.baselineClosedNcrs;
  const baselineClosedQprs = currentConfig.baselineClosedQprs;
  
  // Dynamic metrics from current application state
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

  // Let's compute Claim statistics
  const aprilClaims = currentConfig.aprilClaims;
  const mayClaimsClosed = currentConfig.mayClaimsClosed;
  const mayClaimsPending = currentConfig.mayClaimsPending;
  const dynamicClaimsValue = currentConfig.dynamicClaimsValue;

  const totalClaimsVal = aprilClaims + mayClaimsClosed + mayClaimsPending + dynamicClaimsValue;

  // Breakdown of Claims by Workflow Status
  const claimClosedPaidCount = currentConfig.claimClosedPaidCount;
  const claimPendingCount = currentConfig.claimPendingCount;
  const claimRejectedCount = currentConfig.claimRejectedCount;
  const totalClaimsCount = claimClosedPaidCount + claimPendingCount + claimRejectedCount;

  // Helper for rendering SVG donut charts
  const renderDonutChart = (
    total: number,
    slices: { value: number; color: string; label: string }[],
    centerText: string
  ) => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius; // ~238.76
    let accumulatedPercent = 0;

    return (
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth="10"
          />
          {/* Dynamic Slices */}
          {slices.map((slice, idx) => {
            if (slice.value === 0 || total === 0) return null;
            const percentage = (slice.value / total) * 100;
            const strokeLength = (percentage / 100) * circumference;
            const strokeOffset = circumference - strokeLength + (accumulatedPercent / 100) * circumference;
            accumulatedPercent += percentage;

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth="10"
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out hover:stroke-[12px] cursor-pointer"
                title={`${slice.label}: ${slice.value} (${Math.round(percentage)}%)`}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-slate-800 leading-none">{centerText}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dokumen</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 text-white rounded-lg"><Sparkles size={16} /></span>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Pipeline Status Akhir</h3>
          </div>
          <p className="text-xs text-slate-550 mt-1 font-semibold">
            Dashboard Utama Pemantauan Terintegrasi NCR/NQR, QPR, dan Status Klaim Finansial.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={() => setPeriodIndex(prev => Math.max(0, prev - 1))}
            disabled={periodIndex === 0}
            className="p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all active:scale-90 shadow-sm flex items-center justify-center"
            title="Periode Sebelumnya"
          >
            <ChevronLeft size={14} className="stroke-[2.5]" />
          </button>
          
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm select-none">
            <Calendar size={14} className="text-blue-500" />
            <span>Periode Evaluasi: {activePeriod}</span>
          </div>

          <button 
            type="button"
            onClick={() => setPeriodIndex(prev => Math.min(periods.length - 1, prev + 1))}
            disabled={periodIndex === periods.length - 1}
            className="p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all active:scale-90 shadow-sm flex items-center justify-center"
            title="Periode Selanjutnya"
          >
            <ChevronRight size={14} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-4.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Temuan NCR</span>
            <h4 className="text-2xl font-black text-slate-800">{totalNcrs}</h4>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
              {totalActiveNcrs} Aktif / Butuh Approval
            </span>
          </div>
          <div className="w-11 h-11 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 rounded-xl flex items-center justify-center transition-all duration-300">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Internal QPR Drafts</span>
            <h4 className="text-2xl font-black text-slate-800">{totalQprs}</h4>
            <span className="text-[10px] font-semibold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
              {qprInProgress} Menunggu Approval
            </span>
          </div>
          <div className="w-11 h-11 bg-indigo-50 group-hover:bg-indigo-650 group-hover:text-white text-indigo-600 rounded-xl flex items-center justify-center transition-all duration-300">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sudah di Klaim</span>
            <h4 className="text-2xl font-black text-slate-800">{claimClosedPaidCount}</h4>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
              Closed Paid
            </span>
          </div>
          <div className="w-11 h-11 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white text-emerald-600 rounded-xl flex items-center justify-center transition-all duration-300">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Belum di Klaim</span>
            <h4 className="text-2xl font-black text-slate-800">{claimPendingCount}</h4>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
              Waiting / Pending
            </span>
          </div>
          <div className="w-11 h-11 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white text-amber-600 rounded-xl flex items-center justify-center transition-all duration-300">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations (3 Donut Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* NCR / NQR Donut Card */}
        <div className="bg-white border border-slate-150 rounded-xl shadow-sm p-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <h4 className="text-sm font-black text-slate-800">Status NCR / NQR</h4>
            </div>
            <button 
              onClick={() => setActiveTab("approve-ncr")} 
              className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Kamus Status
              <ChevronRight size={10} />
            </button>
          </div>

          {renderDonutChart(
            totalNcrs,
            [
              { value: ncrClosed, color: "#10b981", label: "Selesai (Closed)" },
              { value: ncrInProgress, color: "#f59e0b", label: "Sedang Diproses" }
            ],
            totalNcrs.toString()
          )}

          <div className="w-full mt-6 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="text-slate-500">Total Dokumen</span>
              </div>
              <span className="text-slate-800 font-bold">{totalNcrs} <span className="text-[10px] text-slate-400 font-normal">100%</span></span>
            </div>
            
            <div className="flex justify-between items-center text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-500">Sedang Diproses</span>
              </div>
              <span className="text-slate-800 font-bold">
                {ncrInProgress} <span className="text-[10px] text-slate-400 font-normal">{Math.round((ncrInProgress / totalNcrs) * 100)}%</span>
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-500">Selesai (Closed)</span>
              </div>
              <span className="text-slate-800 font-bold">
                {ncrClosed} <span className="text-[10px] text-slate-400 font-normal">{Math.round((ncrClosed / totalNcrs) * 100)}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* QPR Donut Card */}
        <div className="bg-white border border-slate-150 rounded-xl shadow-sm p-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <h4 className="text-sm font-black text-slate-800">Status Internal QPR</h4>
            </div>
            <button 
              onClick={() => setActiveTab("approve-qpr")} 
              className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Kamus Status
              <ChevronRight size={10} />
            </button>
          </div>

          {renderDonutChart(
            totalQprs,
            [
              { value: qprClosed, color: "#10b981", label: "Selesai Disetujui" },
              { value: qprInProgress, color: "#f59e0b", label: "Sedang Diproses" }
            ],
            totalQprs.toString()
          )}

          <div className="w-full mt-6 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="text-slate-500">Total Dokumen QPR</span>
              </div>
              <span className="text-slate-800 font-bold">{totalQprs} <span className="text-[10px] text-slate-400 font-normal">100%</span></span>
            </div>
            
            <div className="flex justify-between items-center text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-500">Sedang Diproses</span>
              </div>
              <span className="text-slate-800 font-bold">
                {qprInProgress} <span className="text-[10px] text-slate-400 font-normal">{Math.round((qprInProgress / totalQprs) * 100)}%</span>
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-500">Selesai Disetujui</span>
              </div>
              <span className="text-slate-800 font-bold">
                {qprClosed} <span className="text-[10px] text-slate-400 font-normal">{Math.round((qprClosed / totalQprs) * 100)}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Claim Donut Card */}
        <div className="bg-white border border-slate-150 rounded-xl shadow-sm p-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h4 className="text-sm font-black text-slate-800">Status Klaim Bulanan</h4>
            </div>
            <button 
              onClick={() => setActiveTab("list-qpr")} 
              className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Kamus Status
              <ChevronRight size={10} />
            </button>
          </div>

          {renderDonutChart(
            totalClaimsCount,
            [
              { value: claimClosedPaidCount, color: "#10b981", label: "Closed Paid" },
              { value: claimPendingCount, color: "#f59e0b", label: "Tunggu Keuangan" }
            ],
            totalClaimsCount.toString()
          )}

          <div className="w-full mt-6 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="text-slate-500">Total Transaksi Klaim</span>
              </div>
              <span className="text-slate-800 font-bold">{totalClaimsCount} <span className="text-[10px] text-slate-400 font-normal">100%</span></span>
            </div>
            
            <div className="flex justify-between items-center text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-500">Tunggu Keuangan (Finance)</span>
              </div>
              <span className="text-slate-800 font-bold">
                {claimPendingCount} <span className="text-[10px] text-slate-400 font-normal">{Math.round((claimPendingCount / totalClaimsCount) * 100)}%</span>
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-500">Harga Terinput</span>
              </div>
              <span className="text-slate-800 font-bold">
                {claimClosedPaidCount} <span className="text-[10px] text-slate-400 font-normal">{Math.round((claimClosedPaidCount / totalClaimsCount) * 100)}%</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Claim Value Breakdown & Workflow Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar chart for claim bulanan */}
        <div className="lg:col-span-2 bg-white border border-slate-150 rounded-xl shadow-sm p-6 flex flex-col text-left space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-650" />
              <h4 className="text-sm font-black text-slate-800">Trend Status Klaim Finansial Bulanan</h4>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun 2026</span>
          </div>

          <div className="h-56 flex items-end justify-between px-6 pt-4 gap-8">
            {/* April */}
            <div className="flex flex-col items-center flex-1 space-y-2 h-full justify-end group">
              <div className="text-[10px] font-extrabold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Rp 18.2M
              </div>
              <div 
                className="w-full bg-emerald-400 hover:bg-emerald-550 rounded-t-lg transition-all duration-300 relative shadow-sm"
                style={{ height: "40%" }}
              >
                <div className="absolute top-2 left-0 right-0 text-[8px] font-black text-white text-center">Deduction</div>
              </div>
              <span className="text-xs font-bold text-slate-600">April</span>
            </div>

            {/* May */}
            <div className="flex flex-col items-center flex-1 space-y-2 h-full justify-end group">
              <div className="text-[10px] font-extrabold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Rp 36.5M
              </div>
              <div 
                className="w-full bg-blue-500 hover:bg-blue-600 rounded-t-lg transition-all duration-300 relative shadow-sm"
                style={{ height: "80%" }}
              >
                <div className="absolute top-2 left-0 right-0 text-[8px] font-black text-white text-center">Deduction + Cash</div>
              </div>
              <span className="text-xs font-bold text-slate-600">Mei</span>
            </div>

            {/* June */}
            <div className="flex flex-col items-center flex-1 space-y-2 h-full justify-end group">
              <div className="text-[10px] font-extrabold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Rp {dynamicClaimsValue > 0 ? (dynamicClaimsValue / 1000000).toFixed(1) : "0"}M
              </div>
              <div 
                className="w-full bg-amber-400 hover:bg-amber-500 rounded-t-lg transition-all duration-300 relative shadow-sm animate-pulse-ring"
                style={{ height: dynamicClaimsValue > 0 ? "50%" : "8%" }}
              >
                <div className="absolute top-2 left-0 right-0 text-[8px] font-black text-white text-center">
                  {dynamicClaimsValue > 0 ? "Otorisasi..." : "Draf QPR"}
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600">Juni</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between text-xs gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-400 inline-block"></span>
              <span className="text-slate-500 font-semibold">April: Rp 18.200.000 (Closed Paid)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>
              <span className="text-slate-500 font-semibold">Mei: Rp 36.500.000 (Selesai & Tunggu Vendor)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block"></span>
              <span className="text-slate-500 font-semibold">Juni: Rp {dynamicClaimsValue.toLocaleString("id-ID")} (Dynamic Draft)</span>
            </div>
          </div>
        </div>

        {/* Claim Status Workflow Breakdown Card */}
        <div className="bg-white border border-slate-150 rounded-xl shadow-sm p-6 flex flex-col text-left space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            <h4 className="text-sm font-black text-slate-800">Workflow & Status Klaim</h4>
          </div>

          <div className="space-y-4 pt-2">
            {/* Approved / Paid */}
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-800">Approved & Closed Paid</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Denda lunas / terpotong tagihan.</p>
                </div>
              </div>
              <span className="text-sm font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-md">
                {claimClosedPaidCount}
              </span>
            </div>

            {/* Pending Workflow */}
            <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                  ⋯
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-800">Pending / Waiting Decision</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Menunggu respon vendor & approval.</p>
                </div>
              </div>
              <span className="text-sm font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-md">
                {claimPendingCount}
              </span>
            </div>

            {/* Rejected / Cancelled */}
            <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold">
                  ✕
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-800">Rejected / Ditolak</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Dispute / Negosiasi ulang denda.</p>
                </div>
              </div>
              <span className="text-sm font-black text-rose-600 bg-rose-100 px-3 py-1 rounded-md">
                {claimRejectedCount}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Letter Monitoring Card */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-sm p-6 text-left space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <FileCheck size={18} className="text-indigo-600" />
              <h4 className="text-sm font-black text-slate-800 font-sans">Status & Pemantauan Confirmation Letter (CL) Vendor</h4>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
              Surat konfirmasi denda finansial yang telah dikirim ke vendor untuk proses otorisasi.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("confirmation-letter")}
            className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer self-start sm:self-auto"
          >
            Kelola & Kirim CL
            <ChevronRight size={10} />
          </button>
        </div>

        {/* Small CL Stats Grid */}
        <div className="grid grid-cols-3 gap-4 py-1">
          <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/50 text-left">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Terkirim</span>
            <strong className="text-base font-black text-indigo-700">{confirmationLetters.length}</strong>
          </div>
          <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50 text-left">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Sudah di-Approval</span>
            <strong className="text-base font-black text-emerald-700">
              {confirmationLetters.filter((cl: any) => cl.status === "APPROVED").length}
            </strong>
          </div>
          <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50 text-left">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Belum di-Approval</span>
            <strong className="text-base font-black text-amber-700">
              {confirmationLetters.filter((cl: any) => cl.status === "PENDING").length}
            </strong>
          </div>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs text-left text-slate-500">
            <thead className="text-[10px] text-slate-450 bg-slate-50 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-2.5">No. Confirmation Letter</th>
                <th className="px-4 py-2.5">Vendor / Supplier</th>
                <th className="px-4 py-2.5">Nilai Klaim</th>
                <th className="px-4 py-2.5 text-center">AOP Internal Memo</th>
                <th className="px-4 py-2.5 text-center">Status Approval Vendor</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {confirmationLetters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-450 italic font-semibold">
                    Belum ada Confirmation Letter terkirim.
                  </td>
                </tr>
              ) : (
                confirmationLetters.map((cl: any) => (
                  <tr key={cl.id} className="hover:bg-slate-50 transition-colors font-semibold">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{cl.clNumber}</td>
                    <td className="px-4 py-2.5 text-slate-700 font-bold">{cl.supplierName}</td>
                    <td className="px-4 py-2.5 text-red-600 font-extrabold">{cl.amount}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-55 border border-blue-150 text-blue-800 text-[9px] font-bold">
                        {cl.memoStatus === "SENT_AOP" ? "Sent to AOP" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {cl.status === "APPROVED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold">
                          <CheckCircle2 size={10} className="text-green-600" />
                          Sudah di-Approval
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                          <Clock size={10} className="text-amber-600 animate-pulse" />
                          Belum di-Approval
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2 font-sans">
                        <button
                          onClick={() => setPreviewClDoc(cl)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-750 text-white font-bold rounded text-[10px] shadow-sm cursor-pointer border border-blue-700 hover:scale-105 transition-all"
                          title="Lihat Confirmation Letter PDF"
                        >
                          Lihat PDF
                        </button>
                        {cl.status === "PENDING" && setConfirmationLetters && (
                          <button
                            onClick={() => {
                              setConfirmationLetters(prev => prev.map(item => 
                                item.id === cl.id ? { ...item, status: "APPROVED" } : item
                              ));
                              alert(`Simulasi persetujuan vendor sukses untuk ${cl.clNumber}!`);
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] shadow-sm cursor-pointer border border-emerald-750 hover:scale-105 transition-all"
                            title="Simulasikan approval dari vendor"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => {
                            alert(`Reminder untuk ${cl.clNumber} berhasil dikirim ulang!`);
                            if (setConfirmationLetters) {
                              setConfirmationLetters(prev => prev.map(item => 
                                item.id === cl.id ? { ...item, reminderSentCount: item.reminderSentCount + 1 } : item
                              ));
                            }
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-350 font-bold rounded text-[10px] cursor-pointer hover:scale-105 transition-all"
                          title={`Kirim reminder email (Terkirim: ${cl.reminderSentCount}x)`}
                        >
                          Remind
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Items List (Integrated Action Center) */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-sm p-6 text-left space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <h4 className="text-sm font-black text-slate-800">Daftar Tunggu Tindakan Otorisasi (Action Items)</h4>
          </div>
          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {pendingNcrs.length + pendingQprs.length} Tindakan Butuh Perhatian
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-500">
            <thead className="text-[10px] text-slate-400 bg-slate-50 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">No. Dokumen</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Supplier / Vendor</th>
                <th className="px-4 py-3">Status Pipeline</th>
                <th className="px-4 py-3">Otoritas yang Dibutuhkan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingNcrs.map(ncr => (
                <tr key={ncr.id} className="hover:bg-slate-50 transition-colors font-semibold">
                  <td className="px-4 py-3.5 font-bold text-slate-800">{ncr.ncrNumber}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">NCR / NQR</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-bold">{ncr.supplierName}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase">
                      Tunggu Approval
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-600">Role: {ncr.requiredRole}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setActiveTab("approve-ncr")}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-750 text-white rounded text-[10px] font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1 ml-auto cursor-pointer"
                    >
                      Otorisasi
                      <ArrowRight size={10} />
                    </button>
                  </td>
                </tr>
              ))}

              {pendingQprs.map(qpr => (
                <tr key={qpr.id} className="hover:bg-slate-50 transition-colors font-semibold">
                  <td className="px-4 py-3.5 font-bold text-slate-800">{qpr.qprNumber}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">QPR Claim</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-bold">{qpr.supplierName}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase">
                      Tunggu Approval
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-600">Role: {qpr.requiredRole}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setActiveTab("approve-qpr")}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1 ml-auto cursor-pointer"
                    >
                      Otorisasi
                      <ArrowRight size={10} />
                    </button>
                  </td>
                </tr>
              ))}

              {pendingNcrs.length === 0 && pendingQprs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                    Tidak ada dokumen yang menunggu tindakan approval Anda saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewClDoc && (
        <ConfirmationLetterPrintPreview
          cl={previewClDoc}
          onClose={() => setPreviewClDoc(null)}
        />
      )}

    </div>
  );
}
