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
import { getPeriodFromDate } from "@/services/qprService";

interface ApproveClDashboardProps {
  confirmationLetters: any[];
  setConfirmationLetters?: React.Dispatch<React.SetStateAction<any[]>>;
  handleApproveCL: (clId: string, level: "sect" | "dept" | "div") => void;
  handleMarkClosedPaid?: (clId: string) => void;
  handleDebitNote?: (clId: string) => void;
  handleUpdateCLPipeline?: (clId: string, data: any) => void;
  username?: string;
}

export default function ApproveClDashboard({ 
  confirmationLetters, 
  setConfirmationLetters,
  handleApproveCL, 
  handleMarkClosedPaid, 
  handleDebitNote, 
  handleUpdateCLPipeline,
  username = "admin" 
}: ApproveClDashboardProps) {
  
  const getInitialTab = () => {
    return "dept-accounting";
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

  // Upload modal state for Purchasing / Vendor flow
  const [uploadModalCl, setUploadModalCl] = useState<any | null>(null);
  const [uploadType, setUploadType] = useState<"send_to_vendor" | "vendor_approved">("send_to_vendor");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handlePurchasingSendCl = (cl: any, file?: File) => {
    const payload: any = {
      purchasingSentCl: true,
      purchasingSentDate: new Date().toISOString().split("T")[0],
      sentToVendor: true,
    };
    if (file) {
      payload.signedClFileName = file.name;
      payload.signedClFileUrl = URL.createObjectURL(file);
    }
    if (handleUpdateCLPipeline) {
      handleUpdateCLPipeline(cl.id, payload);
    } else if (setConfirmationLetters) {
      setConfirmationLetters(prev => prev.map(c => c.id === cl.id ? { ...c, ...payload } : c));
    }
    setUploadModalCl(null);
    setSelectedFile(null);
    alert(`CL ${cl.clNumber} berhasil dikirim ke Vendor! Status kini beralih ke "4. WAITING VENDOR APPROVAL".`);
  };

  const handleVendorApproveCl = (cl: any, file?: File) => {
    const payload: any = {
      vendorApproved: true,
      vendorApprovedDate: new Date().toISOString().split("T")[0],
      readyForSSC: true,
    };
    if (file) {
      payload.vendorApprovedDocName = file.name;
      payload.vendorApprovedDocUrl = URL.createObjectURL(file);
    }
    if (handleUpdateCLPipeline) {
      handleUpdateCLPipeline(cl.id, payload);
    } else if (setConfirmationLetters) {
      setConfirmationLetters(prev => prev.map(c => c.id === cl.id ? { ...c, ...payload } : c));
    }
    setUploadModalCl(null);
    setSelectedFile(null);
    alert(`CL ${cl.clNumber} berhasil disetujui Vendor! Dokumen diteruskan ke modul SSC Billing (I-Memo).`);
  };

  // Calculate claim count for each vendor dynamically based on CLs
  const vendorClaimCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    
    confirmationLetters.forEach((cl: any) => {
      const name = cl.supplierName;
      if (name) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return counts;
  }, [confirmationLetters]);

  // Filter pending CLs by role
  const getRoleName = (tab: string) => {
    return "Dept Accounting";
  };
  const roleName = getRoleName(levelTab);
  
  // Pending CLs for the currently active tab
  const rolePendingCls = confirmationLetters.filter((cl) => {
    if (cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID" || cl.requiredRole === "Closed") {
      return false;
    }
    return true; // Any pending CL is waiting for Dept Accounting
  });

  // Approved CLs
  const approvedCls = React.useMemo(() => {
    return confirmationLetters.filter((cl) => {
      return cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID" || cl.requiredRole === "Closed";
    });
  }, [confirmationLetters]);

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
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg font-bold uppercase whitespace-nowrap">
            Otorisasi: Dept Accounting
          </span>

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
                {Array.from(new Set(confirmationLetters.map(cl => cl.period || getPeriodFromDate(cl.dateSent || cl.date)))).map(per => (
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
          <table className="w-full table-fixed text-left text-xs border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-400 text-slate-800 font-extrabold uppercase text-[10px] tracking-wider text-center">
                <th className="px-2 py-3 border-r border-slate-400 w-[18%] text-center font-bold">No. Confirmation Letter</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[18%] text-center font-bold">Detail Vendor</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[10%] text-center font-bold">Tanggal Kirim</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[38%] text-center font-bold">Status Pipeline CL</th>
                <th className="px-2 py-3 w-[16%] text-center font-bold">Aksi & Kontrol</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400 font-medium">
                    <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2 opacity-50" />
                    Tidak ada Confirmation Letter yang butuh approval di role ini.
                  </td>
                </tr>
              ) : (
                currentItems.map((cl) => {
                  const isDeptApproved = !!(cl.clApprovalProgress?.deptAccounting || cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID");
                  const isPurchasingSent = !!(cl.purchasingSentCl || cl.status === "CLOSED_PAID");
                  const isVendorApproved = !!(cl.vendorApproved || cl.status === "CLOSED_PAID");
                  const isClosedPaid = !!(cl.closedPaid || cl.status === "CLOSED_PAID");

                  const stages = [
                    {
                      name: "1. WAITING DEPT ACCOUNTING",
                      status: isDeptApproved ? "APPROVED" : "PENDING"
                    },
                    {
                      name: "2. DEPT ACCOUNTING APPROVE",
                      status: isDeptApproved ? "APPROVED" : "UPCOMING"
                    },
                    {
                      name: "3. PURCHASING SEND CL",
                      status: isPurchasingSent ? "APPROVED" : (isDeptApproved ? "PENDING" : "UPCOMING")
                    },
                    {
                      name: "4. WAITING VENDOR APPROVAL",
                      status: isVendorApproved ? "APPROVED" : (isPurchasingSent ? "PENDING" : "UPCOMING")
                    },
                    {
                      name: "5. VENDOR APPROVED",
                      status: isVendorApproved ? "APPROVED" : "UPCOMING"
                    }
                  ];

                  return (
                    <tr key={cl.id} className="border-b border-slate-400 hover:bg-slate-50/40 transition-colors text-center font-bold">
                      {/* No. Confirmation Letter */}
                      <td className="px-2 py-3 border-r border-slate-400 text-center font-bold text-slate-800 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {cl.clNumber}
                      </td>

                      {/* Detail Vendor */}
                      <td className="px-2 py-3 border-r border-slate-400 text-left">
                        <div className="font-bold text-slate-700 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1.5">
                          <span>{cl.supplierName}</span>
                          {(() => {
                            const count = vendorClaimCounts[cl.supplierName] || 1;
                            if (count > 1) {
                              return (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-black uppercase tracking-wider" title={`${count} Claims`}>
                                  More Than One ({count}x)
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded text-[9px] font-black uppercase tracking-wider" title="1 Claim">
                                  1st Time
                                </span>
                              );
                            }
                          })()}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">QPR: {cl.qprNumber || "Custom CL"}</div>
                      </td>

                      {/* Tanggal Kirim */}
                      <td className="px-2 py-3 border-r border-slate-400 text-center text-slate-600 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {cl.dateSent}
                      </td>

                      {/* Status Pipeline CL (5 Tahap) */}
                      <td className="px-2 py-3 border-r border-slate-400 text-center">
                        <div className="flex items-center gap-1 justify-center py-1 whitespace-nowrap flex-wrap">
                          {stages.map((stage, i, arr) => (
                            <React.Fragment key={i}>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-extrabold transition-all border shrink-0 ${
                                  stage.status === "APPROVED"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : stage.status === "PENDING"
                                    ? "bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-100 animate-pulse"
                                    : "bg-slate-50 text-slate-400 border-slate-200 opacity-60"
                                }`}
                              >
                                {stage.status === "APPROVED" && <CheckCircle2 size={9} className="text-emerald-600 shrink-0" />}
                                {stage.status === "PENDING" && <Clock size={9} className="text-amber-500 shrink-0" />}
                                {stage.name}
                              </span>
                              {i < arr.length - 1 && (
                                <span className="text-slate-300 text-xs font-black select-none">:</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </td>

                      {/* Aksi & Kontrol */}
                      <td className="px-2 py-3 text-center">
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setSelectedCl(cl)}
                            className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10.5px] font-black transition-all cursor-pointer active:scale-95 shadow-sm text-center"
                          >
                            Review
                          </button>

                          {/* Purchasing Controls */}
                          {(username === "purchasing" || username === "admin") && isDeptApproved && !isPurchasingSent && (
                            <div className="flex items-center gap-1 w-full">
                              <button
                                type="button"
                                onClick={() => handlePurchasingSendCl(cl)}
                                className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[8.5px] font-extrabold uppercase shadow-sm cursor-pointer transition-all active:scale-95"
                                title="Kirim CL ke Vendor"
                              >
                                Kirim ke Vendor
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadModalCl(cl);
                                  setUploadType("send_to_vendor");
                                  setSelectedFile(null);
                                }}
                                className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[8.5px] font-extrabold uppercase shadow-sm cursor-pointer transition-all active:scale-95"
                                title="Upload File Dokumen CL Signed"
                              >
                                Upload
                              </button>
                            </div>
                          )}

                          {(username === "purchasing" || username === "admin") && isPurchasingSent && !isVendorApproved && (
                            <div className="flex items-center gap-1 w-full">
                              <button
                                type="button"
                                onClick={() => handleVendorApproveCl(cl)}
                                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[8.5px] font-extrabold uppercase shadow-sm cursor-pointer transition-all active:scale-95"
                                title="Vendor Menyetujui CL"
                              >
                                Vendor Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadModalCl(cl);
                                  setUploadType("vendor_approved");
                                  setSelectedFile(null);
                                }}
                                className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[8.5px] font-extrabold uppercase shadow-sm cursor-pointer transition-all active:scale-95"
                                title="Upload Bukti Persetujuan Vendor"
                              >
                                Upload
                              </button>
                            </div>
                          )}

                          {isVendorApproved && !isClosedPaid && (
                            <span className="w-full text-center text-[8.5px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 py-0.5 rounded">
                              ✓ Siap ke SSC Billing
                            </span>
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

      {/* Approved Confirmation Letters List */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden p-4 mt-6">
        <div className="border-b border-slate-150 pb-3 mb-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Riwayat Dokumen</span>
            <h4 className="text-sm font-bold text-slate-800 mt-1">Daftar Confirmation Letter yang Disetujui (Approved)</h4>
          </div>
          <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded shadow-sm">
            Total: {approvedCls.length} Disetujui
          </span>
        </div>

        <div className="border border-slate-400 rounded-lg overflow-hidden">
          <table className="w-full table-fixed text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-400 text-slate-800 font-extrabold uppercase text-[10px] tracking-wider text-center">
                <th className="px-2 py-3 border-r border-slate-400 w-[25%] text-center font-bold">No. Confirmation Letter</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[25%] text-center font-bold">Detail Vendor</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[15%] text-center font-bold">Tanggal Kirim</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[15%] text-center font-bold">Total Nilai</th>
                <th className="px-2 py-3 border-r border-slate-400 w-[12%] text-center font-bold">Status</th>
                <th className="px-2 py-3 w-[8%] text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {approvedCls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    Tidak ada Confirmation Letter yang sudah disetujui.
                  </td>
                </tr>
              ) : (
                approvedCls.map((cl) => (
                  <tr key={cl.id} className="border-b border-slate-400 hover:bg-slate-50/40 transition-colors text-center font-bold">
                    <td className="px-2 py-3 border-r border-slate-400 text-center font-bold text-slate-800 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {cl.clNumber}
                    </td>
                    <td className="px-2 py-3 border-r border-slate-400 text-left">
                      <div className="font-bold text-slate-700 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {cl.supplierName}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold mt-0.5">QPR: {cl.qprNumber}</div>
                    </td>
                    <td className="px-2 py-3 border-r border-slate-400 text-center text-slate-600">
                      {cl.dateSent}
                    </td>
                    <td className="px-2 py-3 border-r border-slate-400 text-center text-slate-700 font-bold">
                      {cl.amount}
                    </td>
                    <td className="px-2 py-3 border-r border-slate-400 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[9px] font-black uppercase tracking-wider">
                        APPROVED
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setPreviewCl(cl)}
                        className="w-full py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-black transition-all cursor-pointer shadow-sm text-center"
                      >
                        Print PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                  <div className="w-full max-w-2xl bg-white shadow-md rounded border border-slate-300">
                    <ConfirmationLetterPrintPreview cl={selectedCl} inline={true} />
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
                        <span className="font-bold text-slate-700">1. Dept Accounting</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                          selectedCl.clApprovalProgress?.deptAccounting ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {selectedCl.clApprovalProgress?.deptAccounting ? "Signed (Anindita Irnilaningtyas)" : "PENDING"}
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
              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => setSelectedCl(null)} 
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                {(() => {
                  const canUserApproveCl = username === "admin" || username === "accounting";

                  if (!canUserApproveCl) {
                    return (
                      <span className="px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-md text-xs font-bold italic select-none">
                        Mode Memantau (Read-Only)
                      </span>
                    );
                  }
                  return (
                    <button
                      onClick={() => {
                        const level = "dept";
                        handleApproveCL(selectedCl.id, level);
                        
                        const clCopy = { ...selectedCl };
                        const nextProgress = { ...clCopy.clApprovalProgress };
                        nextProgress.sectAccounting = true; // Auto-set for compat
                        nextProgress.deptAccounting = true;
                        
                        const isNowFullyApproved = true;
                        
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
                  );
                })()}
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

      {/* Modal Upload File CL / Bukti Kirim Vendor */}
      {uploadModalCl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6 border border-slate-150 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  {uploadType === "send_to_vendor" ? "Purchasing: Kirim Dokumen CL ke Vendor" : "Purchasing: Upload Persetujuan Vendor"}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{uploadModalCl.clNumber}</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadModalCl(null);
                  setSelectedFile(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vendor:</span>
                  <span className="font-bold text-slate-800">{uploadModalCl.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Claim:</span>
                  <span className="font-bold text-blue-600">{uploadModalCl.amount}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {uploadType === "send_to_vendor" ? "Upload Dokumen Confirmation Letter (Signed PDF):" : "Upload Bukti Konfirmasi Vendor (PDF / Gambar):"}
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-5 text-center bg-slate-50 hover:bg-blue-50/30 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs">
                      <FileText size={16} />
                      <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Download size={20} className="mx-auto text-slate-400" />
                      <p className="text-xs font-bold text-slate-600">Klik atau Drag & Drop file di sini</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Format: PDF, PNG, JPG (Maks. 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[10.5px] font-semibold text-amber-800 leading-relaxed">
                {uploadType === "send_to_vendor" 
                  ? "Mengunggah file dan mengirim CL akan mengubah status dokumen menjadi '4. WAITING VENDOR APPROVAL'."
                  : "Mengunggah bukti persetujuan vendor akan mengubah status menjadi '5. VENDOR APPROVED' dan otomatis meneruskan data ke antrean SSC Billing."}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setUploadModalCl(null);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (uploadType === "send_to_vendor") {
                    handlePurchasingSendCl(uploadModalCl, selectedFile || undefined);
                  } else {
                    handleVendorApproveCl(uploadModalCl, selectedFile || undefined);
                  }
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {uploadType === "send_to_vendor" ? "Kirim CL ke Vendor" : "Simpan Persetujuan Vendor"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
