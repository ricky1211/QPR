"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, Search, Eye, AlertCircle, Trash2, Send } from "lucide-react";
import ConfirmationLetterPrintPreview from "./ConfirmationLetterPrintPreview";

interface DraftClViewProps {
  confirmationLetters: any[];
  setConfirmationLetters: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveTab: (tab: string) => void;
}

export default function DraftClView({ confirmationLetters, setConfirmationLetters, setActiveTab }: DraftClViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedCl, setSelectedCl] = useState<any | null>(null);

  const filteredCls = confirmationLetters.filter(cl => {
    const matchesSearch =
      cl.clNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cl.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSupplier = filterSupplier === "ALL" || cl.supplierName === filterSupplier;

    let matchesStatus = true;
    if (filterStatus !== "ALL") {
      if (filterStatus === "DRAFT") {
        matchesStatus = cl.status === "DRAFT" || cl.status === "PENDING";
      } else if (filterStatus === "WAITING_APPROVAL") {
        matchesStatus = cl.status === "APPROVED_SECT" || cl.status === "PENDING";
      } else if (filterStatus === "APPROVED") {
        matchesStatus = cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID";
      }
    }
    return matchesSearch && matchesSupplier && matchesStatus;
  });

  const suppliers = Array.from(new Set(confirmationLetters.map(cl => cl.supplierName)));

  const handleSendToApproval = (id: string | number) => {
    setConfirmationLetters(prev => prev.map(cl => {
      if (cl.id === id) {
        return { ...cl, status: "APPROVED_SECT", requiredRole: "Dept Accounting" };
      }
      return cl;
    }));
    alert("Draf CL berhasil dikirim ke Dept Head Accounting untuk Approval!");
  };

  const handleDeleteDraft = (id: string | number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus draf CL ini?")) {
      setConfirmationLetters(prev => prev.filter(cl => cl.id !== id));
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="pl-1">
        <h4 className="text-lg font-black text-slate-800">Draf &amp; Status Laporan Confirmation Letter</h4>
        <p className="text-xs text-slate-400 font-semibold mt-1">Review, kirim ke approval, atau cetak dokumen Confirmation Letter.</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari ID CL, Supplier..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
            />
          </div>
          <select
            value={filterSupplier}
            onChange={e => setFilterSupplier(e.target.value)}
            className="px-3 py-2 w-full text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-700 bg-white"
          >
            <option value="ALL">Semua Supplier</option>
            {suppliers.map((s, idx) => (
              <option key={idx} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 w-full text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-700 bg-white"
          >
            <option value="ALL">Semua Status</option>
            <option value="DRAFT">Draf (Belum Dikirim)</option>
            <option value="WAITING_APPROVAL">Menunggu Approval</option>
            <option value="APPROVED">Disetujui / Selesai</option>
          </select>
        </div>

        <div className="overflow-x-auto border border-slate-150 rounded-lg">
          <table className="w-full text-[11px] text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200 uppercase text-[9px] tracking-wider">
              <tr>
                <th className="px-4 py-3">No. CL</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">No. QPR Ref</th>
                <th className="px-4 py-3 font-mono">Tanggal Kirim</th>
                <th className="px-4 py-3 text-right">Nilai Klaim</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
              {filteredCls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic">
                    <AlertCircle size={28} className="mx-auto text-slate-300 mb-2" />
                    Tidak ada draf atau laporan CL yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredCls.map(cl => (
                  <tr key={cl.id} className="hover:bg-slate-55 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-850">{cl.clNumber}</td>
                    <td className="px-4 py-3 text-slate-800 font-bold">{cl.supplierName}</td>
                    <td className="px-4 py-3 text-slate-650 font-mono">{cl.qprNumber}</td>
                    <td className="px-4 py-3 text-slate-500 font-semibold">{cl.dateSent}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-850">{cl.amount}</td>
                    <td className="px-4 py-3 text-center">
                      {cl.status === "PENDING" ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-black uppercase">Draf</span>
                      ) : cl.status === "APPROVED_SECT" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-250 rounded text-[9px] font-black uppercase">
                          ⏳ Waiting Dept
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[9px] font-black uppercase">
                          <CheckCircle2 size={9} /> Disetujui
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCl(cl)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded border border-blue-700 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <Eye size={11} /> Cetak PDF
                        </button>
                        {cl.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleSendToApproval(cl.id)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                            >
                              <Send size={11} /> Kirim
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(cl.id)}
                              className="px-2 py-1.5 bg-red-550 hover:bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCl && (
        <ConfirmationLetterPrintPreview cl={selectedCl} onClose={() => setSelectedCl(null)} />
      )}
    </div>
  );
}
