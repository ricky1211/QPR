"use client";

import React, { useState } from "react";
import { CreditCard, FileText, CheckCircle2, ChevronRight, Calculator } from "lucide-react";

export default function AccountingView() {
  const [selectedQpr, setSelectedQpr] = useState<any>(null);
  const [unitPrice, setUnitPrice] = useState("250000");
  const [taxRate, setTaxRate] = useState("11"); // % PPN
  const [isGenerated, setIsGenerated] = useState(false);

  // List of QPRs ready for accounting action with Total Qty & Allowance Ratio
  const [accountingQueue, setAccountingQueue] = useState([
    {
      id: 10,
      qprNumber: "QPR/2026/05/JAYADI",
      supplierName: "PT JAYADI",
      partName: "Motherboard X1",
      rejectCount: 50, // Qty NG
      totalQty: 10000, // Total Qty
      allowanceRatio: 0.2, // allowance limit, e.g. 0.2%
      period: "Mei 2026",
      status: "APPROVED_INTERNAL" // Ready for accounting input
    }
  ]);

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
    
    // Std Allowance = Total Qty * (allowanceRatio / 100)
    const stdAllowance = Math.round(totalQty * (allowanceRatio / 100));
    // Billable Qty = Qty NG - Std Allowance
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
    setTimeout(() => {
      alert("Confirmation Letter PDF dengan rincian denda potong tagihan berhasil dibuat dan dikirim ke Vendor!");
      // Move from queue to completed
      setAccountingQueue([]);
      setSelectedQpr(null);
      setIsGenerated(false);
    }, 1500);
  };

  const calc = handleCalculateTotal();

  return (
    <div className="space-y-6 text-left">
      
      {/* Page Title */}
      <div className="pl-1">
        <h4 className="text-lg font-black text-slate-800">Eksekusi Finansial QPR & Penutupan Kasus</h4>
        <p className="text-xs text-slate-400 mt-0.5">Fase 4: Hitung nilai klaim denda menggunakan rumus resmi dan terbitkan PDF confirmation letter.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Queue List */}
        <div className="md:col-span-1 bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/30">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Antrean Accounting</span>
            <h4 className="text-xs font-bold text-slate-800 mt-1">Status APPROVED_INTERNAL</h4>
          </div>

          <div className="p-4 space-y-2.5 flex-1">
            {accountingQueue.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 size={28} className="text-green-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Antrean Kosong</p>
                <p className="text-[9px] text-slate-400">Semua draf klaim finansial QPR telah diproses & diselesaikan.</p>
              </div>
            ) : (
              accountingQueue.map((qpr) => (
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
              ))
            )}
          </div>
        </div>

        {/* Right: Pricing Calculator panel */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/10 flex items-center gap-2">
            <Calculator size={18} className="text-blue-500" />
            <h4 className="text-sm font-bold text-slate-800">Konfigurasi & Kalkulator Formula Klaim</h4>
          </div>

          {selectedQpr ? (
            <div className="p-6 space-y-6 flex-1">
              
              {/* Param details grid */}
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
                  <span className="text-red-650 text-sm block mt-0.5" style={{ color: "#dc2626" }}>{calc.stdAllowance} pcs</span>
                </div>
              </div>

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
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
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
                      className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
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
                    <span className="font-black text-sm text-red-650" style={{ color: "#dc2626" }}>Rp {calc.total}</span>
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

    </div>
  );
}
