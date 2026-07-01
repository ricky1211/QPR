"use client";

import React, { useState } from "react";
import { Shield, FileCheck, CheckCircle2, X } from "lucide-react";

export default function SectionHeadView({ pendingNcrs, handleApproveNcrAction, role = "Section Head" }) {
  const sectionHeadNcrs = pendingNcrs.filter((n) => n.requiredRole === role);
  const [selectedNcr, setSelectedNcr] = useState(null);
  const [reviewComment, setReviewComment] = useState("");

  const isStaffApproved = !selectedNcr || role !== "Foreman" || selectedNcr.requiredRole !== "Foreman";
  const isSpvApproved = !selectedNcr || ((role !== "Foreman" && role !== "Section Head") || (selectedNcr.requiredRole === "Dept Head" || selectedNcr.requiredRole === "Closed" || selectedNcr.status === "APPROVED"));
  const isMngApproved = !selectedNcr || (selectedNcr.requiredRole === "Closed" || selectedNcr.status === "APPROVED");

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
                    <p className="text-[10px] text-slate-400">Supplier: {ncr.supplierName} • Qty NG: {ncr.qty} pcs • NG Types: <span className="uppercase font-bold text-red-600">{ncr.reject}</span></p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setSelectedNcr(ncr);
                        setReviewComment("");
                      }}
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
                  <span className="text-slate-400 block font-bold">Qty NG:</span>
                  <strong className="text-slate-800 font-extrabold">{selectedNcr.qty} pcs</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                  <span className="text-slate-400 block font-bold">NG Types:</span>
                  <strong className="text-red-600 font-extrabold uppercase">{selectedNcr.reject}</strong>
                </div>
              </div>

              <div className="p-3 bg-red-50/30 border border-red-100/50 rounded-md space-y-2.5 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Location Found:</span>
                  <span className="text-slate-800 font-bold">{selectedNcr.locationFound || "IN-COMING"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Problem Type:</span>
                  <span className="text-slate-800 font-bold">{selectedNcr.problemType || "QUALITY"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Found By:</span>
                  <span className="text-slate-800 font-bold">{selectedNcr.foundBy || "QC INSPECTOR"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Customer Approval?</span>
                  <span className="text-slate-800 font-bold">{selectedNcr.customerApproval || "YES"}</span>
                </div>
                {selectedNcr.docsToRevise && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Docs to Revise:</span>
                    <span className="text-slate-800 font-bold truncate max-w-[200px]" title={selectedNcr.docsToRevise}>{selectedNcr.docsToRevise}</span>
                  </div>
                )}
                <div className="border-t border-red-100/60 pt-2 flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">Deskripsi Cacat / NG:</span>
                  <p className="text-slate-800 font-bold bg-white p-2 rounded border border-slate-100/80 leading-normal">{selectedNcr.defectType}</p>
                </div>
                <div className="flex justify-between border-t border-red-100/60 pt-2">
                  <span className="text-slate-500 font-medium">Keputusan Disposisi:</span>
                  <span className="text-blue-600 font-black">{selectedNcr.disposition}</span>
                </div>
              </div>

              {/* TANDA TANGAN QUALITY DEPT (PR4-FRM-08001) */}
              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-[11px] mt-4 shadow-sm/5 text-left">
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
                      <div className="text-slate-450 italic text-[8px] py-0.5 font-medium leading-tight">
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

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button
                onClick={() => setSelectedNcr(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-bold transition-colors"
              >
                Tutup
              </button>
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

    </div>
  );
}
