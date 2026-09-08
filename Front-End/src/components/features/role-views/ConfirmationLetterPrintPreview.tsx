"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer, FileText, CheckCircle2, Layers } from "lucide-react";
import QprPrintPreview from "./QprPrintPreview";
import { qprService, mapQprFromDb } from "@/services/qprService";

interface ClPreviewProps {
  cl: {
    clNumber: string;
    qprNumber: string;
    qprNumbers?: string[] | string;
    selectedQprNumbers?: string[] | string;
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
    qprAttachment?: any;
    qprSourceData?: any;
    qpr?: any;
    [key: string]: any;
  };
  onClose?: () => void;
  inline?: boolean;
}

export default function ConfirmationLetterPrintPreview({ cl, onClose, inline = false }: ClPreviewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "cl" | "qpr">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (inline) return;
    document.body.classList.add("print-cl-active");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("print-cl-active");
      document.body.style.overflow = "unset";
    };
  }, [inline]);

  const handlePrint = () => {
    // Set data attribute on print container before printing so CSS can target correct pages
    const printArea = document.getElementById("cl-print-area");
    if (printArea) {
      printArea.setAttribute("data-active-tab", activeTab);
    }
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const getSupplierAddress = (name: string) => {
    return {
      address: cl.supplierAddress || "Jl. Science Timur I Blok A 5H",
      city: cl.supplierCity || "Cikarang Timur, Bekasi, Jawa Barat 17530"
    };
  };

  const supplierInfo = getSupplierAddress(cl.supplierName);

  // Helper to format supplier name with trailing ", PT." as per standard automotive business letter format
  const formatSupplierForLetter = (name?: string) => {
    if (!name) return "Anugerah Daya Industri Komponen Utama, PT.";
    let clean = name.trim();
    if (/^PT\.?\s+/i.test(clean)) {
      clean = clean.replace(/^PT\.?\s+/i, "").trim() + ", PT.";
    } else if (!clean.endsWith(", PT.") && !clean.endsWith(", PT")) {
      clean = `${clean}, PT.`;
    }
    return clean;
  };

  // Helper to resolve all QPR number(s) attached to this Confirmation Letter based on form selection & data
  const getAttachedQprNumbers = () => {
    if (cl.qprNumbers && Array.isArray(cl.qprNumbers) && cl.qprNumbers.length > 0) {
      return cl.qprNumbers.join(", ");
    }
    if (typeof cl.qprNumbers === "string" && cl.qprNumbers.trim()) {
      return cl.qprNumbers;
    }
    if (cl.selectedQprNumbers && Array.isArray(cl.selectedQprNumbers) && cl.selectedQprNumbers.length > 0) {
      return cl.selectedQprNumbers.join(", ");
    }
    if (cl.items && Array.isArray(cl.items) && cl.items.length > 0) {
      const uniqueQprs = Array.from(new Set(cl.items.map((it: any) => it.qprNumber).filter(Boolean)));
      if (uniqueQprs.length > 0) {
        return uniqueQprs.join(", ");
      }
    }
    if (cl.qprNumber && cl.qprNumber.trim()) {
      return cl.qprNumber;
    }
    if (cl.qprAttachment?.qprNumber) {
      return cl.qprAttachment.qprNumber;
    }
    if (cl.qprSourceData?.qprNumber) {
      return cl.qprSourceData.qprNumber;
    }
    return "004/QI/QPR/SUB/11/25, 009/QI/QPR/SUB/11/25, 014/QI/QPR/SUB/11/25";
  };

  const attachedQprNumbers = getAttachedQprNumbers();

  const formatEnglishDate = (dateStr?: string) => {
    if (!dateStr) return "07 September 2026";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const day = String(parseInt(parts[2], 10)).padStart(2, "0");
    const month = months[parseInt(parts[1], 10) - 1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  };

  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return "07 SEPTEMBER 2026";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr.toUpperCase();
    const months = [
      "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
      "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
    ];
    const day = String(parseInt(parts[2], 10)).padStart(2, "0");
    const month = months[parseInt(parts[1], 10) - 1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  };

  // Calculate Subtotal (DPP), Pajak PPN (11%), and Total
  const calculateFinancials = () => {
    let subtotalVal = 0;
    if (cl.items && cl.items.length > 0) {
      cl.items.forEach((item) => {
        const qtyVal = item.qtyClaim ?? item.billableQty ?? item.qtyNG ?? item.qty ?? item.qtyNg ?? 0;
        const priceVal = typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : (item.unitPrice || 0);
        const amountVal = item.amount ?? item.subtotal ?? (qtyVal * priceVal);
        subtotalVal += (amountVal || 0);
      });
    }
    
    // Parse total from cl.amount if available
    const rawTotalStr = String(cl.amount || "0").replace(/[^0-9]/g, "");
    const totalFromStr = parseInt(rawTotalStr, 10) || 0;

    let dpp = subtotalVal;
    let tax = 0;
    let total = 0;

    if (dpp > 0) {
      tax = Math.round(dpp * 0.11);
      total = dpp + tax;
      if (totalFromStr > 0 && Math.abs(totalFromStr - total) <= 2) {
        total = totalFromStr;
      }
    } else if (totalFromStr > 0) {
      dpp = Math.round(totalFromStr / 1.11);
      tax = totalFromStr - dpp;
      total = totalFromStr;
    }

    return {
      dppFormatted: dpp > 0 ? dpp.toLocaleString("id-ID") : "-",
      taxFormatted: tax > 0 ? tax.toLocaleString("id-ID") : "-",
      totalFormatted: total > 0 ? total.toLocaleString("id-ID") : (cl.amount || "-")
    };
  };

  const { dppFormatted, taxFormatted, totalFormatted } = calculateFinancials();

  // Live fetched QPR data from database / service
  const [liveQpr, setLiveQpr] = useState<any | null>(null);

  useEffect(() => {
    // If full explicit QPR attachment is already attached in props, use it
    if (cl.qprAttachment && cl.qprAttachment.parts && cl.qprAttachment.parts.length > 0) {
      setLiveQpr(cl.qprAttachment);
      return;
    }

    const targetQprNum = attachedQprNumbers.split(",")[0]?.trim();
    if (cl.qprId) {
      qprService.getById(cl.qprId)
        .then((dbQpr) => {
          if (dbQpr) {
            setLiveQpr(mapQprFromDb(dbQpr));
          }
        })
        .catch(() => {});
    } else if (targetQprNum) {
      qprService.getAll()
        .then((allQprs) => {
          if (Array.isArray(allQprs)) {
            const match = allQprs.find((q: any) => 
              q.qprNumber === targetQprNum || 
              q.docNumber === targetQprNum ||
              (q.id && q.id === cl.qprId)
            );
            if (match) {
              setLiveQpr(mapQprFromDb(match));
            }
          }
        })
        .catch(() => {});
    }
  }, [cl.qprId, cl.qprAttachment, attachedQprNumbers]);

  // Extract or build QPR attachment data
  const baseQpr = liveQpr || cl.qprAttachment || cl.qprSourceData || cl.qpr || {};

  const qprParts = (baseQpr.parts && Array.isArray(baseQpr.parts) && baseQpr.parts.length > 0)
    ? baseQpr.parts
    : (cl.items && cl.items.length > 0 ? cl.items.map((it: any, idx: number) => ({
        no: idx + 1,
        partName: it.partName || it.description || it.partDesc || "ALL TYPE PART FINISH",
        partNumber: it.partNumber || "IT-650",
        totalQty: it.totalQty || 1000,
        qtyNG: it.qtyNg !== undefined ? it.qtyNg : (it.qtyNG !== undefined ? it.qtyNG : (it.qty || 25)),
        stdAllowance: it.stdAllowance !== undefined ? it.stdAllowance : 0,
        ngActual: it.ngActual !== undefined ? it.ngActual : (it.totalQty > 0 ? ((it.qtyNg || it.qty || 25) / it.totalQty) * 100 : 2.5),
        qtyClaim: it.qtyClaim !== undefined ? it.qtyClaim : (it.billableQty || it.qtyNg || it.qty || 25)
      })) : [
        {
          no: 1,
          partName: cl.partName || baseQpr.partName || "ALL TYPE PART FINISH",
          partNumber: cl.partNumber || baseQpr.partNumber || "IT-650",
          totalQty: 1000,
          qtyNG: cl.qty || 25,
          stdAllowance: 0,
          ngActual: 2.5,
          qtyClaim: cl.qty || 25
        }
      ]);

  const claimTypes = Array.isArray(baseQpr.claimType) 
    ? baseQpr.claimType 
    : (typeof baseQpr.claimType === "string" ? [baseQpr.claimType] : (Array.isArray(cl.claimType) ? cl.claimType : ["MATERIAL", "PROSES M/C"]));

  // Prepared full approved QPR data object strictly identical to official QPR module
  const preparedQprObject = {
    ...baseQpr,
    qprNumber: baseQpr.qprNumber || attachedQprNumbers.split(",")[0]?.trim() || "05/QI/QPR/SUB/09/26",
    supplierName: baseQpr.supplierName || cl.supplierName || "PT TEMARU ENGINEERING INDONESIA",
    period: baseQpr.period || cl.period || "09/2026",
    date: baseQpr.date || cl.dateSent || "2026-09-07",
    refNcrNumber: baseQpr.refNcrNumber || cl.refNcrNumber || "NCR/2026/09/005",
    problem: baseQpr.problem || cl.problem || "Dimensi out of tolerance pada bagian komponen yang diverifikasi.",
    claimType: claimTypes,
    parts: qprParts,
    remarks: baseQpr.remarks || cl.remarks || "Komponen non-conforming telah diverifikasi oleh QA Dept. Sesuai keputusan claim, penyesuaian biaya dibebankan pada Confirmation Letter terlampir.",
    totalItems: baseQpr.totalItems || (cl.qty || 25) * 100,
    rejectItems: baseQpr.rejectItems || cl.qty || 25,
    allowanceRatio: baseQpr.allowanceRatio || "0.5%",
    claimAmount: baseQpr.claimAmount || cl.amount || totalFormatted || "-",
    status: "APPROVED",
    requiredRole: "Closed",
    approvedBy: ["Creator", "Section Head", "Dept Head", "Div Head", "Purchasing"],
    approvalProgress: {
      approvedAtSectionHead: true,
      approvedAtDeptHead: true,
      approvedAtDivHead: true,
      approvedAtPurchasing: true,
      checksumSectionHead: "OK",
      checksumDeptHead: "OK",
      checksumDivHead: "OK",
      checksumPurchasing: "OK",
      ...(baseQpr.approvalProgress || {})
    },
    pdfFiles: baseQpr.pdfFiles || cl.pdfFiles,
    pdfFileName: baseQpr.pdfFileName || cl.pdfFileName,
    pdfFileBase64: baseQpr.pdfFileBase64 || cl.pdfFileBase64
  };

  /* =========================================================
     PAGE 1: CONFIRMATION LETTER SHEET (DEEP BLACK TIMES NEW ROMAN)
     ========================================================= */
  const clSheetContent = (
    <div
      id={inline ? "cl-sheet-inline-1" : "cl-sheet-page-1"}
      className="bg-white mx-auto text-black border-2 border-black shadow-md"
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "12px",
        color: "#000000",
        width: "210mm",
        minHeight: "297mm",
        padding: "0px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        pageBreakInside: "avoid",
        breakInside: "avoid",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "geometricPrecision"
      }}
    >
      <div className="flex-grow p-[8mm_12mm_4mm_12mm] print:p-[2mm_4mm_2mm_4mm] flex flex-col justify-between h-full">
        <div>
          {/* Header Image */}
          <div className="flex flex-col items-center pb-1">
            <div className="w-full flex justify-between items-center">
              <img
                src="/qpr/logo-mtm.png"
                alt="MTM Logo"
                className="h-[26px] w-auto object-contain"
              />
              <img
                src="/qpr/stiker.png"
                alt="TUV Certifications"
                className="h-[26px] w-auto object-contain"
              />
            </div>
            {/* Garis Pembatas Header Logo */}
            <div 
              style={{ 
                borderBottom: "2px solid #000000",
                width: "100%",
                marginTop: "8px",
                marginBottom: "2px"
              }} 
            />
          </div>

          {/* Title */}
          <div className="mt-2 mb-2 text-center">
            <h1 
              style={{ 
                fontFamily: '"Times New Roman", Times, serif',
                color: "#000000",
                fontSize: "18px",
                fontWeight: "900",
                letterSpacing: "0.5px"
              }} 
              className="uppercase"
            >
              CONFIRMATION LETTER
            </h1>
          </div>

          {/* Date */}
          <div 
            style={{ 
              fontFamily: '"Times New Roman", Times, serif',
              color: "#000000",
              fontSize: "12px",
              fontWeight: "600"
            }} 
            className="text-right mb-2"
          >
            Cikarang, {formatEnglishDate(cl.dateSent)}
          </div>

          {/* Recipient */}
          <div 
            style={{ 
              fontFamily: '"Times New Roman", Times, serif',
              color: "#000000",
              fontSize: "12px",
              lineHeight: "1.35"
            }} 
            className="mb-3 font-semibold"
          >
            <div style={{ fontWeight: "800" }}>To:</div>
            <div style={{ fontWeight: "800" }}>{formatSupplierForLetter(cl.supplierName)}</div>
            <div style={{ fontWeight: "600" }}>{supplierInfo.address}</div>
            <div style={{ fontWeight: "600" }}>{supplierInfo.city}</div>
          </div>

          {/* Opening Paragraph matching user requirement */}
          <div 
            style={{ 
              fontFamily: '"Times New Roman", Times, serif',
              color: "#000000",
              fontSize: "12px",
              fontWeight: "500",
              lineHeight: "1.4"
            }} 
            className="mb-3 text-justify space-y-1.5"
          >
            <p>According to quality problem report (QPR) that we have checked at Menara Terus Makmur, PT.:</p>
            <p>We would like to confirm to you that we have agreed if it is found some NG parts which are not caused by our internal process. NG parts and loss can be seen as follows:</p>
          </div>

          {/* Items Table */}
          <div className="mb-3">
            <table 
              style={{ 
                fontFamily: '"Times New Roman", Times, serif',
                color: "#000000",
                border: "2px solid #000000"
              }} 
              className="w-full border-collapse text-[11.5px]"
            >
              <thead>
                <tr className="text-center" style={{ backgroundColor: "#edf2f7", color: "#000000" }}>
                  <th style={{ border: "1.5px solid #000000", padding: "5px 4px", fontWeight: "900", width: "8%" }}>No</th>
                  <th style={{ border: "1.5px solid #000000", padding: "5px 8px", fontWeight: "900", width: "44%", textAlign: "center" }}>Description</th>
                  <th style={{ border: "1.5px solid #000000", padding: "5px 4px", fontWeight: "900", width: "12%", textAlign: "center" }}>Qty</th>
                  <th style={{ border: "1.5px solid #000000", padding: "5px 4px", fontWeight: "900", width: "16%", textAlign: "center" }}>Claim Cost</th>
                  <th style={{ border: "1.5px solid #000000", padding: "5px 8px", fontWeight: "900", width: "20%", textAlign: "center" }}>Amount (IDR)</th>
                </tr>
              </thead>
              <tbody>
                {cl.items && cl.items.length > 0 ? (
                  cl.items.map((item, idx) => {
                    const qtyVal = item.qtyClaim ?? item.billableQty ?? item.qtyNG ?? item.qty ?? item.qtyNg ?? 0;
                    const priceVal = typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : (item.unitPrice || 0);
                    const amountVal = item.amount ?? item.subtotal ?? (qtyVal * priceVal);
                    return (
                      <tr key={idx} className="text-center" style={{ color: "#000000", fontWeight: "600" }}>
                        <td style={{ border: "1.5px solid #000000", padding: "5px 4px", textAlign: "center" }}>{idx + 1}</td>
                        <td style={{ border: "1.5px solid #000000", padding: "5px 8px", textAlign: "left", fontWeight: "700" }}>{item.partName || item.description || "INNER TUBE,650 A"}</td>
                        <td style={{ border: "1.5px solid #000000", padding: "5px 4px", textAlign: "center", whiteSpace: "nowrap" }}>{qtyVal.toLocaleString("id-ID")}</td>
                        <td style={{ border: "1.5px solid #000000", padding: "5px 4px", textAlign: "center", whiteSpace: "nowrap" }}>{priceVal ? priceVal.toLocaleString("id-ID") : "-"}</td>
                        <td style={{ border: "1.5px solid #000000", padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap", fontWeight: "700" }}>{amountVal ? amountVal.toLocaleString("id-ID") : "-"}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="text-center" style={{ color: "#000000", fontWeight: "600" }}>
                    <td style={{ border: "1.5px solid #000000", padding: "5px 4px" }}>1</td>
                    <td style={{ border: "1.5px solid #000000", padding: "5px 8px", textAlign: "left", fontWeight: "700" }}>{cl.partName || "INNER TUBE,650 A"}</td>
                    <td style={{ border: "1.5px solid #000000", padding: "5px 4px", textAlign: "center", whiteSpace: "nowrap" }}>{(cl.qty || 25).toLocaleString("id-ID")}</td>
                    <td style={{ border: "1.5px solid #000000", padding: "5px 4px", textAlign: "center", whiteSpace: "nowrap" }}>85,000</td>
                    <td style={{ border: "1.5px solid #000000", padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap", fontWeight: "700" }}>{dppFormatted !== "-" ? dppFormatted : "2,125,000"}</td>
                  </tr>
                )}
                {/* VAT Row */}
                <tr style={{ color: "#000000", fontWeight: "700" }}>
                  <td style={{ border: "1.5px solid #000000", padding: "5px 4px" }}></td>
                  <td colSpan={3} style={{ border: "1.5px solid #000000", padding: "5px 8px", textAlign: "left", fontWeight: "800" }}>VAT</td>
                  <td style={{ border: "1.5px solid #000000", padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{taxFormatted !== "-" ? taxFormatted : "233,750"}</td>
                </tr>
                {/* Total Row with double underline effect */}
                <tr style={{ color: "#000000", fontWeight: "900" }}>
                  <td style={{ border: "1.5px solid #000000", padding: "5px 4px" }}></td>
                  <td colSpan={3} style={{ border: "1.5px solid #000000", padding: "5px 8px", textAlign: "left", fontWeight: "900" }}>Total</td>
                  <td style={{ border: "1.5px solid #000000", padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap", borderBottom: "3.5px double #000000", fontWeight: "900" }}>{totalFormatted !== "-" ? totalFormatted : "2,358,750"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Official Description & Attachment Reference matching requested layout */}
          <div 
            style={{ 
              fontFamily: '"Times New Roman", Times, serif',
              color: "#000000",
              fontSize: "12px",
              fontWeight: "500",
              lineHeight: "1.4"
            }} 
            className="mb-3 text-black"
          >
            <p className="text-justify mb-2">
              Based on the data above, we will proceed with deducting the amount directly from the payment to {formatSupplierForLetter(cl.supplierName)} if we do not receive any confirmation within 10 (ten) working days. We look forward to your confirmation.
            </p>
            
            <div className="mt-2" style={{ fontWeight: "700" }}>
              <div className="mb-0.5">Attachment :</div>
              <div style={{ fontWeight: "900" }}>
                QPR Number : {attachedQprNumbers}
              </div>
            </div>
          </div>

          {/* Signatures Footer */}
          <div 
            style={{ 
              fontFamily: '"Times New Roman", Times, serif',
              color: "#000000",
              fontSize: "12px",
              fontWeight: "600"
            }} 
            className="mt-auto space-y-3 pt-2"
          >
            <span className="block" style={{ fontWeight: "600" }}>Yours Faithfully,</span>
            <strong className="block text-black mt-0.5" style={{ fontSize: "13px", fontWeight: "900" }}>MenaraTerusMakmur, PT</strong>
            <span className="block text-black text-[11px] mt-0.5" style={{ fontWeight: "600" }}>Accounting &amp; Finance Departement</span>

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
                <div className="flex justify-between items-end mt-1">
                  {/* LEFT: TTD + Anindita */}
                  <div>
                    <div style={{ height: "55px", position: "relative" }} className="flex items-end">
                      {isAccountingApproved ? (
                        <img
                          src="/qpr/TTD-Anindita.jpeg"
                          alt="TTD Anindita"
                          style={{ height: "52px", objectFit: "contain", position: "absolute", bottom: 0, left: 0 }}
                          onError={(e) => {
                            if (!e.currentTarget.src.includes("/qpr/")) {
                              e.currentTarget.src = "/qpr/TTD-Anindita.jpeg";
                            } else {
                              e.currentTarget.src = "/TTD-Anindita.jpeg";
                            }
                          }}
                        />
                      ) : (
                        <span className="text-black italic text-[10.5px] font-sans block pb-1" style={{ fontWeight: "700" }}>(Pending Approval)</span>
                      )}
                    </div>
                    <div className="pt-0">
                      <span className="underline block text-[12px] text-black" style={{ fontWeight: "900" }}>Anindita Imilaningtyas</span>
                      <span className="block text-[10.5px] text-black" style={{ fontWeight: "600" }}>Dep. Head Accounting &amp; Finance</span>
                    </div>
                  </div>

                  {/* RIGHT: Approved + Vendor */}
                  <div className="flex flex-col items-end pr-10">
                    {isVendorApproved ? (
                      <span className="text-[11px] text-[#0f766e] mb-0.5" style={{ fontWeight: "900" }}>Approved</span>
                    ) : (
                      <span className="text-[10px] text-amber-750 mb-0.5 italic" style={{ fontWeight: "700" }}>(Pending Vendor Approval)</span>
                    )}
                    <div style={{ height: "55px" }} />
                    <span className="underline block text-[12px] text-black text-right" style={{ fontWeight: "900" }}>{cl.supplierName}</span>
                    <span className="block text-[10.5px] text-black" style={{ fontWeight: "600" }}>Vendor</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* PT Menara Terus Makmur Footer */}
        <div 
          style={{ 
            fontFamily: '"Times New Roman", Times, serif',
            color: "#000000",
            borderTop: "2px solid #000000"
          }} 
          className="w-full px-[6mm] pb-[2mm] pt-2 mt-auto text-center text-[9.5px] font-bold leading-normal"
        >
          <div style={{ fontWeight: "800" }}>PT Menara Terus Makmur - Manufacturer : Forging Parts, Mechanical Jacks, Hand Tools &amp; Machining Parts</div>
          <div className="text-[8.5px] mt-0.5" style={{ fontWeight: "600" }}>
            Jl. Jababeka XI Blok H.3 - 12 Kawasan Industri Jababeka, Cikarang Utara, Kabupaten Bekasi, Jawa Barat - Indonesia 17530 / Telp. : +62-21-8934504 (Hunting) Fax. : +62-21-8934505
          </div>
        </div>

      </div>
    </div>
  );

  /* =========================================================
     PAGE 2: ATTACHED FULL APPROVED QPR DOCUMENT SHEET (100% IDENTICAL TO QPR PREVIEW)
     ========================================================= */
  const qprSheetContent = (
    <div id={inline ? "cl-sheet-inline-2" : "cl-sheet-page-2"} className="w-full flex flex-col items-center">
      <QprPrintPreview qpr={preparedQprObject} inline={true} hideVendorToggle={true} />
    </div>
  );

  /* Inline Rendering (Tabs or Stacked) */
  if (inline) {
    return (
      <div className="w-full flex flex-col items-center">
        {/* Tab switch for inline preview */}
        <div className="flex items-center gap-2 mb-3 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              activeTab === "all" ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Layers size={13} className="inline mr-1" /> Semua Halaman (2 Hlm)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cl")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              activeTab === "cl" ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FileText size={13} className="inline mr-1" /> Halaman 1: Confirmation Letter
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("qpr")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              activeTab === "qpr" ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            <CheckCircle2 size={13} className="inline mr-1" /> Halaman 2: Lampiran QPR
          </button>
        </div>

        <div className="w-full flex flex-col gap-6">
          {(activeTab === "all" || activeTab === "cl") && (
            <div className="w-full overflow-x-auto shadow-md rounded-lg">
              {clSheetContent}
            </div>
          )}
          {(activeTab === "all" || activeTab === "qpr") && (
            <div className="w-full overflow-x-auto shadow-md rounded-lg">
              {qprSheetContent}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* Full Modal Dialog Rendering via React Portal */
  if (!mounted) return null;

  const modalJSX = (
    <div id="cl-print-modal-root" className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 overflow-y-auto flex flex-col items-center p-4 print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:block print:overflow-visible">
      {/* Top Action & Navigation Bar */}
      <div className="fixed top-4 right-4 flex items-center gap-3 z-50 print:hidden">
        {/* Page Switch Buttons in Modal */}
        <div className="flex items-center bg-slate-800/90 text-white rounded-lg p-1 shadow-lg border border-slate-700">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === "all" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            Semua Halaman (2 Hlm)
          </button>
          <button
            onClick={() => setActiveTab("cl")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === "cl" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            Hlm 1: CL
          </button>
          <button
            onClick={() => setActiveTab("qpr")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === "qpr" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            Hlm 2: Lampiran QPR
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-lg transition-colors cursor-pointer"
        >
          <Printer size={14} />
          Cetak PDF Lengkap
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold shadow-lg border border-slate-200 transition-colors cursor-pointer"
        >
          <X size={14} />
          Tutup
        </button>
      </div>

      {/* Document Sheets Container */}
      <div
        id="cl-print-area"
        data-active-tab={activeTab}
        className="pt-16 pb-12 w-full flex flex-col items-center gap-8 print:pt-0 print:pb-0 print:block print:gap-0 print:w-full"
      >
        {/* Page 1: Confirmation Letter */}
        <div
          id="cl-page-1-container"
          className="shadow-2xl print:shadow-none print:w-full"
          style={{ display: (activeTab === "all" || activeTab === "cl") ? "block" : "none" }}
        >
          {clSheetContent}
        </div>

        {/* Page 2: QPR Attachment */}
        <div
          id="cl-page-2-container"
          className="shadow-2xl print:shadow-none print:w-full"
          style={{ display: (activeTab === "all" || activeTab === "qpr") ? "block" : "none" }}
        >
          {qprSheetContent}
        </div>
      </div>

      <style>{`
        #cl-sheet-page-1,
        #cl-sheet-page-1 * {
          color: #000000 !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          text-rendering: geometricPrecision !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm !important;
          }
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            overflow: visible !important;
          }
          body * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Completely hide the Next.js app tree and everything else on body */
          body.print-cl-active > *:not(#cl-print-modal-root) {
            display: none !important;
            visibility: hidden !important;
          }

          /* Show only the modal root in pure static document flow */
          body.print-cl-active #cl-print-modal-root {
            display: block !important;
            position: static !important;
            inset: auto !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            float: none !important;
          }

          body.print-cl-active #cl-print-area {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            float: none !important;
          }

          /* Tab-based visibility in print */
          body.print-cl-active #cl-print-area[data-active-tab="cl"] #cl-page-2-container,
          body.print-cl-active #cl-print-area[data-active-tab="cl"] #cl-sheet-page-2 {
            display: none !important;
          }
          body.print-cl-active #cl-print-area[data-active-tab="qpr"] #cl-page-1-container,
          body.print-cl-active #cl-print-area[data-active-tab="qpr"] #cl-sheet-page-1 {
            display: none !important;
          }

          /* When tab is 'all': Page 1 breaks cleanly to Page 2 */
          body.print-cl-active #cl-print-area[data-active-tab="all"] #cl-page-1-container {
            display: block !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          body.print-cl-active #cl-print-area[data-active-tab="all"] #cl-page-2-container {
            display: block !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
            break-after: auto !important;
          }

          /* Page 1: CL Sheet (Exact 1 page fit) */
          body.print-cl-active #cl-sheet-page-1 {
            width: 100% !important;
            max-width: 194mm !important;
            height: 283mm !important;
            max-height: 283mm !important;
            min-height: 283mm !important;
            margin: 0 auto !important;
            padding: 4mm 6mm !important;
            border: 1.5px solid #000 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            font-family: "Times New Roman", Times, serif !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
          body.print-cl-active #cl-sheet-page-1 * {
            font-family: "Times New Roman", Times, serif !important;
            color: #000000 !important;
          }

          /* Page 2: QPR Sheet (Exact 1 page fit) */
          body.print-cl-active #cl-page-2-container,
          body.print-cl-active #cl-sheet-page-2,
          body.print-cl-active #cl-sheet-page-2 > div {
            width: 100% !important;
            display: block !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          body.print-cl-active #cl-sheet-page-2 #qpr-print-area {
            width: 100% !important;
            max-width: 194mm !important;
            height: 283mm !important;
            max-height: 283mm !important;
            min-height: 283mm !important;
            margin: 0 auto !important;
            padding: 4mm 6mm !important;
            border: 1px solid #000 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            font-family: Arial, sans-serif !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
            break-after: auto !important;
            overflow: hidden !important;
          }
          body.print-cl-active #cl-sheet-page-2 * {
            color: #000000 !important;
          }

          /* Hide all non-print UI (tabs, buttons, etc.) */
          body.print-cl-active .print\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalJSX, document.body);
}
