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
    supplierAddress?: string;
    supplierCity?: string;
    approvedBy?: string[];
    vendorApproved?: boolean;
    requiredRole?: string;
    [key: string]: any;
  };
  onClose?: () => void;
  inline?: boolean;
}

export default function ConfirmationLetterPrintPreview({ cl, onClose, inline = false }: ClPreviewProps) {
  React.useEffect(() => {
    document.body.classList.add("print-cl-active");
    if (inline) {
      return () => {
        document.body.classList.remove("print-cl-active");
        document.body.style.overflow = "unset";
      };
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("print-cl-active");
      document.body.style.overflow = "unset";
    };
  }, [inline]);

  const handlePrint = () => {
    window.print();
  };

  const getSupplierAddress = (name: string) => {
    return {
      address: cl.supplierAddress || "Kawasan Industri MM2100 Blok C",
      city: cl.supplierCity || "Cikarang Barat, Bekasi, Jawa Barat 17530"
    };
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

  const documentContent = (
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
      <div className="flex-grow p-[15mm] flex flex-col justify-between print:p-[0mm]">
        <div>
          {/* Header Image */}
          <div className="flex flex-col items-center border-b-[3px] border-black pb-3">
            <div className="w-full flex justify-between items-center">
              <img
                src="/qpr/logo-mtm.png"
                alt="MTM Logo"
                className="h-[38px] w-auto object-contain"
              />
              <img
                src="/qpr/stiker.png"
                alt="TUV Certifications"
                className="h-[42px] w-auto object-contain"
              />
            </div>
          </div>

          <div className="mt-10 mb-6 text-center">
            <h1 className="font-serif font-bold text-[22px] tracking-wide uppercase text-black">Confirmation Letter</h1>
          </div>

          <div className="text-right font-serif mb-6 text-slate-800">
            Cikarang, {formatEnglishDate(cl.dateSent)}
          </div>

          <div className="mb-6 font-serif leading-relaxed text-slate-850">
            <div className="font-black text-black">To:</div>
            <div className="font-black text-black text-[13px] uppercase">{cl.supplierName}</div>
            <div>{supplierInfo.address}</div>
            <div>{supplierInfo.city}</div>
          </div>

          <div className="mb-5 font-serif leading-relaxed">
            Dear Sir/Madam,
          </div>

          <div className="mb-6 leading-relaxed text-justify font-serif text-slate-800">
            We are writing to officially confirm the financial claim regarding the quality issues identified in your supplied parts. As previously communicated via our Quality Problem Report (QPR), the details of the non-conforming items and their associated costs are detailed below:
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-black font-serif text-[11px]">
              <thead>
                <tr className="bg-slate-100/80 font-bold text-center">
                  <th className="border border-black p-2 w-[5%] font-serif font-bold">No.</th>
                  <th className="border border-black p-2 w-[40%] font-serif font-bold">Part Name / Description</th>
                  <th className="border border-black p-2 w-[15%] font-serif font-bold">QTY Claim</th>
                  <th className="border border-black p-2 w-[20%] font-serif font-bold">Unit Price</th>
                  <th className="border border-black p-2 w-[20%] font-serif font-bold">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {cl.items && cl.items.length > 0 ? (
                  cl.items.map((item, idx) => {
                    const qtyVal = item.qtyClaim ?? item.billableQty ?? item.qtyNG ?? item.qty ?? item.qtyNg ?? 0;
                    const priceVal = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : (item.unitPrice || 0);
                    const amountVal = item.amount ?? item.subtotal ?? (qtyVal * priceVal);
                    return (
                      <tr key={idx} className="text-center">
                        <td className="border border-black p-2">{idx + 1}</td>
                        <td className="border border-black p-2 text-left font-semibold">{item.partName || item.description || "Part NG"}</td>
                        <td className="border border-black p-2 text-center" style={{ whiteSpace: "nowrap" }}>{qtyVal.toLocaleString("id-ID")} Pcs</td>
                        <td className="border border-black p-2 text-center" style={{ whiteSpace: "nowrap" }}>{priceVal ? `Rp ${priceVal.toLocaleString("id-ID")}` : "-"}</td>
                        <td className="border border-black p-2 text-right font-bold" style={{ whiteSpace: "nowrap" }}>{amountVal ? `Rp ${amountVal.toLocaleString("id-ID")}` : "-"}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="text-center">
                    <td className="border border-black p-2">1</td>
                    <td className="border border-black p-2 text-left font-semibold">{cl.partName || "Part Material NG"}</td>
                    <td className="border border-black p-2 text-center" style={{ whiteSpace: "nowrap" }}>{cl.qty || 0} Pcs</td>
                    <td className="border border-black p-2 text-center">-</td>
                    <td className="border border-black p-2 text-right font-bold" style={{ whiteSpace: "nowrap" }}>{cl.amount}</td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={4} className="border border-black p-2 text-right font-serif font-bold">Total Claim:</td>
                  <td className="border border-black p-2 text-right font-serif font-black" style={{ whiteSpace: "nowrap" }}>{cl.amount}</td>
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
            {(() => {
              const isDraft = cl.status === "DRAFT";
              const isAccountingApproved = !isDraft && (
                cl.status === "FULLY_APPROVED" ||
                cl.status === "APPROVED_BY_VENDOR" ||
                cl.status === "CLOSED_PAID" ||
                !!cl.clApprovalProgress?.deptAccounting ||
                (Array.isArray(cl.approvedBy) && cl.approvedBy.includes("Accounting"))
              );

              const isVendorApproved = !isDraft && (
                cl.status === "APPROVED_BY_VENDOR" ||
                cl.status === "CLOSED_PAID" ||
                !!cl.vendorApproved ||
                (Array.isArray(cl.approvedBy) && cl.approvedBy.includes("Vendor"))
              );

              return (
                <div className="flex justify-between items-end mt-2">
                  {/* LEFT: TTD + Anindita */}
                  <div>
                    <div style={{ height: "70px", position: "relative" }} className="flex items-end">
                      {isAccountingApproved ? (
                        <img
                          src="/qpr/TTD-Anindita.jpeg"
                          alt="TTD Anindita"
                          style={{ height: "68px", objectFit: "contain", position: "absolute", bottom: 0, left: 0 }}
                          onError={(e) => {
                            if (!e.currentTarget.src.includes("/qpr/")) {
                              e.currentTarget.src = "/qpr/TTD-Anindita.jpeg";
                            } else {
                              e.currentTarget.src = "/TTD-Anindita.jpeg";
                            }
                          }}
                        />
                      ) : (
                        <span className="text-slate-400 italic text-[11px] font-sans block pb-2">(Pending Approval)</span>
                      )}
                    </div>
                    <div className="pt-0">
                      <span className="underline font-bold block text-[13px] text-black">Anindita Imilaningtyas</span>
                      <span className="block text-[11px] text-slate-700 font-normal">Dep. Head Accounting &amp; Finance</span>
                    </div>
                  </div>

                  {/* RIGHT: Approved + Vendor */}
                  <div className="flex flex-col items-end pr-10">
                    {isVendorApproved ? (
                      <span className="font-bold text-[12px] text-[#0f766e] mb-1">Approved</span>
                    ) : (
                      <span className="font-semibold text-[11px] text-amber-600 mb-1 italic">(Pending Vendor Approval)</span>
                    )}
                    <div style={{ height: "70px" }} />
                    <span className="underline font-bold block text-[13px] text-black text-right">{cl.supplierName}</span>
                    <span className="block text-[11px] text-slate-700 font-normal">Vendor</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* PT Menara Terus Makmur Footer */}
        <div className="w-full px-[10mm] pb-[6mm] pt-3 border-t-[3px] border-black mt-auto text-center text-[10px] text-slate-700 font-sans font-bold leading-normal">
          <div>PT Menara Terus Makmur - Manufacturer : Forging Parts, Mechanical Jacks, Hand Tools &amp; Machining Parts</div>
          <div className="text-[9px] font-semibold text-slate-500 mt-0.5">
            Jl. Jababeka XI Blok H.3 - 12 Kawasan Industri Jababeka, Cikarang Utara, Kabupaten Bekasi, Jawa Barat - Indonesia 17530 / Telp. : +62-21-8934504 (Hunting) Fax. : +62-21-8934505
          </div>
        </div>

      </div>
    </div>
  );

  if (inline) {
    return documentContent;
  }

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
        {documentContent}
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
