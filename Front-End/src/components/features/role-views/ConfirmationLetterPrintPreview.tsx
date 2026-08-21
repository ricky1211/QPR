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
    partName?: string;
  };
  onClose?: () => void;
  inline?: boolean;
}

export default function ConfirmationLetterPrintPreview({ cl, onClose, inline = false }: ClPreviewProps) {
  React.useEffect(() => {
    document.body.classList.add("print-cl-active");
    if (inline) return () => {
      document.body.classList.remove("print-cl-active");
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("print-cl-active");
      document.body.style.overflow = originalOverflow;
    };
  }, [inline]);

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
    if (!dateStr) return "December 2, 2025";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1];
    const year = parts[0];
    return `${month} ${day}, ${year}`;
  };

  const hasCustomItems = cl.items && cl.items.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 overflow-y-auto flex flex-col items-center p-4 print:p-0 print:bg-white print:block">
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

      <div className="pt-16 pb-8 w-full flex justify-center print:pt-0 print:pb-0 print:block">
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
          <div className="mb-6 font-serif">
            Dear Sir/Madam,
          </div>

          <div className="mb-6 font-serif">
            We are writing to officially confirm the financial claim regarding the quality issues identified in your supplied parts. As previously communicated via our Quality Problem Report (QPR), the details of the non-conforming items and their associated costs are detailed below:
          </div>

          {/* Breakdown Table */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-black text-xs font-serif">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-black p-2 text-center font-bold font-serif w-12">No.</th>
                  <th className="border border-black p-2 text-left font-bold font-serif">Part Name / Description</th>
                  <th className="border border-black p-2 text-center font-bold font-serif w-24">QTY NG</th>
                  <th className="border border-black p-2 text-right font-bold font-serif w-32">Unit Price</th>
                  <th className="border border-black p-2 text-right font-bold font-serif w-36">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {hasCustomItems ? (
                  cl.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-black p-2 text-center font-serif">{idx + 1}</td>
                      <td className="border border-black p-2 text-left font-serif">{item.partName}</td>
                      <td className="border border-black p-2 text-center font-serif">{item.billableQty || item.qty || 0} Pcs</td>
                      <td className="border border-black p-2 text-right font-serif">Rp {item.unitPrice?.toLocaleString("id-ID")}</td>
                      <td className="border border-black p-2 text-right font-serif font-bold">Rp {item.amount?.toLocaleString("id-ID")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-black p-2 text-center font-serif">1</td>
                    <td className="border border-black p-2 text-left font-serif">{cl.partName || "CONE RACE ALL TYPE"}</td>
                    <td className="border border-black p-2 text-center font-serif">{cl.reject || 0} Pcs</td>
                    <td className="border border-black p-2 text-right font-serif">-</td>
                    <td className="border border-black p-2 text-right font-serif font-bold">{cl.amount}</td>
                  </tr>
                )}
                {/* Total Row */}
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={4} className="border border-black p-2 text-right font-serif font-bold">Total Claim:</td>
                  <td className="border border-black p-2 text-right font-serif font-black text-red-650">{cl.amount}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-8 leading-relaxed font-serif">
            This claim has been processed in accordance with our quality agreement. The total amount of <strong className="font-serif font-bold text-black">{cl.amount}</strong> will be settled based on the finalized vendor decision. Please sign and return this confirmation letter as an acknowledgment of this agreement.
          </div>

          {/* Signatures Footer */}
          <div className="mt-auto space-y-6 pt-6 font-serif">
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
            margin: 8mm !important;
          }
          html, body {
            height: auto;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body.print-cl-active * { visibility: hidden; }
          body.print-cl-active #cl-print-area, body.print-cl-active #cl-print-area * { visibility: visible; }
          body.print-cl-active #cl-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 194mm !important;
            height: 281mm !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            border: 1px solid #000 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
