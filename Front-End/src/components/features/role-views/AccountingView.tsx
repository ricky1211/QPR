"use client";

import React, { useState } from "react";
import { 
  FileText, 
  CheckCircle2, 
  ChevronRight,
  Calculator,
  Mail,
  Send,
  AlertTriangle,
  Clock,
  X,
  Banknote,
  ShieldCheck,
  Plus
} from "lucide-react";
import ConfirmationLetterPrintPreview from "./ConfirmationLetterPrintPreview";

interface AccountingViewProps {
  confirmationLetters: any[];
  setConfirmationLetters: React.Dispatch<React.SetStateAction<any[]>>;
  handleGenerateCL: (qpr: any, amount: string, items?: any[]) => void;
  handleApproveCL?: (clId: string, level: "sect" | "dept" | "div") => void;
  handleMarkClosedPaid?: (clId: string) => void;
  handleDebitNote?: (clId: string) => void;
  handleUpdateCLPipeline?: (clId: string, data: any) => void;
  pendingQprs?: any[];
  setPendingQprs?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function AccountingView({
  confirmationLetters,
  setPendingQprs,
  setConfirmationLetters,
  handleGenerateCL,
  handleApproveCL,
  handleMarkClosedPaid,
  handleDebitNote,
  handleUpdateCLPipeline,
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
    const qprs = pendingQprs ? pendingQprs.filter((q: any) => 
      (q.status === "APPROVED_INTERNAL" || q.status === "WAITING_VENDOR" || q.status === "APPROVED_BY_VENDOR" || q.requiredRole === "Purchasing" || q.requiredRole === "Vendor" || q.requiredRole === "Accounting") && 
      q.status !== "CLOSED" && 
      q.requiredRole !== "Closed"
    ) : [];
    
    const list = qprs.map((q: any) => ({
      id: q.id,
      qprNumber: q.qprNumber,
      supplierName: q.supplierName,
      supplierId: q.supplierId,
      partName: q.partName || "Part Material NG",
      rejectCount: q.rejectItems || 30,
      totalQty: q.totalItems || 1000,
      allowanceRatio: parseFloat(q.allowanceRatio?.replace("%", "") || "0.5"),
      period: q.period,
      status: q.status
    }));



    return list;
  }, [pendingQprs, confirmationLetters]);

  const [clItems, setClItems] = useState<any[]>([]);

  React.useEffect(() => {
    if (selectedQpr) {
      setClItems([
        {
          id: `item-${Date.now()}`,
          partName: selectedQpr.partName || "Motherboard X1",
          totalQty: selectedQpr.totalQty || 1000,
          rejectCount: selectedQpr.rejectCount || 30,
          allowanceRatio: selectedQpr.allowanceRatio || 0.5,
          unitPrice: "250000"
        }
      ]);
    } else {
      setClItems([]);
    }
  }, [selectedQpr]);

  const handleCalculateTotal = () => {
    if (!selectedQpr) {
      return {
        items: [],
        subtotal: "0",
        tax: "0",
        total: "0",
        totalNum: 0
      };
    }

    let grandSubtotal = 0;
    
    const itemsCalculated = clItems.map(item => {
      const totalQty = parseFloat(String(item.totalQty)) || 0;
      const rejectCount = parseFloat(String(item.rejectCount)) || 0;
      const allowanceRatio = parseFloat(String(item.allowanceRatio)) || 0;
      const unitPriceVal = parseFloat(String(item.unitPrice)) || 0;

      const stdAllowance = Math.round(totalQty * (allowanceRatio / 100));
      const billableQty = Math.max(0, rejectCount - stdAllowance);
      const subtotal = billableQty * unitPriceVal;
      
      grandSubtotal += subtotal;

      return {
        ...item,
        stdAllowance,
        billableQty,
        subtotal
      };
    });

    const tax = grandSubtotal * (parseFloat(taxRate) / 100);
    const total = grandSubtotal + tax;

    return {
      items: itemsCalculated,
      subtotal: grandSubtotal.toLocaleString("id-ID"),
      tax: tax.toLocaleString("id-ID"),
      total: total.toLocaleString("id-ID"),
      totalNum: total
    };
  };

  const handleGeneratePdf = () => {
    setIsGenerated(true);
    const calcResult = handleCalculateTotal();
    
    setTimeout(() => {
      // 1. Generate & save the CL to global state
      handleGenerateCL(selectedQpr, calcResult.total, calcResult.items);
      
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
        reminderSentCount: 1,
        items: calcResult.items
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Queue List */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/30">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Antrean Pembuatan CL (Purchasing)</span>
            <h4 className="text-xs font-bold text-slate-800 mt-1">Klaim QPR Siap di-CL</h4>
          </div>

          <div className="p-4 space-y-2.5 flex-1">
            {/* Manual CL Creation Button */}
            <button
              onClick={() => setSelectedQpr({
                id: `manual-${Date.now()}`,
                qprNumber: `QPR/2026/06/MANUAL-${Math.floor(Math.random() * 900 + 100)}`,
                supplierName: "PT JAYADI",
                supplierId: "cmsy9dc0m000128sjgk0n6mbu",
                partName: "Custom Part Material",
                rejectCount: 30,
                totalQty: 10000,
                allowanceRatio: 0.5,
                period: "Juni 2026",
                status: "APPROVED_INTERNAL",
                isManual: true
              })}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 mb-2"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Buat CL Manual</span>
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
                      <span className="text-[10px] text-slate-400 block">{qpr.partName} • {qpr.rejectCount} pcs NG / {qpr.totalQty} Total</span>

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
          <div className="p-5 border-b border-slate-100 bg-slate-50/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calculator size={18} className="text-blue-500" />
              <h4 className="text-sm font-bold text-slate-800">Konfigurasi & Kalkulator Formula Klaim</h4>
            </div>
            {selectedQpr && (
              <button
                onClick={() => setSelectedQpr(null)}
                className="text-xs font-bold text-red-600 hover:text-red-700 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100/70 border border-red-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="Batal pilih / Bersihkan pilihan"
              >
                <X size={13} className="stroke-[2.5]" />
                Batal Pilih
              </button>
            )}
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
              ) : null}

              {/* Part Items List Configuration Table */}
              <div className="space-y-3.5 text-xs text-left">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <strong className="text-slate-800 font-extrabold uppercase tracking-wide">
                    Konfigurasi Part & Harga per Item
                  </strong>
                  <button
                    type="button"
                    onClick={() => {
                      setClItems(prev => [
                        ...prev,
                        {
                          id: `item-${Date.now()}`,
                          partName: "Custom Part",
                          totalQty: 1000,
                          rejectCount: 10,
                          allowanceRatio: 0.5,
                          unitPrice: "250000"
                        }
                      ]);
                    }}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95 text-[10.5px]"
                  >
                    <Plus size={13} className="stroke-[2.5]" />
                    <span>Tambah Part Item</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-[11px] text-left border-collapse min-w-[900px]">
                    <thead className="bg-slate-50 text-slate-750 font-black border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-3">Nama Part / Deskripsi</th>
                        <th className="px-3 py-3 w-28 text-right">Total Qty</th>
                        <th className="px-3 py-3 w-28 text-right">Qty NG</th>
                        <th className="px-3 py-3 w-24 text-right">Limit (%)</th>
                        <th className="px-3 py-3 w-24 text-right">Allow. Qty</th>
                        <th className="px-3 py-3 w-24 text-right">Qty Denda</th>
                        <th className="px-3 py-3 w-40 text-right">Harga Satuan (Rp)</th>
                        <th className="px-3 py-3 w-36 text-right">Subtotal (Rp)</th>
                        <th className="px-3 py-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-bold">
                      {calc.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-55">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.partName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setClItems(prev => prev.map(x => x.id === item.id ? { ...x, partName: val } : x));
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-855 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.totalQty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setClItems(prev => prev.map(x => x.id === item.id ? { ...x, totalQty: val } : x));
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-right font-mono text-slate-855 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.rejectCount}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setClItems(prev => prev.map(x => x.id === item.id ? { ...x, rejectCount: val } : x));
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-right font-mono text-slate-855 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              value={item.allowanceRatio}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setClItems(prev => prev.map(x => x.id === item.id ? { ...x, allowanceRatio: val } : x));
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-right font-mono text-slate-855 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-2 text-right font-mono text-slate-500 pr-4">
                            {item.stdAllowance}
                          </td>
                          <td className="p-2 text-right font-mono text-blue-650 pr-4">
                            {item.billableQty}
                          </td>
                          <td className="p-2">
                            <div className="relative">
                              <span className="absolute left-2 top-2 text-[10px] text-slate-400">Rp</span>
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setClItems(prev => prev.map(x => x.id === item.id ? { ...x, unitPrice: val } : x));
                                }}
                                className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded text-right font-mono text-slate-855 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </td>
                          <td className="p-2 text-right font-mono text-slate-855 pr-4">
                            Rp {item.subtotal.toLocaleString("id-ID")}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              disabled={clItems.length <= 1}
                              onClick={() => {
                                setClItems(prev => prev.filter(x => x.id !== item.id));
                              }}
                              className="p-1 text-red-500 hover:text-red-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-xs"
                            >
                              ❌
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax PPN Configuration */}
              <div className="w-full max-w-[200px] text-left">
                <label className="block text-xs font-bold text-slate-750 mb-1">PPN (%)</label>
                <div className="relative text-xs">
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-850"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Calculation Summary with Formula visual */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3.5">
                <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ringkasan Total Klaim</span>
                  <span className="text-[8px] bg-slate-200 text-slate-700 font-black px-1.5 py-0.5 rounded uppercase">
                    (Qty NG - Std Allowance) x Harga Satuan per Part
                  </span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal Seluruh Part</span>
                    <span className="font-bold text-slate-850">Rp {calc.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PPN ({taxRate}%)</span>
                    <span className="font-bold text-slate-850">Rp {calc.tax}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200/50">
                    <span className="font-extrabold text-slate-900">Total Claim Denda Akhir</span>
                    <span className="font-black text-sm text-red-650">Rp {calc.total}</span>
                  </div>
                </div>
              </div>

              {/* Generate PDF action */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleGeneratePdf}
                  disabled={isGenerated}
                  className="flex items-center gap-1.5 px-6 py-3 rounded-md text-xs font-bold shadow-md transition-colors cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10"
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
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dashboard Monitoring CL</span>
            <h4 className="text-xs font-bold text-slate-850 mt-1">Status Pengiriman, Otorisasi Internal & Pembayaran Confirmation Letter</h4>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1.5 rounded font-bold uppercase whitespace-nowrap">
              Otorisasi Level: {
                (() => {
                  const mtmUser = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )mtm_user=([^;]*)/)?.[1] : 'admin';
                  return mtmUser === 'accounting' ? 'Sect/Dept/Div Accounting' : 'Admin';
                })()
              }
            </span>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded shadow-sm">
              Total CL: {confirmationLetters.length} Surat
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
            <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10 text-center">No</th>
                <th className="px-4 py-3">No. Confirmation Letter</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Tgl Kirim</th>
                <th className="px-4 py-3 text-center w-52">Lead Time (Proses Accounting)</th>
                <th className="px-4 py-3 text-center min-w-[760px]">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {confirmationLetters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic font-semibold">
                    Belum ada Confirmation Letter yang dikirim.
                  </td>
                </tr>
              ) : (
                confirmationLetters.map((cl, index) => {
                  const prog = cl.clApprovalProgress || { sectAccounting: false, deptAccounting: false };
                  const currentRole = cl.requiredRole || (
                    !prog.deptAccounting ? "Dept Accounting" : "Closed"
                  );

                  const approvalSteps = [
                    { key: "dept", label: "Dept Accounting", done: prog.deptAccounting, roleMatch: "Dept Accounting" }
                  ];
                  const fullyApproved = prog.deptAccounting;
                  const closedPaid = cl.closedPaid || cl.status === "CLOSED_PAID";
                  const debitCount = cl.debitNoteCount || 0;

                  return (
                    <tr key={cl.id} className="hover:bg-slate-50 transition-colors font-semibold">
                      <td className="px-4 py-3 text-center text-slate-400 font-mono">{index + 1}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 break-all">{cl.clNumber}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{cl.supplierName}</td>
                      <td className="px-4 py-3 text-slate-500">{cl.dateSent}</td>

                       {/* Lead Time (Proses Accounting) — Progress Bar Style */}
                       <td className="px-4 py-3">
                         {(() => {
                           const MAX_DAYS = 7;
                           let diffDays = 1;
                           try {
                             const sentDate = new Date(cl.dateSent);
                             const nowDate = new Date();
                             diffDays = Math.max(1, Math.ceil(Math.abs(nowDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)));
                           } catch {}
                           // Lock days at approval time if approved
                           const finalDays = fullyApproved ? (cl.approvedDays || diffDays) : diffDays;
                           const pct = Math.min(100, Math.round((finalDays / MAX_DAYS) * 100));
                           const barColor = fullyApproved
                             ? "bg-emerald-500"
                             : finalDays <= 2 ? "bg-emerald-400"
                             : finalDays <= 4 ? "bg-amber-400"
                             : "bg-red-500";
                           const textColor = fullyApproved
                             ? "text-emerald-700"
                             : finalDays <= 2 ? "text-emerald-700"
                             : finalDays <= 4 ? "text-amber-700"
                             : "text-red-700";
                           return (
                             <div className="flex flex-col gap-1.5 min-w-[140px]">
                               <div className="flex items-center justify-between">
                                 <span className={`text-[10px] font-black ${textColor}`}>
                                   {fullyApproved
                                     ? <span className="inline-flex items-center gap-1"><CheckCircle2 size={10} /> {finalDays} Hari ✓</span>
                                     : `${finalDays} Hari Berjalan`
                                   }
                                 </span>
                                 <span className="text-[9px] text-slate-400 font-bold">{pct}%</span>
                               </div>
                               <div className="h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                                 <div
                                   className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                   style={{ width: `${pct}%` }}
                                 />
                               </div>
                               <div className="flex items-center justify-between text-[8.5px] text-slate-400 font-bold">
                                 <span>0</span>
                                 <span className="text-slate-500">Target: {MAX_DAYS} hari</span>
                               </div>
                               <div className="flex gap-1 mt-0.5">
                                 {approvalSteps.map(step => (
                                   <span
                                     key={step.key}
                                     className={`text-[8px] font-black px-1.5 py-0.5 rounded ${step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                                   >
                                     {step.done ? '✓' : '○'} Dept
                                   </span>
                                 ))}
                               </div>
                             </div>
                           );
                         })()}
                       </td>

                        <td className="px-4 py-3">
                           <div className="flex items-center gap-1 justify-center py-1 whitespace-nowrap flex-wrap">
                             {(() => {
                               // Stage flags
                               const isDeptApproved = !!(prog.deptAccounting || cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID");
                               const isPurchasingSent = !!(cl.purchasingSentCl || cl.status === "CLOSED_PAID");
                               const isVendorApproved = !!(cl.vendorApproved || cl.status === "CLOSED_PAID");

                               const stages = [
                                 {
                                   name: "1. WAITING DEPT ACCOUNTING",
                                   status: isDeptApproved ? "APPROVED" : "PENDING"
                                 },
                                 {
                                   name: "2. DEPT ACCOUNTING APPROVE",
                                   status: isDeptApproved ? "APPROVED" : "UPCOMING"
                                 },
                                 {
                                   name: "3. PURCHASING SEND CL",
                                   status: isPurchasingSent ? "APPROVED" : (isDeptApproved ? "PENDING" : "UPCOMING")
                                 },
                                 {
                                   name: "4. WAITING VENDOR APPROVAL",
                                   status: isVendorApproved ? "APPROVED" : (isPurchasingSent ? "PENDING" : "UPCOMING")
                                 },
                                 {
                                   name: "5. VENDOR APPROVED",
                                   status: isVendorApproved ? "APPROVED" : "UPCOMING"
                                 }
                               ];

                               return stages.map((stage, i, arr) => (
                                 <React.Fragment key={i}>
                                   <span
                                     className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-extrabold transition-all border shrink-0 ${
                                       stage.status === "APPROVED"
                                         ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                         : stage.status === "PENDING"
                                         ? "bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-100"
                                         : "bg-slate-50 text-slate-400 border-slate-200 opacity-60"
                                     }`}
                                   >
                                     {stage.status === "APPROVED" && <CheckCircle2 size={10} className="text-emerald-600 shrink-0" />}
                                     {stage.status === "PENDING" && <Clock size={10} className="text-amber-500 shrink-0" />}
                                     {stage.name}
                                   </span>
                                   {i < arr.length - 1 && (
                                     <div className="flex flex-col items-center justify-center shrink-0 px-1 select-none">
                                       <span className="text-slate-400 text-xs font-black leading-none">:</span>
                                     </div>
                                   )}
                                 </React.Fragment>
                               ));
                             })()}

                             {/* Purchasing manual action buttons */}
                             {(() => {
                               const isDeptApproved = !!(prog.deptAccounting || cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID");
                               const isPurchasingSent = !!(cl.purchasingSentCl || cl.status === "CLOSED_PAID");
                               const isVendorApproved = !!(cl.vendorApproved || cl.status === "CLOSED_PAID");
                               return (
                                 <div className="flex gap-1.5 ml-2 shrink-0 items-center">
                                   {/* Send CL to Vendor */}
                                   {isDeptApproved && !isPurchasingSent && (
                                     <button
                                       onClick={() => {
                                         const payload = { purchasingSentCl: true, purchasingSentDate: new Date().toISOString().split('T')[0] };
                                         if (handleUpdateCLPipeline) {
                                           handleUpdateCLPipeline(cl.id, payload);
                                         } else {
                                           setConfirmationLetters(prev => prev.map(c => c.id === cl.id ? { ...c, ...payload } : c));
                                         }
                                       }}
                                       className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[8.5px] font-black cursor-pointer transition-colors active:scale-95 uppercase shadow-sm"
                                       title="Purchasing: Kirim CL ke Vendor"
                                     >
                                       <Send size={9} />
                                       Kirim ke Vendor
                                     </button>
                                   )}
                                   {/* Vendor Approved via Upload CL */}
                                   {isPurchasingSent && !isVendorApproved && (
                                     <div className="flex items-center gap-1">
                                       <label className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[8.5px] font-black cursor-pointer transition-colors active:scale-95 uppercase shadow-sm">
                                         <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                         Upload CL Signed
                                         <input
                                           type="file"
                                           accept="application/pdf,image/*"
                                           className="hidden"
                                           onChange={(e) => {
                                             if (e.target.files && e.target.files.length > 0) {
                                               const file = e.target.files[0];
                                               const fileUrl = URL.createObjectURL(file);
                                               alert(`File "${file.name}" berhasil diupload. Status CL berubah menjadi Vendor Approved.`);
                                               const payload = { vendorApproved: true, vendorApprovedDate: new Date().toISOString().split('T')[0], signedClFileName: file.name, signedClFileUrl: fileUrl };
                                               if (handleUpdateCLPipeline) {
                                                 handleUpdateCLPipeline(cl.id, payload);
                                               } else {
                                                 setConfirmationLetters(prev => prev.map(c => c.id === cl.id ? { ...c, ...payload } : c));
                                               }
                                             }
                                           }}
                                         />
                                       </label>
                                       <span className="text-slate-300">or</span>
                                       <button
                                         onClick={() => {
                                           const payload = { vendorApproved: true, vendorApprovedDate: new Date().toISOString().split('T')[0] };
                                           if (handleUpdateCLPipeline) {
                                             handleUpdateCLPipeline(cl.id, payload);
                                           } else {
                                             setConfirmationLetters(prev => prev.map(c => c.id === cl.id ? { ...c, ...payload } : c));
                                           }
                                         }}
                                         className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[8.5px] font-black cursor-pointer transition-colors active:scale-95 uppercase shadow-sm"
                                         title="Purchasing: Vendor Sudah Approve"
                                       >
                                         <CheckCircle2 size={9} />
                                         Vendor Approve
                                       </button>
                                     </div>
                                   )}
                                   {/* Close Paid */}
                                   {isVendorApproved && !closedPaid && handleMarkClosedPaid && (
                                     <button
                                       onClick={() => handleMarkClosedPaid(cl.id)}
                                       className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[8.5px] font-black cursor-pointer transition-colors active:scale-95 uppercase shadow-sm"
                                       title="Tandai sebagai Close Paid"
                                     >
                                       <Banknote size={9} />
                                       Close Paid
                                     </button>
                                   )}
                                   {closedPaid && (
                                     <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-[9px] font-black uppercase">
                                       <CheckCircle2 size={10} className="text-green-600" />
                                       Close Paid
                                     </span>
                                   )}
                                 </div>
                               );
                             })()}
                           </div>
                        </td>

                      {/* Aksi */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {cl.signedClFileUrl ? (
                             <a
                               href={cl.signedClFileUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                               title={`Buka file yang di-upload: ${cl.signedClFileName}`}
                             >
                               <FileText size={12} />
                               Buka Signed CL ({cl.signedClFileName?.slice(0, 10)}...)
                             </a>
                           ) : (
                             <button
                               onClick={() => setPreviewClDoc(cl)}
                               className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1"
                               title="Lihat Confirmation Letter PDF"
                             >
                               <FileText size={12} />
                               Lihat CL PDF
                             </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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

            {/* Content: Full-Width Preview */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 gap-6 bg-slate-50 max-h-[65vh]">
              
              {/* Confirmation Letter Document Sheet Preview (A4 style) */}
              <div className="border border-slate-200 rounded-lg bg-slate-100 p-3 max-h-[60vh] overflow-y-auto shadow-inner flex items-start justify-center w-full">
                <div 
                  className="w-full bg-white shadow-md p-6 text-black border border-slate-355 text-left font-serif max-w-[210mm]"
                  style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "10.5px", lineHeight: "1.35" }}
                >
                  {/* Top black line */}
                  <div className="border-t border-black mb-4 w-full" />

                  {/* Title */}
                  <div className="text-center mb-3">
                    <h5 className="text-sm font-bold tracking-normal uppercase">Confirmation Letter</h5>
                  </div>

                  {/* Date */}
                  <div className="text-right text-[9.5px] mb-3">
                    Cikarang, {(() => {
                      if (!justGeneratedCl.dateSent) return "02 December 2025";
                      const parts = justGeneratedCl.dateSent.split("-");
                      if (parts.length !== 3) return justGeneratedCl.dateSent;
                      const months = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ];
                      return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
                    })()}
                  </div>

                  {/* To Address */}
                  <div className="font-bold mb-4 text-[10px]">
                    <div>To:</div>
                    <div>{justGeneratedCl.supplierName.toUpperCase().endsWith(", PT.") ? justGeneratedCl.supplierName : `${justGeneratedCl.supplierName}, PT.`}</div>
                    <div>Jl. Science Timur I Blok A 5H</div>
                    <div>Cikarang Timur, Bekasi, Jawa Barat 17530</div>
                  </div>

                  {/* Intro texts */}
                  <div className="space-y-2 mb-4 text-[9.5px] text-justify">
                    <p>
                      According to quality problem report (QPR) that we have checked at Menara Terus Makmur, PT.:
                    </p>
                    <p>
                      We would like to confirm to you that we have agreed if it is found some NG parts which are not caused by our internal process. NG parts and loss can be seen as follows:
                    </p>
                  </div>

                  {/* Table */}
                  <div className="mb-4">
                    <table className="w-full text-[9px] border-collapse border border-black text-black">
                      <thead>
                        <tr className="border-b border-black text-center font-bold">
                          <th className="border border-black px-1.5 py-1 w-6">No</th>
                          <th className="border border-black px-1.5 py-1">Description</th>
                          <th className="border border-black px-1.5 py-1 w-10">Qty</th>
                          <th className="border border-black px-1.5 py-1 w-20">Claim Cost</th>
                          <th className="border border-black px-1.5 py-1 w-24">Amount (IDR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {justGeneratedCl.items && justGeneratedCl.items.length > 0 ? (
                          justGeneratedCl.items.map((item: any, idx: number) => {
                            const totalQty = parseFloat(String(item.totalQty)) || 0;
                            const rejectCount = parseFloat(String(item.rejectCount)) || 0;
                            const allowanceRatio = parseFloat(String(item.allowanceRatio)) || 0;
                            const unitPriceVal = parseFloat(String(item.unitPrice)) || 0;
                            const stdAllowance = Math.round(totalQty * (allowanceRatio / 100));
                            const billableQty = Math.max(0, rejectCount - stdAllowance);
                            const subtotal = billableQty * unitPriceVal;
                            return (
                              <tr key={item.id || idx}>
                                <td className="border border-black px-1.5 py-1 text-center">{idx + 1}</td>
                                <td className="border border-black px-1.5 py-1">{item.partName}</td>
                                <td className="border border-black px-1.5 py-1 text-center font-mono">{billableQty}</td>
                                <td className="border border-black px-1.5 py-1 text-right font-mono">{unitPriceVal.toLocaleString("en-US")}</td>
                                <td className="border border-black px-1.5 py-1 text-right font-mono">{subtotal.toLocaleString("en-US")}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <>
                            <tr>
                              <td className="border border-black px-1.5 py-1 text-center">1</td>
                              <td className="border border-black px-1.5 py-1">HUB CLUTCH, IMV 683N</td>
                              <td className="border border-black px-1.5 py-1 text-center font-mono">14</td>
                              <td className="border border-black px-1.5 py-1 text-right font-mono">49,516</td>
                              <td className="border border-black px-1.5 py-1 text-right font-mono">693,224</td>
                            </tr>
                            <tr>
                              <td className="border border-black px-1.5 py-1 text-center">2</td>
                              <td className="border border-black px-1.5 py-1">HUB CLUTCH, RZN</td>
                              <td className="border border-black px-1.5 py-1 text-center font-mono">6</td>
                              <td className="border border-black px-1.5 py-1 text-right font-mono">56,277</td>
                              <td className="border border-black px-1.5 py-1 text-right font-mono">337,662</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td className="border-l border-black px-1.5 py-0.5"></td>
                          <td className="border-l border-black px-1.5 py-0.5" colSpan={3}>VAT</td>
                          <td className="border border-black px-1.5 py-0.5 text-right font-mono">
                            {(() => {
                              const totalVal = parseInt(justGeneratedCl.amount.replace(/[^0-9]/g, "") || "0", 10);
                              const subVal = Math.round(totalVal / 1.11);
                              return (totalVal - subVal).toLocaleString("en-US");
                            })()}
                          </td>
                        </tr>
                        <tr className="font-bold">
                          <td className="border-l border-b border-black px-1.5 py-0.5"></td>
                          <td className="border-l border-b border-black px-1.5 py-0.5" colSpan={3}>Total</td>
                          <td className="border border-black px-1.5 py-0.5 text-right font-mono">{parseInt(justGeneratedCl.amount.replace(/[^0-9]/g, "") || "0", 10).toLocaleString("en-US")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Closing texts */}
                  <div className="space-y-2 mb-4 text-[9.5px] text-justify">
                    <p>
                      Based on the data above, we will release a debit note to {justGeneratedCl.supplierName.toUpperCase().endsWith(", PT.") ? justGeneratedCl.supplierName : `${justGeneratedCl.supplierName}, PT.`} if there is no any confirmation within 5 working days. We are looking forward for your confirmation
                    </p>
                    <div>
                      <span>Attachment :</span>
                      <div className="font-bold">QPR Number : {justGeneratedCl.qprNumber}</div>
                    </div>
                  </div>

                  {/* Signature */}
                  <div className="flex justify-between text-[9.5px] font-bold mt-6">
                    <div className="flex flex-col justify-between min-h-[90px]">
                      <div>
                        <span>Yours Faithfully,</span>
                        <div className="mt-0.5 font-bold">MenaraTerusMakmur, PT</div>
                        <div className="font-normal text-[8.5px]">Accounting & Finance Departement</div>
                      </div>
                      <div className="pt-4">
                        <span className="block underline font-bold">Anindita Irnilaningtyas</span>
                        <span className="block font-normal text-[8px] text-slate-500">Dep. Head Accounting & Finance</span>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between items-end text-right min-h-[90px] pr-2">
                      <span>Approved</span>
                      <div className="w-24 border-b border-dashed border-slate-400 h-8" />
                      <span className="font-bold text-center w-24">Representative</span>
                    </div>
                  </div>
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
