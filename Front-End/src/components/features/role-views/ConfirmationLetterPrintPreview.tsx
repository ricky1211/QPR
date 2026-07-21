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
    items?: any[];
    clApprovalProgress?: { sectAccounting?: boolean; deptAccounting?: boolean };
  };
  onClose?: () => void;
  inline?: boolean;
}

export default function ConfirmationLetterPrintPreview({ cl, onClose, inline = false }: ClPreviewProps) {
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
          Batal
        </button>
      </div>

      <div className="pt-16 pb-8 w-full flex justify-center">
        {/* Confirmation Letter PDF Document Layout */}
        <div
          id="cl-print-area"
          className={`bg-white mx-auto ${inline ? "w-full shadow-sm" : "shadow-2xl my-4 text-black border border-black"}`}
          style={{
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: "12px",
            width: inline ? "100%" : "210mm",
            minHeight: inline ? "auto" : "297mm",
            padding: inline ? "8px" : "20mm",
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
                    const rejectCount = parseFloat(String(item.qtyNG ?? item.rejectCount)) || 0;
                    const allowanceRatio = parseFloat(String(item.allowanceRatio ?? item.stdAllowance)) || 0;
                    const billableQty = item.qtyClaim ?? item.qty ?? item.billableQty ?? Math.max(0, rejectCount - Math.round(totalQty * (allowanceRatio / 100)));
                    const unitPriceVal = parseFloat(String(item.unitPrice ?? item.claimCost)) || 0;
                    const subtotal = item.amount ?? item.subtotal ?? (billableQty * unitPriceVal);

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

          {/* Signature & Approval blocks */}
          <div className="mt-10 font-serif text-[12px] relative" style={{ minHeight: "155px" }}>
            <div className="flex justify-between items-start">
              {/* Yours Faithfully signature block (Left) */}
              <div className="space-y-1 w-full relative">
                <span className="block">Yours Faithfully,</span>
                <strong className="block font-serif font-bold text-black mt-1">MenaraTerusMakmur, PT</strong>
                <div className="flex items-center justify-between text-slate-700 text-[11px] w-full">
                  <span>Accounting &amp; Finance Departement</span>
                  {(cl.clApprovalProgress?.deptAccounting || cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID") && (
                    <div className="font-serif text-black flex items-center gap-14 text-[12px] pr-10">
                      <span className="italic font-normal font-serif text-[13px] lowercase">p</span>
                      <span className="font-bold text-[12px] text-[#0f766e]">Approved</span>
                    </div>
                  )}
                </div>
                
                {/* Space for signature */}
                <div style={{ height: "45px" }} />

                {/* Person details */}
                <div className="pt-2">
                  <span className="underline font-bold block text-[13px] text-black">Anindita Imilaningtyas</span>
                  <span className="block text-[11px] text-slate-700 font-normal">Dep. Head Accounting &amp; Finance</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm !important;
          }
          html, body {
            height: auto;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * { visibility: hidden; }
          #cl-print-area, #cl-print-area * { visibility: visible; }
          #cl-print-area {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 198mm !important;
            height: 285mm !important;
            min-height: 0 !important;
            margin: 0 auto !important;
            padding: 6mm !important;
            border: 1px solid #000 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            transform: scale(0.83) !important;
            transform-origin: top center !important;
          }
        }
      `}</style>
    </div>
  );
}
