"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  X, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  ShieldCheck, 
  ListTodo,
  TrendingDown,
  ArrowRight,
  Shield
} from "lucide-react";
import QprPrintPreview from "./QprPrintPreview";

export default function ApproveQprDashboard({ pendingQprs, handleApproveQprAction }) {
  const [levelTab, setLevelTab] = useState("ppic"); // 'ppic' or 'dept-head'
  const [activeFilterTab, setActiveFilterTab] = useState("all-pending"); // 'all-pending', 'needs-verification', 'returned'
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Advanced Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");

  // Modal states
  const [selectedQpr, setSelectedQpr] = useState<any>(null);
  const [previewQpr, setPreviewQpr] = useState<any>(null);

  // Filter pending QPRs by role
  const roleName = levelTab === "ppic" ? "PPIC Staff" : "Dept Head";
  const rolePendingQprs = pendingQprs.filter((q) => q.requiredRole === roleName);

  // Filter based on search query & advanced filters
  const filteredQprs = rolePendingQprs.filter((qpr) => {
    // 1. Search filter
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      qpr.qprNumber.toLowerCase().includes(q) ||
      qpr.supplierName.toLowerCase().includes(q) ||
      qpr.period.toLowerCase().includes(q);

    // 2. Tab filter
    let matchesTab = true;
    if (activeFilterTab === "needs-verification") {
      matchesTab = qpr.status === "WAITING_APPROVAL";
    } else if (activeFilterTab === "returned") {
      matchesTab = false;
    }

    // 3. Supplier filter
    const matchesSupplier = selectedSupplier === "ALL" || qpr.supplierName === selectedSupplier;

    // 4. Period filter
    const matchesPeriod = selectedPeriod === "ALL" || qpr.period === selectedPeriod;

    // 5. Severity filter
    let severity = "LOW";
    if (qpr.rejectItems > 20) severity = "CRITICAL";
    else if (qpr.rejectItems > 10) severity = "MEDIUM";
    const matchesSeverity = selectedSeverity === "ALL" || severity === selectedSeverity;

    return matchesSearch && matchesTab && matchesSupplier && matchesPeriod && matchesSeverity;
  });

  // Pagination config
  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(filteredQprs.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQprs.slice(indexOfFirstItem, indexOfLastItem);

  // CSV Export handler
  const handleExportList = () => {
    if (filteredQprs.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = ["ID Report", "SupplierName", "Period", "Total Items", "Reject Items", "Allowance Ratio", "Claim Amount", "Date", "Status"];
    const csvRows = [
      headers.join(","),
      ...filteredQprs.map(q => [
        `"${q.qprNumber}"`,
        `"${q.supplierName}"`,
        `"${q.period}"`,
        q.totalItems,
        q.rejectItems,
        `"${q.allowanceRatio}"`,
        `"${q.claimAmount}"`,
        `"${q.date}"`,
        `"${q.status}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `QPR_Approvals_Export_${levelTab.toUpperCase()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date helper (e.g. 2026-06-10 -> 10 Jun 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${day} ${months[monthIndex]} ${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Role Switcher & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white border border-slate-100 rounded-lg shadow-sm gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Approval QPR</h3>
          <p className="text-xs text-slate-455 mt-1">Review and authorize Quality Problem Reports for final submission.</p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {/* Toggle Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button
              onClick={() => {
                setLevelTab("ppic");
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                levelTab === "ppic" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              PPIC Staff
            </button>
            <button
              onClick={() => {
                setLevelTab("dept-head");
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                levelTab === "dept-head" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Dept Head
            </button>
          </div>

          {/* Action buttons matching screenshot */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-[11px] font-bold shadow-sm transition-all cursor-pointer ${
              isFilterOpen 
                ? "border-blue-600 bg-blue-50 text-blue-600"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            }`}
          >
            <Filter size={11} />
            Filters
            {(selectedSupplier !== "ALL" || selectedPeriod !== "ALL" || selectedSeverity !== "ALL") && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={handleExportList}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Download size={11} />
            Export List
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {isFilterOpen && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-left animate-slide-down">
          {/* 1. Supplier Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => {
                setSelectedSupplier(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-bold text-slate-800 cursor-pointer h-9"
            >
              <option value="ALL">ALL SUPPLIERS</option>
              {Array.from(new Set(rolePendingQprs.map(q => q.supplierName))).map(sup => (
                <option key={String(sup)} value={String(sup)}>{String(sup)}</option>
              ))}
            </select>
          </div>

          {/* 2. Period Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-bold text-slate-800 cursor-pointer h-9"
            >
              <option value="ALL">ALL PERIODS</option>
              {Array.from(new Set(rolePendingQprs.map(q => q.period))).map(per => (
                <option key={String(per)} value={String(per)}>{String(per)}</option>
              ))}
            </select>
          </div>

          {/* 3. Severity / Reject Level Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Severity Level</label>
            <div className="flex gap-2">
              <select
                value={selectedSeverity}
                onChange={(e) => {
                  setSelectedSeverity(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-bold text-slate-800 cursor-pointer h-9"
              >
                <option value="ALL">ALL SEVERITY</option>
                <option value="CRITICAL">CRITICAL (&gt; 20 Reject)</option>
                <option value="MEDIUM">MEDIUM (&gt; 10 Reject)</option>
                <option value="LOW">LOW</option>
              </select>

              {(selectedSupplier !== "ALL" || selectedPeriod !== "ALL" || selectedSeverity !== "ALL" || searchQuery !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSupplier("ALL");
                    setSelectedPeriod("ALL");
                    setSelectedSeverity("ALL");
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all cursor-pointer h-9"
                  title="Reset All Filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid (3 cards matching screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Pending Approvals */}
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden text-left">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pending Approvals</span>
            <span className="text-3xl font-black text-slate-900 mt-2 block">
              {String(rolePendingQprs.length).padStart(2, "0")}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2 z-10">
            <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded flex items-center gap-1 text-[9px] font-extrabold">
              <TrendingDown size={10} /> -12% vs last week
            </span>
          </div>
          <div className="absolute right-4 top-4 p-2 bg-blue-50 text-blue-600 rounded-lg">
            <ListTodo size={18} />
          </div>
        </div>

        {/* Card 2: Critical Problems */}
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden text-left">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Critical Problems</span>
            <span className="text-3xl font-black text-red-600 mt-2 block">08</span>
          </div>
          <div className="flex justify-between items-center mt-2 z-10">
            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[9px] font-extrabold">High Priority</span>
          </div>
          <div className="absolute right-4 top-4 p-2 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle size={18} />
          </div>
        </div>

        {/* Card 3: Approved This Month (Blue full-bleed theme) */}
        <div className="bg-blue-900 border border-blue-950 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden text-left text-white">
          <div>
            <span className="text-3xl font-black block">142</span>
            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest block mt-0.5">Approved This Month</span>
          </div>
          <div className="mt-2 text-[10px] text-blue-100 font-bold z-10">
            Average Approval Time: 4.2h
          </div>
          <Shield size={65} className="absolute right-0 bottom-0 text-blue-800/30 stroke-[1] -mr-3 -mb-3" />
        </div>
      </div>

      {/* Tabs Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-slate-200 pb-2">
        {/* Tabs switcher */}
        <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100 shrink-0">
          {[
            { id: "all-pending", label: "All Pending" },
            { id: "needs-verification", label: "Needs Verification" },
            { id: "returned", label: "Returned" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilterTab(tab.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-md text-[11px] font-black tracking-wider transition-all cursor-pointer ${
                activeFilterTab === tab.id
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={13} className="text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search by product or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 font-bold"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden p-4">
        <div className="border border-slate-400 rounded-lg overflow-hidden">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-400 text-slate-800 font-extrabold uppercase text-[10px] tracking-wider text-center">
                <th className="px-2 py-3 border-r border-slate-400 w-[18%] text-center font-bold">ID Report</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[22%] text-center font-bold">Detail Produk</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[22%] text-center font-bold">Kategori Masalah</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[12%] text-center font-bold">Tanggal Laporan</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[18%] text-center font-bold">Status Verifikasi</th>
                <th className="px-2 py-3 w-[8%] text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 font-medium">
                    <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2 opacity-50" />
                    No reports pending approval.
                  </td>
                </tr>
              ) : (
                currentItems.map((qpr) => {
                  // Determine severity label based on item quantity or reject items
                  let severityText = "Minor - Low Reject";
                  let severityDot = "bg-slate-450";
                  let severityBg = "bg-slate-50 text-slate-500";
                  if (qpr.rejectItems > 20) {
                    severityText = "Critical - Allowance Exceeded";
                    severityDot = "bg-red-500";
                    severityBg = "bg-red-50 text-red-600 border border-red-100/50";
                  } else if (qpr.rejectItems > 10) {
                    severityText = "Major - Moderate Reject";
                    severityDot = "bg-amber-500";
                    severityBg = "bg-amber-50 text-amber-600 border border-amber-100/50";
                  }

                  // Verification status text based on role active
                  const statusText = levelTab === "ppic" 
                    ? "Menunggu Verifikasi PPIC" 
                    : "Menunggu Manajer Quality";

                  return (
                    <tr key={qpr.id} className="border-b border-slate-400 hover:bg-slate-50/40 transition-colors text-center font-bold">
                      {/* ID Report */}
                      <td className="px-2 py-3 border-r border-slate-400 text-center font-bold text-slate-800 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {qpr.qprNumber}
                      </td>

                      {/* Detail Produk */}
                      <td className="px-2 py-3 border-r border-slate-400 text-left">
                        <div className="font-bold text-slate-700 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">{qpr.supplierName}</div>
                        <div className="text-[9px] text-slate-400 font-bold mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Period: {qpr.period} | Qty: {qpr.totalItems} pcs</div>
                      </td>

                      {/* Kategori Masalah */}
                      <td className="px-2 py-3 border-r border-slate-400 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${severityBg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${severityDot}`} />
                          {severityText}
                        </span>
                      </td>

                      {/* Tanggal Laporan */}
                      <td className="px-2 py-3 border-r border-slate-400 text-center text-slate-650 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {formatDate(qpr.date)}
                      </td>

                      {/* Status Verifikasi */}
                      <td className="px-2 py-3 border-r border-slate-400 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-blue-600 text-[10px] font-bold leading-tight">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span>{statusText}</span>
                        </div>
                      </td>

                      {/* Aksi Button */}
                      <td className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedQpr(qpr)}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-black transition-all cursor-pointer active:scale-95 shadow-sm shadow-blue-500/5 text-center"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/20 text-xs font-bold text-slate-505">
          <div>
            Menampilkan {currentItems.length} dari {filteredQprs.length} item pending
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-1.5 border border-slate-200 rounded-md transition-colors ${
                currentPage === 1 ? "text-slate-300 bg-slate-50/50 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50 cursor-pointer"
              }`}
            >
              <ChevronLeft size={14} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7.5 h-7.5 border rounded-md transition-colors text-center ${
                  currentPage === page
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-1.5 border border-slate-200 rounded-md transition-colors ${
                currentPage === totalPages ? "text-slate-300 bg-slate-50/50 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50 cursor-pointer"
              }`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Performance and Alert Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Span 2: Approval Performance Tracking Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-150 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-2">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Approval Performance Tracking</h4>
          </div>

          <div className="flex items-end justify-between gap-4 h-40 pt-8 pb-2">
            {[
              { day: "Mon", height: "25%", active: false },
              { day: "Tue", height: "55%", active: false },
              { day: "Wed", height: "40%", active: false },
              { day: "Thu", height: "65%", active: false },
              { day: "Today", height: "85%", active: true, value: "4.2h" }
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                {bar.active && (
                  <span className="absolute -top-6 text-[10px] font-black text-slate-850 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                    {bar.value}
                  </span>
                )}
                <div 
                  style={{ height: bar.height }}
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    bar.active 
                      ? "bg-blue-600 shadow-md shadow-blue-500/10 animate-pulse-ring" 
                      : "bg-slate-100 group-hover:bg-slate-200"
                  }`}
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Span 1: Quality Alert & Need Assistance */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Card A: Quality Alert */}
          <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm text-left space-y-2 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Quality Alert</span>
              <p className="text-xs text-slate-600 font-bold mt-2 leading-relaxed">
                Recurring dimensional defect detected in Line A2 for 3 consecutive batches.
              </p>
            </div>
            <div className="pt-2">
              <button 
                type="button" 
                onClick={() => alert("Membuka analisis investigasi defect...")}
                className="text-red-500 hover:text-red-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                View Investigation <ArrowRight size={13} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Card B: Need Assistance */}
          <div className="bg-blue-600 rounded-xl p-5 shadow-sm text-left text-white space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-black uppercase tracking-wider text-blue-100">Need Assistance?</h5>
              <p className="text-[11px] text-blue-50 leading-relaxed font-bold mt-2">
                Contact Quality Control room extension 402 for immediate verification support.
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert("Membuka Support Ticket...")}
              className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-black rounded-lg transition-colors cursor-pointer text-center shadow-sm shadow-blue-700/5 border border-transparent"
            >
              Open Support Ticket
            </button>
          </div>
        </div>

      </div>

      {/* Unified QPR Details Modal (Copied exactly from PPIC / Dept Head modals for functionality) */}
      {selectedQpr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase">
                  {levelTab === "ppic" ? "Validasi Hitungan Denda (PPIC)" : "Validasi Hitungan Denda QPR"}
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedQpr.qprNumber}</h4>
              </div>
              <button 
                onClick={() => setSelectedQpr(null)} 
                className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 block">Supplier</span>
                <span className="text-sm font-bold text-slate-800 block mt-1">{selectedQpr.supplierName}</span>
                <span className="text-xs text-slate-400 block mt-0.5">Periode Transaksi: {selectedQpr.period}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                {levelTab === "ppic" ? (
                  <>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                      <span className="text-slate-400 block">Total Kirim:</span>
                      <strong className="text-slate-800 font-bold">{selectedQpr.totalItems} pcs</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                      <span className="text-slate-400 block">Total Reject:</span>
                      <strong className="text-red-600 font-bold">{selectedQpr.rejectItems} pcs</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                      <span className="text-slate-400 block">Total Reject:</span>
                      <strong className="text-slate-800 font-bold">{selectedQpr.rejectItems} pcs / {selectedQpr.totalItems} pcs</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                      <span className="text-slate-400 block">Allowance Toleransi:</span>
                      <strong className="text-slate-800 font-bold">{selectedQpr.allowanceRatio}</strong>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 bg-red-50 border border-red-150 rounded-lg text-center">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">
                  {levelTab === "ppic" ? "Total Nilai Denda" : "Total Klaim Denda"}
                </span>
                <span className="text-2xl font-black text-red-600 block mt-1">{selectedQpr.claimAmount}</span>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center gap-2">
              <button
                onClick={() => setPreviewQpr(selectedQpr)}
                className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-bold transition-colors cursor-pointer"
              >
                <FileText size={13} />
                Preview Form QPR
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedQpr(null)} 
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    handleApproveQprAction(selectedQpr.id, selectedQpr.qprNumber);
                    setSelectedQpr(null);
                  }}
                  className={`px-5 py-2.5 text-white rounded-md font-bold text-xs shadow-md transition-colors cursor-pointer ${
                    levelTab === "ppic"
                      ? "bg-teal-600 hover:bg-teal-700 shadow-teal-600/10"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10"
                  }`}
                >
                  {levelTab === "ppic" ? "Validasi & Approve" : "Approve QPR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QPR Print Preview Modal */}
      {previewQpr && (
        <QprPrintPreview
          qpr={previewQpr}
          onClose={() => setPreviewQpr(null)}
        />
      )}

    </div>
  );
}
