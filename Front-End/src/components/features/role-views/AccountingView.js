"use client";

import React, { useState } from "react";
import { CreditCard, FileText, CheckCircle2, ChevronRight } from "lucide-react";

export default function AccountingView() {
  const [selectedQpr, setSelectedQpr] = useState(null);
  const [unitPrice, setUnitPrice] = useState("250000");
  const [taxRate, setTaxRate] = useState("11"); // % PPN
  const [isGenerated, setIsGenerated] = useState(false);

  // List of QPRs ready for accounting action
  const [accountingQueue, setAccountingQueue] = useState([
    {
      id: 10,
      qprNumber: "QPR/2026/05/JAYADI",
      supplierName: "PT JAYADI",
      partName: "Motherboard X1",
      rejectCount: 50,
      period: "Mei 2026",
      status: "APPROVED_INTERNAL" // Ready for accounting input
    }
  ]);

  const handleCalculateTotal = () => {
    const qty = selectedQpr ? selectedQpr.rejectCount : 0;
    const price = parseFloat(unitPrice) || 0;
    const subtotal = qty * price;
    const tax = subtotal * (parseFloat(taxRate) / 100);
    const total = subtotal + tax;

    return {
      subtotal: subtotal.toLocaleString("id-ID"),
      tax: tax.toLocaleString("id-ID"),
      total: total.toLocaleString("id-ID")
    };
  };

  const handleGeneratePdf = () => {
    setIsGenerated(true);
    setTimeout(() => {
      alert("Confirmation Letter PDF berhasil di-generate dan dikirim ke Vendor!");
      // Move from queue to completed
      setAccountingQueue([]);
      setSelectedQpr(null);
      setIsGenerated(false);
    }, 1500);
  };

  const calc = handleCalculateTotal();

  return (
    <div className="space-y-6">
      

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Queue List */}
        <div className="md:col-span-1 bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/30">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Antrean Accounting</span>
            <h4 className="text-xs font-bold text-slate-800 mt-1">Status APPROVED_INTERNAL</h4>
          </div>

          <div className="p-4 space-y-2.5">
            {accountingQueue.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 size={28} className="text-green-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Antrean Kosong</p>
                <p className="text-[9px] text-slate-400">Tidak ada draf klaim internal yang menunggu rincian harga saat ini.</p>
              </div>
            ) : (
              accountingQueue.map((qpr) => (
                <button
                  key={qpr.id}
                  onClick={() => setSelectedQpr(qpr)}
                  className={`w-full text-left p-3.5 rounded-md border transition-all flex justify-between items-center ${
                    selectedQpr && selectedQpr.id === qpr.id
                      ? "bg-blue-50/50 border-blue-200"
                      : "bg-slate-50 border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="overflow-hidden">
                    <span className="font-mono text-[9px] font-bold text-slate-800 block">{qpr.qprNumber}</span>
                    <strong className="text-xs font-bold text-slate-900 block mt-1">{qpr.supplierName}</strong>
                    <span className="text-[10px] text-slate-400">{qpr.partName} • {qpr.rejectCount} pcs</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Pricing Calculator panel */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-800">Konfigurasi Nilai Klaim Keuangan</h4>
          </div>

          {selectedQpr ? (
            <div className="p-6 space-y-6">
              
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

              {/* Calculation Summary */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kalkulasi Tagihan Klaim</span>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal ({selectedQpr.rejectCount} pcs x Rp {parseFloat(unitPrice).toLocaleString("id-ID")})</span>
                    <span className="font-bold text-slate-800">Rp {calc.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PPN ({taxRate}%)</span>
                    <span className="font-bold text-slate-800">Rp {calc.tax}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200/50">
                    <span className="font-extrabold text-slate-900">Total Claim Tagihan</span>
                    <span className="font-black text-sm text-red-600">Rp {calc.total}</span>
                  </div>
                </div>
              </div>

              {/* Generate PDF action */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleGeneratePdf}
                  disabled={isGenerated}
                  className="flex items-center gap-1.5 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold shadow-md shadow-rose-600/10 transition-colors"
                >
                  <FileText size={14} />
                  {isGenerated ? "Generating PDF..." : "Generate Confirmation Letter & Kirim"}
                </button>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 italic text-xs">
              Silakan pilih salah satu draf QPR di antrean sebelah kiri untuk menginput nominal denda keuangan.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
