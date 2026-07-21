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
  Shield,
  Clock,
  Banknote,
  Printer
} from "lucide-react";
import ConfirmationLetterPrintPreview from "./ConfirmationLetterPrintPreview";

interface ApproveClDashboardProps {
  confirmationLetters: any[];
  handleApproveCL: (clId: string, level: "sect" | "dept" | "div") => void;
  handleMarkClosedPaid?: (clId: string) => void;
  handleDebitNote?: (clId: string) => void;
  username?: string;
}

export default function ApproveClDashboard({ 
  confirmationLetters, 
  handleApproveCL, 
  handleMarkClosedPaid, 
  handleDebitNote, 
  username = "admin" 
}: ApproveClDashboardProps) {
  
  const getInitialTab = () => {
    if (username === "sectaccounting" || username === "accounting") return "sect-accounting";
    if (username === "deptaccounting") return "dept-accounting";
    return "sect-accounting";
  };

  const [levelTab, setLevelTab] = useState(getInitialTab());

  React.useEffect(() => {
    setLevelTab(getInitialTab());
  }, [username]);

  const [activeFilterTab, setActiveFilterTab] = useState("all-pending"); // 'all-pending', 'needs-verification', 'returned'
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Advanced Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState("ALL");

  // Modal states
  const [selectedCl, setSelectedCl] = useState<any>(null);
  const [previewCl, setPreviewCl] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<any>(null);

  // Filter pending CLs by role
  const getRoleName = (tab: string) => {
    switch (tab) {
      case "sect-accounting": return "Sect Accounting";
      case "dept-accounting": return "Dept Accounting";
      default: return "Sect Accounting";
    }
  };
  const roleName = getRoleName(levelTab);
  
  // Pending CLs for the currently active tab
  const rolePendingCls = confirmationLetters.filter((cl) => {
    if (cl.requiredRole === roleName) return true;
    if (roleName === "Sect Accounting" && cl.status === "PENDING") return true;
    if (roleName === "Dept Accounting" && cl.status === "APPROVED_SECT") return true;
    return false;
  });

  // Filter based on search query & advanced filters
  const filteredCls = rolePendingCls.filter((cl) => {
    // 1. Search filter
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      cl.clNumber.toLowerCase().includes(q) ||
      cl.supplierName.toLowerCase().includes(q) ||
      (cl.qprNumber && cl.qprNumber.toLowerCase().includes(q));

    // 2. Tab filter
    let matchesTab = true;
    if (activeFilterTab === "needs-verification") {
      matchesTab = cl.closedPaid === false;
    }

    // 3. Supplier filter
    const matchesSupplier = selectedSupplier === "ALL" || cl.supplierName === selectedSupplier;

    // 4. Period filter
    const matchesPeriod = selectedPeriod === "ALL" || cl.period === selectedPeriod;

    return matchesSearch && matchesTab && matchesSupplier && matchesPeriod;
  });

  // Pagination config
  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(filteredCls.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCls.slice(indexOfFirstItem, indexOfLastItem);

  // CSV Export handler
  const handleExportList = () => {
    if (filteredCls.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = ["ID CL", "QPR Number", "Supplier Name", "Date Sent", "Amount", "Status", "Required Otorisasi"];
    const csvRows = [
      headers.join(","),
      ...filteredCls.map(cl => [
        `"${cl.clNumber}"`,
        `"${cl.qprNumber}"`,
        `"${cl.supplierName}"`,
        `"${cl.dateSent}"`,
        `"${cl.amount}"`,
        `"${cl.status}"`,
        `"${cl.requiredRole}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CL_Approvals_Export_${levelTab.toUpperCase()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics calculation
  const totalPendingCount = confirmationLetters.filter(cl => cl.status !== "FULLY_APPROVED" && cl.status !== "CLOSED_PAID" && cl.requiredRole !== "Closed").length;
  const totalClosedPaidCount = confirmationLetters.filter(cl => cl.closedPaid || cl.status === "CLOSED_PAID").length;
  const totalApprovedThisMonth = confirmationLetters.filter(cl => cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID").length;

  return (
    <div className="space-y-6 text-left">
      
      {/* Role Switcher & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white border border-slate-100 rounded-lg shadow-sm gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Approval Confirmation Letter</h3>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {/* Toggle Switcher — Visible for Admin / Accounting */}
          {username === "admin" || username === "accounting" ? (
            <div className="flex bg-slate-100 p-1 rounded-md overflow-x-auto max-w-[400px] sm:max-w-none">
               {[
                { id: "sect-accounting", label: "SECT ACC" },
                { id: "dept-accounting", label: "DEPT ACC" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setLevelTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    levelTab === tab.id ? "bg-white text-blue-650 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1.5 rounded font-bold uppercase whitespace-nowrap">
              Role: {levelTab === "sect-accounting" ? "Sect Acc" : "Dept Acc"}
            </span>
          )}

          {/* Action buttons matching QPR dashboard */}
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
            {(selectedSupplier !== "ALL" || selectedPeriod !== "ALL") && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-650 animate-pulse" />
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
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-left animate-slide-down">
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
              {Array.from(new Set(confirmationLetters.map(cl => cl.supplierName))).map(sup => (
                <option key={String(sup)} value={String(sup)}>{String(sup)}</option>
              ))}
            </select>
          </div>

          {/* 2. Period Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Period</label>
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-bold text-slate-800 cursor-pointer h-9"
              >
                <option value="ALL">ALL PERIODS</option>
                {Array.from(new Set(confirmationLetters.map(cl => cl.period || "Juni 2026"))).map(per => (
                  <option key={String(per)} value={String(per)}>{String(per)}</option>
                ))}
              </select>

              {(selectedSupplier !== "ALL" || selectedPeriod !== "ALL" || searchQuery !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSupplier("ALL");
                    setSelectedPeriod("ALL");
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all cursor-pointer h-9"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}


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
            placeholder="Search by Confirmation Letter No..."
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
          <table className="w-full table-fixed text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-400 text-slate-800 font-extrabold uppercase text-[10px] tracking-wider text-center">
                <th className="px-2 py-3 border-r border-slate-400 w-[22%] text-center font-bold">No. Confirmation Letter</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[20%] text-center font-bold">Detail Vendor</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[18%] text-center font-bold">Jumlah Claim Denda</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[12%] text-center font-bold">Tanggal Kirim</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[20%] text-center font-bold">Status Verifikasi</th>
                <th className="px-2 py-3 w-[8%] text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 font-medium">
                    <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2 opacity-50" />
                    Tidak ada Confirmation Letter yang butuh approval di role ini.
                  </td>
                </tr>
              ) : (
                currentItems.map((cl) => {
                  const statusText = `Menunggu Approval ${roleName}`;
                  return (
                    <tr key={cl.id} className="border-b border-slate-400 hover:bg-slate-50/40 transition-colors text-center font-bold">
                      {/* No. Confirmation Letter */}
                      <td className="px-2 py-3 border-r border-slate-400 text-center font-bold text-slate-800 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {cl.clNumber}
                      </td>

                      {/* Detail Vendor */}
                      <td className="px-2 py-3 border-r border-slate-400 text-left">
                        <div className="font-bold text-slate-700 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">{cl.supplierName}</div>
                        <div className="text-[9px] text-slate-400 font-bold mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">QPR: {cl.qprNumber || "Custom CL"}</div>
                      </td>

                      {/* Jumlah Claim Denda */}
                      <td className="px-2 py-3 border-r border-slate-400 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100">
                          {cl.amount}
                        </span>
                      </td>

                      {/* Tanggal Kirim */}
                      <td className="px-2 py-3 border-r border-slate-400 text-center text-slate-600 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {cl.dateSent}
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
                          onClick={() => setSelectedCl(cl)}
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
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/20 text-xs font-bold text-slate-500">
          <div>
            Menampilkan {currentItems.length} dari {filteredCls.length} item pending
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

      {/* Detail Otorisasi / Review Modal */}
      {selectedCl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-[1200px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase">
                  LEMBAR OTORISASI PERSETUJUAN CONFIRMATION LETTER
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedCl.clNumber}</h4>
              </div>
              <button 
                onClick={() => setSelectedCl(null)} 
                className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-slate-50">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Official Cl Document Sheet */}
                <div className="lg:col-span-2 border border-slate-200 rounded-lg overflow-hidden bg-slate-100 p-4 max-h-[60vh] overflow-y-auto shadow-inner flex items-start justify-center">
                  <div className="w-full max-w-2xl bg-white shadow-md rounded border border-slate-300 p-6 text-black font-serif text-[11px] leading-relaxed">
                    <div className="border-t border-black mb-4 w-full" />
                    <h5 className="text-center font-bold uppercase text-sm mb-3">Confirmation Letter</h5>
                    <div className="text-right text-[9.5px] mb-3">Cikarang, {selectedCl.dateSent}</div>
                    
                    <div className="font-bold mb-4">
                      <div>To:</div>
                      <div>{selectedCl.supplierName}</div>
                      <div>Jl. Science Timur I Blok A 5H</div>
                      <div>Cikarang Timur, Bekasi, Jawa Barat 17530</div>
                    </div>

                    <p className="mb-4 text-justify">
                      According to quality problem report (QPR) that we have checked at Menara Terus Makmur, PT.: We would like to confirm to you that we have agreed if it is found some NG parts which are not caused by our internal process. NG parts and loss can be seen as follows:
                    </p>

                    <table className="w-full text-[9.5px] border-collapse border border-black text-black mb-4 font-sans">
                      <thead>
                        <tr className="border-b border-black text-center font-bold bg-slate-50">
                          <th className="border border-black px-1.5 py-1">Description</th>
                          <th className="border border-black px-1.5 py-1 w-24">Amount (IDR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-2 py-1.5">Penalti Klaim Kualitas (NG Allowance Exceeded)</td>
                          <td className="border border-black px-2 py-1.5 text-right font-mono font-bold">{selectedCl.amount}</td>
                        </tr>
                      </tbody>
                    </table>

                    <p className="mb-4 text-justify">
                      Based on the data above, we will release a debit note to {selectedCl.supplierName} if there is no any confirmation within 5 working days. We are looking forward to your confirmation.
                    </p>

                    <div className="flex justify-between font-sans text-[10px] font-bold mt-8">
                      <div>
                        <span>Yours Faithfully,</span>
                        <div className="mt-1 font-bold">PT Menara Terus Makmur</div>
                        <div className="font-normal text-slate-500">Accounting & Finance Dept.</div>
                      </div>
                      <div className="text-right pr-4">
                        <span>Approved</span>
                        <div className="w-24 border-b border-dashed border-slate-400 h-8 mt-2" />
                        <span className="font-bold text-center w-24 block mt-1">Representative</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Review & Otorisasi Progress */}
                <div className="space-y-4 text-left">
                  <div className="p-4 bg-white border border-slate-150 rounded-lg shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Supplier / Vendor</span>
                    <span className="text-sm font-bold text-slate-800 block mt-1">{selectedCl.supplierName}</span>
                    <span className="text-xs text-slate-450 block mt-0.5">QPR Referensi: {selectedCl.qprNumber || "-"}</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-4 text-[11px] space-y-2.5 shadow-sm">
                    <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">
                      Rantai Otorisasi Internal Accounting
                    </span>
                    <div className="space-y-3 divide-y divide-slate-150">
                      <div className="flex justify-between items-center pt-2.5 first:pt-0">
                        <span className="font-bold text-slate-700">1. Sect Accounting</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                          selectedCl.clApprovalProgress?.sectAccounting ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {selectedCl.clApprovalProgress?.sectAccounting ? "Signed (Anindita)" : "PENDING"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2.5">
                        <span className="font-bold text-slate-700">2. Dept Accounting</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                          selectedCl.clApprovalProgress?.deptAccounting ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {selectedCl.clApprovalProgress?.deptAccounting ? "Signed (Budi Santoso)" : "PENDING"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-lg text-[10px] text-slate-550 leading-relaxed font-semibold">
                    <strong className="text-blue-750 block mb-1">Panduan Otorisasi:</strong>
                    Tombol persetujuan di bawah ini akan aktif dan memvalidasi lembar penalti komersial (Confirmation Letter) sesuai dengan hak akses Anda.
                  </div>
                </div>

              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center gap-2">
              <button
                onClick={() => setPreviewCl(selectedCl)}
                className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-bold transition-colors cursor-pointer"
              >
                <FileText size={13} />
                Preview PDF Lengkap
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedCl(null)} 
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    const level = levelTab === "sect-accounting" ? "sect" : "dept";
                    handleApproveCL(selectedCl.id, level);
                    
                    const clCopy = { ...selectedCl };
                    const nextProgress = { ...clCopy.clApprovalProgress };
                    if (level === "sect") nextProgress.sectAccounting = true;
                    if (level === "dept") nextProgress.deptAccounting = true;
                    
                    const isNowFullyApproved = (level === "dept" || nextProgress.deptAccounting);
                    
                    if (isNowFullyApproved) {
                      setShowSuccessModal({
                        clNumber: clCopy.clNumber,
                        supplierName: clCopy.supplierName,
                        amount: clCopy.amount,
                        cl: { ...clCopy, clApprovalProgress: nextProgress, status: "FULLY_APPROVED" }
                      });
                    } else {
                      alert(`Dokumen CL ${clCopy.clNumber} berhasil di-approve untuk level ${roleName}.`);
                    }
                    setSelectedCl(null);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs shadow-md shadow-blue-500/10 transition-colors cursor-pointer"
                >
                  Approve CL ({roleName})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6 border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Approval Selesai!</h3>
              <p className="text-[11.5px] text-slate-500 font-bold mt-1 leading-normal">
                Dokumen Confirmation Letter <span className="font-mono text-slate-700">{showSuccessModal.clNumber}</span> untuk <span className="text-slate-700">{showSuccessModal.supplierName}</span> telah sepenuhnya disetujui.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setPreviewCl(showSuccessModal.cl);
                  setShowSuccessModal(null);
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={12} />
                Cetak / Print PDF
              </button>
              <button
                onClick={() => {
                  import("xlsx").then((XLSX) => {
                    const items = showSuccessModal.cl.items || [
                      { no: 1, partName: "HUB CLUTCH, IMV 683N", qty: 14, claimCost: 49516, amount: 693224 },
                      { no: 2, partName: "HUB CLUTCH, RZN", qty: 6, claimCost: 56277, amount: 337662 }
                    ];

                    const headers = ["No", "Part Name / Description", "Quantity", "Unit Claim Cost (IDR)", "Subtotal Amount (IDR)"];
                    
                    const excelRows = [
                      { "Col1": "CONFIRMATION LETTER", "Col2": showSuccessModal.clNumber },
                      { "Col1": "Vendor / Supplier", "Col2": showSuccessModal.supplierName },
                      { "Col1": "Tanggal Sent", "Col2": showSuccessModal.cl.dateSent },
                      {}, // Empty row
                      { "Col1": headers[0], "Col2": headers[1], "Col3": headers[2], "Col4": headers[3], "Col5": headers[4] },
                      ...items.map((item: any, idx: number) => ({
                        "Col1": idx + 1,
                        "Col2": item.partName || item.description || "",
                        "Col3": item.qty || item.qtyClaim || 0,
                        "Col4": item.claimCost || item.unitPrice || 0,
                        "Col5": item.amount || item.subtotal || 0
                      })),
                      {}, // Empty row
                      { "Col1": "Total Claim (Exc. VAT)", "Col5": Math.round((parseInt(showSuccessModal.amount.replace(/[^0-9]/g, "")) || 0) / 1.11) },
                      { "Col1": "VAT (11%)", "Col5": (parseInt(showSuccessModal.amount.replace(/[^0-9]/g, "")) || 0) - Math.round((parseInt(showSuccessModal.amount.replace(/[^0-9]/g, "")) || 0) / 1.11) },
                      { "Col1": "Grand Total Claim (IDR)", "Col5": parseInt(showSuccessModal.amount.replace(/[^0-9]/g, "")) || 0 }
                    ];

                    const worksheet = XLSX.utils.json_to_sheet(excelRows, { skipHeader: true });
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, "Confirmation_Letter");
                    XLSX.writeFile(workbook, `Confirmation_Letter_${showSuccessModal.clNumber.replace(/\//g, "_")}.xlsx`);
                    
                    setShowSuccessModal(null);
                    alert("Berkas Excel (.xlsx) untuk Confirmation Letter berhasil diunduh.");
                  }).catch(err => {
                    alert("Gagal mengekspor berkas Excel: " + err);
                  });
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={12} />
                Download Excel (.xlsx)
              </button>
              <button
                onClick={() => setShowSuccessModal(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {previewCl && (
        <ConfirmationLetterPrintPreview
          cl={previewCl}
          onClose={() => setPreviewCl(null)}
        />
      )}

    </div>
  );
}
