"use client";

import React, { useState } from "react";
import { Shield, FileCheck, CheckCircle2, X } from "lucide-react";

export default function SectionHeadView({ pendingNcrs, handleApproveNcrAction, role = "Section Head" }) {
  const sectionHeadNcrs = pendingNcrs.filter((n) => n.requiredRole === role);
  const [selectedNcr, setSelectedNcr] = useState(null);

  return (
    <div className="space-y-6">
      

      {/* Pending list */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Inbox Otoritas NCR</span>
          <h4 className="text-sm font-bold text-slate-800 mt-1">NCR Menunggu Persetujuan {role}</h4>
        </div>

        <div className="p-6">
          {sectionHeadNcrs.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 size={36} className="text-green-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Semua Berkas Bersih!</p>
              <p className="text-[10px] text-slate-400">Tidak ada dokumen NCR tertunda yang memerlukan tanda tangan Anda saat ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sectionHeadNcrs.map((ncr) => (
                <div key={ncr.id} className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                      {ncr.ncrNumber}
                    </span>
                    <h5 className="text-xs font-bold text-slate-800 pt-1">{ncr.partName} ({ncr.partNumber})</h5>
                    <p className="text-[10px] text-slate-400">Supplier: {ncr.supplierName} • Reject: {ncr.reject} pcs / {ncr.qty} pcs</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedNcr(ncr)}
                      className="flex-1 sm:flex-none px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-bold transition-colors animate-all"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => handleApproveNcrAction(ncr.id, ncr.ncrNumber)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-bold shadow-sm shadow-amber-500/10 transition-colors cursor-pointer"
                    >
                      Setujui
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail overlay */}
      {selectedNcr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">Lembar Analisis Defect</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedNcr.ncrNumber}</h4>
              </div>
              <button onClick={() => setSelectedNcr(null)} className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 block">Detail Part & Supplier</span>
                <span className="text-sm font-bold text-slate-800 block mt-1">{selectedNcr.partName}</span>
                <span className="text-xs text-slate-400 block mt-0.5">{selectedNcr.partNumber} • {selectedNcr.supplierName}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                  <span className="text-slate-400 block">Total Kirim:</span>
                  <strong className="text-slate-800 font-bold">{selectedNcr.qty} pcs</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                  <span className="text-slate-400 block">Qty Defect NG:</span>
                  <strong className="text-red-600 font-bold">{selectedNcr.reject} pcs</strong>
                </div>
              </div>

              <div className="p-3 bg-red-50/30 border border-red-100/50 rounded-md space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Jenis Cacat:</span>
                  <span className="text-slate-800 font-bold">{selectedNcr.defectType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Keputusan Disposisi:</span>
                  <span className="text-slate-800 font-bold">{selectedNcr.disposition}</span>
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
              <button
                onClick={() => {
                  handleApproveNcrAction(selectedNcr.id, selectedNcr.ncrNumber);
                  setSelectedNcr(null);
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-bold text-xs shadow-md shadow-amber-500/10 transition-colors"
              >
                Approve & Tanda Tangan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
