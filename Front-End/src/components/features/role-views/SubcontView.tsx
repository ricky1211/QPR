"use client";

import React, { useState } from "react";
import { User, CheckCircle2, Upload, FileText, X, AlertTriangle } from "lucide-react";

export default function SubcontView() {
  const [activeTab, setActiveTab] = useState<"pica" | "settlement">("pica");
  
  // Simulated active NCR / QPR for vendor
  const [activeClaim, setActiveClaim] = useState({
    id: 30,
    qprNumber: "QPR/2026/05/JAYADI",
    ncrNumber: "NCR/2026/05/008",
    supplierName: "PT JAYADI",
    period: "Mei 2026",
    partName: "Motherboard X1",
    qtyNG: 15,
    amount: "Rp 12.500.000",
    status: "WAITING_VENDOR"
  });

  // PICA Form State
  const [rootCause, setRootCause] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");
  const [picaFile, setPicaFile] = useState<any>(null);
  const [picaSubmitted, setPicaSubmitted] = useState(false);
  const [picaVerified, setPicaVerified] = useState(false);

  // Settlement Form State
  const [settlementMode, setSettlementMode] = useState("deduction"); // 'deduction' or 'cash'
  const [proofFile, setProofFile] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settled, setSettled] = useState(false);

  const handlePicaFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setPicaFile({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB"
      });
    }
  };

  const handleProofFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB"
      });
    }
  };

  const handleSubmitPica = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootCause || !correctiveAction || !preventiveAction || !picaFile) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setPicaSubmitted(true);
      alert("Laporan Tindakan PICA berhasil dikirim! Menunggu Verifikasi QA Team.");
      // Auto-simulate QA validation for interactive feel after 2 seconds
      setTimeout(() => {
        setPicaVerified(true);
        alert("[SIMULASI QA] Laporan PICA Anda telah diverifikasi & disetujui oleh QA Team PT MTM! Akses penyelesaian denda (Fase 4) kini terbuka.");
        setActiveTab("settlement");
      }, 2000);
    }, 1200);
  };

  const handleSubmitSettlement = (e: React.FormEvent) => {
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
      
      {/* Subcont / Vendor Portal Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">External Vendor Portal</span>
          <h2 className="text-lg font-black text-slate-800 mt-0.5">Portal Subkontraktor: {activeClaim ? activeClaim.supplierName : "PT JAYADI"}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan portal ini untuk merespons NCR & QPR, mengunggah analisis perbaikan (PICA), serta mengonfirmasi penyelesaian keuangan.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-lg border max-w-xl mx-auto">
        <button
          onClick={() => setActiveTab("pica")}
          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "pica"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          Fase 3: Tindakan PICA
        </button>
        <button
          onClick={() => {
            if (!picaVerified && activeClaim) {
              alert("Anda harus mengunggah PICA dan diverifikasi oleh QA Team terlebih dahulu sebelum masuk ke Fase 4!");
              return;
            }
            setActiveTab("settlement");
          }}
          disabled={!picaVerified && !!activeClaim}
          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === "settlement"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          Fase 4: Penyelesaian Finansial
        </button>
      </div>

      <div className="max-w-xl mx-auto">
        {/* TABS 1: PICA */}
        {activeTab === "pica" && (
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden text-left">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tindakan Korektif & Preventif (PICA)</span>
              <h4 className="text-sm font-bold text-slate-800 mt-1">NCR Terkait: {activeClaim ? activeClaim.ncrNumber : "—"}</h4>
            </div>

            {picaVerified ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 size={40} className="text-green-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">PICA Telah Disetujui & Dikunci!</h4>
                <p className="text-xs text-slate-500">
                  Laporan PICA telah diverifikasi oleh tim QA. Silakan lanjutkan ke menu **Fase 4: Penyelesaian Finansial** untuk menyelesaikan klaim.
                </p>
                <button
                  onClick={() => setActiveTab("settlement")}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-md shadow hover:bg-blue-700 cursor-pointer"
                >
                  Buka Penyelesaian Finansial
                </button>
              </div>
            ) : picaSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Menunggu Verifikasi QA...</h4>
                <p className="text-xs text-slate-500">
                  PICA berhasil diunggah. Tim QA sedang melakukan evaluasi efektivitas tindakan perbaikan Anda di lapangan.
                </p>
              </div>
            ) : activeClaim ? (
              <form onSubmit={handleSubmitPica} className="p-6 space-y-4">
                <div className="p-3.5 bg-yellow-50 text-yellow-800 rounded-lg text-xs font-semibold border border-yellow-250 flex items-start gap-2">
                  <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                  <span>Sistem mendeteksi adanya klaim kualitas. Anda diwajibkan mengisi PICA sebelum dapat mengakses tagihan berjalan.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">1. Root Cause Analysis (Akar Masalah)</label>
                  <textarea
                    required
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="Jelaskan detail mengapa cacat produk ini bisa terjadi di line produksi Anda..."
                    rows={3}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">2. Corrective Action (Tindakan Perbaikan)</label>
                  <textarea
                    required
                    value={correctiveAction}
                    onChange={(e) => setCorrectiveAction(e.target.value)}
                    placeholder="Tulis tindakan perbaikan jangka pendek yang sudah dilakukan..."
                    rows={3}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">3. Preventive Action (Tindakan Pencegahan)</label>
                  <textarea
                    required
                    value={preventiveAction}
                    onChange={(e) => setPreventiveAction(e.target.value)}
                    placeholder="Jelaskan tindakan pencegahan jangka panjang agar tidak terjadi lagi..."
                    rows={3}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Unggah File Laporan PICA Lengkap (PDF)</label>
                  {picaFile ? (
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-md text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={16} className="text-blue-600 shrink-0" />
                        <span className="truncate font-bold text-slate-800">{picaFile.name}</span>
                      </div>
                      <button type="button" onClick={() => setPicaFile(null)} className="text-red-500 hover:text-red-700"><X size={12} /></button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-lg p-5 bg-slate-50/30 cursor-pointer text-center text-xs text-slate-500 transition-colors">
                      <input type="file" accept="application/pdf" onChange={handlePicaFileChange} className="hidden" required />
                      <Upload size={18} className="text-slate-400 mb-1" />
                      <span className="font-bold text-blue-600">Pilih Berkas PICA</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">Mendukung file PDF resmi perusahaan Anda</span>
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!rootCause || !correctiveAction || !preventiveAction || !picaFile || isSubmitting}
                  className={`w-full py-3 rounded-md text-xs font-bold shadow-md transition-all cursor-pointer ${
                    !rootCause || !correctiveAction || !preventiveAction || !picaFile || isSubmitting
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10"
                  }`}
                >
                  {isSubmitting ? "Mengirim PICA..." : "Kirim Laporan PICA ke QA"}
                </button>
              </form>
            ) : (
              <div className="p-12 text-center text-slate-400 italic text-xs bg-white border border-slate-100 rounded-xl">
                Tidak ada laporan PICA masuk yang perlu diproses.
              </div>
            )}
          </div>
        )}

        {/* TABS 2: SETTLEMENT */}
        {activeTab === "settlement" && (
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden text-left">
            {settled ? (
              <div className="p-8 bg-white text-center space-y-3">
                <CheckCircle2 size={40} className="text-green-500 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-slate-900">Tagihan Berhasil Diselesaikan!</h4>
                <p className="text-xs text-slate-500">
                  Bukti penyelesaian denda telah diunggah dan status QPR berhasil dirampungkan ke status <strong>CLOSED PAID</strong>. Kasus dinyatakan ditutup.
                </p>
              </div>
            ) : activeClaim ? (
              <div>
                <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tagihan Masuk Vendor</span>
                  <h4 className="text-sm font-bold text-slate-800 mt-1">{activeClaim.qprNumber}</h4>
                </div>

                <form onSubmit={handleSubmitSettlement} className="p-6 space-y-5">
                  <div className="p-4 bg-red-50/50 border border-red-100/50 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-500">Tagihan Periode {activeClaim.period}</span>
                      <span className="block font-bold text-slate-950 mt-0.5">Denda Akumulasi NG</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block font-semibold text-[9px] uppercase tracking-wider">Total Pembayaran</span>
                      <strong className="text-red-650 font-black text-sm" style={{ color: "#dc2626" }}>{activeClaim.amount}</strong>
                    </div>
                  </div>

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
                        <button type="button" onClick={() => setProofFile(null)} className="text-red-500 hover:text-red-700"><X size={12} /></button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-lg p-6 bg-slate-50/30 cursor-pointer text-center text-xs text-slate-500 transition-colors">
                        <input type="file" accept="application/pdf,image/*" onChange={handleProofFileChange} className="hidden" required />
                        <Upload size={20} className="text-slate-400 mb-2" />
                        <span className="font-bold text-blue-600">Pilih File Bukti</span>
                        <span className="text-[10px] text-slate-400 mt-1">Mendukung PDF atau File Gambar</span>
                      </label>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!proofFile || isSubmitting}
                      className={`w-full py-3 rounded-md text-xs font-bold shadow-md transition-all cursor-pointer ${
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
        )}
      </div>

    </div>
  );
}
