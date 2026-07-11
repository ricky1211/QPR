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
  ArrowRight,
  FileCheck2,
  Building
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
  const [activeSubTab, setActiveSubTab] = useState<"ssc_purchasing" | "buat_ssc_payment" | "reminder">("ssc_purchasing");
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

  const getClaimText = (cl: any) => {
    const name = cl.supplierName.toUpperCase();
    if (name.includes("JAYADI")) return "CLAIM PART NG CONE RACE ALL TYPE";
    if (name.includes("IKAN BAKAR")) return "CLAIM PART NG HARDDISK 1TB";
    if (name.includes("RUICHENG")) return "CLAIM PART NG CONE RACE ALL TYPE";
    return "CLAIM PART NG";
  };

  const formatSscDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const getPaymentDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    // 10th of next-next month (e.g. if June, then August 10th)
    const payDate = new Date(date.getFullYear(), date.getMonth() + 2, 10);
    return `${payDate.getMonth() + 1}/${payDate.getDate()}/${payDate.getFullYear()}`;
  };

  const getRequestDateBoxes = (dateStr: string) => {
    if (!dateStr) return ["2", "7", "0", "8", "2", "0", "2", "5"];
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return ["2", "7", "0", "8", "2", "0", "2", "5"];
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear());
    return (d + m + y).split("");
  };

  const handleExportExcel = (type: "ssc_purchasing" | "buat_ssc_payment") => {
    try {
      import("xlsx").then((XLSX) => {
        const dataToExport = confirmationLetters.map((cl, idx) => {
          const amountStr = String(cl.amount || "");
          const amountNum = parseInt(amountStr.replace(/[^0-9]/g, "") || "0", 10);
          return {
            "Customer": "OTC08002",
            "DocumentNo": cl.clNumber.replace(/[^0-9]/g, "").slice(-11) || `180000000${53 + idx}`,
            "Text": type === "ssc_purchasing" ? getClaimText(cl) : (cl.customText !== undefined ? cl.customText : `POTONG TAGIH ${getClaimText(cl)}`),
            "Vendor": cl.supplierName,
            "Doc. Date": formatSscDate(cl.dateSent),
            "Local Crcy Amt": amountNum,
            "Potong tagih payment date": type === "ssc_purchasing" ? getPaymentDate(cl.dateSent) : (cl.paymentDate !== undefined ? cl.paymentDate : getPaymentDate(cl.dateSent))
          };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        const sheetName = type === "ssc_purchasing" ? "SSC Billing" : "SSC Billing Payment";
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 30));
        XLSX.writeFile(workbook, `${sheetName.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);
      });
    } catch (e) {
      alert("Gagal mengunduh Excel: " + e);
    }
  };

  // SSC Billing Payment editable fields
  const [payCompany, setPayCompany] = useState("PT MENARA TERUS MAKMUR");
  const [payBusinessArea, setPayBusinessArea] = useState("MT");
  const [payTitle, setPayTitle] = useState("Permohonan Pemotongan Invoice Vendor");
  const [payTo, setPayTo] = useState("SSC Invoicing & Payment");
  const [payInstruction, setPayInstruction] = useState(
    "Sehubungan dengan ditemukannya komponen NG yang bukan disebabkan oleh proses internal kami, mohon dapat dilakukan pemotongan pembayaran terhadap vendor berikut :"
  );

  // SSC email
  const sscEmail = "ssc-billing@astraoparts.co.id";
  const handleEmailSSC = () => {
    const subject = encodeURIComponent(`[SSC BILLING] ${selectedCl?.clNumber || ""} - ${selectedCl?.supplierName || ""}`);
    const body = encodeURIComponent(`Kepada Tim SSC Billing,\n\nMohon diproses SSC Billing untuk:\nNo CL: ${selectedCl?.clNumber || ""}\nVendor: ${selectedCl?.supplierName || ""}\nJumlah: ${selectedCl?.amount || ""}\n\nTerima kasih.\n\nPT Menara Terus Makmur`);
    window.open(`mailto:${sscEmail}?subject=${subject}&body=${body}`);
  };

  const handleUpdateClField = (id: string, field: string, value: any) => {
    setConfirmationLetters(prev => prev.map(cl => {
      if (cl.id === id) {
        return { ...cl, [field]: value };
      }
      return cl;
    }));
  };

  const handleAddRow = () => {
    const nextIndex = confirmationLetters.length + 1;
    const newId = `cl-custom-${Date.now()}`;
    const newCl = {
      id: newId,
      clNumber: `CL/2026/06/00${nextIndex}`,
      qprNumber: `QPR/2026/06/CUSTOM_${nextIndex}`,
      supplierName: "PT VENDOR BARU",
      dateSent: new Date().toISOString().split("T")[0],
      amount: "Rp 10.000.000",
      status: "PENDING",
      memoStatus: "DRAFT_MEMO",
      reminderSentCount: 0,
      customText: `POTONG TAGIH CLAIM PART NG ...`,
      paymentDate: "8/10/2026",
      customerCode: "OTC08002",
      documentNo: `2026060${nextIndex}`
    };
    setConfirmationLetters(prev => [...prev, newCl]);
  };

  const handleDeleteRow = (id: string) => {
    setConfirmationLetters(prev => prev.filter(cl => cl.id !== id));
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
            <h3 className="text-base font-black uppercase tracking-wider">SSC Billing &amp; Reminder</h3>
          </div>
          <p className="text-xs text-indigo-200 mt-1 font-semibold">
            Kelola SSC Billing (Purchasing &amp; Payment), dan pengiriman notifikasi pengingat pembayaran denda kualitas.
          </p>
        </div>
        {/* Direct Email SSC Button */}
        <button
          onClick={handleEmailSSC}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0"
        >
          <Send size={13} />
          Direct Email ke SSC / AOP
        </button>
      </div>

      {confirmationLetters.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-bold italic">
          Belum ada Confirmation Letter yang dibuat. Silakan terbitkan Confirmation Letter terlebih dahulu di tab "Buat Confirmation Letter".
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar selector */}
          {true && (
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
                        <div className="flex items-center gap-1 text-[11px] text-blue-950 font-black truncate max-w-[70%]">
                          <Building size={11} className="text-blue-600 shrink-0" />
                          <span className="truncate">{cl.supplierName}</span>
                        </div>
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
                      <div className="text-[10px] text-slate-500 font-mono font-bold pl-3.5">
                        {cl.clNumber}
                      </div>
                      <div className="flex justify-between items-center text-[9.5px] text-slate-400 border-t border-slate-100 pt-1.5 mt-0.5">
                        <span>Tanggal: {cl.dateSent}</span>
                        <span className="font-bold text-red-650">{cl.amount}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {activeSubTab === "buat_ssc_payment" && (
                /* Informational Sidebar for SSC Payment tab */
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5">
                    SSC Payment Status
                  </span>
                  <p className="text-xs text-slate-500 font-medium">
                    Lengkapi/edit rincian tabel pada form di kanan. Pratinjau cetak PDF dan ekspor Excel memo potong tagih otomatis terupdate langsung di bagian bawah halaman.
                  </p>
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-[10px] text-blue-800 leading-normal font-semibold">
                    Vendor aktif: <strong>{selectedCl?.supplierName}</strong>
                  </div>
                </div>
              )}

            {activeSubTab === "reminder" && (
              /* Quick summary of reminders */
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
                  <Send size={11} className="shrink-0" />
                  KIRIM REMINDER ULANG
                </button>
              </div>
            )}
            </div>
          )}

          {/* Editor & Templates Preview */}
          <div className="lg:col-span-3 space-y-4">
            {/* View Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap gap-1">
              <button
                onClick={() => setActiveSubTab("ssc_purchasing")}
                className={`flex-1 min-w-[150px] py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeSubTab === "ssc_purchasing"
                    ? "bg-white text-blue-750 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileCheck2 size={13} />
                SSC BILLING
              </button>
              <button
                onClick={() => setActiveSubTab("buat_ssc_payment")}
                className={`flex-1 min-w-[150px] py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeSubTab === "buat_ssc_payment"
                    ? "bg-white text-blue-750 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileCheck2 size={13} />
                BUAT SSC PAYMENT
              </button>
              <button
                onClick={() => setActiveSubTab("reminder")}
                className={`flex-1 min-w-[150px] py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeSubTab === "reminder"
                    ? "bg-white text-blue-750 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Mail size={13} />
                EMAIL REMINDER
              </button>
            </div>

            {/* Template Sheet Content Container */}
            <div className="bg-white border border-slate-250 rounded-xl shadow-sm overflow-hidden flex flex-col">
              {/* Toolbar */}
              <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center print:hidden">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {activeSubTab === "buat_ssc_payment" ? "Form Input Memo SSC" : "Preview Template Sheet"}
                </span>
                <div className="flex gap-2">
                  {activeSubTab === "buat_ssc_payment" ? (
                    <span className="text-[10px] text-slate-500 font-bold bg-slate-200 px-2.5 py-1 rounded">
                      Mode Edit & Preview Aktif
                    </span>
                  ) : (
                    <>
                      {activeSubTab === "ssc_purchasing" && (
                        <button
                          onClick={() => handleExportExcel(activeSubTab)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <FileText size={12} />
                          Export Excel (.xlsx)
                        </button>
                      )}
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
                    </>
                  )}
                </div>
              </div>

              {/* SHEET SIMULATOR */}
              <div className="p-6 md:p-10 bg-slate-100 flex justify-center items-center min-h-[600px] overflow-x-auto">


                {activeSubTab === "ssc_purchasing" && (
                  /* Internal Memo to SSC - Billing Purchasing Layout */
                  <div
                    id="internal-memo-sheet"
                    className="bg-white shadow-lg border border-slate-300 w-full text-slate-900 p-6 text-left relative overflow-x-auto"
                    style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif', minHeight: "500px" }}
                  >
                    {/* Sheet Header Information */}
                    <div className="mb-4 pb-3 border-b border-slate-200">
                      <h3 className="text-sm font-bold text-blue-900">REKAPITULASI KLAIM DENDA KUALITAS (QPR) - SSC BILLING</h3>
                      <p className="text-[11px] text-slate-500">Tujuan: Shared Service Center (SSC) Astra Otoparts Group • Format Penyesuaian Tagihan Purchasing (Deduction Note)</p>
                    </div>

                    {/* Table Container styled like Excel */}
                    <table className="w-full text-[11px] border-collapse border border-slate-400">
                      <thead>
                        <tr className="bg-[#f0ac0e] text-black border border-slate-400 text-center font-bold">
                          <th className="border border-slate-400 px-3 py-2 w-28">Customer</th>
                          <th className="border border-slate-400 px-3 py-2 w-32">DocumentNo</th>
                          <th className="border border-slate-400 px-3 py-2">Text</th>
                          <th className="border border-slate-400 px-3 py-2">Vendor</th>
                          <th className="border border-slate-400 px-3 py-2 w-28">Doc. Date</th>
                          <th className="border border-slate-400 px-3 py-2 w-36 text-right">Local Crcy Amt</th>
                          <th className="border border-slate-400 px-3 py-2 w-44">Potong tagih payment date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {confirmationLetters.map((cl, idx) => {
                          const amountNum = parseInt(cl.amount?.replace(/[^0-9]/g, "") || "0", 10);
                          return (
                            <tr key={cl.id} className={`hover:bg-slate-50 font-semibold border border-slate-400 text-slate-800 ${cl.id === selectedClId ? 'bg-blue-50/50 font-bold' : ''}`}>
                              <td className="border border-slate-400 px-3 py-1.5 text-center font-mono">
                                {cl.customerCode !== undefined ? cl.customerCode : "OTC08002"}
                              </td>
                              <td className="border border-slate-400 px-3 py-1.5 text-center font-mono">
                                {cl.documentNo !== undefined ? cl.documentNo : (cl.clNumber.replace(/[^0-9]/g, "").slice(-11) || `180000000${53 + idx}`)}
                              </td>
                              <td className="border border-slate-400 px-3 py-1.5 text-left font-mono text-[10px] uppercase font-bold">
                                {cl.customText !== undefined ? cl.customText : `POTONG TAGIH ${getClaimText(cl)}`}
                              </td>
                              <td className="border border-slate-400 px-3 py-1.5 text-left font-sans">
                                {cl.supplierName}
                              </td>
                              <td className="border border-slate-400 px-3 py-1.5 text-center font-mono">
                                {formatSscDate(cl.dateSent)}
                              </td>
                              <td className="border border-slate-400 px-3 py-1.5 text-right font-mono font-bold">
                                {cl.amount}
                              </td>
                              <td className="border border-slate-400 px-3 py-1.5 text-center font-mono text-emerald-700 font-bold">
                                {cl.paymentDate !== undefined ? cl.paymentDate : getPaymentDate(cl.dateSent)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div className="mt-8 text-[10px] text-slate-400 leading-normal flex justify-between">
                      <span>Dibuat oleh: Finance Department MTM</span>
                      <span>Diunduh/Dicetak pada: {new Date().toLocaleDateString('id-ID')}</span>
                    </div>

                    {/* Direct email action button inside the SSC Billing sheet view */}
                    <div className="mt-6 flex justify-end print:hidden">
                      <button
                        onClick={handleEmailSSC}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        <Mail size={12} className="stroke-[2.5]" />
                        Direct Email ke SSC / AOP
                      </button>
                    </div>
                  </div>
                )}
                {activeSubTab === "buat_ssc_payment" && (
                  /* Form Pengisian Manual + Live A4 Preview */
                  <div className="w-full space-y-6">
                    {/* Form Input Box */}
                    <div className="bg-white rounded-xl shadow-md border border-slate-200 w-full p-8 text-left space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-150 pb-4">
                        <div>
                          <h4 className="text-base font-extrabold text-slate-800">Form Pengisian Manual SSC Payment</h4>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium font-sans">Lengkapi instruksi dan data tabel untuk memo pemotongan invoice vendor</p>
                        </div>
                        <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2.5 py-1 rounded">TEMPLATED FORM</span>
                      </div>

                      {/* Auto-filled Reference Info */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Company Name</span>
                          <strong className="text-slate-700">PT MENARA TERUS MAKMUR</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Business Area</span>
                          <strong className="text-slate-700">MT</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Document Title</span>
                          <strong className="text-slate-700">Permohonan Pemotongan Invoice Vendor</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Destination (To)</span>
                          <strong className="text-slate-700 font-sans">{payTo}</strong>
                        </div>
                      </div>

                      {/* Instruction Textarea */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider">
                          Instruksi Pemotongan (Instruction)
                        </label>
                        <textarea
                          value={payInstruction}
                          onChange={e => setPayInstruction(e.target.value)}
                          className="w-full p-3 border border-slate-350 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-800 bg-white leading-relaxed font-sans"
                          rows={2}
                          placeholder="Ketik instruksi pemotongan disini..."
                        />
                      </div>

                      {/* Gold Table Rows Inputs */}
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider">
                            Rincian Baris Tabel (Table Data)
                          </label>
                          <button
                            onClick={handleAddRow}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                            Tambah Baris
                          </button>
                        </div>

                        <div className="overflow-x-auto border border-slate-250 rounded-xl bg-white p-4 shadow-inner">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="text-[10.5px] text-slate-400 font-extrabold uppercase border-b border-slate-200 tracking-wider">
                                <th className="p-2 pb-3 min-w-[110px]">Customer</th>
                                <th className="p-2 pb-3 min-w-[140px]">Document No</th>
                                <th className="p-2 pb-3 min-w-[280px]">Text / Deskripsi</th>
                                <th className="p-2 pb-3 min-w-[180px]">Vendor</th>
                                <th className="p-2 pb-3 min-w-[115px]">Doc. Date</th>
                                <th className="p-2 pb-3 min-w-[145px]">Local Crcy Amt</th>
                                <th className="p-2 pb-3 min-w-[130px]">Payment Date</th>
                                <th className="p-2 pb-3 min-w-[60px] text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {confirmationLetters.map((cl, idx) => (
                                <tr key={cl.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-2 py-3">
                                    <input
                                      type="text"
                                      value={cl.customerCode !== undefined ? cl.customerCode : "OTC08002"}
                                      onChange={e => handleUpdateClField(cl.id, "customerCode", e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                  </td>
                                  <td className="p-2 py-3">
                                    <input
                                      type="text"
                                      value={cl.documentNo !== undefined ? cl.documentNo : (cl.clNumber.replace(/[^0-9]/g, "").slice(-11) || `180000000${53 + idx}`)}
                                      onChange={e => handleUpdateClField(cl.id, "documentNo", e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                  </td>
                                  <td className="p-2 py-3">
                                    <input
                                      type="text"
                                      value={cl.customText !== undefined ? cl.customText : `POTONG TAGIH ${getClaimText(cl)}`}
                                      onChange={e => handleUpdateClField(cl.id, "customText", e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                  </td>
                                  <td className="p-2 py-3">
                                    <input
                                      type="text"
                                      value={cl.supplierName}
                                      onChange={e => handleUpdateClField(cl.id, "supplierName", e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                  </td>
                                  <td className="p-2 py-3">
                                    <input
                                      type="text"
                                      value={cl.dateSent}
                                      onChange={e => handleUpdateClField(cl.id, "dateSent", e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                  </td>
                                  <td className="p-2 py-3">
                                    <input
                                      type="text"
                                      value={cl.amount}
                                      onChange={e => handleUpdateClField(cl.id, "amount", e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-850 font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                  </td>
                                  <td className="p-2 py-3">
                                    <input
                                      type="text"
                                      value={cl.paymentDate !== undefined ? cl.paymentDate : getPaymentDate(cl.dateSent)}
                                      onChange={e => handleUpdateClField(cl.id, "paymentDate", e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                  </td>
                                  <td className="p-2 py-3 text-center">
                                    <button
                                      onClick={() => handleDeleteRow(cl.id)}
                                      title="Hapus baris ini"
                                      className="p-2 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center border border-slate-200 hover:border-red-200 bg-white shadow-sm"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* LIVE PREVIEW AREA */}
                    <div className="bg-slate-100 rounded-xl p-5 md:p-8 border border-slate-250 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3 print:hidden">
                        <div>
                          <strong className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                            Pratinjau Lembar Memo Internal SSC Payment (A4)
                          </strong>
                          <span className="text-[10px] text-slate-450 font-semibold block mt-0.5">
                            Menampilkan preview dokumen cetak untuk vendor aktif: <strong>{selectedCl?.supplierName || "—"}</strong>
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleExportExcel("buat_ssc_payment")}
                            className="px-3.5 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          >
                            <FileText size={12} />
                            Export Excel
                          </button>
                          <button
                            onClick={handlePrint}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          >
                            <Printer size={12} />
                            Cetak PDF / Print
                          </button>
                        </div>
                      </div>

                      {/* Internal Memo A4 Sheet */}
                      {selectedCl ? (
                        <div
                          id="internal-memo-sheet"
                          className="bg-white shadow-lg border border-slate-350 w-full max-w-[210mm] text-black p-10 text-left relative mx-auto"
                          style={{ fontFamily: '"Arial", sans-serif', fontSize: "11px", minHeight: "297mm", color: "#000000" }}
                        >
                          {/* Dashed Barcode Box */}
                          <div className="flex justify-end mb-6">
                            <div 
                              className="border-[1.5px] border-dashed border-black w-72 h-16 flex flex-col items-center justify-center text-[10px] font-bold text-black italic px-4 text-center"
                              style={{ fontFamily: '"Arial", sans-serif' }}
                            >
                              <div>PLEASE PUT <span className="underline font-black">FA BARCODE</span> HERE</div>
                            </div>
                          </div>

                          {/* Metadata Header Grid */}
                          <div className="space-y-3 text-[12px] font-bold mb-6" style={{ color: "#000000" }}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-1">
                                <span className="w-28 text-left">Company</span>
                                <span className="mr-2">:</span>
                                <span className="font-bold text-black text-[11px] px-1 py-0.5">
                                  PT MENARA TERUS MAKMUR
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mr-8">
                                <span className="font-bold">Business Area</span>
                                <span className="mx-2">:</span>
                                <span className="font-bold text-black text-[11px] px-2 py-0.5 text-center font-sans">
                                  MT
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <span className="w-28 text-left">Request Date</span>
                              <span className="mr-2">:</span>
                              <div className="flex items-center gap-0.5">
                                {getRequestDateBoxes(selectedCl.dateSent).map((digit, idx) => (
                                  <React.Fragment key={idx}>
                                    {idx === 2 && <span className="mx-1 font-bold text-black">/</span>}
                                    {idx === 4 && <span className="mx-1 font-bold text-black">/</span>}
                                    <span className="w-5 h-6 border border-black flex items-center justify-center font-mono font-black bg-white text-black text-[11px]">
                                      {digit}
                                    </span>
                                  </React.Fragment>
                                ))}
                                <span className="text-[10px] text-slate-500 font-normal ml-2">(dd/mm/yyyy)</span>
                              </div>
                            </div>
                          </div>

                          {/* Title */}
                          <div className="text-center my-6">
                            <h1 className="text-lg font-black uppercase tracking-wider underline decoration-1 underline-offset-4" style={{ fontFamily: '"Arial", sans-serif' }}>
                              INTERNAL MEMO - OTHERS
                            </h1>
                          </div>

                          {/* Main Content Box (thick border) */}
                          <div className="border-[3px] border-black p-4 mb-6 space-y-4">
                            {/* Title row */}
                            <div className="border-b border-black pb-2 flex items-start">
                              <span className="w-24 font-bold shrink-0">Title</span>
                              <span className="mr-3 font-bold">:</span>
                              <span className="flex-1 font-bold text-black text-[11px] px-1 py-0.5">
                                Permohonan Pemotongan Invoice Vendor
                              </span>
                            </div>
                            
                            {/* To row */}
                            <div className="border-b border-black pb-2 flex items-start">
                              <span className="w-24 font-bold shrink-0">To</span>
                              <span className="mr-3 font-bold">:</span>
                              <span className="flex-1 font-bold text-black text-[11px] px-1 py-0.5 font-sans">
                                SSC Invoicing & Payment
                              </span>
                            </div>

                            {/* Instruction row */}
                            <div className="space-y-3">
                              <div className="flex items-start">
                                <span className="w-24 font-bold shrink-0">Instruction</span>
                                <span className="mr-3 font-bold">:</span>
                                <div className="flex-1 font-medium text-justify text-[11px] leading-relaxed pl-1 font-sans">
                                  {payInstruction}
                                </div>
                              </div>

                              {/* Gold Table Embedded */}
                              <div className="pl-28 w-full overflow-x-auto my-3">
                                <table className="w-full text-[9px] border-collapse border border-black font-sans">
                                  <thead>
                                    <tr className="bg-[#e5a93b] text-black border border-black text-[8.5px] text-center font-bold">
                                      <th className="border border-black px-2 py-1">Customer</th>
                                      <th className="border border-black px-2 py-1">DocumentNo</th>
                                      <th className="border border-black px-2 py-1">Text</th>
                                      <th className="border border-black px-2 py-1">Vendor</th>
                                      <th className="border border-black px-2 py-1">Doc. Date</th>
                                      <th className="border border-black px-2 py-1 text-right">Local Crcy Amt</th>
                                      <th className="border border-black px-2 py-1">Potong tagih payment date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {confirmationLetters.map((cl, idx) => {
                                      return (
                                        <tr key={cl.id} className="bg-white border border-black text-black">
                                          <td className="border border-black px-2 py-1 text-center font-mono">
                                            {cl.customerCode !== undefined ? cl.customerCode : "OTC08002"}
                                          </td>
                                          <td className="border border-black px-2 py-1 text-center font-mono">
                                            {cl.documentNo !== undefined ? cl.documentNo : (cl.clNumber.replace(/[^0-9]/g, "").slice(-11) || `180000000${53 + idx}`)}
                                          </td>
                                          <td className="border border-black px-2 py-1 text-left font-mono text-[8px] uppercase font-bold">
                                            {cl.customText !== undefined ? cl.customText : `POTONG TAGIH ${getClaimText(cl)}`}
                                          </td>
                                          <td className="border border-black px-2 py-1 text-left font-sans">
                                            {cl.supplierName}
                                          </td>
                                          <td className="border border-black px-2 py-1 text-center font-mono">
                                            {formatSscDate(cl.dateSent)}
                                          </td>
                                          <td className="border border-black px-2 py-1 text-right font-mono font-bold">
                                            {cl.amount}
                                          </td>
                                          <td className="border border-black px-2 py-1 text-center font-mono font-bold">
                                            {cl.paymentDate !== undefined ? cl.paymentDate : getPaymentDate(cl.dateSent)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              {/* Demikian dan Terimakasih */}
                              <div className="pl-28 space-y-4">
                                <div className="font-bold text-[11px] pt-1">
                                  Demikian , dan Terimakasih
                                </div>
                                
                                {/* Write-in lines */}
                                <div className="border-t border-black w-full pt-1.5"></div>
                                <div className="border-t border-black w-full pt-1"></div>
                              </div>
                            </div>
                          </div>

                          {/* Signatures Section */}
                          <div className="mt-8">
                            <table className="w-full border-collapse border border-black text-center text-[10px] font-bold">
                              <thead>
                                <tr className="bg-[#e5a93b] text-black border border-black">
                                  <th className="border border-black py-1.5 w-1/4">Prepared by <sup>1)</sup></th>
                                  <th className="border border-black py-1.5 w-2/4" colSpan={2}>Approved by <sup>1)</sup></th>
                                  <th className="border border-black py-1.5 w-1/4">Entry by <sup>1)</sup></th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Signature signs */}
                                <tr className="h-20 bg-white">
                                  <td className="border border-black p-2 relative vertical-align-middle">
                                    <span className="font-serif italic text-blue-700 text-lg block select-none">Bagas Nur P</span>
                                  </td>
                                  <td className="border border-black p-2 relative vertical-align-middle">
                                    {selectedCl.status === "APPROVED" && (
                                      <>
                                        <div className="text-[9px] text-slate-400 absolute top-1 left-1 font-sans">AIR</div>
                                        <span className="font-serif italic text-blue-700 text-lg block select-none">Anindita I.</span>
                                      </>
                                    )}
                                  </td>
                                  <td className="border border-black p-2 relative vertical-align-middle">
                                    {selectedCl.status === "APPROVED" && (
                                      <span className="font-serif italic text-blue-700 text-lg block select-none">Evi S.</span>
                                    )}
                                  </td>
                                  <td className="border border-black p-2 bg-white">
                                    {/* Empty */}
                                  </td>
                                </tr>
                                {/* Grey Box (Name) */}
                                <tr className="bg-[#b0b0b0] h-6 text-black">
                                  <td className="border border-black px-2 py-0.5 text-[9.5px]">Bagas Nur P</td>
                                  <td className="border border-black px-2 py-0.5 text-[9.5px]">
                                    {selectedCl.status === "APPROVED" ? "Anindita I" : ""}
                                  </td>
                                  <td className="border border-black px-2 py-0.5 text-[9.5px]">
                                    {selectedCl.status === "APPROVED" ? "Evi Sulistyorini" : ""}
                                  </td>
                                  <td className="border border-black px-2 py-0.5 text-[9.5px]"></td>
                                </tr>
                                {/* Blue Box (Function) */}
                                <tr className="bg-[#56b4e9] h-6 text-black">
                                  <td className="border border-black px-2 py-0.5 text-[9px]"></td>
                                  <td className="border border-black px-2 py-0.5 text-[9px]"></td>
                                  <td className="border border-black px-2 py-0.5 text-[9px]"></td>
                                  <td className="border border-black px-2 py-0.5 text-[9px]"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Remarks Footer */}
                          <div className="mt-4 text-[9px] text-black italic leading-normal">
                            <div className="font-bold">Remark:</div>
                            <div><sup>1)</sup> Every signing person must write down his / her full name in the grey box and his/her function in the blue box</div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-8 text-center text-slate-400 font-bold italic border border-slate-200 rounded-xl">
                          Pilih Confirmation Letter di panel kiri untuk menampilkan pratinjau memo.
                        </div>
                      )}
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
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #internal-memo-sheet, #internal-memo-sheet * { visibility: visible; }
          #internal-memo-sheet { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
