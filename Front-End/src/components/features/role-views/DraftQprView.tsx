"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, Search, Eye, AlertCircle, Trash2, Send } from "lucide-react";
import QprPrintPreview from "./QprPrintPreview";

interface DraftQprViewProps {
  pendingQprs: any[];
  setPendingQprs: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveTab: (tab: string) => void;
}

export default function DraftQprView({ pendingQprs, setPendingQprs, setActiveTab }: DraftQprViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedQpr, setSelectedQpr] = useState<any | null>(null);

  const filteredQprs = pendingQprs.filter(qpr => {
    const matchesSearch =
      qpr.qprNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qpr.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSupplier = filterSupplier === "ALL" || qpr.supplierName === filterSupplier;
    
    let matchesStatus = true;
    if (filterStatus !== "ALL") {
      if (filterStatus === "DRAFT") {
        matchesStatus = qpr.status === "DRAFT";
      } else if (filterStatus === "WAITING_APPROVAL") {
        matchesStatus = qpr.status === "WAITING_APPROVAL";
      } else if (filterStatus === "APPROVED") {
        matchesStatus = qpr.status === "APPROVED" || qpr.status === "CLOSED" || qpr.status === "APPROVED_INTERNAL";
      }
    }
    return matchesSearch && matchesSupplier && matchesStatus;
  });

  const suppliers = Array.from(new Set(pendingQprs.map(q => q.supplierName)));

  const handleSendToApproval = (id: string | number) => {
    setPendingQprs(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, status: "WAITING_APPROVAL", requiredRole: "Section Head" };
      }
      return q;
    }));
    alert("Draf QPR berhasil dikirim ke Section Head untuk Approval!");
  };

  const handleDeleteDraft = (id: string | number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus draf QPR ini?")) {
      setPendingQprs(prev => prev.filter(q => q.id !== id));
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="pl-1">
        <h4 className="text-lg font-black text-slate-800">Draf &amp; Status Laporan QPR</h4>
        <p className="text-xs text-slate-400 font-semibold mt-1">Review, kirim ke approval, atau cetak dokumen QPR.</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari ID QPR, Supplier..."
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
                <th className="px-4 py-3">No. QPR</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Tanggal Buat</th>
                <th className="px-4 py-3 text-right">Nilai Klaim</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
              {filteredQprs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic">
                    <AlertCircle size={28} className="mx-auto text-slate-300 mb-2" />
                    Tidak ada draf atau laporan QPR yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredQprs.map(qpr => (
                  <tr key={qpr.id} className="hover:bg-slate-55 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-850">{qpr.qprNumber}</td>
                    <td className="px-4 py-3 text-slate-800 font-bold">{qpr.supplierName}</td>
                    <td className="px-4 py-3 text-slate-650">{qpr.period || "Juni 2026"}</td>
                    <td className="px-4 py-3 text-slate-500 font-semibold">{qpr.date}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-850">{qpr.claimAmount}</td>
                    <td className="px-4 py-3 text-center">
                      {qpr.status === "DRAFT" ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-black uppercase">Draf</span>
                      ) : qpr.status === "WAITING_APPROVAL" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-250 rounded text-[9px] font-black uppercase">
                          ⏳ {qpr.requiredRole || "Approve"}
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
                          onClick={() => setSelectedQpr(qpr)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded border border-blue-700 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <Eye size={11} /> Cetak PDF
                        </button>
                        {qpr.status === "DRAFT" && (
                          <>
                            <button
                              onClick={() => handleSendToApproval(qpr.id)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                            >
                              <Send size={11} /> Kirim
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(qpr.id)}
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

      {selectedQpr && (
        <QprPrintPreview qpr={selectedQpr} onClose={() => setSelectedQpr(null)} />
      )}
    </div>
  );
}
