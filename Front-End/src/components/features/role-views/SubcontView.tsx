"use client";

import React, { useState } from "react";
import { User, CheckCircle2, Upload, FileText, X } from "lucide-react";

export default function SubcontView() {
  const [activeClaim, setActiveClaim] = useState({
    id: 30,
    qprNumber: "QPR/2026/05/JAYADI",
    supplierName: "PT JAYADI",
    period: "Mei 2026",
    amount: "Rp 12.500.000",
    status: "WAITING_VENDOR"
  });

  const [settlementMode, setSettlementMode] = useState("deduction"); // 'deduction' or 'cash'
  const [proofFile, setProofFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settled, setSettled] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB"
      });
    }
  };

  const handleSubmitSettlement = (e) => {
    e.preventDefault();
    if (!proofFile) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSettled(true);
      setActiveClaim(null);
      alert("Bukti pembayaran / surat potong tagihan berhasil dikirim dan terverifikasi!");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      

      <div className="max-w-xl mx-auto">
        {settled ? (
          <div className="p-8 bg-white border border-slate-100 rounded-xl shadow-sm text-center space-y-3">
            <CheckCircle2 size={40} className="text-green-500 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-slate-900">Tagihan Berhasil Diselesaikan!</h4>
            <p className="text-xs text-slate-500">
              Bukti penyelesaian denda telah diunggah dan status QPR berhasil dirampungkan ke status <strong>CLOSED PAID</strong>. Terima kasih atas kerja sama Anda.
            </p>
          </div>
        ) : activeClaim ? (
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tagihan Masuk Vendor</span>
              <h4 className="text-sm font-bold text-slate-800 mt-1">{activeClaim.qprNumber}</h4>
            </div>

            <form onSubmit={handleSubmitSettlement} className="p-6 space-y-5">
              
              {/* Claim Amount block */}
              <div className="p-4 bg-red-50/50 border border-red-100/50 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">Tagihan Periode {activeClaim.period}</span>
                  <span className="block font-bold text-slate-950 mt-0.5">Denda Akumulasi NG</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-semibold text-[9px] uppercase tracking-wider">Total Pembayaran</span>
                  <strong className="text-red-600 font-black text-sm">{activeClaim.amount}</strong>
                </div>
              </div>

              {/* Settlement Mode Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Metode Penyelesaian Denda</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 border rounded-md flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    settlementMode === "deduction" ? "border-blue-500 bg-blue-50/10 font-bold" : "border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="settlementMode"
                      value="deduction"
                      checked={settlementMode === "deduction"}
                      onChange={() => setSettlementMode("deduction")}
                      className="hidden"
                    />
                    <span className="text-xs text-slate-800">Potong Tagihan</span>
                    <span className="text-[9px] text-slate-400 font-medium mt-0.5">Deduction invoice berjalan</span>
                  </label>

                  <label className={`p-3 border rounded-md flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    settlementMode === "cash" ? "border-blue-500 bg-blue-50/10 font-bold" : "border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="settlementMode"
                      value="cash"
                      checked={settlementMode === "cash"}
                      onChange={() => setSettlementMode("cash")}
                      className="hidden"
                    />
                    <span className="text-xs text-slate-800">Transfer Tunai</span>
                    <span className="text-[9px] text-slate-400 font-medium mt-0.5">Cash bank replacement</span>
                  </label>
                </div>
              </div>

              {/* File upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {settlementMode === "deduction" ? "Unggah Surat Potong Tagihan (PDF)" : "Unggah Bukti Transfer Bank (PDF/Image)"}
                </label>
                
                {proofFile ? (
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-md text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={16} className="text-blue-600 shrink-0" />
                      <span className="truncate font-bold text-slate-800">{proofFile.name}</span>
                    </div>
                    <button onClick={() => setProofFile(null)} className="text-red-500 hover:text-red-700"><X size={12} /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-lg p-6 bg-slate-50/30 cursor-pointer text-center text-xs text-slate-500 transition-colors">
                    <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="hidden" />
                    <Upload size={20} className="text-slate-400 mb-2" />
                    <span className="font-bold text-blue-600">Pilih File Bukti</span>
                    <span className="text-[10px] text-slate-400 mt-1">Mendukung PDF atau File Gambar</span>
                  </label>
                )}
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!proofFile || isSubmitting}
                  className={`w-full py-3 rounded-md text-xs font-bold shadow-md transition-all ${
                    !proofFile || isSubmitting
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10"
                  }`}
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Bukti Penyelesaian"}
                </button>
              </div>

            </form>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 italic text-xs bg-white border border-slate-100 rounded-xl">
            Tidak ada tagihan QPR masuk yang perlu diproses.
          </div>
        )}
      </div>

    </div>
  );
}
