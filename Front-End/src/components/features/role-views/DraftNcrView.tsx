"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Trash2, 
  Eye, 
  AlertCircle
} from "lucide-react";
import NcrPrintPreview from "./NcrPrintPreview";

interface DraftNcrViewProps {
  pendingNcrs: any[];
  setPendingNcrs: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveTab: (tab: string) => void;
}

export default function DraftNcrView({ 
  pendingNcrs, 
  setPendingNcrs,
  setActiveTab 
}: DraftNcrViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedNcr, setSelectedNcr] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter NCRs
  const filteredNcrs = pendingNcrs.filter((ncr) => {
    const matchesSearch = 
      ncr.ncrNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ncr.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ncr.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSupplier = filterSupplier === "ALL" || ncr.supplierName === filterSupplier;
    
    // Status mapping: WAITING_APPROVAL/APPROVED/CLOSED vs DRAFT
    let matchesStatus = true;
    if (filterStatus !== "ALL") {
      if (filterStatus === "DRAFT") {
        matchesStatus = ncr.status === "DRAFT";
      } else if (filterStatus === "WAITING_APPROVAL") {
        matchesStatus = ncr.status === "WAITING_APPROVAL";
      } else if (filterStatus === "APPROVED") {
        matchesStatus = ncr.status === "APPROVED" || ncr.status === "CLOSED";
      }
    }
    
    return matchesSearch && matchesSupplier && matchesStatus;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredNcrs.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNcrs.slice(indexOfFirstItem, indexOfLastItem);

  // Send draft to approval
  const handleSendToApproval = (id: string | number) => {
    setPendingNcrs(prev => prev.map(ncr => {
      if (ncr.id === id) {
        return {
          ...ncr,
          status: "WAITING_APPROVAL",
          requiredRole: "Section Head"
        };
      }
      return ncr;
    }));
    alert("Draf NCR berhasil dikirim ke Section Head untuk Approval!");
  };

  // Delete draft
  const handleDeleteDraft = (id: string | number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus draf NCR ini?")) {
      setPendingNcrs(prev => prev.filter(ncr => ncr.id !== id));
    }
  };

  // Unique list of suppliers for filter dropdown
  const suppliers = Array.from(new Set(pendingNcrs.map(n => n.supplierName)));

  // Count metrics
  const totalCount = pendingNcrs.length;
  const draftCount = pendingNcrs.filter(n => n.status === "DRAFT").length;
  const pendingCount = pendingNcrs.filter(n => n.status === "WAITING_APPROVAL").length;
  const approvedCount = pendingNcrs.filter(n => n.status === "APPROVED" || n.status === "CLOSED").length;

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="pl-1">
        <h4 className="text-lg font-black text-slate-800">Draf & Status Laporan NCR</h4>
        <p className="text-xs text-slate-400 font-semibold mt-1">Review, kirim ke approval, atau cetak dokumen NCR yang telah dibuat.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total NCR */}
        <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileText size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total NCR</span>
            <strong className="text-lg font-black text-slate-800">{totalCount}</strong>
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-500 rounded-lg">
            <FileText size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Draf Simpanan</span>
            <strong className="text-lg font-black text-slate-700">{draftCount}</strong>
          </div>
        </div>

        {/* Waiting Approval */}
        <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-655 rounded-lg">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Menunggu Approval</span>
            <strong className="text-lg font-black text-slate-800">{pendingCount}</strong>
          </div>
        </div>

        {/* Approved / Closed */}
        <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sudah Disetujui</span>
            <strong className="text-lg font-black text-slate-800">{approvedCount}</strong>
          </div>
        </div>
      </div>

      {/* Main Card with Filter & Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 space-y-4">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari ID NCR, Part, Supplier..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 w-full text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
            />
          </div>

          <div>
            <select
              value={filterSupplier}
              onChange={(e) => {
                setFilterSupplier(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 w-full text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-700 bg-white"
            >
              <option value="ALL">Semua Supplier</option>
              {suppliers.map((sup, idx) => (
                <option key={idx} value={sup}>{sup}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 w-full text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-700 bg-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">Draf (Belum Dikirim)</option>
              <option value="WAITING_APPROVAL">Menunggu Approval</option>
              <option value="APPROVED">Disetujui / Selesai</option>
            </select>
          </div>
        </div>

        {/* NCR Table */}
        <div className="overflow-x-auto border border-slate-150 rounded-lg">
          <table className="w-full text-[11px] text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200 uppercase text-[9px] tracking-wider">
              <tr>
                <th className="px-4 py-3">No. NCR / ID</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Part Name</th>
                <th className="px-4 py-3 text-right">Qty NG</th>
                <th className="px-4 py-3">Jenis Cacat</th>
                <th className="px-4 py-3">Tanggal Temuan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 italic">
                    <AlertCircle size={28} className="mx-auto text-slate-300 mb-2" />
                    Tidak ada draf atau laporan NCR yang sesuai filter.
                  </td>
                </tr>
              ) : (
                currentItems.map((ncr) => {
                  return (
                    <tr key={ncr.id} className="hover:bg-slate-55 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-850">{ncr.ncrNumber}</td>
                      <td className="px-4 py-3 text-slate-800 font-bold">{ncr.supplierName}</td>
                      <td className="px-4 py-3 text-slate-650">{ncr.partName}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{ncr.reject || ncr.qty || 0}</td>
                      <td className="px-4 py-3 text-slate-500">{ncr.defectType || "-"}</td>
                      <td className="px-4 py-3 text-slate-500 font-semibold">{ncr.date}</td>
                      <td className="px-4 py-3">
                        {ncr.status === "DRAFT" ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-black uppercase">
                            Draf
                          </span>
                        ) : ncr.status === "WAITING_APPROVAL" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-250 rounded text-[9px] font-black uppercase">
                            <span className="w-1.5 h-1.5 bg-amber-550 rounded-full animate-ping" />
                            {ncr.requiredRole === "Section Head" ? "Waiting SPV" : "Waiting Dept"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[9px] font-black uppercase">
                            Disetujui
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {/* Preview PDF */}
                          <button
                            onClick={() => setSelectedNcr(ncr)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-150 border border-slate-250 text-slate-700 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                            title="Pratinjau Lembar NCR PDF"
                          >
                            <Eye size={11} />
                            Lihat PDF
                          </button>

                          {/* Submit Draft */}
                          {ncr.status === "DRAFT" && (
                            <>
                              <button
                                onClick={() => handleSendToApproval(ncr.id)}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                                title="Kirim ke Section Head untuk Approval"
                              >
                                <Send size={11} />
                                Kirim
                              </button>
                              <button
                                onClick={() => handleDeleteDraft(ncr.id)}
                                className="px-2 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded text-[10px] font-bold cursor-pointer transition-colors"
                                title="Hapus Draf"
                              >
                                <Trash2 size={11} />
                              </button>
                            </>
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

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-2 text-xs">
            <span className="text-slate-400 font-semibold">
              Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredNcrs.length)} dari {filteredNcrs.length} item
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-slate-650"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1 font-bold text-slate-800 bg-slate-50 rounded border border-slate-200">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-slate-655"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NCR Print Preview Modal */}
      {selectedNcr && (
        <NcrPrintPreview 
          ncr={selectedNcr} 
          onClose={() => setSelectedNcr(null)} 
        />
      )}
    </div>
  );
}
