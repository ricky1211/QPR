"use client";

import React from "react";
import { X, Printer } from "lucide-react";

interface ClPreviewProps {
  cl: {
    clNumber: string;
    qprNumber: string;
    supplierName: string;
    dateSent: string;
    amount: string;
    status: string;
    period?: string;
    qty?: number;
    reject?: number;
    allowanceRatio?: string;
    reminderSentCount?: number;
  };
  onClose: () => void;
}

export default function ConfirmationLetterPrintPreview({ cl, onClose }: ClPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  // Address lookup helper
  const getSupplierAddress = (name: string) => {
    if (name.includes("JAYADI")) {
      return {
        address: "Jl. Industri No. 12, Cikarang",
        city: "Cikarang Timur, Bekasi, Jawa Barat 17530"
      };
    } else if (name.includes("IKAN BAKAR")) {
      return {
        address: "Kawasan Jababeka Blok A No. 8",
        city: "Cikarang Utara, Bekasi, Jawa Barat 17530"
      };
    } else {
      return {
        address: "Shijiazhuang Industrial Development Zone",
        city: "Shijiazhuang, Hebei, China 050035"
      };
    }
  };

  const supplierInfo = getSupplierAddress(cl.supplierName);

  // Parse amount for dynamic table calculation
  const totalAmountVal = parseInt(cl.amount?.replace(/[^0-9]/g, "") || "1144283", 10);
  const subtotalVal = Math.round(totalAmountVal / 1.11);
  const taxVal = totalAmountVal - subtotalVal;

  // Let's divide into two authentic description items (like the image)
  const qtyTotal = cl.reject || 20;
  const qty1 = Math.round(qtyTotal * 0.7) || 14;
  const qty2 = qtyTotal - qty1 || 6;

  const cost1 = Math.round((subtotalVal * 0.67) / qty1);
  const cost2 = Math.round((subtotalVal * 0.33) / qty2);

  const amount1 = qty1 * cost1;
  const amount2 = subtotalVal - amount1; // ensure exact subtotal sum

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Action Bar */}
      <div className="fixed top-4 right-4 flex gap-2 z-50 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-lg transition-colors cursor-pointer"
        >
          <Printer size={14} />
          Cetak / Print
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold shadow-lg border border-slate-200 transition-colors cursor-pointer"
        >
          <X size={14} />
          Tutup
        </button>
      </div>

      {/* Confirmation Letter PDF Document Layout */}
      <div
        id="cl-print-area"
        className="bg-white shadow-2xl w-full max-w-2xl my-16 text-slate-900 p-12 text-left"
        style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", minHeight: "842px" }}
      >
        {/* MTM Astra Otoparts Header */}
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
          <h1 className="text-sm font-black uppercase tracking-widest border-b border-black pb-1.5 inline-block">
            Confirmation Letter
          </h1>
          <div className="text-right text-[10px] text-slate-700 font-semibold mt-4">
            Cikarang, {cl.dateSent}
          </div>
        </div>

        {/* To Address */}
        <div className="space-y-1 font-bold text-[10.5px] leading-relaxed mb-6">
          <div>To:</div>
          <div className="font-extrabold text-slate-900">{cl.supplierName}.</div>
          <div className="font-medium text-slate-700">{supplierInfo.address}</div>
          <div className="font-medium text-slate-700">{supplierInfo.city}</div>
        </div>

        {/* Greeting and Intro text */}
        <div className="space-y-4 text-[10.5px] leading-relaxed mb-6 font-medium text-slate-700 text-justify">
          <p>
            According to quality problem report (QPR) that we have checked at Menara Terus Makmur, PT.:
          </p>
          <p>
            We would like to confirm to you that we have agreed if it is found some NG parts which are not caused by our internal process. NG parts and loss can be seen as follows:
          </p>
        </div>

        {/* Parts Table */}
        <div className="mb-6">
          <table className="w-full text-[10px] text-left border-collapse border border-black font-semibold text-slate-800">
            <thead>
              <tr className="bg-slate-100 border-b border-black text-[9px] text-slate-700">
                <th className="border border-black px-3 py-1.5 w-10 text-center">No</th>
                <th className="border border-black px-3 py-1.5">Description</th>
                <th className="border border-black px-3 py-1.5 w-16 text-center">Qty</th>
                <th className="border border-black px-3 py-1.5 w-24 text-right">Claim Cost</th>
                <th className="border border-black px-3 py-1.5 w-28 text-right">Amount (IDR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-3 py-2 text-center">1</td>
                <td className="border border-black px-3 py-2">HUB CLUTCH, IMV 683N (2TR) - Claim QPR</td>
                <td className="border border-black px-3 py-2 text-center">{qty1}</td>
                <td className="border border-black px-3 py-2 text-right">Rp {cost1.toLocaleString("id-ID")}</td>
                <td className="border border-black px-3 py-2 text-right">Rp {amount1.toLocaleString("id-ID")}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-2 text-center">2</td>
                <td className="border border-black px-3 py-2">HUB CLUTCH, RZN - Claim QPR</td>
                <td className="border border-black px-3 py-2 text-center">{qty2}</td>
                <td className="border border-black px-3 py-2 text-right">Rp {cost2.toLocaleString("id-ID")}</td>
                <td className="border border-black px-3 py-2 text-right">Rp {amount2.toLocaleString("id-ID")}</td>
              </tr>
              {/* VAT Row */}
              <tr>
                <td className="border border-black px-3 py-1 text-center"></td>
                <td className="border border-black px-3 py-1 font-bold text-slate-500" colSpan={3}>VAT (PPN 11%)</td>
                <td className="border border-black px-3 py-1 text-right font-bold text-slate-500">Rp {taxVal.toLocaleString("id-ID")}</td>
              </tr>
              {/* Total Row */}
              <tr className="bg-slate-50 font-bold border-t border-black">
                <td className="border border-black px-3 py-2 text-center"></td>
                <td className="border border-black px-3 py-2 text-slate-900 font-extrabold" colSpan={3}>Total Penalti Denda Akhir</td>
                <td className="border border-black px-3 py-2 text-right text-red-650 font-black text-[11px]">Rp {totalAmountVal.toLocaleString("id-ID")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Terms text */}
        <div className="space-y-4 text-[10.5px] leading-relaxed mb-8 font-medium text-slate-700 text-justify">
          <p>
            Based on the data above, we will release a debit note to <strong>{cl.supplierName}</strong> if there is no any confirmation within 5 working days. We are looking forward for your confirmation.
          </p>
          <div className="text-[10px] space-y-1 font-semibold text-slate-500 pt-2 border-t border-slate-100">
            <div><strong>Attachment:</strong></div>
            <div className="font-mono text-[9.5px]">QPR Number: {cl.qprNumber}</div>
          </div>
        </div>

        {/* Signature blocks */}
        <div className="grid grid-cols-2 gap-12 text-[10.5px] leading-relaxed font-bold mt-12">
          {/* MTM side */}
          <div className="flex flex-col min-h-[120px] justify-between">
            <div>
              <span>Yours Faithfully,</span>
              <strong className="block mt-1 text-slate-900">PT Menara Terus Makmur</strong>
              <span className="block text-slate-500 text-[9.5px]">Accounting & Finance Departement</span>
            </div>
            <div>
              <div className="border-b border-black w-40 h-10 flex items-end">
                <span className="font-serif italic text-blue-700 text-sm block ml-1 select-none">Anindita I.</span>
              </div>
              <span className="block text-slate-800 mt-1">Anindita Irmaningtyas</span>
              <span className="block text-slate-400 text-[9px] font-medium">Dep. Head Accounting & Finance</span>
            </div>
          </div>

          {/* Supplier side */}
          <div className="flex flex-col min-h-[120px] justify-between items-end text-right">
            <div className="text-right w-full">
              <span>Approved by,</span>
              <strong className="block mt-1 text-slate-900">PT {cl.supplierName.replace("PT ", "")}</strong>
              <span className="block text-slate-500 text-[9.5px]">Authorized Signature & Stamp</span>
            </div>
            <div className="text-left w-48">
              {cl.status === "APPROVED" ? (
                <div className="relative border-b border-black w-40 h-12 flex flex-col justify-end items-center bg-green-50/20 border-green-300 rounded p-1">
                  <div className="absolute top-1 text-[7px] text-green-700 border border-green-300 bg-green-50 px-1 font-black rounded scale-90 select-none">APPROVED DIGITAL</div>
                  <span className="font-serif italic text-emerald-800 text-[10px] font-black tracking-wider leading-none">PT {cl.supplierName.replace("PT ", "").slice(0,6).toUpperCase()}</span>
                  <span className="text-[7.5px] text-green-600 block leading-none font-bold mt-1 font-mono">checksum: {cl.clNumber.slice(-4)}</span>
                </div>
              ) : (
                <div className="border-b border-dashed border-slate-400 w-40 h-10 flex items-center justify-center bg-slate-50 rounded">
                  <span className="text-[8px] text-slate-400 italic">Waiting Signature...</span>
                </div>
              )}
              <span className="block text-slate-850 mt-1 text-center font-bold">Director / Representative</span>
            </div>
          </div>
        </div>

        {/* Footer print details */}
        <div className="text-center text-[7.5px] text-slate-400 mt-16 pt-3 border-t border-slate-100 select-none">
          Document generated via PT Menara Terus Makmur Portal • PR4-FRM-08103
        </div>

      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cl-print-area, #cl-print-area * { visibility: visible; }
          #cl-print-area { position: fixed; left: 0; top: 0; width: 100%; margin: 0; padding: 24px; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
