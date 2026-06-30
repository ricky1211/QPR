"use client";

import React, { useState } from "react";
import { Briefcase, FileCheck, CheckCircle2, X } from "lucide-react";

export default function DeptHeadView({
  pendingNcrs,
  pendingQprs,
  handleApproveNcrAction,
  handleApproveQprAction
}) {
  const deptHeadNcrs = pendingNcrs.filter((n) => n.requiredRole === "Dept Head");
  const deptHeadQprs = pendingQprs.filter((q) => q.requiredRole === "Dept Head");

  const [selectedNcr, setSelectedNcr] = useState(null);
  const [selectedQpr, setSelectedQpr] = useState(null);

  return (
    <div className="space-y-6">
      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Panel 1: Pending NCRs */}
        <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 bg-slate-50/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Inbox NCR Level 2</span>
              <h4 className="text-sm font-bold text-slate-800 mt-1">NCR Menunggu Persetujuan Final</h4>
            </div>

            <div className="p-5 space-y-3">
              {deptHeadNcrs.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <CheckCircle2 size={30} className="text-green-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Inbox NCR Bersih</p>
                </div>
              ) : (
                deptHeadNcrs.map((ncr) => (
                  <div key={ncr.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-md space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[9px] font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {ncr.ncrNumber}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-extrabold uppercase">Waiting ACC</span>
                    </div>
                    <div className="text-xs text-slate-800 font-bold">
                      {ncr.partName} ({ncr.partNumber})
                    </div>
                    <p className="text-[10px] text-slate-400">Supplier: {ncr.supplierName} • NG Defect: {ncr.reject} pcs</p>
                    <div className="flex gap-2 pt-1.5 border-t border-slate-100/50">
                      <button onClick={() => setSelectedNcr(ncr)} className="flex-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 transition-all">Detail</button>
                      <button onClick={() => handleApproveNcrAction(ncr.id, ncr.ncrNumber)} className="flex-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all">Approve</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel 2: Pending QPRs */}
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
                  <div key={qpr.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-md space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[9px] font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {qpr.qprNumber}
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-extrabold uppercase animate-pulse">Waiting ACC</span>
                    </div>
                    <div className="text-xs text-slate-800 font-bold">
                      Klaim Bulanan - {qpr.supplierName}
                    </div>
                    <div className="flex justify-between text-[10px] bg-white p-2 rounded-lg border border-slate-100/50">
                      <div>
                        <span className="text-slate-400 block">Transaksi:</span>
                        <strong className="text-slate-700 font-semibold">{qpr.period}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Total Defect:</span>
                        <strong className="text-slate-700 font-semibold">{qpr.rejectItems} pcs</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-red-500 font-bold">Nilai Claim:</span>
                        <strong className="text-red-600 font-extrabold">{qpr.claimAmount}</strong>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1.5">
                      <button onClick={() => setSelectedQpr(qpr)} className="flex-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 transition-all">Detail</button>
                      <button onClick={() => handleApproveQprAction(qpr.id, qpr.qprNumber)} className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all">Setujui</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* NCR Details Modal */}
      {selectedNcr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">Lembar Analisis Defect (Dept Head)</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedNcr.ncrNumber}</h4>
              </div>
              <button onClick={() => setSelectedNcr(null)} className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
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
              <button onClick={() => setSelectedNcr(null)} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-bold transition-colors">Batal</button>
              <button
                onClick={() => {
                  handleApproveNcrAction(selectedNcr.id, selectedNcr.ncrNumber);
                  setSelectedNcr(null);
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-bold text-xs shadow-md shadow-amber-500/10 transition-colors"
              >
                Approve Level 2
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

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button onClick={() => setSelectedQpr(null)} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-bold transition-colors">Batal</button>
              <button
                onClick={() => {
                  handleApproveQprAction(selectedQpr.id, selectedQpr.qprNumber);
                  setSelectedQpr(null);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-md font-bold text-xs shadow-md shadow-indigo-500/10 transition-colors"
              >
                Approve QPR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
