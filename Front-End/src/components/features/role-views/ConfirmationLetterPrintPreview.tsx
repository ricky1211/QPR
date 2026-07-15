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
        address: "Jl. Science Timur I Blok A 5H",
        city: "Cikarang Timur, Bekasi, Jawa Barat 17530"
      };
    }
  };

  const supplierInfo = getSupplierAddress(cl.supplierName);

  const formatEnglishDate = (dateStr?: string) => {
    if (!dateStr) return "02 December 2025";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1];
    const year = parts[0];
    return `${day < 10 ? '0' + day : day} ${month} ${year}`;
  };

  // Parse amount for dynamic table calculation
  const totalAmountVal = parseInt(cl.amount?.replace(/[^0-9]/g, "") || "1144283", 10);
  const subtotalVal = Math.round(totalAmountVal / 1.11);
  const taxVal = totalAmountVal - subtotalVal;

  const qtyTotal = cl.reject || 20;
  const qty1 = Math.round(qtyTotal * 0.7) || 14;
  const qty2 = qtyTotal - qty1 || 6;

  const cost1 = Math.round((subtotalVal * 0.67) / qty1) || 49516;
  const cost2 = Math.round((subtotalVal * 0.33) / qty2) || 56277;

  const amount1 = qty1 * cost1;
  const amount2 = subtotalVal - amount1; // ensure exact subtotal sum

  const hasCustomItems = cl.items && cl.items.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 overflow-y-auto flex flex-col items-center p-4">
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

      <div className="pt-16 pb-8 w-full flex justify-center">
        {/* Confirmation Letter PDF Document Layout */}
        <div
          id="cl-print-area"
          className="bg-white shadow-2xl my-4 text-black p-12 text-left"
          style={{
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: "12px",
            width: "210mm",
            minHeight: "297mm",
            padding: "20mm",
            boxSizing: "border-box"
          }}
        >
          {/* Solid line at the top */}
          <div className="border-t-2 border-black mb-8 w-full" />

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold font-serif tracking-normal">
              Confirmation Letter
            </h1>
          </div>

          {/* Date */}
          <div className="text-right text-xs font-serif mb-6 pr-4">
            Cikarang, {formatEnglishDate(cl.dateSent)}
          </div>

          {/* To Address */}
          <div className="space-y-0.5 font-bold text-xs leading-relaxed mb-6 font-serif">
            <div>To:</div>
            <div>{cl.supplierName.toUpperCase().endsWith(", PT.") ? cl.supplierName : `${cl.supplierName}, PT.`}</div>
            <div>{supplierInfo.address}</div>
            <div>{supplierInfo.city}</div>
          </div>

          {/* Greeting and Intro text */}
          <div className="space-y-4 text-xs leading-relaxed mb-6 font-serif text-justify">
            <p>
              According to quality problem report (QPR) that we have checked at Menara Terus Makmur, PT.:
            </p>
            <p>
              We would like to confirm to you that we have agreed if it is found some NG parts which are not caused by our internal process. NG parts and loss can be seen as follows:
            </p>
          </div>

          {/* Parts Table */}
          <div className="mb-6">
            <table className="w-full text-xs text-left border-collapse border border-black font-serif text-black">
              <thead>
                <tr className="border-b border-black text-center font-bold">
                  <th className="border border-black px-2 py-1 w-10 text-center">No</th>
                  <th className="border border-black px-2 py-1 text-center">Description</th>
                  <th className="border border-black px-2 py-1 w-14 text-center">Qty</th>
                  <th className="border border-black px-2 py-1 w-24 text-center">Claim Cost</th>
                  <th className="border border-black px-2 py-1 w-28 text-center">Amount (IDR)</th>
                </tr>
              </thead>
              <tbody>
                {hasCustomItems ? (
                  cl.items.map((item: any, idx: number) => {
                    const totalQty = parseFloat(String(item.totalQty)) || 0;
                    const rejectCount = parseFloat(String(item.rejectCount)) || 0;
                    const allowanceRatio = parseFloat(String(item.allowanceRatio)) || 0;
                    const unitPriceVal = parseFloat(String(item.unitPrice)) || 0;
                    const stdAllowance = Math.round(totalQty * (allowanceRatio / 100));
                    const billableQty = Math.max(0, rejectCount - stdAllowance);
                    const subtotal = billableQty * unitPriceVal;
                    return (
                      <tr key={item.id || idx}>
                        <td className="border border-black px-2 py-1 text-center">{idx + 1}</td>
                        <td className="border border-black px-2 py-1">{item.partName}</td>
                        <td className="border border-black px-2 py-1 text-center font-mono">{billableQty}</td>
                        <td className="border border-black px-2 py-1 text-right font-mono">{unitPriceVal.toLocaleString("en-US")}</td>
                        <td className="border border-black px-2 py-1 text-right font-mono">{subtotal.toLocaleString("en-US")}</td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr>
                      <td className="border border-black px-2 py-1 text-center">1</td>
                      <td className="border border-black px-2 py-1">HUB CLUTCH, IMV 683N</td>
                      <td className="border border-black px-2 py-1 text-center font-mono">{qty1}</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{cost1.toLocaleString("en-US")}</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{amount1.toLocaleString("en-US")}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 text-center">2</td>
                      <td className="border border-black px-2 py-1">HUB CLUTCH, RZN</td>
                      <td className="border border-black px-2 py-1 text-center font-mono">{qty2}</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{cost2.toLocaleString("en-US")}</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{amount2.toLocaleString("en-US")}</td>
                    </tr>
                  </>
                )}
                {/* VAT Row */}
                <tr>
                  <td className="border-l border-t-0 border-b-0 border-black px-2 py-1 text-center"></td>
                  <td className="border-l border-black px-2 py-1" colSpan={3}>VAT</td>
                  <td className="border border-black px-2 py-1 text-right font-mono">{taxVal.toLocaleString("en-US")}</td>
                </tr>
                {/* Total Row */}
                <tr className="font-bold">
                  <td className="border-l border-t-0 border-b border-black px-2 py-1 text-center"></td>
                  <td className="border-l border-b border-black px-2 py-1" colSpan={3}>Total</td>
                  <td className="border border-black px-2 py-1 text-right font-mono">{totalAmountVal.toLocaleString("en-US")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms text */}
          <div className="space-y-4 text-xs leading-relaxed mb-6 font-serif text-justify">
            <p>
              Based on the data above, we will release a debit note to {cl.supplierName.toUpperCase().endsWith(", PT.") ? cl.supplierName : `${cl.supplierName}, PT.`} if there is no any confirmation within 5 working days. We are looking forward for your confirmation
            </p>
            <div className="space-y-1 pt-2">
              <div>Attachment :</div>
              <div className="font-bold">QPR Number : {cl.qprNumber}</div>
            </div>
          </div>

          {/* Signature blocks */}
          <div className="flex justify-between text-xs leading-relaxed font-bold mt-12 font-serif">
            {/* MTM side */}
            <div className="flex flex-col min-h-[140px] justify-between">
              <div>
                <span>Yours Faithfully,</span>
                <strong className="block mt-1">MenaraTerusMakmur, PT</strong>
                <span className="block font-normal">Accounting & Finance Departement</span>
              </div>
              <div className="pt-6">
                <span className="block underline font-bold">Anindita Irnilaningtyas</span>
                <span className="block font-normal text-slate-550 text-[11px]">Dep. Head Accounting & Finance</span>
              </div>
            </div>

            {/* Approved side */}
            <div className="flex flex-col min-h-[140px] justify-between items-end text-right pr-6">
              <div className="w-full text-right">
                <span className="font-bold">Approved</span>
              </div>
              <div className="text-left w-40">
                <div className="border-b border-dashed border-slate-400 w-36 h-12 flex items-center justify-center bg-slate-50 rounded">
                  <span className="text-[9px] text-slate-400 italic">Representative Signature</span>
                </div>
                <span className="block mt-1 font-bold text-center w-36">Representative</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            height: 100%;
            overflow: hidden;
          }
          body * { visibility: hidden; }
          #cl-print-area, #cl-print-area * { visibility: visible; }
          #cl-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 20mm !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
