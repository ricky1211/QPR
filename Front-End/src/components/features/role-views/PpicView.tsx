"use client";

import React, { useState } from "react";
import { Users, FileCheck, CheckCircle2, X, FileText } from "lucide-react";
import QprPrintPreview from "./QprPrintPreview";

export default function PpicView({ pendingQprs, handleApproveQprAction }) {
  const ppicQprs = pendingQprs.filter((q) => q.requiredRole === "PPIC Staff");
  const [selectedQpr, setSelectedQpr] = useState(null);
  const [previewQpr, setPreviewQpr] = useState(null);

  return (
    <div className="space-y-6">
      

      {/* Inbox list */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Inbox Validasi PPIC</span>
          <h4 className="text-sm font-bold text-slate-800 mt-1">Klaim QPR Menunggu Validasi PPIC</h4>
        </div>

        <div className="p-6">
          {ppicQprs.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 size={36} className="text-green-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Semua Berkas Bersih!</p>
              <p className="text-[10px] text-slate-400">Tidak ada pengajuan klaim QPR yang memerlukan validasi PPIC saat ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ppicQprs.map((qpr) => (
                <div key={qpr.id} className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                      {qpr.qprNumber}
                    </span>
                    <h5 className="text-xs font-bold text-slate-800 pt-1">Denda Klaim Bulanan - {qpr.supplierName}</h5>
                    <p className="text-[10px] text-slate-400">Periode: {qpr.period} • Claim Amount: <strong className="text-red-600">{qpr.claimAmount}</strong></p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setPreviewQpr(qpr)}
                      className="flex-1 sm:flex-none flex items-center gap-1.5 px-3.5 py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-bold transition-colors cursor-pointer"
                    >
                      <FileText size={12} />
                      Preview QPR
                    </button>
                    <button
                      onClick={() => setSelectedQpr(qpr)}
                      className="flex-1 sm:flex-none px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-bold transition-colors cursor-pointer"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => handleApproveQprAction(qpr.id, qpr.qprNumber)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold shadow-sm shadow-teal-600/10 transition-colors cursor-pointer"
                    >
                      Validasi QPR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details modal */}
      {selectedQpr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-teal-600 tracking-widest uppercase">Validasi Hitungan Denda (PPIC)</span>
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
                  <span className="text-slate-400 block">Total Kirim:</span>
                  <strong className="text-slate-800 font-bold">{selectedQpr.totalItems} pcs</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                  <span className="text-slate-400 block">Total Reject:</span>
                  <strong className="text-red-600 font-bold">{selectedQpr.rejectItems} pcs</strong>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-150 rounded-lg text-center">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">Total Nilai Denda</span>
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
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-bold text-xs shadow-md shadow-teal-600/10 transition-colors cursor-pointer"
                >
                  Validasi & Approve
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
