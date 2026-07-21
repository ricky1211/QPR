import React, { useState } from "react";
import { Briefcase, FileCheck, CheckCircle2, X, FileText, Search, Filter, ChevronLeft, ChevronRight, AlertTriangle, Clock, Shield } from "lucide-react";
import QprPrintPreview from "./QprPrintPreview";
import NcrPrintPreview from "./NcrPrintPreview";
import { ncrService, mapNcrFromDb } from "@/services/ncrService";

export default function DeptHeadView({
  pendingNcrs,
  pendingQprs,
  handleApproveNcrAction,
  handleApproveQprAction,
  showNcr = true,
  showQpr = true
}) {
  const deptHeadNcrs = pendingNcrs.filter((n) => n.requiredRole === "Dept Head");
  const deptHeadQprs = pendingQprs.filter((q) => q.requiredRole === "Dept Head");

  const [selectedNcr, setSelectedNcr] = useState(null);
  const [selectedQpr, setSelectedQpr] = useState(null);
  const [previewQpr, setPreviewQpr] = useState(null);
  const [reviewComment, setReviewComment] = useState("");

  const handleViewDetail = (ncr: any) => {
    if (typeof ncr.id === "string" && ncr.id.length > 10) {
      ncrService.getById(ncr.id)
        .then((realNcr) => {
          setSelectedNcr(mapNcrFromDb(realNcr));
        })
        .catch(err => {
          console.error("Failed to load NCR details:", err);
          alert("Gagal memuat detail NCR.");
        });
    } else {
      setSelectedNcr(ncr);
    }
  };
  
  // Search & Pagination states for NCR
  const [ncrSearchQuery, setNcrSearchQuery] = useState("");
  const [ncrCurrentPage, setNcrCurrentPage] = useState(1);

  // Advanced Filter states
  const [isNcrFilterOpen, setIsNcrFilterOpen] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [selectedSupplier, setSelectedSupplier] = useState("ALL");
  const [selectedLocation, setSelectedLocation] = useState("ALL");

  const isMngApproved = selectedNcr && (selectedNcr.requiredRole === "Closed" || selectedNcr.status === "APPROVED");

  // Filter NCR list based on search query & advanced filters
  const filteredNcrs = deptHeadNcrs.filter((ncr) => {
    // 1. Search query filter
    const q = ncrSearchQuery.toLowerCase();
    const matchesSearch = 
      ncr.ncrNumber.toLowerCase().includes(q) ||
      ncr.supplierName.toLowerCase().includes(q) ||
      ncr.partName.toLowerCase().includes(q) ||
      (ncr.defectType && ncr.defectType.toLowerCase().includes(q));

    // 2. Severity filter
    let severity = "LOW";
    if (ncr.qty > 200) severity = "CRITICAL";
    else if (ncr.qty > 100) severity = "MEDIUM";
    const matchesSeverity = selectedSeverity === "ALL" || severity === selectedSeverity;

    // 3. Supplier filter
    const matchesSupplier = selectedSupplier === "ALL" || ncr.supplierName === selectedSupplier;

    // 4. Location filter
    const matchesLocation = selectedLocation === "ALL" || (ncr.locationFound && ncr.locationFound.includes(selectedLocation));

    return matchesSearch && matchesSeverity && matchesSupplier && matchesLocation;
  });

  // NCR Pagination
  const ncrItemsPerPage = 4;
  const ncrTotalPages = Math.max(1, Math.ceil(filteredNcrs.length / ncrItemsPerPage));
  const ncrIndexOfLastItem = ncrCurrentPage * ncrItemsPerPage;
  const ncrIndexOfFirstItem = ncrIndexOfLastItem - ncrItemsPerPage;
  const currentNcrs = filteredNcrs.slice(ncrIndexOfFirstItem, ncrIndexOfLastItem);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[monthIndex]} ${day}, ${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Metrics for NCR
  const awaitingCount = deptHeadNcrs.length;
  const criticalCount = deptHeadNcrs.filter(n => n.qty > 200).length;
  const criticalStr = String(criticalCount).padStart(2, "0");
  const awaitingStr = String(awaitingCount);

  return (
    <div className="space-y-6 text-left">
      

      <div className={`grid gap-6 ${showNcr && showQpr ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 w-full"}`}>
        
        {/* Panel 1: Pending NCRs */}
        {showNcr && (
          <div className="space-y-6">


            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search size={14} className="text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search report ID or supplier..."
                  value={ncrSearchQuery}
                  onChange={(e) => {
                    setNcrSearchQuery(e.target.value);
                    setNcrCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 font-bold"
                />
              </div>

              {/* Filter button */}
              <button
                type="button"
                onClick={() => setIsNcrFilterOpen(!isNcrFilterOpen)}
                className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  isNcrFilterOpen 
                    ? "border-blue-600 bg-blue-50 text-blue-600" 
                    : "border-slate-200 text-slate-707 bg-white hover:bg-slate-50"
                }`}
              >
                <Filter size={13} />
                Filter
                {(selectedSeverity !== "ALL" || selectedSupplier !== "ALL" || selectedLocation !== "ALL") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                )}
              </button>
            </div>

            {/* Advanced Filter Panel */}
            {isNcrFilterOpen && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-left animate-slide-down">
                {/* 1. Severity Filter */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Severity Level</label>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => {
                      setSelectedSeverity(e.target.value);
                      setNcrCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-bold text-slate-800 cursor-pointer h-9"
                  >
                    <option value="ALL">ALL SEVERITY</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                {/* 2. Supplier Filter */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => {
                      setSelectedSupplier(e.target.value);
                      setNcrCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-bold text-slate-800 cursor-pointer h-9"
                  >
                    <option value="ALL">ALL SUPPLIERS</option>
                    {Array.from(new Set(deptHeadNcrs.map((n: any) => n.supplierName))).map((sup: any) => (
                      <option key={String(sup)} value={String(sup)}>{String(sup)}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Location Found Filter */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location Found</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedLocation}
                      onChange={(e) => {
                        setSelectedLocation(e.target.value);
                        setNcrCurrentPage(1);
                      }}
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-bold text-slate-800 cursor-pointer h-9"
                    >
                      <option value="ALL">ALL LOCATIONS</option>
                      <option value="IN-COMING">IN-COMING</option>
                      <option value="OUT-GOING">OUT-GOING</option>
                      <option value="IN-PROSES">IN-PROSES</option>
                      <option value="CUSTOMER">CUSTOMER</option>
                    </select>

                    {(selectedSeverity !== "ALL" || selectedSupplier !== "ALL" || selectedLocation !== "ALL" || ncrSearchQuery !== "") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSeverity("ALL");
                          setSelectedSupplier("ALL");
                          setSelectedLocation("ALL");
                          setNcrSearchQuery("");
                          setNcrCurrentPage(1);
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

            {/* Table Card */}
            <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="px-6 py-4 font-bold">REPORT ID</th>
                      <th className="px-6 py-4 font-bold">SUPPLIER</th>
                      <th className="px-6 py-4 font-bold">DATE FOUND</th>
                      <th className="px-6 py-4 font-bold">SEVERITY</th>
                      <th className="px-6 py-4 font-bold">STATUS</th>
                      <th className="px-6 py-4 font-bold text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentNcrs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-slate-400 font-medium">
                          <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2 opacity-50" />
                          No reports match the criteria.
                        </td>
                      </tr>
                    ) : (
                      currentNcrs.map((ncr) => {
                        // Determine severity label and colors
                        let severityText = "Low";
                        let severityDot = "bg-slate-400";
                        let severityBg = "bg-slate-50 text-slate-600";
                        if (ncr.qty > 200) {
                          severityText = "Critical";
                          severityDot = "bg-red-500";
                          severityBg = "bg-red-50 text-red-600 border border-red-100/50";
                        } else if (ncr.qty > 100) {
                          severityText = "Medium";
                          severityDot = "bg-blue-500";
                          severityBg = "bg-blue-50 text-blue-600 border border-blue-100/50";
                        }

                        return (
                          <tr key={ncr.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                            {/* Report ID & Defect Info */}
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <div className="font-bold text-slate-800 text-[13px]">{ncr.ncrNumber}</div>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {ncr.partName?.toUpperCase().includes("ALL TYPE") ? "ALL TYPE" : ncr.partName} ({ncr.reject})
                              </div>
                            </td>

                            {/* Supplier */}
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <div className="font-bold text-slate-707 text-[12px]">{ncr.supplierName}</div>
                            </td>

                            {/* Date Found */}
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <div className="text-slate-500 font-bold">{formatDate(ncr.date)}</div>
                            </td>

                            {/* Severity */}
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${severityBg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${severityDot}`} />
                                {severityText}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="italic text-slate-500 font-semibold text-[11px]">
                                {ncr.status === "WAITING_APPROVAL" ? "Pending Approval" : "Under Investigation"}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4.5 whitespace-nowrap text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  handleViewDetail(ncr);
                                  setReviewComment("");
                                }}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-750 text-white rounded-md text-xs font-black transition-all flex items-center gap-1 mx-auto cursor-pointer active:scale-95 shadow-sm shadow-blue-500/5"
                              >
                                Review <ChevronRight size={12} className="stroke-[3]" />
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
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/20 text-xs font-bold text-slate-500">
                <div>
                  Showing {currentNcrs.length} of {filteredNcrs.length} reports
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setNcrCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={ncrCurrentPage === 1}
                    className={`p-1.5 border border-slate-200 rounded-md transition-colors ${
                      ncrCurrentPage === 1 ? "text-slate-300 bg-slate-50/50 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                    }`}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  
                  {Array.from({ length: ncrTotalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setNcrCurrentPage(page)}
                      className={`w-7.5 h-7.5 border rounded-md transition-colors text-center ${
                        ncrCurrentPage === page
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setNcrCurrentPage(prev => Math.min(ncrTotalPages, prev + 1))}
                    disabled={ncrCurrentPage === ncrTotalPages}
                    className={`p-1.5 border border-slate-200 rounded-md transition-colors ${
                      ncrCurrentPage === ncrTotalPages ? "text-slate-300 bg-slate-50/50 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                    }`}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: Pending QPRs */}
        {showQpr && (
          <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-100 bg-slate-50/30">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Inbox Claim QPR</span>
                <h4 className="text-sm font-bold text-slate-800 mt-1">Draf QPR Menunggu Otoritas</h4>
              </div>

              <div className="p-5 space-y-3">
                {deptHeadQprs.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <CheckCircle2 size={30} className="text-green-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">Inbox QPR Bersih</p>
                  </div>
                ) : (
                  deptHeadQprs.map((qpr) => (
                    <div key={qpr.id} className="p-5 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[10px] font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                          {qpr.qprNumber}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-extrabold uppercase animate-pulse">Waiting ACC</span>
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        Klaim Bulanan - {qpr.supplierName}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs bg-white p-3.5 rounded-lg border border-slate-200/60 shadow-sm/5">
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Transaksi:</span>
                          <strong className="text-slate-700 font-bold text-[11px] block mt-0.5">{qpr.period}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Total Defect:</span>
                          <strong className="text-slate-700 font-bold text-[11px] block mt-0.5">{qpr.rejectItems} pcs</strong>
                        </div>
                        <div>
                          <span className="text-red-500/80 block font-bold text-[9px] uppercase tracking-wider">Nilai Claim:</span>
                          <strong className="text-red-600 font-black text-[11px] block mt-0.5">{qpr.claimAmount}</strong>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setPreviewQpr(qpr)}
                          className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                        >
                          <FileText size={12} />
                          Preview
                        </button>
                        <button onClick={() => setSelectedQpr(qpr)} className="px-5 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-bold text-slate-600 transition-all cursor-pointer">Detail</button>
                        <button onClick={() => handleApproveQprAction(qpr.id, qpr.qprNumber)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-md shadow-indigo-500/10 transition-all cursor-pointer">Setujui</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* NCR Details Modal */}
      {selectedNcr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">          <div className="bg-white rounded-xl w-full max-w-[1200px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">Lembar Analisis Defect (Dept Head)</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedNcr.ncrNumber}</h4>
              </div>
              <button onClick={() => setSelectedNcr(null)} className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Official A4 Document Sheet */}
                <div className="lg:col-span-2 border border-slate-200 rounded-lg overflow-hidden bg-slate-100 p-4 max-h-[65vh] overflow-y-auto shadow-inner flex items-start justify-center">
                  <div className="w-full max-w-2xl bg-white shadow-md rounded border border-slate-300">
                    <NcrPrintPreview ncr={selectedNcr} inline={true} />
                  </div>
                </div>

                {/* Right Column: Signatures, Reviews, and Actions */}
                <div className="space-y-4">
                  {/* TANDA TANGAN QUALITY DEPT (PR4-FRM-08001) */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-[11px] shadow-sm/5 text-left">
                    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-extrabold text-slate-800 uppercase text-center tracking-wider text-[10px]">
                      TANDA TANGAN QUALITY DEPT (PR4-FRM-08001)
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-slate-300 text-center font-bold">
                      {/* STAFF Box */}
                      <div className="flex flex-col justify-between h-20 p-1">
                        <div className="text-[8px] text-slate-400 font-black uppercase">Staff (QC Inspector)</div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-800 text-xs font-bold leading-none select-none">
                            {selectedNcr.foundBy ? selectedNcr.foundBy.split(" ")[1] : "Hendrik"}
                          </span>
                          {selectedNcr.staffReview && (
                            <span className="text-[8px] text-slate-505 font-normal mt-0.5 italic block max-w-[80px] truncate" title={selectedNcr.staffReview}>
                              "{selectedNcr.staffReview}"
                            </span>
                          )}
                        </div>
                        <div className="text-[8px] text-slate-500 border-t border-slate-200 pt-0.5">
                          {selectedNcr.date || "28-7-2025"}
                        </div>
                      </div>

                      {/* SPV Box */}
                      <div className="flex flex-col justify-between h-20 p-1">
                        <div className="text-[8px] text-slate-400 font-black uppercase">SPV (QC SPV)</div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-800 text-xs font-bold leading-none select-none">Approved (SPV)</span>
                          {selectedNcr.spvReview && (
                            <span className="text-[8px] text-slate-505 font-normal mt-0.5 italic block max-w-[80px] truncate" title={selectedNcr.spvReview}>
                              "{selectedNcr.spvReview}"
                            </span>
                          )}
                        </div>
                        <div className="text-[8px] text-slate-500 border-t border-slate-200 pt-0.5">
                          {selectedNcr.date || "28-7-2025"}
                        </div>
                      </div>

                      {/* MNG Box */}
                      <div className="flex flex-col justify-between h-20 p-1">
                        <div className="text-[8px] text-slate-400 font-black uppercase">MNG (QC Manager)</div>
                        {isMngApproved ? (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-800 text-xs font-bold leading-none select-none">Approved (MNG)</span>
                            {selectedNcr.mngReview && (
                              <span className="text-[8px] text-slate-550 font-normal mt-0.5 italic block max-w-[80px] truncate" title={selectedNcr.mngReview}>
                                "{selectedNcr.mngReview}"
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-450 italic text-[8px] py-0.5 font-medium leading-tight">
                            Menunggu MNG
                          </div>
                        )}
                        <div className="text-[8px] text-slate-500 border-t border-slate-200 pt-0.5">
                          {isMngApproved ? selectedNcr.date : "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Reviews Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-left space-y-2.5">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">
                      Detail Catatan Review Approval
                    </span>
                    <div className="space-y-2 divide-y divide-slate-100">
                      {/* Staff Review */}
                      <div className="pt-2 first:pt-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">Staff (QC Inspector)</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-700">
                            APPROVED
                          </span>
                        </div>
                        {selectedNcr.staffReview && (
                          <p className="text-slate-600 mt-1 italic leading-normal font-semibold">
                            "{selectedNcr.staffReview}"
                          </p>
                        )}
                      </div>

                      {/* SPV Review */}
                      <div className="pt-2 first:pt-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">SPV (QC SPV)</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-700">
                            APPROVED
                          </span>
                        </div>
                        {selectedNcr.spvReview && (
                          <p className="text-slate-600 mt-1 italic leading-normal font-semibold">
                            "{selectedNcr.spvReview}"
                          </p>
                        )}
                      </div>

                      {/* MNG Review */}
                      <div className="pt-2 first:pt-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">MNG (QC Manager)</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            isMngApproved ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            {isMngApproved ? "APPROVED" : "PENDING"}
                          </span>
                        </div>
                        {isMngApproved && selectedNcr.mngReview && (
                          <p className="text-slate-600 mt-1 italic leading-normal font-semibold">
                            "{selectedNcr.mngReview}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Catatan / Review Input */}
                  <div className="space-y-1.5 text-left border-t border-slate-150 pt-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Review / Catatan MNG (QC Manager) <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Tulis catatan review MNG di sini..."
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-14 bg-slate-50/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button onClick={() => setSelectedNcr(null)} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-bold transition-colors">Batal</button>
              <button
                onClick={() => {
                  handleApproveNcrAction(selectedNcr.id, selectedNcr.ncrNumber, reviewComment);
                  setSelectedNcr(null);
                  setReviewComment("");
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-bold text-xs shadow-md shadow-amber-500/10 transition-colors cursor-pointer"
              >
                Approve & Tanda Tangan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QPR Details Modal */}
      {selectedQpr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase">Validasi Hitungan Denda QPR</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedQpr.qprNumber}</h4>
              </div>
              <button onClick={() => setSelectedQpr(null)} className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 block">Supplier</span>
                <span className="text-sm font-bold text-slate-800 block mt-1">{selectedQpr.supplierName}</span>
                <span className="text-xs text-slate-400 block mt-0.5">Periode Transaksi: {selectedQpr.period}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                  <span className="text-slate-400 block">Total Reject:</span>
                  <strong className="text-slate-800 font-bold">{selectedQpr.rejectItems} pcs / {selectedQpr.totalItems} pcs</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                  <span className="text-slate-400 block">Allowance Toleransi:</span>
                  <strong className="text-slate-800 font-bold">{selectedQpr.allowanceRatio}</strong>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-150 rounded-lg text-center">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">Total Klaim Denda</span>
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
                <button onClick={() => setSelectedQpr(null)} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-bold transition-colors cursor-pointer">Batal</button>
                <button
                  onClick={() => {
                    handleApproveQprAction(selectedQpr.id, selectedQpr.qprNumber);
                    setSelectedQpr(null);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-xs shadow-md shadow-indigo-500/10 transition-colors cursor-pointer"
                >
                  Approve QPR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QPR Print Preview */}
      {previewQpr && (
        <QprPrintPreview
          qpr={previewQpr}
          onClose={() => setPreviewQpr(null)}
        />
      )}

    </div>
  );
}
