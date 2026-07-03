"use client";

import React, { useState } from "react";
import { Briefcase, FileCheck, CheckCircle2, X } from "lucide-react";

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
  const [reviewComment, setReviewComment] = useState("");

  const isMngApproved = selectedNcr && (selectedNcr.requiredRole === "Closed" || selectedNcr.status === "APPROVED");

  return (
    <div className="space-y-6">
      

      <div className={`grid gap-6 ${showNcr && showQpr ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-3xl mx-auto w-full"}`}>
        
        {/* Panel 1: Pending NCRs */}
        {showNcr && (
          <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-100 bg-slate-50/30">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Inbox NCR</span>
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
                    <div key={ncr.id} className="p-5 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[10px] font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                          {ncr.ncrNumber}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-extrabold uppercase">Waiting ACC</span>
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {ncr.partName} ({ncr.partNumber})
                      </div>
                      <p className="text-xs text-slate-500">Supplier: <strong className="text-slate-700 font-bold">{ncr.supplierName}</strong> • NG Defect: <strong className="text-red-600 font-extrabold">{ncr.reject} pcs</strong></p>
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50">
                        <button onClick={() => { setSelectedNcr(ncr); setReviewComment(""); }} className="px-5 py-2 border border-slate-200 hover:bg-slate-150 rounded-lg text-[11px] font-bold text-slate-600 transition-all">Detail</button>
                        <button onClick={() => handleApproveNcrAction(ncr.id, ncr.ncrNumber)} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold shadow-md shadow-amber-500/10 transition-all cursor-pointer">Approve</button>
                      </div>
                    </div>
                  ))
                )}
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
                        <button onClick={() => setSelectedQpr(qpr)} className="px-5 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-bold text-slate-600 transition-all">Detail</button>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">Lembar Analisis Defect (Dept Head)</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedNcr.ncrNumber}</h4>
              </div>
              <button onClick={() => setSelectedNcr(null)} className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Defect details */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 block">Detail Part & Supplier</span>
                    <span className="text-sm font-bold text-slate-800 block mt-1">{selectedNcr.partName}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">{selectedNcr.partNumber} • {selectedNcr.supplierName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center text-xs">
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                      <span className="text-slate-400 block font-bold">Qty NG:</span>
                      <strong className="text-slate-800 font-extrabold">{selectedNcr.qty} pcs</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                      <span className="text-slate-400 block font-bold">NG Types:</span>
                      <strong className="text-red-650 font-extrabold text-red-600 uppercase">{selectedNcr.reject}</strong>
                    </div>
                  </div>

                  <div className="p-3.5 bg-red-50/30 border border-red-100/50 rounded-lg text-[11px] space-y-3 text-left">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      <div>
                        <span className="text-slate-450 font-bold text-[9px] uppercase tracking-wider block">Location Found</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">{selectedNcr.locationFound || "IN-COMING"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold text-[9px] uppercase tracking-wider block">Problem Type</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">{selectedNcr.problemType || "QUALITY"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold text-[9px] uppercase tracking-wider block">Docs to Revise</span>
                        <strong className="text-slate-800 font-bold block mt-0.5 truncate" title={selectedNcr.docsToRevise}>{selectedNcr.docsToRevise || "-"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-455 font-bold text-[9px] uppercase tracking-wider block">Found By</span>
                        <strong className="text-slate-800 font-bold block mt-0.5 truncate" title={selectedNcr.foundBy}>{selectedNcr.foundBy || "QC INSPECTOR"}</strong>
                      </div>
                    </div>

                    <div className="border-t border-red-100/60 pt-2.5">
                      <span className="text-slate-455 font-bold text-[9px] uppercase tracking-wider block">Deskripsi Cacat / NG</span>
                      <p className="text-slate-800 font-bold bg-white p-2 rounded border border-slate-100 leading-normal mt-1 text-[11px]">{selectedNcr.defectType || selectedNcr.defectType}</p>
                    </div>
                  </div>

                  {/* Excel-style Read-only Keputusan Disposisi Table */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden text-center text-[9px] font-bold bg-white shadow-sm">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-extrabold text-[10px]">
                          <th colSpan={5} className="py-1.5 text-center uppercase tracking-wider">
                            KEPUTUSAN DISPOSISI
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                          <td className="border-r border-slate-300 py-1 w-[22%]">RETURN TO VENDOR</td>
                          <td className="border-r border-slate-300 py-1 w-[22%]">REWORK</td>
                          <td className="border-r border-slate-300 py-1 w-[22%]">SCRAP</td>
                          <td className="border-r border-slate-300 py-1 w-[17%] bg-slate-100/30 text-center font-bold">YES</td>
                          <td className="py-1 w-[17%] bg-slate-100/30 text-center font-bold">NO</td>
                        </tr>
                        <tr className="border-b border-slate-200 h-8">
                          <td className={`border-r border-slate-300 transition-colors ${
                            (Array.isArray(selectedNcr.disposition) ? selectedNcr.disposition.join(", ") : selectedNcr.disposition) === "RETURN TO VENDOR" ? "bg-blue-100 text-blue-700" : ""
                          }`}>
                            {(Array.isArray(selectedNcr.disposition) ? selectedNcr.disposition.join(", ") : selectedNcr.disposition) === "RETURN TO VENDOR" ? "✓" : ""}
                          </td>
                          <td className={`border-r border-slate-300 transition-colors ${
                            (Array.isArray(selectedNcr.disposition) ? selectedNcr.disposition.join(", ") : selectedNcr.disposition) === "REWORK" ? "bg-blue-100 text-blue-700" : ""
                          }`}>
                            {(Array.isArray(selectedNcr.disposition) ? selectedNcr.disposition.join(", ") : selectedNcr.disposition) === "REWORK" ? "✓" : ""}
                          </td>
                          <td className={`border-r border-slate-300 transition-colors ${
                            (Array.isArray(selectedNcr.disposition) ? selectedNcr.disposition.join(", ") : selectedNcr.disposition) === "SCRAP" ? "bg-blue-100 text-blue-700" : ""
                          }`}>
                            {(Array.isArray(selectedNcr.disposition) ? selectedNcr.disposition.join(", ") : selectedNcr.disposition) === "SCRAP" ? "✓" : ""}
                          </td>
                          <td 
                            rowSpan={2}
                            className={`border-r border-slate-300 transition-colors ${
                              selectedNcr.customerApproval === "YES" ? "bg-emerald-100 text-emerald-800" : ""
                            }`}
                          >
                            {selectedNcr.customerApproval === "YES" ? "✓" : ""}
                          </td>
                          <td 
                            rowSpan={2}
                            className={`transition-colors ${
                              selectedNcr.customerApproval === "NO" ? "bg-red-100 text-red-800" : ""
                            }`}
                          >
                            {selectedNcr.customerApproval === "NO" ? "✓" : ""}
                          </td>
                        </tr>
                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                          <td className="border-r border-slate-300 py-1">ACCEPT AS IS</td>
                          <td className="border-r border-slate-300 py-1">REPAIR</td>
                          <td className="border-r border-slate-300 py-1">REGRADE</td>
                        </tr>
                        <tr className="h-8">
                          <td className={`border-r border-slate-300 transition-colors ${
                            (Array.isArray(selectedNcr.disposition) ? selectedNcr.disposition.join(", ") : selectedNcr.disposition) === "ACCEPT AS IS" ? "bg-blue-100 text-blue-700" : ""
                          }`}>
                            {(Array.isArray(selectedNcr.disposition) ? selectedNcr.disposition.join(", ") : selectedNcr.disposition) === "ACCEPT AS IS" ? "✓" : ""}
                          </td>
                          <td className={`border-r border-slate-300 transition-colors ${
                            (Array.isArray(selectedNcr.disposition) ? selectedNcr.disposition.join(", ") : selectedNcr.disposition) === "REPAIR" ? "bg-blue-100 text-blue-700" : ""
                          }`}>
                            {(Array.isArray(selectedNcr.disposition) ? selectedNcr.disposition.join(", ") : selectedNcr.disposition) === "REPAIR" ? "✓" : ""}
                          </td>
                          <td className={`border-r border-slate-300 transition-colors ${
                            (Array.isArray(selectedNcr.disposition) ? selectedNcr.disposition.join(", ") : selectedNcr.disposition) === "REGRADE" ? "bg-blue-100 text-blue-700" : ""
                          }`}>
                            {(Array.isArray(selectedNcr.disposition) ? selectedNcr.disposition.join(", ") : selectedNcr.disposition) === "REGRADE" ? "✓" : ""}
                          </td>
                        </tr>
                      </tbody>
                    </table>
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
