"use client";

import React, { useState } from "react";
import {
  FileText,
  Mail,
  Printer,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building,
  ArrowRight,
  TrendingUp,
  FileCheck2
} from "lucide-react";

interface IMemoViewProps {
  confirmationLetters: any[];
  setConfirmationLetters: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function IMemoView({
  confirmationLetters,
  setConfirmationLetters
}: IMemoViewProps) {
  const [selectedClId, setSelectedClId] = useState<string>(
    confirmationLetters.length > 0 ? confirmationLetters[0].id : ""
  );
  const [activeSubTab, setActiveSubTab] = useState<"internal" | "vendor" | "reminder">("internal");
  const [copied, setCopied] = useState(false);

  const selectedCl = confirmationLetters.find(cl => cl.id === selectedClId) || confirmationLetters[0];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReminder = (id: string) => {
    setConfirmationLetters(prev =>
      prev.map(cl => {
        if (cl.id === id) {
          alert(`Sukses: Email Reminder untuk ${cl.clNumber} berhasil dikirim ulang ke vendor!`);
          return { ...cl, reminderSentCount: (cl.reminderSentCount || 0) + 1 };
        }
        return cl;
      })
    );
  };

  // Helper values
  const getSupplierCode = (name: string) => {
    if (name.includes("JAYADI")) return "SUP001";
    if (name.includes("IKAN BAKAR")) return "SUP002";
    return "SUP003";
  };

  const formattedMemoNumInternal = selectedCl
    ? `MEMO-MTM/AOP/${selectedCl.clNumber.replace(/[^0-9]/g, "") || "20260601"}`
    : "MEMO-MTM/AOP/20260601";

  const formattedMemoNumVendor = selectedCl
    ? `MEMO-MTM/VND/${selectedCl.clNumber.replace(/[^0-9]/g, "") || "20260601"}`
    : "MEMO-MTM/VND/20260601";

  // Reminder Email Template text
  const emailTemplateText = selectedCl
    ? `Kepada Yth. Pimpinan Keuangan / Sales Manager ${selectedCl.supplierName},

Melalui surat ini kami mengingatkan kembali terkait penalti penyesuaian kualitas barang (QPR) dengan nomor Confirmation Letter ${selectedCl.clNumber} yang telah dikirimkan pada tanggal ${selectedCl.dateSent}.

Jumlah klaim denda akhir yang disepakati adalah sebesar ${selectedCl.amount}. Harap melakukan konfirmasi persetujuan dalam portal QPR Anda.

Batas waktu: 5 Hari Kerja. Jika dalam waktu 5 hari kerja sejak surat ini dikirimkan tidak ada konfirmasi lebih lanjut, kami mengasumsikan pihak vendor telah menyetujui rincian denda ini sepenuhnya dan akan mengeksekusi deduction pada tagihan berjalan.

Hormat Kami,
PT Menara Terus Makmur (Finance & Accounting Div)`
    : "";

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white border border-indigo-900 rounded-xl shadow-md gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/10 text-white rounded-lg">
              <Mail size={18} />
            </span>
            <h3 className="text-base font-black uppercase tracking-wider">Modul i-Memo &amp; Reminder</h3>
          </div>
          <p className="text-xs text-indigo-200 mt-1 font-semibold">
            Kelola Memorandum Internal (AOP), Surat Klaim Vendor, dan pengiriman notifikasi pengingat pembayaran denda kualitas.
          </p>
        </div>
      </div>

      {confirmationLetters.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-bold italic">
          Belum ada Confirmation Letter yang dibuat. Silakan terbitkan Confirmation Letter terlebih dahulu di tab "Buat Confirmation Letter".
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar selector */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Pilih Confirmation Letter
              </label>
              <div className="space-y-2">
                {confirmationLetters.map(cl => (
                  <button
                    key={cl.id}
                    onClick={() => {
                      setSelectedClId(cl.id);
                    }}
                    className={`w-full p-3 rounded-lg text-left text-xs border transition-all flex flex-col gap-1.5 cursor-pointer ${
                      selectedClId === cl.id
                        ? "bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-sm"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[10.5px]">
                        {cl.clNumber}
                      </span>
                      <span
                        className={`text-[8.5px] px-2 py-0.5 rounded-full font-bold ${
                          cl.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {cl.status === "APPROVED" ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9.5px] text-slate-500 font-semibold">
                      <Building size={10} />
                      <span className="truncate">{cl.supplierName}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-400">
                      <span>Tanggal: {cl.dateSent}</span>
                      <span className="font-bold text-red-650">{cl.amount}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick summary of reminders */}
            <div className="bg-white border border-slate-250 rounded-xl p-4 shadow-sm space-y-3 text-slate-800">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">
                Status Pengingat
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">Terkirim:</span>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {selectedCl?.reminderSentCount || 0} Kali
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-150 pt-2">
                <span className="text-xs text-slate-500 font-bold">Batas Waktu:</span>
                <span className="text-xs font-bold text-red-650">5 Hari Kerja</span>
              </div>
              <button
                onClick={() => handleSendReminder(selectedCl.id)}
                className="w-full mt-1 py-2 bg-blue-600 hover:bg-blue-750 active:scale-95 text-white font-bold text-[10px] rounded-lg tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Send size={11} />
                KIRIM REMINDER ULANG
              </button>
            </div>
          </div>

          {/* Editor & Templates Preview */}
          <div className="lg:col-span-3 space-y-4">
            {/* View Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveSubTab("internal")}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeSubTab === "internal"
                    ? "bg-white text-blue-750 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText size={13} />
                INTERNAL MEMO (AOP)
              </button>
              <button
                onClick={() => setActiveSubTab("vendor")}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeSubTab === "vendor"
                    ? "bg-white text-blue-750 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileCheck2 size={13} />
                SURAT KLAIM VENDOR
              </button>
              <button
                onClick={() => setActiveSubTab("reminder")}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeSubTab === "reminder"
                    ? "bg-white text-blue-750 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Mail size={13} />
                EMAIL REMINDER TEMPLATE
              </button>
            </div>

            {/* Template Sheet Content Container */}
            <div className="bg-white border border-slate-250 rounded-xl shadow-sm overflow-hidden flex flex-col">
              {/* Toolbar */}
              <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center print:hidden">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Preview Template Sheet
                </span>
                <div className="flex gap-2">
                  {activeSubTab === "reminder" ? (
                    <button
                      onClick={() => handleCopyText(emailTemplateText)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                      {copied ? "Tersalin!" : "Salin Teks"}
                    </button>
                  ) : (
                    <button
                      onClick={handlePrint}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Printer size={12} />
                      Cetak PDF / Print
                    </button>
                  )}
                </div>
              </div>

              {/* SHEET SIMULATOR */}
              <div className="p-6 md:p-10 bg-slate-100 flex justify-center items-center min-h-[600px] overflow-x-auto">
                {activeSubTab === "internal" && (
                  /* Internal Memo Preview */
                  <div
                    id="internal-memo-sheet"
                    className="bg-white shadow-md border border-slate-300 w-full max-w-2xl text-slate-900 p-10 text-left relative"
                    style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", minHeight: "800px" }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-6">
                      <div>
                        <span className="font-black text-base text-slate-800 tracking-wider">PT MENARA TERUS MAKMUR</span>
                        <span className="block text-[8px] font-bold text-slate-500 italic uppercase">A Member of ASTRA Otoparts Group</span>
                      </div>
                      <div className="text-right text-[7px] text-slate-400 font-semibold leading-normal">
                        <div>Jababeka Industrial Estate Block H-1 No. 12</div>
                        <div>Cikarang, Bekasi, Jawa Barat - Indonesia</div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-center my-6">
                      <h1 className="text-base font-black uppercase tracking-widest border-b border-black pb-1.5 inline-block">
                        INTERNAL MEMORANDUM
                      </h1>
                      <div className="text-slate-500 text-[10px] font-bold mt-2 font-mono text-center">
                        NO: {formattedMemoNumInternal}
                      </div>
                    </div>

                    {/* Memo Grid Metadata Header */}
                    <div className="border border-black p-4 mb-6 space-y-2 bg-slate-50 font-sans text-[10.5px] leading-relaxed">
                      <div className="grid grid-cols-6 gap-1">
                        <span className="font-extrabold text-slate-500 col-span-1">KEPADA</span>
                        <span className="font-black text-slate-900 col-span-5">: Finance &amp; Accounting Div. AOP (Astra Otoparts Group)</span>
                        
                        <span className="font-extrabold text-slate-500 col-span-1">DARI</span>
                        <span className="font-black text-slate-900 col-span-5">: Finance &amp; Accounting Department PT MTM</span>
                        
                        <span className="font-extrabold text-slate-500 col-span-1">TANGGAL</span>
                        <span className="font-medium text-slate-700 col-span-5">: Cikarang, {selectedCl.dateSent}</span>
                        
                        <span className="font-extrabold text-slate-500 col-span-1">HAL</span>
                        <span className="font-black text-red-650 col-span-5">: Pengajuan Accrual Klaim Denda Kualitas QPR - {selectedCl.supplierName}</span>
                      </div>
                    </div>

                    {/* Body Text */}
                    <div className="space-y-4 text-[10.5px] leading-relaxed mb-6 font-medium text-slate-700 text-justify">
                      <p>Dengan hormat,</p>
                      <p>
                        Bersama memo ini kami informasikan pengajuan rencana pemotongan tagihan (Deduction Note) atas klaim penalti denda finansial kualitas QPR terhadap supplier <strong>{selectedCl.supplierName}</strong> periode berjalan.
                      </p>
                      <p>
                        Detail surat konfirmasi denda finansial kualitas (Confirmation Letter) yang dikirimkan ke vendor adalah sebagai berikut:
                      </p>
                    </div>

                    {/* Details Table */}
                    <div className="mb-6">
                      <table className="w-full text-[10.5px] text-left border-collapse border border-black font-semibold text-slate-800">
                        <thead>
                          <tr className="bg-slate-100 border-b border-black text-[9.5px] text-slate-700">
                            <th className="border border-black px-4 py-2">Parameter Dokumen</th>
                            <th className="border border-black px-4 py-2">Rincian / Nilai Klaim</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black px-4 py-2 bg-slate-50/50">Nama Vendor / Supplier</td>
                            <td className="border border-black px-4 py-2 text-slate-900">{selectedCl.supplierName}</td>
                          </tr>
                          <tr>
                            <td className="border border-black px-4 py-2 bg-slate-50/50">No. Confirmation Letter</td>
                            <td className="border border-black px-4 py-2 font-mono text-indigo-700">{selectedCl.clNumber}</td>
                          </tr>
                          <tr>
                            <td className="border border-black px-4 py-2 bg-slate-50/50">Nilai Denda Keuangan</td>
                            <td className="border border-black px-4 py-2 text-red-650 font-black text-sm">{selectedCl.amount}</td>
                          </tr>
                          <tr>
                            <td className="border border-black px-4 py-2 bg-slate-50/50">Status Otorisasi Vendor</td>
                            <td className="border border-black px-4 py-2">
                              {selectedCl.status === "APPROVED" ? (
                                <span className="text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9.5px]">
                                  Sudah di-Approval Vendor
                                </span>
                              ) : (
                                <span className="text-amber-700 font-extrabold bg-amber-50 border border-amber-250 px-2.5 py-0.5 rounded-full text-[9.5px]">
                                  Belum di-Approval Vendor (Pending)
                                </span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Conclusion text */}
                    <div className="space-y-4 text-[10.5px] leading-relaxed mb-10 font-medium text-slate-700 text-justify">
                      <p>
                        Rincian data penalti di atas telah diverifikasi dan disetujui oleh internal Quality Assurance Dept Head dan Plant Head MTM. Kami mengajukan pencadangan piutang penalti keuangan ini di pembukuan Astra Otoparts Finance Group agar diproses pada siklus pembayaran vendor bulan berikutnya.
                      </p>
                      <p>Demikian memorandum internal ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
                    </div>

                    {/* Signature blocks */}
                    <div className="grid grid-cols-2 gap-12 text-[10.5px] leading-relaxed font-bold mt-12 border-t border-slate-100 pt-6">
                      <div className="flex flex-col min-h-[100px] justify-between">
                        <div>
                          <span>Dibuat Oleh,</span>
                          <span className="block text-slate-500 text-[9.5px] mt-0.5">Finance Department MTM</span>
                        </div>
                        <div>
                          <div className="border-b border-black w-40 h-8 flex items-end">
                            <span className="font-serif italic text-blue-700 text-xs block ml-1 select-none">Heri S.</span>
                          </div>
                          <span className="block text-slate-800 mt-1">Heri Susanto</span>
                          <span className="block text-slate-400 text-[9px] font-medium">Accounting &amp; Finance Staff</span>
                        </div>
                      </div>

                      <div className="flex flex-col min-h-[100px] justify-between">
                        <div>
                          <span>Disetujui Oleh,</span>
                          <span className="block text-slate-500 text-[9.5px] mt-0.5">Accounting &amp; Finance Head MTM</span>
                        </div>
                        <div>
                          <div className="border-b border-black w-40 h-8 flex items-end">
                            <span className="font-serif italic text-blue-700 text-xs block ml-1 select-none">Anindita I.</span>
                          </div>
                          <span className="block text-slate-800 mt-1">Anindita Irmaningtyas</span>
                          <span className="block text-slate-400 text-[9px] font-medium">Dep. Head Accounting &amp; Finance</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSubTab === "vendor" && (
                  /* Vendor Memo Preview */
                  <div
                    id="vendor-memo-sheet"
                    className="bg-white shadow-md border border-slate-300 w-full max-w-2xl text-slate-900 p-10 text-left relative"
                    style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", minHeight: "800px" }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-6">
                      <div>
                        <span className="font-black text-base text-slate-800 tracking-wider">PT MENARA TERUS MAKMUR</span>
                        <span className="block text-[8px] font-bold text-slate-500 italic uppercase">A Member of ASTRA Otoparts Group</span>
                      </div>
                      <div className="text-right text-[7px] text-slate-400 font-semibold leading-normal">
                        <div>Jababeka Industrial Estate Block H-1 No. 12</div>
                        <div>Cikarang, Bekasi, Jawa Barat - Indonesia</div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-center my-6">
                      <h1 className="text-base font-black uppercase tracking-widest border-b border-black pb-1.5 inline-block">
                        MEMORANDUM KLAIM DENDA VENDOR
                      </h1>
                      <div className="text-slate-500 text-[10px] font-bold mt-2 font-mono text-center">
                        NO: {formattedMemoNumVendor}
                      </div>
                    </div>

                    {/* Meta Header */}
                    <div className="border border-black p-4 mb-6 space-y-2 bg-slate-50 font-sans text-[10.5px] leading-relaxed">
                      <div className="grid grid-cols-6 gap-1">
                        <span className="font-extrabold text-slate-500 col-span-1">KEPADA</span>
                        <span className="font-black text-slate-900 col-span-5">: Management / Finance Director - {selectedCl.supplierName}</span>
                        
                        <span className="font-extrabold text-slate-500 col-span-1">DARI</span>
                        <span className="font-black text-slate-900 col-span-5">: Finance &amp; QA Department PT MTM</span>
                        
                        <span className="font-extrabold text-slate-500 col-span-1">TANGGAL</span>
                        <span className="font-medium text-slate-700 col-span-5">: Cikarang, {selectedCl.dateSent}</span>
                        
                        <span className="font-extrabold text-slate-500 col-span-1">HAL</span>
                        <span className="font-black text-red-650 col-span-5">: Surat Pemberitahuan Potongan Klaim Finansial QPR</span>
                      </div>
                    </div>

                    {/* Body Text */}
                    <div className="space-y-4 text-[10.5px] leading-relaxed mb-6 font-medium text-slate-700 text-justify">
                      <p>Dengan hormat,</p>
                      <p>
                        Sehubungan dengan diterbitkannya Quality Problem Report (QPR) dan <strong>Confirmation Letter (CL)</strong> nomor <strong>{selectedCl.clNumber}</strong>, kami informasikan rincian pembebanan biaya denda kualitas (penalti) atas defect supply material pada periode berjalan.
                      </p>
                      <p>
                        Berdasarkan kesepakatan rasio kelonggaran (allowance limit), berikut adalah ringkasan potongan finansial yang akan ditagihkan pada invoice pembayaran:
                      </p>
                    </div>

                    {/* Details Table */}
                    <div className="mb-6">
                      <table className="w-full text-[10.5px] text-left border-collapse border border-black font-semibold text-slate-800">
                        <thead>
                          <tr className="bg-slate-100 border-b border-black text-[9.5px] text-slate-700">
                            <th className="border border-black px-4 py-2">Parameter Penilaian</th>
                            <th className="border border-black px-4 py-2">Detail Data Penalti</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black px-4 py-2 bg-slate-50/50">Kode &amp; Nama Vendor</td>
                            <td className="border border-black px-4 py-2 text-slate-900">{getSupplierCode(selectedCl.supplierName)} - {selectedCl.supplierName}</td>
                          </tr>
                          <tr>
                            <td className="border border-black px-4 py-2 bg-slate-50/50">Referensi QPR / Periode</td>
                            <td className="border border-black px-4 py-2 font-mono text-slate-700">{selectedCl.qprNumber} / {selectedCl.period || "Mei 2026"}</td>
                          </tr>
                          <tr>
                            <td className="border border-black px-4 py-2 bg-slate-50/50">Batas Toleransi (Allowance)</td>
                            <td className="border border-black px-4 py-2">{selectedCl.allowanceRatio || "0.5%"}</td>
                          </tr>
                          <tr>
                            <td className="border border-black px-4 py-2 bg-slate-50/50">Jumlah Denda Potongan</td>
                            <td className="border border-black px-4 py-2 text-red-650 font-black text-sm">{selectedCl.amount}</td>
                          </tr>
                          <tr>
                            <td className="border border-black px-4 py-2 bg-slate-50/50">Status Pengiriman</td>
                            <td className="border border-black px-4 py-2 text-green-700 font-bold">TERKIRIM (E-MAIL PORTAL)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Conclusion text */}
                    <div className="space-y-4 text-[10.5px] leading-relaxed mb-10 font-medium text-slate-700 text-justify">
                      <p>
                        Harap segera menindaklanjuti dengan melakukan penandatanganan digital pada lembar Confirmation Letter melalui Portal QPR MTM. Sesuai kesepakatan kerja sama, apabila dalam waktu <strong>5 (lima) Hari Kerja</strong> sejak surat ini terkirim tidak ada sanggahan tertulis, maka kami menganggap pihak vendor telah menyetujui pembebanan biaya klaim kualitas ini sepenuhnya.
                      </p>
                      <p>Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
                    </div>

                    {/* Signature blocks */}
                    <div className="grid grid-cols-2 gap-12 text-[10.5px] leading-relaxed font-bold mt-12 border-t border-slate-100 pt-6">
                      <div className="flex flex-col min-h-[100px] justify-between">
                        <div>
                          <span>Dikirim Oleh,</span>
                          <span className="block text-slate-500 text-[9.5px] mt-0.5">Finance Department MTM</span>
                        </div>
                        <div>
                          <div className="border-b border-black w-40 h-8 flex items-end">
                            <span className="font-serif italic text-blue-700 text-xs block ml-1 select-none">Heri S.</span>
                          </div>
                          <span className="block text-slate-800 mt-1">Heri Susanto</span>
                          <span className="block text-slate-400 text-[9px] font-medium">Accounting &amp; Finance Staff</span>
                        </div>
                      </div>

                      <div className="flex flex-col min-h-[100px] justify-between">
                        <div>
                          <span>Mengetahui,</span>
                          <span className="block text-slate-500 text-[9.5px] mt-0.5">Quality Assurance Head MTM</span>
                        </div>
                        <div>
                          <div className="border-b border-black w-40 h-8 flex items-end">
                            <span className="font-serif italic text-blue-700 text-xs block ml-1 select-none">Supriyadi</span>
                          </div>
                          <span className="block text-slate-800 mt-1">Supriyadi M.</span>
                          <span className="block text-slate-400 text-[9px] font-medium">Dep. Head Quality Assurance</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSubTab === "reminder" && (
                  /* Reminder Email View */
                  <div className="bg-white rounded-xl shadow-md border border-slate-200 w-full max-w-xl p-6 text-left space-y-4">
                    <div className="bg-slate-850 text-white p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="text-blue-400" size={18} />
                        <span className="text-xs font-black uppercase tracking-wider">E-mail Reminder Simulator</span>
                      </div>
                      <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded">AUTO-GENERATED</span>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-[10.5px] space-y-1 font-semibold text-slate-600">
                      <div><span className="text-slate-400">Kepada:</span> management@{selectedCl.supplierName.toLowerCase().replace("pt ", "").replace(/ /g, "")}.co.id</div>
                      <div><span className="text-slate-400">Subject:</span> [URGENT REMINDER] Lembar Persetujuan Confirmation Letter Kualitas {selectedCl.clNumber}</div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-250 rounded-lg text-slate-700 text-[11px] leading-relaxed font-mono whitespace-pre-wrap">
                      {emailTemplateText}
                    </div>

                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 flex items-start gap-2">
                      <AlertCircle size={14} className="shrink-0 text-blue-600 mt-0.5" />
                      <p className="text-[10px] leading-normal font-semibold">
                        Email ini dikirimkan otomatis oleh sistem jika dalam 2x24 jam vendor belum menandatangani Confirmation Letter yang diajukan.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendReminder(selectedCl.id)}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send size={12} />
                        Kirim Ulang Email Pengingat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
