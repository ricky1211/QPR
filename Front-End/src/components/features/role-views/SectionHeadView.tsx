import React, { useState } from "react";
import { Shield, FileCheck, CheckCircle2, X, Search, Filter, ChevronLeft, ChevronRight, AlertTriangle, Clock, Printer } from "lucide-react";
import NcrPrintPreview from "./NcrPrintPreview";
import { ncrService, mapNcrFromDb } from "@/services/ncrService";


export default function SectionHeadView({ pendingNcrs, handleApproveNcrAction, role = "Section Head" }) {
  const sectionHeadNcrs = pendingNcrs.filter((n) => n.requiredRole === role);
  const [selectedNcr, setSelectedNcr] = useState(null);
  const [reviewComment, setReviewComment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [printNcr, setPrintNcr] = useState(null);

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


  // Advanced Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [selectedSupplier, setSelectedSupplier] = useState("ALL");
  const [selectedLocation, setSelectedLocation] = useState("ALL");

  const isStaffApproved = !selectedNcr || role !== "Foreman" || selectedNcr.requiredRole !== "Foreman";
  const isSpvApproved = !selectedNcr || ((role !== "Foreman" && role !== "Section Head") || (selectedNcr.requiredRole === "Dept Head" || selectedNcr.requiredRole === "Closed" || selectedNcr.status === "APPROVED"));
  const isMngApproved = !selectedNcr || (selectedNcr.requiredRole === "Closed" || selectedNcr.status === "APPROVED");

  // Filter based on search query & advanced filters
  const filteredNcrs = sectionHeadNcrs.filter((ncr) => {
    // 1. Search Query filter
    const q = searchQuery.toLowerCase();
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

  // Pagination config
  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(filteredNcrs.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNcrs.slice(indexOfFirstItem, indexOfLastItem);

  // Format date helper (e.g. 2026-06-05 -> Jun 5, 2026)
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

  // Metric values
  const awaitingCount = sectionHeadNcrs.length;
  const criticalCount = sectionHeadNcrs.filter(n => n.qty > 200).length;
  const criticalStr = String(criticalCount).padStart(2, "0");
  const awaitingStr = String(awaitingCount);

  return (
    <div className="space-y-6 text-left">
      

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
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 font-bold"
          />
        </div>

        {/* Filter button */}
        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
            isFilterOpen 
              ? "border-blue-600 bg-blue-50 text-blue-600" 
              : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
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
      {isFilterOpen && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-left animate-slide-down">
          {/* 1. Severity Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Severity Level</label>
            <select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value);
                setCurrentPage(1);
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
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-bold text-slate-800 cursor-pointer h-9"
            >
              <option value="ALL">ALL SUPPLIERS</option>
              {Array.from(new Set(sectionHeadNcrs.map((n: any) => n.supplierName))).map((sup: any) => (
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
                  setCurrentPage(1);
                }}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-bold text-slate-800 cursor-pointer h-9"
              >
                <option value="ALL">ALL LOCATIONS</option>
                <option value="IN-COMING">IN-COMING</option>
                <option value="OUT-GOING">OUT-GOING</option>
                <option value="IN-PROSES">IN-PROSES</option>
                <option value="CUSTOMER">CUSTOMER</option>
              </select>

              {(selectedSeverity !== "ALL" || selectedSupplier !== "ALL" || selectedLocation !== "ALL" || searchQuery !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeverity("ALL");
                    setSelectedSupplier("ALL");
                    setSelectedLocation("ALL");
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
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 font-medium">
                    <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2 opacity-50" />
                    No reports match the criteria.
                  </td>
                </tr>
              ) : (
                currentItems.map((ncr) => {
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
                        <div className="font-bold text-slate-700 text-[12px]">{ncr.supplierName}</div>
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
            Showing {currentItems.length} of {filteredNcrs.length} reports
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
 
      {/* Detail overlay */}
      {selectedNcr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">          <div className="bg-white rounded-xl w-full max-w-[1200px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">Lembar Analisis Defect</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedNcr.ncrNumber}</h4>
              </div>
              <button onClick={() => setSelectedNcr(null)} className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors">
                <X size={18} />
              </button>
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
                        {isStaffApproved ? (
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
                        ) : (
                          <div className="text-slate-455 italic text-[8px] py-0.5 font-medium leading-tight">
                            Menunggu Staff
                          </div>
                        )}
                        <div className="text-[8px] text-slate-500 border-t border-slate-200 pt-0.5">
                          {selectedNcr.date || "28-7-2025"}
                        </div>
                      </div>

                      {/* SPV Box */}
                      <div className="flex flex-col justify-between h-20 p-1">
                        <div className="text-[8px] text-slate-400 font-black uppercase">SPV (QC SPV)</div>
                        {isSpvApproved ? (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-800 text-xs font-bold leading-none select-none">Approved (SPV)</span>
                            {selectedNcr.spvReview && (
                              <span className="text-[8px] text-slate-505 font-normal mt-0.5 italic block max-w-[80px] truncate" title={selectedNcr.spvReview}>
                                "{selectedNcr.spvReview}"
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[8px] py-0.5 font-medium leading-tight">
                            Menunggu SPV
                          </div>
                        )}
                        <div className="text-[8px] text-slate-500 border-t border-slate-200 pt-0.5">
                          {isSpvApproved ? selectedNcr.date : "-"}
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
                          <div className="text-slate-400 italic text-[8px] py-0.5 font-medium leading-tight">
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
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            isStaffApproved ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            {isStaffApproved ? "APPROVED" : "PENDING"}
                          </span>
                        </div>
                        {isStaffApproved && selectedNcr.staffReview && (
                          <p className="text-slate-600 mt-1 italic leading-normal font-semibold">
                            "{selectedNcr.staffReview}"
                          </p>
                        )}
                      </div>

                      {/* SPV Review */}
                      <div className="pt-2 first:pt-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">SPV (QC SPV)</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            isSpvApproved ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            {isSpvApproved ? "APPROVED" : "PENDING"}
                          </span>
                        </div>
                        {isSpvApproved && selectedNcr.spvReview && (
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
                      Review / Catatan {role === "Foreman" ? "Staff" : "SPV"} <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={`Tulis catatan review ${role === "Foreman" ? "Staff" : "SPV"} di sini...`}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-14 bg-slate-50/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button
                onClick={() => setSelectedNcr(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-bold transition-colors"
              >
                Tutup
              </button>
              {/* Cetak PDF — hanya untuk NCR yang sudah fully approved */}
              {(selectedNcr?.status === "APPROVED" || selectedNcr?.requiredRole === "Closed") && (
                <button
                  onClick={() => setPrintNcr(selectedNcr)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Printer size={13} />
                  Cetak PDF
                </button>
              )}
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

      {/* NCR Print Preview Modal (for approved NCRs) */}
      {printNcr && (
        <NcrPrintPreview
          ncr={printNcr}
          onClose={() => setPrintNcr(null)}
        />
      )}

    </div>
  );
}
