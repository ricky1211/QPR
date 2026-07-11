"use client";

import React, { useState } from "react";
import { 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  Calculator,
  Mail,
  Send,
  Eye,
  AlertTriangle,
  Clock,
  X,
  FileCheck,
  Check,
  Download
} from "lucide-react";
import ConfirmationLetterPrintPreview from "./ConfirmationLetterPrintPreview";

interface AccountingViewProps {
  confirmationLetters: any[];
  setConfirmationLetters: React.Dispatch<React.SetStateAction<any[]>>;
  handleGenerateCL: (qpr: any, amount: string) => void;
  pendingQprs?: any[];
}

export default function AccountingView({
  confirmationLetters,
  setConfirmationLetters,
  handleGenerateCL,
  pendingQprs
}: AccountingViewProps) {
  const [selectedQpr, setSelectedQpr] = useState<any>(null);
  const [unitPrice, setUnitPrice] = useState("250000");
  const [taxRate, setTaxRate] = useState("11"); // % PPN
  const [isGenerated, setIsGenerated] = useState(false);

  // Modals / Preview States
  const [previewMemoCl, setPreviewMemoCl] = useState<any | null>(null);
  const [previewReminderCl, setPreviewReminderCl] = useState<any | null>(null);
  const [justGeneratedCl, setJustGeneratedCl] = useState<any | null>(null);
  const [previewClDoc, setPreviewClDoc] = useState<any | null>(null);

  const handleUpdateManualQpr = (field: string, value: any) => {
    setSelectedQpr((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // List of QPRs ready for accounting action, dynamically compiled from pendingQprs
  const accountingQueue = React.useMemo(() => {
    const qprs = pendingQprs ? pendingQprs.filter((q: any) => (q.status === "APPROVED_INTERNAL" || q.requiredRole === "Purchasing") && q.status !== "CLOSED" && q.requiredRole !== "Closed") : [];
    
    const list = qprs.map((q: any) => ({
      id: q.id,
      qprNumber: q.qprNumber,
      supplierName: q.supplierName,
      partName: q.partName || "Part Material NG",
      rejectCount: q.rejectItems || 30,
      totalQty: q.totalItems || 1000,
      allowanceRatio: parseFloat(q.allowanceRatio?.replace("%", "") || "0.5"),
      period: q.period,
      status: q.status
    }));

    if (list.length === 0 && !confirmationLetters.some(cl => cl.qprNumber === "QPR/2026/05/JAYADI")) {
      list.push({
        id: 10,
        qprNumber: "QPR/2026/05/JAYADI",
        supplierName: "PT JAYADI",
        partName: "Motherboard X1",
        rejectCount: 50, // Qty NG
        totalQty: 10000, // Total Qty
        allowanceRatio: 0.2, // allowance limit
        period: "Mei 2026",
        status: "APPROVED_INTERNAL"
      });
    }

    return list;
  }, [pendingQprs, confirmationLetters]);

  const handleCalculateTotal = () => {
    if (!selectedQpr) {
      return {
        stdAllowance: 0,
        billableQty: 0,
        subtotal: "0",
        tax: "0",
        total: "0"
      };
    }

    const qtyNg = selectedQpr.rejectCount;
    const totalQty = selectedQpr.totalQty;
    const allowanceRatio = selectedQpr.allowanceRatio; // e.g. 0.2 %
    
    const stdAllowance = Math.round(totalQty * (allowanceRatio / 100));
    const billableQty = Math.max(0, qtyNg - stdAllowance);

    const price = parseFloat(unitPrice) || 0;
    const subtotal = billableQty * price;
    const tax = subtotal * (parseFloat(taxRate) / 100);
    const total = subtotal + tax;

    return {
      stdAllowance,
      billableQty,
      subtotal: subtotal.toLocaleString("id-ID"),
      tax: tax.toLocaleString("id-ID"),
      total: total.toLocaleString("id-ID")
    };
  };

  const handleGeneratePdf = () => {
    setIsGenerated(true);
    const calcResult = handleCalculateTotal();
    
    setTimeout(() => {
      // 1. Generate & save the CL to global state
      handleGenerateCL(selectedQpr, calcResult.total);
      
      // 2. Open Success modal showing Internal Memo & Vendor Reminder
      const simulatedClNumber = `CL/2026/06/${selectedQpr.supplierName.replace("PT ", "").replace(/ /g, "_")}_${Math.floor(Math.random() * 900 + 100)}`;
      setJustGeneratedCl({
        clNumber: simulatedClNumber,
        qprNumber: selectedQpr.qprNumber,
        supplierName: selectedQpr.supplierName,
        dateSent: new Date().toISOString().split("T")[0],
        amount: `Rp ${calcResult.total}`,
        period: selectedQpr.period,
        status: "PENDING",
        memoStatus: "SENT_AOP",
        reminderSentCount: 1
      });

      // 3. Clear selected state
      setSelectedQpr(null);
      setIsGenerated(false);
    }, 1200);
  };

  const handleToggleApproval = (id: string) => {
    setConfirmationLetters(prev => prev.map(cl => {
      if (cl.id === id) {
        const newStatus = cl.status === "APPROVED" ? "PENDING" : "APPROVED";
        return { ...cl, status: newStatus };
      }
      return cl;
    }));
  };

  const handleSendReminder = (id: string) => {
    setConfirmationLetters(prev => prev.map(cl => {
      if (cl.id === id) {
        alert(`Reminder untuk ${cl.clNumber} berhasil dikirim ulang ke vendor!`);
        return { ...cl, reminderSentCount: cl.reminderSentCount + 1 };
      }
      return cl;
    }));
  };

  const calc = handleCalculateTotal();

  return (
    <div className="space-y-6 text-left">
      
      {/* Page Title */}
      <div className="pl-1">
        <h4 className="text-lg font-black text-slate-800">Eksekusi Finansial QPR & Penutupan Kasus</h4>
        <p className="text-xs text-slate-400 mt-0.5">Fase 4: Hitung nilai klaim denda menggunakan rumus resmi dan terbitkan PDF confirmation letter.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Queue List */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/30">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Antrean Accounting</span>
            <h4 className="text-xs font-bold text-slate-800 mt-1">QPR Disetujui Div Head</h4>
          </div>

          <div className="p-4 space-y-2.5 flex-1">
            {/* Manual CL Creation Button */}
            <button
              onClick={() => setSelectedQpr({
                id: `manual-${Date.now()}`,
                qprNumber: `QPR/2026/06/MANUAL-${Math.floor(Math.random() * 900 + 100)}`,
                supplierName: "PT JAYADI",
                partName: "Custom Part Material",
                rejectCount: 30,
                totalQty: 10000,
                allowanceRatio: 0.5,
                period: "Juni 2026",
                status: "APPROVED_INTERNAL",
                isManual: true
              })}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-blue-650 hover:from-indigo-750 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 mb-2"
            >
              <span>➕ Buat CL Manual</span>
            </button>

            {accountingQueue.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 size={28} className="text-green-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Antrean Kosong</p>
                <p className="text-[9px] text-slate-400">Semua draf klaim finansial QPR telah diproses & diselesaikan.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {accountingQueue.map((qpr) => (
                  <button
                    key={qpr.id}
                    onClick={() => setSelectedQpr(qpr)}
                    className={`w-full text-left p-3.5 rounded-md border transition-all flex justify-between items-center ${
                      selectedQpr && selectedQpr.id === qpr.id
                        ? "bg-blue-50/50 border-blue-200"
                        : "bg-slate-50 border-slate-100 hover:bg-slate-150 cursor-pointer"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <span className="font-mono text-[9px] font-bold text-slate-800 block">{qpr.qprNumber}</span>
                      <strong className="text-xs font-bold text-slate-900 block mt-1">{qpr.supplierName}</strong>
                      <span className="text-[10px] text-slate-400">{qpr.partName} • {qpr.rejectCount} pcs NG / {qpr.totalQty} Total</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Pricing Calculator panel */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/10 flex items-center gap-2">
            <Calculator size={18} className="text-blue-500" />
            <h4 className="text-sm font-bold text-slate-800">Konfigurasi & Kalkulator Formula Klaim</h4>
          </div>

          {selectedQpr ? (
            <div className="p-6 space-y-6 flex-1">
              
              {/* Manual Document Input Form */}
              {selectedQpr.isManual ? (
                <div className="bg-indigo-50/20 p-4 border border-indigo-150/60 rounded-xl space-y-4 text-xs">
                  <div className="flex items-center gap-1.5 border-b border-indigo-100/50 pb-2 mb-1">
                    <span className="p-1 bg-indigo-600 text-white rounded-md"><FileText size={10} /></span>
                    <strong className="text-indigo-900 font-extrabold uppercase tracking-wide">Form Dokumen Manual</strong>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Nomor QPR</label>
                      <input
                        type="text"
                        value={selectedQpr.qprNumber}
                        onChange={(e) => handleUpdateManualQpr("qprNumber", e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="QPR/2026/06/CUSTOM"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Nama Supplier / Vendor</label>
                      <select
                        value={selectedQpr.supplierName}
                        onChange={(e) => handleUpdateManualQpr("supplierName", e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="PT JAYADI">PT JAYADI</option>
                        <option value="PT IKAN BAKAR">PT IKAN BAKAR</option>
                        <option value="SHIJIAZHUANG RUICHENG TRADE CO., LTD">SHIJIAZHUANG RUICHENG TRADE CO., LTD</option>
                        <option value="PT MENARA TERUS MAKMUR">PT MENARA TERUS MAKMUR</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Nama Part</label>
                      <input
                        type="text"
                        value={selectedQpr.partName}
                        onChange={(e) => handleUpdateManualQpr("partName", e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Motherboard X1"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Periode Evaluasi</label>
                      <select
                        value={selectedQpr.period}
                        onChange={(e) => handleUpdateManualQpr("period", e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Januari 2026">Januari 2026</option>
                        <option value="Februari 2026">Februari 2026</option>
                        <option value="Maret 2026">Maret 2026</option>
                        <option value="April 2026">April 2026</option>
                        <option value="Mei 2026">Mei 2026</option>
                        <option value="Juni 2026">Juni 2026</option>
                        <option value="Juli 2026">Juli 2026</option>
                        <option value="Agustus 2026">Agustus 2026</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 border-t border-indigo-100/30 pt-3">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Total Qty Kirim</label>
                      <input
                        type="number"
                        value={selectedQpr.totalQty}
                        onChange={(e) => handleUpdateManualQpr("totalQty", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Kuantitas NG</label>
                      <input
                        type="number"
                        value={selectedQpr.rejectCount}
                        onChange={(e) => handleUpdateManualQpr("rejectCount", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Allowance limit (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedQpr.allowanceRatio}
                        onChange={(e) => handleUpdateManualQpr("allowanceRatio", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Queued Param details grid (Read-Only) */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 border border-slate-200/50 rounded-lg text-xs font-bold">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Total Qty:</span>
                    <span className="text-slate-800 text-sm block mt-0.5">{selectedQpr.totalQty.toLocaleString("id-ID")} pcs</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Qty NG:</span>
                    <span className="text-slate-800 text-sm block mt-0.5">{selectedQpr.rejectCount} pcs</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Std Allowance Limit:</span>
                    <span className="text-blue-600 text-sm block mt-0.5">{selectedQpr.allowanceRatio}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-red-500 uppercase tracking-wider block">Std Allowance Qty:</span>
                    <span className="text-red-600 text-sm block mt-0.5">{calc.stdAllowance} pcs</span>
                  </div>
                </div>
              )}

              {/* Form Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Harga Satuan Part (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-850"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">PPN (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-850"
                    />
                    <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              </div>

              {/* Calculation Summary with Formula visual */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rincian Perhitungan Formula Klaim</span>
                  <span className="text-[8px] bg-slate-200 text-slate-700 font-black px-1.5 py-0.5 rounded uppercase">
                    (Qty NG - Std Allowance) x Harga Satuan
                  </span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kuantitas Denda (Qty NG: {selectedQpr.rejectCount} - Allowance: {calc.stdAllowance})</span>
                    <span className="font-bold text-slate-800">{calc.billableQty} pcs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal ({calc.billableQty} pcs x Rp {parseFloat(unitPrice).toLocaleString("id-ID")})</span>
                    <span className="font-bold text-slate-800">Rp {calc.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PPN ({taxRate}%)</span>
                    <span className="font-bold text-slate-800">Rp {calc.tax}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200/50">
                    <span className="font-extrabold text-slate-900">Total Claim Denda Akhir</span>
                    <span className="font-black text-sm text-red-600">Rp {calc.total}</span>
                  </div>
                </div>
              </div>

              {/* Generate PDF action */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleGeneratePdf}
                  disabled={isGenerated}
                  className="flex items-center gap-1.5 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold shadow-md shadow-rose-600/10 transition-colors cursor-pointer"
                >
                  <FileText size={14} />
                  {isGenerated ? "Generating PDF..." : "Generate Confirmation Letter & Kirim ke Vendor"}
                </button>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 italic text-xs flex-1 flex items-center justify-center">
              Silakan pilih salah satu draf QPR di antrean sebelah kiri untuk menginput nominal denda keuangan.
            </div>
          )}
        </div>

      </div>

      {/* MONITORING PANEL FOR CONFIRMATION LETTERS SENT */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dashboard Monitoring CL</span>
            <h4 className="text-xs font-bold text-slate-850 mt-1">Status Pengiriman & Otorisasi Confirmation Letter Vendor</h4>
          </div>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded shadow-sm">
            Total CL: {confirmationLetters.length} Surat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3">No. Confirmation Letter</th>
                <th className="px-4 py-3">Vendor / Supplier</th>
                <th className="px-4 py-3">Tanggal Kirim</th>
                <th className="px-4 py-3">Total Nilai Klaim</th>
                <th className="px-4 py-3 text-center">AOP Internal Memo</th>
                <th className="px-4 py-3 text-center">Status Approval Vendor</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {confirmationLetters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic font-semibold">
                    Belum ada Confirmation Letter yang dikirim.
                  </td>
                </tr>
              ) : (
                confirmationLetters.map((cl, index) => (
                  <tr key={cl.id} className="hover:bg-slate-55 transition-colors font-semibold">
                    <td className="px-4 py-3 text-center text-slate-400 font-mono">{index + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{cl.clNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{cl.supplierName}</td>
                    <td className="px-4 py-3 text-slate-500">{cl.dateSent}</td>
                    <td className="px-4 py-3 text-red-600 font-extrabold">{cl.amount}</td>
                    <td className="px-4 py-3 text-center">
                      {cl.memoStatus === "SENT_AOP" ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">
                          Terkirim ke AOP
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-150 text-slate-600 rounded text-[10px] font-bold">
                          Draft Memo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cl.status === "APPROVED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold">
                          <CheckCircle2 size={10} className="text-green-600" />
                          Sudah di Approval
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                            <Clock size={10} className="text-amber-600 animate-pulse" />
                            Belum di Approval
                          </span>
                          <button
                            onClick={() => handleToggleApproval(cl.id)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-350 text-slate-700 text-[10px] rounded cursor-pointer transition-colors"
                            title="Verifikasi persetujuan manual (Simulasi Vendor)"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewClDoc(cl)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 mx-auto"
                          title="Lihat Confirmation Letter PDF"
                        >
                          <FileText size={12} />
                          Lihat CL PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP 1: GENERATION SUCCESS DIALOG (SHOWS BOTH MEMO AOP & REMINDER VENDOR) */}
      {justGeneratedCl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-650 via-teal-600 to-emerald-700 text-white flex justify-between items-center" style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)" }}>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase bg-white/20 text-white px-2 py-0.5 rounded">Sukses Terbit</span>
                <h4 className="text-base font-black mt-1">Confirmation Letter {justGeneratedCl.clNumber} Berhasil Dibuat</h4>
              </div>
              <button 
                onClick={() => setJustGeneratedCl(null)} 
                className="p-2 hover:bg-white/10 rounded-md text-white/80 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content: Double Column Preview */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 max-h-[65vh]">
              
              {/* AOP Internal Memo Preview */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col text-left space-y-4">
                <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                  <span className="text-xs font-black text-indigo-750 flex items-center gap-1">
                    <FileText size={14} />
                    Internal Memo ke AOP
                  </span>
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 rounded font-bold">Auto-Generated</span>
                </div>

                <div className="flex-1 space-y-3 font-serif text-[11px] text-slate-800 p-3 bg-slate-50/50 rounded border border-slate-100/50 leading-relaxed">
                  <div className="text-center font-bold text-xs uppercase border-b border-slate-400 pb-2 mb-3">
                    PT MENARA TERUS MAKMUR
                    <span className="block text-[8px] font-normal italic font-sans text-slate-400">A Member of ASTRA Otoparts Group</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-y-1 font-sans text-[10px] mb-3">
                    <span className="font-bold text-slate-400">KEPADA:</span>
                    <span className="col-span-2 text-slate-850 font-bold">Finance & Accounting Div. AOP</span>
                    
                    <span className="font-bold text-slate-400">DARI:</span>
                    <span className="col-span-2 text-slate-850 font-bold">Finance Department MTM</span>
                    
                    <span className="font-bold text-slate-400">TANGGAL:</span>
                    <span className="col-span-2 text-slate-800">{justGeneratedCl.dateSent}</span>
                    
                    <span className="font-bold text-slate-400">HAL:</span>
                    <span className="col-span-2 text-slate-850 font-bold">Pengajuan Klaim Kualitas Penalti (QPR) - {justGeneratedCl.supplierName}</span>
                  </div>

                  <p>Dengan hormat,</p>
                  <p>
                    Bersama memo ini kami informasikan pengajuan rencana pemotongan tagihan (Deduction) atas klaim denda kualitas QPR terhadap supplier <strong>{justGeneratedCl.supplierName}</strong> periode <strong>{justGeneratedCl.period}</strong> dengan rincian berikut:
                  </p>
                  
                  <div className="bg-slate-100 p-2.5 rounded font-sans text-[11px] space-y-1 my-2 border border-slate-200">
                    <div className="flex justify-between">
                      <span>No. Confirmation Letter:</span>
                      <strong className="font-mono">{justGeneratedCl.clNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Jumlah Denda Kualitas:</span>
                      <strong className="text-red-650">{justGeneratedCl.amount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Status Pengiriman Vendor:</span>
                      <span className="text-amber-600 font-bold">Sent (Pending Approval)</span>
                    </div>
                  </div>

                  <p>
                    Memo ini diajukan sebagai basis pencatatan pencadangan piutang denda (accrual claim) di tingkat AOP Group, menunggu konfirmasi persetujuan basah/digital resmi dari vendor yang bersangkutan.
                  </p>
                  
                  <div className="pt-4 flex justify-between font-sans text-[10px] text-slate-400">
                    <span>Dibuat oleh: Finance Div MTM</span>
                    <span>Approved by: Accounting Dep. Head</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => alert("Memo Internal AOP berhasil terkirim ke sistem integrasi AOP!")}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Send size={11} />
                    Kirim ke AOP Finance
                  </button>
                  <button 
                    onClick={() => setPreviewMemoCl(justGeneratedCl)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-350 text-slate-700 rounded text-xs font-bold cursor-pointer flex items-center gap-1"
                    title="Lihat Full PDF Memo AOP"
                  >
                    <Eye size={12} />
                    PDF
                  </button>
                </div>
              </div>

              {/* Vendor Email/Reminder Preview */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col text-left space-y-4">
                <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                  <span className="text-xs font-black text-amber-700 flex items-center gap-1">
                    <Mail size={14} />
                    Reminder Surat ke Vendor
                  </span>
                  <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 rounded font-bold">Email Ready</span>
                </div>

                <div className="flex-1 space-y-3 font-sans text-[11px] text-slate-800 p-3 bg-slate-50/50 rounded border border-slate-100/50 leading-relaxed">
                  <div className="border border-slate-200 bg-white p-2 rounded text-[10px] space-y-1 font-bold text-slate-600">
                    <div><span className="text-slate-400">To:</span> management@{justGeneratedCl.supplierName.toLowerCase().replace("pt ", "").replace(/ /g, "")}.co.id</div>
                    <div><span className="text-slate-400">Subject:</span> [URGENT REMINDER] Lembar Confirmation Letter Kualitas {justGeneratedCl.clNumber} - MTM</div>
                  </div>

                  <p className="pt-2">Kepada Yth. Pimpinan Keuangan / Sales Manager <strong>{justGeneratedCl.supplierName}</strong>,</p>
                  <p>
                    Kami telah menerbitkan lembar persetujuan <strong>Confirmation Letter Penalti Kualitas (QPR)</strong> dengan nomor <strong>{justGeneratedCl.clNumber}</strong> tanggal pengiriman <strong>{justGeneratedCl.dateSent}</strong>.
                  </p>
                  <p>
                    Nilai denda klaim yang disepakati adalah sebesar <strong className="text-red-650">{justGeneratedCl.amount}</strong>. Sesuai prosedur Astra Otoparts, harap segera melakukan verifikasi dan penandatanganan lembar Confirmation Letter terlampir.
                  </p>
                  
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 flex items-start gap-2 my-2">
                    <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <strong>Batas Waktu Otorisasi:</strong>
                      <p className="text-[10px] mt-0.5 leading-normal">
                        Harap melakukan Approval dalam waktu maksimal 5 (lima) hari kerja. Apabila tidak ada tanggapan, pemotongan tagihan secara otomatis akan dijalankan pada tagihan berjalan.
                      </p>
                    </div>
                  </div>

                  <p>Hormat kami,</p>
                  <strong className="block mt-1 font-black text-slate-800 text-[10px]">PT Menara Terus Makmur (Finance & Accounting Div)</strong>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      alert(`Email reminder untuk ${justGeneratedCl.clNumber} berhasil dikirim ke vendor!`);
                      setJustGeneratedCl(null);
                    }}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Send size={11} />
                    Kirim Email & Pengingat Vendor
                  </button>
                  <button 
                    onClick={() => alert("Reminder template copied to clipboard!")}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-350 text-slate-700 rounded text-xs font-bold cursor-pointer"
                  >
                    Salin Teks
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setJustGeneratedCl(null)} 
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-md font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Selesai & Masuk ke Monitoring
              </button>
            </div>

          </div>
        </div>
      )}



      {previewClDoc && (
        <ConfirmationLetterPrintPreview
          cl={previewClDoc}
          onClose={() => setPreviewClDoc(null)}
        />
      )}

    </div>
  );
}
