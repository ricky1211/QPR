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
            padding: inline ? "8px" : "0px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box"
          }}
        >


          {/* PT Menara Terus Makmur Logo and Certificates Header */}
          <div className="w-full px-[10mm] pt-[6mm] pb-3 border-b-[3px] border-black mb-6 font-sans">
            <div className="flex justify-between items-center">
              {/* Left: MTM Logo Area */}
              <div className="flex items-center">
                <img src="/qpr/logo-mtm.png" alt="PT MTM Logo" style={{ height: "38px", objectFit: "contain", display: "block" }} />
              </div>

              {/* Right: Certificates Sticker */}
              <div className="flex items-center">
                <img src="/qpr/stiker.png" alt="TUV SUD Certificates" style={{ height: "72px", objectFit: "contain", display: "block" }} />
              </div>
            </div>
          </div>

          {/* Document Content Wrapper with proper standard letter margins */}
          <div className="flex-1 flex flex-col justify-start px-[20mm] py-2 text-xs font-serif leading-relaxed text-justify">

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
                        <td className="border border-black px-2.5 py-1.5 font-bold text-slate-900" style={{ wordBreak: "break-word", whiteSpace: "normal", lineHeight: "1.35" }}>{item.partName}</td>
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
          <div className="mt-10 font-serif text-[12px]">
            {/* Header row: Yours Faithfully */}
            <span className="block">Yours Faithfully,</span>
            <strong className="block font-serif font-bold text-black mt-1">MenaraTerusMakmur, PT</strong>
            <span className="block text-slate-700 text-[11px] mt-0.5">Accounting &amp; Finance Departement</span>

            {/* Two-column signature row */}
            <div className="flex justify-between items-end mt-2">

              {/* LEFT: TTD + Anindita */}
              <div>
                {/* Signature image */}
                <div style={{ height: "70px", position: "relative" }}>
                  {(cl.clApprovalProgress?.deptAccounting || cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID") && (
                    <img
                      src="/qpr/TTD-Anindita.jpeg"
                      alt="TTD Anindita"
                      style={{ height: "68px", objectFit: "contain", position: "absolute", bottom: 0, left: 0 }}
                    />
                  )}
                </div>
                <div className="pt-0">
                  <span className="underline font-bold block text-[13px] text-black">Anindita Imilaningtyas</span>
                  <span className="block text-[11px] text-slate-700 font-normal">Dep. Head Accounting &amp; Finance</span>
                </div>
              </div>

              {/* RIGHT: Approved + Vendor — only when approved */}
              {(cl.clApprovalProgress?.deptAccounting || cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID") && (
                <div className="flex flex-col items-end pr-10">
                  <span className="font-bold text-[12px] text-[#0f766e] mb-1">Approved</span>
                  {/* spacer matching signature height */}
                  <div style={{ height: "70px" }} />
                  <span className="underline font-bold block text-[13px] text-black text-right">{cl.supplierName}</span>
                  <span className="block text-[11px] text-slate-700 font-normal">Vendor</span>
                </div>
              )}

            </div>
          </div>
          </div>

          {/* PT Menara Terus Makmur Footer */}
          <div className="w-full px-[10mm] pb-[6mm] pt-3 border-t-[3px] border-black mt-auto text-center text-[10px] text-slate-700 font-sans font-bold leading-normal">
            <div>PT Menara Terus Makmur - Manufacturer : Forging Parts, Mechanical Jacks, Hand Tools &amp; Machining Parts</div>
            <div className="text-[9px] font-semibold text-slate-500 mt-0.5">
              Jl. Jababeka XI Blok H.3 - 12 Kawasan Industri Jababeka, Cikarang Utara, Kabupaten Bekasi, Jawa Barat - Indonesia 17530 / Telp. : +62-21-8934504 (Hunting) Fax. : +62-21-8934505
            </div>
            {/* Bottom Blue Bar */}
            <div className="w-full h-[6px] bg-[#002060] mt-3" />
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
            padding: 0mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
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
