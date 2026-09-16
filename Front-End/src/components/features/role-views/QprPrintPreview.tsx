"use client";

import React from "react";
import { X, Printer, Edit, FileText } from "lucide-react";
import { qprService, mapQprFromDb } from "@/services/qprService";

interface QprPreviewProps {
  qpr: {
    qprNumber: string;
    supplierName: string;
    period: string;
    date: string;
    totalItems: number;
    rejectItems: number;
    allowanceRatio: string;
    claimAmount: string;
    status?: string;
    [key: string]: any;
  };
  onClose?: () => void;
  inline?: boolean;
  onEditRevision?: () => void;
  hideVendorToggle?: boolean;
}

const PART_ITEMS = [
  { no: 1, partName: "BRB GN5", totalQty: 75000, qtyNG: 75000, ngActual: 100.0 },
  { no: 2, partName: "BRT GN5", totalQty: 75000, qtyNG: 75000, ngActual: 100.0 },
  { no: 3, partName: "CRB GN5", totalQty: 75000, qtyNG: 75000, ngActual: 100.0 },
  { no: 4, partName: "CRT GN5", totalQty: 75000, qtyNG: 75000, ngActual: 100.0 },
];

function FlowBox({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="border border-black bg-slate-100 flex items-center justify-center text-center font-bold"
        style={{ width: "72px", height: "44px", padding: "4px", fontSize: "8px" }}
      >
        {label}
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center mx-1">
      <div style={{ width: "20px", height: "2px", background: "#64748b" }} />
      <div style={{
        width: 0, height: 0,
        borderTop: "5px solid transparent",
        borderBottom: "5px solid transparent",
        borderLeft: "7px solid #64748b"
      }} />
    </div>
  );
}

function FactorySVG({ label, subContent }: { label: string; subContent?: React.ReactNode }) {
  return (
    <div className="relative" style={{ width: "80px", height: "60px" }}>
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        <path d="M5,55 L5,30 L28,16 L28,30 L51,16 L51,30 L74,16 L74,55 Z" fill="#ffffff" stroke="#000000" strokeWidth="1.2"/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-[15px]" style={{ width: "80px", height: "60px" }}>
        {subContent ? subContent : <span style={{ fontSize: "8px", fontWeight: "bold", color: "#000000" }}>{label}</span>}
      </div>
    </div>
  );
}

function CheckItem({ label, checked, onClick }: { label: string; checked: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-1 cursor-pointer select-none">
      <div className="w-3 h-3 border border-black flex items-center justify-center flex-shrink-0 bg-white">
        {checked && <span style={{ fontSize: "8px" }} className="font-black leading-none text-red-600">V</span>}
      </div>
      <span style={{ fontSize: "8px" }}>{label}</span>
    </div>
  );
}

export default function QprPrintPreview({ qpr, onClose, inline = false, onEditRevision, hideVendorToggle = false }: QprPreviewProps) {
  const [isVendorCopy, setIsVendorCopy] = React.useState(false);

  const base64ToBlobUrl = (base64Str: string): string => {
    if (!base64Str) return "";
    if (!base64Str.startsWith("data:application/pdf")) {
      return base64Str;
    }
    try {
      const parts = base64Str.split(";base64,");
      const contentType = parts[0].split(":")[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([uInt8Array], { type: contentType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error converting base64 to blob:", error);
      return base64Str;
    }
  };

  const [fetchedAttachments, setFetchedAttachments] = React.useState<Array<{ name: string; base64: string }> | null>(null);

  React.useEffect(() => {
    // If attachments already exist in props, use them
    if (qpr.pdfFiles && qpr.pdfFiles.length > 0 && qpr.pdfFiles[0].base64) {
      setFetchedAttachments(qpr.pdfFiles);
      return;
    }
    if (qpr.pdfFileBase64) {
      try {
        if (qpr.pdfFileBase64.startsWith('[')) {
          setFetchedAttachments(JSON.parse(qpr.pdfFileBase64));
          return;
        }
      } catch (e) {}
      setFetchedAttachments([{ name: qpr.pdfFileName || "attachment.pdf", base64: qpr.pdfFileBase64 }]);
      return;
    }

    // If not present and ID exists, fetch full detail on demand
    if (qpr.id) {
      qprService.getById(qpr.id)
        .then((dbDetail) => {
          if (dbDetail) {
            const mapped = mapQprFromDb(dbDetail);
            if (mapped.pdfFiles && mapped.pdfFiles.length > 0) {
              setFetchedAttachments(mapped.pdfFiles);
            }
          }
        })
        .catch((err) => {
          console.warn("[QprPrintPreview] Could not fetch detailed PDF attachments:", err);
        });
    }
  }, [qpr.id, qpr.pdfFiles, qpr.pdfFileBase64, qpr.pdfFileName]);

  const parsedAttachments = React.useMemo(() => {
    if (fetchedAttachments && fetchedAttachments.length > 0) {
      return fetchedAttachments;
    }
    if (qpr.pdfFiles && Array.isArray(qpr.pdfFiles) && qpr.pdfFiles.length > 0) {
      return qpr.pdfFiles;
    }
    if (qpr.attachments && Array.isArray(qpr.attachments) && qpr.attachments.length > 0) {
      return qpr.attachments;
    }
    if (qpr.pdfFileBase64) {
      try {
        if (typeof qpr.pdfFileBase64 === "string" && qpr.pdfFileBase64.startsWith("[")) {
          const parsed = JSON.parse(qpr.pdfFileBase64);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
      if (typeof qpr.pdfFileBase64 === "string" && qpr.pdfFileBase64.length > 0) {
        return [{ name: qpr.pdfFileName || "Lampiran_Foto.jpg", base64: qpr.pdfFileBase64 }];
      }
    }
    if (qpr.photoBase64 || qpr.imageBase64 || qpr.attachmentBase64) {
      const b64 = qpr.photoBase64 || qpr.imageBase64 || qpr.attachmentBase64;
      return [{ name: qpr.photoName || "Lampiran_Foto.jpg", base64: b64 }];
    }
    return [];
  }, [fetchedAttachments, qpr.pdfFiles, qpr.attachments, qpr.pdfFileBase64, qpr.pdfFileName, qpr.photoBase64, qpr.imageBase64, qpr.attachmentBase64]);

  const [activeAttachmentIdx, setActiveAttachmentIdx] = React.useState(0);

  const activeAttachment = parsedAttachments[activeAttachmentIdx] || null;

  const pdfBlobUrl = React.useMemo(() => {
    if (!activeAttachment || !activeAttachment.base64) return "";
    const url = base64ToBlobUrl(activeAttachment.base64);
    return `${url}#toolbar=0&navpanes=0`;
  }, [activeAttachment]);

  // Check if this vendor has been claimed > 1 times
  const getClaimCountForVendor = (supplierName: string) => {
    if (typeof qpr.vendorClaimCount === 'number') {
      return qpr.vendorClaimCount;
    }
    return 1;
  };

  const claimCount = getClaimCountForVendor(qpr.supplierName);
  const isMoreThanOne = claimCount > 1;

  // Unified parts list for both header and table
  const tableParts = React.useMemo(() => {
    if (qpr.parts && Array.isArray(qpr.parts) && qpr.parts.length > 0) return qpr.parts;
    if (qpr.items && Array.isArray(qpr.items) && qpr.items.length > 0) return qpr.items;
    if (qpr.qprParts && Array.isArray(qpr.qprParts) && qpr.qprParts.length > 0) return qpr.qprParts;
    return PART_ITEMS;
  }, [qpr]);

  const isMultiplePartsInTable = tableParts.length > 1;
  const headerPartName = isMultiplePartsInTable
    ? "All Type"
    : (tableParts[0]?.partName || qpr.partName || "ALL TYPE PART FINISH");
  const headerPartNumber = (qpr.partNumber && qpr.partNumber !== "All Type" && qpr.partNumber !== "ALL TYPE")
    ? qpr.partNumber
    : (tableParts[0]?.partNumber && tableParts[0]?.partNumber !== "All Type" && tableParts[0]?.partNumber !== "ALL TYPE"
        ? tableParts[0].partNumber
        : (qpr.partNumber || "-"));

  // Local state for interactive editing
  const [localClaimTypes, setLocalClaimTypes] = React.useState<string[]>(
    Array.isArray(qpr.claimType) ? qpr.claimType : ["PROSES PACKING", "PROSES CHECK"]
  );
  const [localIsMoreThanOne, setLocalIsMoreThanOne] = React.useState(isMoreThanOne);
  const [localClaimCount, setLocalClaimCount] = React.useState(claimCount);

  React.useEffect(() => {
    if (Array.isArray(qpr.claimType)) {
      setLocalClaimTypes(qpr.claimType);
    }
  }, [qpr.claimType]);

  React.useEffect(() => {
    setLocalIsMoreThanOne(isMoreThanOne);
    setLocalClaimCount(claimCount);
  }, [isMoreThanOne, claimCount]);

  // Process mapping for flow diagram highlights
  const claimTypes = localClaimTypes;

  const isMaterial = claimTypes.includes("MATERIAL");
  const isForging = claimTypes.includes("PROSES FORGING");
  const isMachining = claimTypes.includes("PROSES M/C");
  const isPainting = claimTypes.includes("PAINTING/PLATING");
  const isParkerizing = claimTypes.includes("PARKEREZING");
  const isHeatTreatment = claimTypes.includes("HEAT TREATMENT");
  const anySupplierProcess = isMaterial || isForging || isMachining || isPainting || isParkerizing || isHeatTreatment;

  let supplierProcessLabel = "MACHINING";
  if (isMachining) supplierProcessLabel = "MACHINING";
  else if (isForging) supplierProcessLabel = "FORGING";
  else if (isMaterial) supplierProcessLabel = "MATERIAL";
  else if (isPainting) supplierProcessLabel = "PAINT / PLATE";
  else if (isParkerizing) supplierProcessLabel = "PARKERIZING";
  else if (isHeatTreatment) supplierProcessLabel = "HEAT TREAT";

  const isMtmProcess = claimTypes.includes("PROSES PACKING");
  const isCustomerProcess = claimTypes.includes("PROSES CHECK");

  const getShortVendorName = (fullName: string) => {
    if (!fullName) return "VENDOR";
    const clean = fullName.replace(/^PT\.?\s+/i, "PT. ").trim();
    if (clean.length > 20) {
      return clean.substring(0, 18) + "...";
    }
    return clean;
  };
  const shortVendorName = getShortVendorName(qpr.supplierName);

  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    if (inline) {
      return () => {
        document.body.classList.remove("print-qpr-active");
        document.body.style.overflow = "unset";
      };
    }
    document.body.classList.add("print-qpr-active");
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("print-qpr-active");
      document.body.style.overflow = "unset";
    };
  }, [inline]);

  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return "28 JULI 2025";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr.toUpperCase();
    const months = [
      "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
      "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
    ];
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  };

  // QPR Signature states strictly aligned with pipeline approval progress
  const isDraftOrRevise = qpr.status === "DRAFT" || qpr.status === "UNDER_REVISION" || qpr.status === "REVISE";

  const isSectionHeadSigned = !isDraftOrRevise && (
    !!qpr.approvalProgress?.approvedAtSectionHead ||
    !!qpr.approvalProgress?.checksumSectionHead ||
    qpr.status === "APPROVED" ||
    qpr.status === "CLOSED" ||
    qpr.status === "CLOSED_PAID" ||
    qpr.requiredRole === "Dept Head" ||
    qpr.requiredRole === "Div Head" ||
    qpr.requiredRole === "Purchasing" ||
    qpr.requiredRole === "Closed" ||
    qpr.requiredRole === "CLOSED" ||
    qpr.requiredRole === "Vendor" ||
    (Array.isArray(qpr.approvedBy) && qpr.approvedBy.includes("Section Head"))
  );

  const isDeptHeadSigned = !isDraftOrRevise && (
    !!qpr.approvalProgress?.approvedAtDeptHead ||
    !!qpr.approvalProgress?.checksumDeptHead ||
    qpr.status === "APPROVED" ||
    qpr.status === "CLOSED" ||
    qpr.status === "CLOSED_PAID" ||
    qpr.requiredRole === "Div Head" ||
    qpr.requiredRole === "Purchasing" ||
    qpr.requiredRole === "Closed" ||
    qpr.requiredRole === "CLOSED" ||
    qpr.requiredRole === "Vendor" ||
    (Array.isArray(qpr.approvedBy) && qpr.approvedBy.includes("Dept Head"))
  );

  const isDivHeadSigned = !isDraftOrRevise && (
    !!qpr.approvalProgress?.approvedAtDivHead ||
    !!qpr.approvalProgress?.checksumDivHead ||
    qpr.status === "APPROVED" ||
    qpr.status === "CLOSED" ||
    qpr.status === "CLOSED_PAID" ||
    qpr.requiredRole === "Purchasing" ||
    qpr.requiredRole === "Closed" ||
    qpr.requiredRole === "CLOSED" ||
    qpr.requiredRole === "Vendor" ||
    (Array.isArray(qpr.approvedBy) && qpr.approvedBy.includes("Div Head"))
  );

  const isPurchasingSigned = !isDraftOrRevise && (
    !!qpr.approvalProgress?.approvedAtPurchasing ||
    !!qpr.approvalProgress?.checksumPurchasing ||
    qpr.status === "CLOSED" ||
    qpr.status === "CLOSED_PAID" ||
    qpr.requiredRole === "Closed" ||
    qpr.requiredRole === "CLOSED" ||
    qpr.requiredRole === "Vendor" ||
    (Array.isArray(qpr.approvedBy) && qpr.approvedBy.includes("Purchasing")) ||
    (qpr.status === "APPROVED" && qpr.requiredRole !== "Purchasing")
  );

  const documentContent = (
    <div
      id="qpr-print-area"
      className={`bg-white mx-auto ${inline ? "w-full shadow-sm" : "shadow-2xl my-4"} flex flex-col justify-between`}
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        border: "1px solid #000",
        width: inline ? "100%" : "210mm",
        minHeight: inline ? "auto" : "297mm",
        padding: inline ? "6px 8px" : "8mm 10mm",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column"
      }}
    >
        {/* Company Header */}
        <div className="flex items-center" style={{ borderBottom: "1.5px solid #000000", padding: "6px 10px", color: "#000000" }}>
          <div style={{ width: "170px", minWidth: "170px", marginRight: "12px", display: "flex", alignItems: "center" }}>
            <img src="/qpr/logo-mtm.jpg" alt="PT MTM Logo" style={{ height: "26px", objectFit: "contain", display: "block" }} />
          </div>
          <div className="flex-1 text-center font-bold text-black" style={{ fontSize: "7.5px", lineHeight: "1.6", color: "#000000" }}>
            <div className="font-black text-black" style={{ fontSize: "9px", color: "#000000" }}>PT MENARA TERUS MAKMUR</div>
            <div style={{ color: "#000000" }}>Jl. Jababeka XI Blok H 1 No. 12, Jababeka Industrial Estate</div>
            <div style={{ color: "#000000" }}>17530 CIKARANG BEKASI INDONESIA</div>
            <div style={{ color: "#000000" }}>TELP: (62-21) 8934504, FAX: (62-21) 8934505</div>
          </div>
          <div className="text-right font-bold text-black" style={{ width: "100px", minWidth: "100px", fontSize: "7.5px", color: "#000000" }}>
            <div className="font-black text-black" style={{ fontSize: "8px", color: "#000000" }}>(PR4-FRM-08101)</div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center" style={{ backgroundColor: "#ffffff", color: "#000000", borderTop: "1.5px solid #000000", borderBottom: "1.5px solid #000000", padding: "6px 0" }}>
          <div className="font-black tracking-wide uppercase text-black" style={{ fontSize: "18px", color: "#000000" }}>QUALITY PROBLEM REPORT</div>
          <div className="font-black tracking-wider text-black" style={{ fontSize: "9px", color: "#000000" }}>( PR4-FRM-08101 )</div>
        </div>

        {/* Supplier Info + Status Section */}
        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          {/* Left: Supplier info */}
          <div style={{ flex: 1.2, borderRight: "1px solid #000", display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: "bold", fontSize: "8.5px", padding: "3px 8px", background: "#f1f5f9", borderBottom: "1px solid #000", textTransform: "uppercase" }}>
              SUPPLIER / VENDOR
            </div>
            <div style={{ padding: "6px 8px", flex: 1 }}>
              <div style={{ fontWeight: "900", fontSize: "10.5px", color: "#1e293b", textTransform: "uppercase", marginBottom: "6px" }}>
                <span contentEditable suppressContentEditableWarning className="focus:bg-yellow-50 focus:outline-none print:bg-transparent">{qpr.supplierName || "VENDOR SUPPLIER"}</span>
              </div>
              <div style={{ fontSize: "8.5px", lineHeight: "1.5", fontWeight: "bold", color: "#334155" }}>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Part Name</span>
                  <span>: <span contentEditable suppressContentEditableWarning className="focus:bg-yellow-50 focus:outline-none print:bg-transparent">
                    {headerPartName}
                  </span></span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Part Number</span>
                  <span>: <span contentEditable suppressContentEditableWarning className="focus:bg-yellow-50 focus:outline-none print:bg-transparent">
                    {headerPartNumber}
                  </span></span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Model</span>
                  <span>: <span contentEditable suppressContentEditableWarning className="focus:bg-yellow-50 focus:outline-none print:bg-transparent">{qpr.model || "-"}</span></span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Lot/Batch</span>
                  <span>: <span contentEditable suppressContentEditableWarning className="focus:bg-yellow-50 focus:outline-none print:bg-transparent">{qpr.lotBatch || "-"}</span></span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Date</span>
                  <span>: <span contentEditable suppressContentEditableWarning className="focus:bg-yellow-50 focus:outline-none print:bg-transparent">{formatDateIndo(qpr.date)}</span></span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Problem</span>
                  <span>: <span contentEditable suppressContentEditableWarning className="focus:bg-yellow-50 focus:outline-none print:bg-transparent">{qpr.problem || "VISUAL NG"}</span></span>
                </div>
                {qpr.pdfFileName && (
                  <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", marginTop: "2px" }}>
                    <span>Attachment</span>
                    <span className="text-blue-750 font-bold">: 📄 {qpr.pdfFileName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Doc No + Status blocks */}
          <div style={{ width: "320px", minWidth: "320px", display: "flex", flexDirection: "column" }}>
            {/* Doc no, revision, issue date */}
            {[
              { label: "Doc No.", val: qpr.qprNumber || "PR4-FRM-08101" },
              { label: "Revision", val: "A" },
              { label: "Issue Date", val: formatDateIndo(qpr.date) },
            ].map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr", borderBottom: "1px solid #000" }}>
                <div style={{ borderRight: "1px solid #000", padding: "2px 6px", fontWeight: "bold", fontSize: "8px" }}>{row.label}</div>
                <div style={{ padding: "2px 6px", fontSize: "8px", fontFamily: "monospace", fontWeight: "bold" }}>: {row.val}</div>
              </div>
            ))}

            <div style={{ display: "flex", flex: 1 }}>
              {/* Left Sub-Column */}
              <div style={{ flex: 1, borderRight: "1px solid #000", display: "flex", flexDirection: "column" }}>
                {!isVendorCopy ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "7px", borderBottom: "1px solid #000", padding: "2px", background: "#f1f5f9", textTransform: "uppercase" }}>
                      Problem Occurance in one year
                    </div>
                    <div 
                      onClick={() => setLocalIsMoreThanOne(false)}
                      style={{ display: "grid", gridTemplateColumns: "1fr 32px", borderBottom: "1px solid #000", flex: 1, alignItems: "center", cursor: "pointer" }}
                    >
                      <div style={{ borderRight: "1px solid #000", padding: "2px 4px", fontWeight: "bold", fontSize: "7px" }}>
                        1st time
                      </div>
                      <div style={{ padding: "2px", display: "flex", justifyContent: "center" }}>
                        <span style={{ width: "12px", height: "12px", border: "1px solid #000", display: "inline-block", backgroundColor: localIsMoreThanOne ? "white" : "#ef4444" }} />
                      </div>
                    </div>
                    <div 
                      onClick={() => setLocalIsMoreThanOne(true)}
                      style={{ display: "grid", gridTemplateColumns: "1fr 32px", borderBottom: "1px solid #000", flex: 1, alignItems: "center", cursor: "pointer" }}
                    >
                      <div style={{ borderRight: "1px solid #000", padding: "2px 4px", fontWeight: "bold", fontSize: "7px" }}>
                        More Than one
                      </div>
                      <div style={{ padding: "2px", display: "flex", justifyContent: "center" }}>
                        <span style={{ width: "12px", height: "12px", border: "1px solid #000", display: "inline-block", backgroundColor: localIsMoreThanOne ? "#ef4444" : "white" }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", borderBottom: "1px solid #000", justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa" }}>
                    <span style={{ fontSize: "7px", color: "#94a3b8", fontStyle: "italic" }}>[Internal Data Excluded]</span>
                  </div>
                )}
                <div style={{ padding: "4px", fontSize: "7px", fontWeight: "bold", borderTop: "none" }}>
                  REF. TO NCR NO : <span style={{ fontFamily: "monospace", fontSize: "7px", color: "#1e40af" }} contentEditable suppressContentEditableWarning className="focus:bg-yellow-50 focus:outline-none print:bg-transparent">{qpr.refNcrNumber || "240/QI/NCR/SUP/VII/25"}</span>
                </div>
              </div>

              {/* Right Sub-Column */}
              <div style={{ flex: 1.2, display: "flex", flexDirection: "column" }}>
                {/* STATUS */}
                <div style={{ borderBottom: "1px solid #000" }}>
                  <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "7px", borderBottom: "1px solid #000", padding: "2.5px 2px", background: "#f1f5f9" }}>STATUS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #000" }}>
                    {["Rework", "Return", "Reject"].map((s, i) => (
                      <div key={s} style={{ borderRight: i < 2 ? "1px solid #000" : "none", textAlign: "center", padding: "1px 2px", fontWeight: "bold", fontSize: "6.5px" }}>{s}</div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                    {[false, false, true].map((checked, i) => (
                      <div key={i} style={{ borderRight: i < 2 ? "1px solid #000" : "none", padding: "3px 2px", display: "flex", justifyContent: "center" }}>
                        <span style={{ width: "12px", height: "12px", border: "1px solid #000", display: "inline-block", backgroundColor: checked ? "#ef4444" : "white" }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* PART CATEGORY */}
                <div style={{ borderBottom: "1px solid #000" }}>
                  <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "7px", borderBottom: "1px solid #000", padding: "2.5px 2px", background: "#f1f5f9" }}>PART CATEGORY</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #000" }}>
                    {["Ordinary", "Function", "Safety"].map((s, i) => (
                      <div key={s} style={{ borderRight: i < 2 ? "1px solid #000" : "none", textAlign: "center", padding: "1px 2px", fontWeight: "bold", fontSize: "6.5px" }}>{s}</div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                    {[false, true, false].map((checked, i) => (
                      <div key={i} style={{ borderRight: i < 2 ? "1px solid #000" : "none", padding: "3px 2px", display: "flex", justifyContent: "center" }}>
                        <span style={{ width: "12px", height: "12px", border: "1px solid #000", display: "inline-block", backgroundColor: checked ? "#ef4444" : "white" }} />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: "4px", fontSize: "7px", fontWeight: "bold" }}>
                  NO QPR : <span style={{ fontFamily: "monospace", fontSize: "7px", color: "#b91c1c" }}>{qpr.qprNumber || "002/QI/QPR/SUB/8/25"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parts Table */}
        <div style={{ borderBottom: "1px solid #000" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.5px" }}>
            <thead>
              <tr style={{ backgroundColor: "transparent" }}>
                <th style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center", fontWeight: "bold", backgroundColor: "#f1f5f9" }}>NO</th>
                <th style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center", fontWeight: "bold", backgroundColor: "#f1f5f9", minWidth: "120px" }}>PART NAME</th>
                <th style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center", fontWeight: "bold", backgroundColor: "#f1f5f9" }}>TOTAL QTY (PCS)</th>
                <th style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center", fontWeight: "bold", backgroundColor: "#f1f5f9" }}>QTY NG (PCS)</th>
                <th style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center", fontWeight: "bold", backgroundColor: "#ffff00" }}>NG ACTUAL (%)</th>
                <th style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center", fontWeight: "bold", backgroundColor: "#bbf7d0" }}>STD NG ALLOWANCE<br/>0.5 % (PCS)</th>
                <th style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center", fontWeight: "bold", backgroundColor: "#fca5a5" }}>QTY CLAIM (PCS)</th>
              </tr>
            </thead>
            <tbody>
              {tableParts.map((item: any, idx: number) => {
                const itemNo = item.no !== undefined ? item.no : idx + 1;
                const totalQty = item.totalQty || 0;
                const qtyNG = item.qtyNG !== undefined ? item.qtyNG : (item.qtyNg !== undefined ? item.qtyNg : 0);
                const stdAllowance = item.stdAllowance !== undefined ? item.stdAllowance : Math.round(totalQty * 0.005);
                const ngActual = item.ngActual !== undefined ? item.ngActual : (totalQty > 0 ? (qtyNG / totalQty) * 100 : 0);
                const qtyClaim = item.qtyClaim !== undefined ? item.qtyClaim : qtyNG - stdAllowance;
                return (
                  <tr key={itemNo}>
                    <td style={{ border: "1px solid #000", padding: "3px 4px", textAlign: "center" }}>{itemNo}</td>
                    <td style={{ border: "1px solid #000", padding: "4px 8px", fontWeight: "bold", wordBreak: "break-word", whiteSpace: "normal", lineHeight: "1.35", color: "#0f172a" }}>{item.partName}</td>
                    <td style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center" }}>{totalQty.toLocaleString("id-ID")}</td>
                    <td style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center" }}>{qtyNG.toLocaleString("id-ID")}</td>
                    <td style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center", fontWeight: "bold", color: "#b91c1c" }}>{ngActual.toFixed(2)}%</td>
                    <td style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center" }}>{stdAllowance.toLocaleString("id-ID")}</td>
                    <td style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center", fontWeight: "bold" }}>{qtyClaim.toLocaleString("id-ID")}</td>
                  </tr>
                );
              })}
              {[...Array(Math.max(0, 4 - tableParts.length))].map((_, i) => (
                <tr key={`empty-${i}`}>
                  {[...Array(7)].map((__, j) => (
                    <td key={j} style={{ border: "1px solid #000", padding: "2.5px 4px", height: "12px" }}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Remarks Section */}
        <div style={{ padding: "6px 12px", display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "8px" }}>
          <div style={{ fontWeight: "bold", fontSize: "9px", textTransform: "uppercase", color: "#374151", whiteSpace: "nowrap" }}>REMARKS :</div>
          <div 
            contentEditable 
            suppressContentEditableWarning
            className="focus:bg-yellow-50 focus:outline-none print:bg-transparent"
            style={{ 
              fontSize: "8.5px", 
              lineHeight: "16px",
              minHeight: "48px", 
              flexGrow: 1, 
              outline: "none", 
              whiteSpace: "pre-wrap", 
              color: "#1f2937",
              backgroundImage: "linear-gradient(to bottom, transparent 15px, rgba(0, 0, 0, 0.35) 15px, rgba(0, 0, 0, 0.35) 16px, transparent 16px)",
              backgroundSize: "100% 16px"
            }}
          >
            {qpr.remarks || ""}
          </div>
        </div>

        {/* JENIS CLAIM + Signature */}
        <div style={{ display: "flex", borderTop: "1px solid #000", marginTop: "auto" }}>
          {/* Jenis Claim */}
          <div style={{ flex: 1, borderRight: "1px solid #000", padding: "10px 12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
              {["MATERIAL", "PAINTING/PLATING", "PROSES PACKING", "PARKEREZING", "PROSES CHECK", "HEAT TREATMENT", "PROSES FORGING", "PROSES M/C"].map((opt) => (
                <CheckItem
                  key={opt}
                  label={opt}
                  checked={localClaimTypes.includes(opt)}
                  onClick={() => {
                    setLocalClaimTypes(prev =>
                      prev.includes(opt) ? prev.filter(c => c !== opt) : [...prev, opt]
                    );
                  }}
                />
              ))}
            </div>
          </div>

          {/* Signature Block */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ borderBottom: "1px solid #000", textAlign: "center", padding: "4px", fontSize: "8px", fontWeight: "bold", color: "#1e293b" }}>
              Cikarang, {formatDateIndo(qpr.date)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", flex: 1 }}>
              {[
                { 
                  type: "Prepared", 
                  name: "Deny M.", 
                  role: "(Creator)",
                  isSigned: true,
                  sigSvg: (
                    <img 
                      src="/qpr/TTD-DENY.M.png" 
                      alt="Deny M. Signature" 
                      style={{ height: "28px", width: "auto", objectFit: "contain" }} 
                      onError={(e) => {
                        if (!e.currentTarget.src.includes("/qpr/")) {
                          e.currentTarget.src = "/qpr/TTD-DENY.M.png";
                        } else {
                          e.currentTarget.src = "/TTD-DENY.M.png";
                        }
                      }}
                    />
                  )
                },
                { 
                  type: "Checked", 
                  name: "Septian N.", 
                  role: "(Section Head)",
                  isSigned: isSectionHeadSigned,
                  sigSvg: (
                    <img 
                      src="/qpr/TTD-PakSeptian.jpeg" 
                      alt="Septian N. Signature" 
                      style={{ height: "28px", width: "auto", objectFit: "contain" }} 
                      onError={(e) => {
                        if (!e.currentTarget.src.includes("/qpr/")) {
                          e.currentTarget.src = "/qpr/TTD-PakSeptian.jpeg";
                        } else {
                          e.currentTarget.src = "/TTD-PakSeptian.jpeg";
                        }
                      }}
                    />
                  )
                },
                { 
                  type: "Approved", 
                  name: "Septian N.", 
                  role: "(Dept. Head Quality)",
                  isSigned: isDeptHeadSigned,
                  sigSvg: (
                    <img 
                      src="/qpr/TTD-PakSeptian.jpeg" 
                      alt="Septian N. Signature" 
                      style={{ height: "28px", width: "auto", objectFit: "contain" }} 
                      onError={(e) => {
                        if (!e.currentTarget.src.includes("/qpr/")) {
                          e.currentTarget.src = "/qpr/TTD-PakSeptian.jpeg";
                        } else {
                          e.currentTarget.src = "/TTD-PakSeptian.jpeg";
                        }
                      }}
                    />
                  )
                },
                { 
                  type: "Approved", 
                  name: "Putu R. S.", 
                  role: "(Div. Head)",
                  isSigned: isDivHeadSigned,
                  sigSvg: (
                    <img 
                      src="/qpr/TTD-PakPutu.jpeg" 
                      alt="Putu R. S. Signature" 
                      style={{ height: "28px", width: "auto", objectFit: "contain" }} 
                      onError={(e) => {
                        if (!e.currentTarget.src.includes("/qpr/")) {
                          e.currentTarget.src = "/qpr/TTD-PakPutu.jpeg";
                        } else {
                          e.currentTarget.src = "/TTD-PakPutu.jpeg";
                        }
                      }}
                    />
                  )
                },
                { 
                  type: "Acknowledged", 
                  name: "Irvan H. N.", 
                  role: "(Purchasing)",
                  isSigned: isPurchasingSigned,
                  sigSvg: (
                    <img 
                      src="/TTD-PURCHASING.jpeg" 
                      alt="Irvan H. N. Signature" 
                      style={{ height: "28px", width: "auto", objectFit: "contain" }} 
                      onError={(e) => {
                        if (!e.currentTarget.src.includes("/qpr/")) {
                          e.currentTarget.src = "/qpr/TTD-PURCHASING.jpeg";
                        } else {
                          e.currentTarget.src = "/TTD-PURCHASING.jpeg";
                        }
                      }}
                    />
                  )
                }
              ].map((sig, i) => (
                <div key={i} style={{ borderRight: i < 4 ? "1px solid #000" : "none", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "60px" }}>
                  <div style={{ borderBottom: "1px solid #000", padding: "1px 2px", fontWeight: "bold", fontSize: "7px", background: "#f8fafc" }}>{sig.type}</div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "30px", padding: "1px" }}>
                    {sig.isSigned ? (
                      sig.sigSvg
                    ) : (
                      <span style={{ fontSize: "6.5px", color: "#cbd5e1", fontStyle: "italic" }}>(Pending)</span>
                    )}
                  </div>
                  <div style={{ borderTop: "1px solid #000", padding: "1.5px 2px", fontSize: "6.5px", color: "#1e293b", textAlign: "center", lineHeight: "1.25", fontWeight: "bold" }}>
                    <div style={{ textDecoration: "underline", color: "#000000" }}>{sig.name}</div>
                    <div style={{ fontSize: "5.5px", fontWeight: "normal", color: "#475569", marginTop: "1px" }}>{sig.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  const isImageAttachment = (file: { name?: string; base64?: string } | null) => {
    if (!file) return false;
    if (file.base64 && (
      file.base64.startsWith("data:image/") ||
      file.base64.startsWith("blob:") ||
      file.base64.startsWith("http://") ||
      file.base64.startsWith("https://") ||
      file.base64.startsWith("/")
    )) return true;
    if (file.name && /\.(png|jpe?g|webp|gif|bmp|svg|jfif)$/i.test(file.name)) return true;
    return false;
  };

  // Group images together if all are photos or render per page
  const imageAttachments = parsedAttachments.filter((f: any) => isImageAttachment(f));
  const nonImageAttachments = parsedAttachments.filter((f: any) => !isImageAttachment(f));

  const attachmentPrintPages = (
    <div id="qpr-attachments-print-area" className="w-full flex flex-col gap-4">
      {parsedAttachments.length > 0 ? (
        imageAttachments.length > 0 && nonImageAttachments.length === 0 ? (
          /* When attachments are photos (1 or multiple images uploaded in form) */
          <div
            className="qpr-attachment-print-page bg-white mx-auto shadow-md border border-slate-300 p-5 text-left font-sans text-slate-800 flex flex-col justify-between"
            style={{
              width: inline ? "100%" : "210mm",
              minHeight: inline ? "auto" : "297mm",
              boxSizing: "border-box"
            }}
          >
            {/* Header */}
            <div>
              <div className="border-b-2 border-black pb-2 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black text-black uppercase tracking-wider">
                    LAMPIRAN BUKTI KETIDAKSESUAIAN PART NG (FOTO TEMUAN &amp; BUKTI VISUAL)
                  </h3>
                  <p className="text-[9px] text-slate-600 font-bold mt-0.5">
                    Ref. Dokumen QPR: <span className="font-mono text-blue-700 font-extrabold">{qpr.qprNumber}</span> | Ref. No. NCR: <span className="font-mono text-black font-bold">{qpr.refNcrNumber || "-"}</span> | Tanggal: <span className="text-black font-bold">{formatDateIndo(qpr.date)}</span>
                  </p>
                </div>
                <span className="text-[10px] font-black text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded tracking-wide">
                  EVIDENCE ATTACHED
                </span>
              </div>

              {/* Metadata Summary */}
              <div className="grid grid-cols-4 gap-2.5 my-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-semibold">
                <div>
                  <span className="text-slate-500 uppercase text-[7.5px] font-bold block">Vendor / Supplier</span>
                  <span className="text-black font-extrabold truncate block">{qpr.supplierName || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[7.5px] font-bold block">Ref. No. NCR</span>
                  <span className="text-black font-mono font-bold block">{qpr.refNcrNumber || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[7.5px] font-bold block">Part Name / Number</span>
                  <span className="text-black font-bold truncate block">{headerPartName} ({headerPartNumber})</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[7.5px] font-bold block">Total NG / Claim</span>
                  <span className="text-red-700 font-black font-mono block">{qpr.rejectItems || tableParts.reduce((acc: number, p: any) => acc + (p.qtyNG || p.qtyNg || 0), 0)} pcs</span>
                </div>
              </div>

              {/* Defect Description */}
              <div className="mb-2.5">
                <span className="text-slate-500 uppercase text-[8px] font-bold block mb-0.5">
                  Deskripsi Masalah / Problem Analysis
                </span>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[9.5px] text-slate-800 italic leading-relaxed">
                  "{qpr.problem || "Ditemukan komponen NG saat proses verifikasi mutu."}"
                </div>
              </div>

              {/* Photos Grid Container */}
              <div className="my-1.5">
                <span className="text-slate-500 uppercase text-[8px] font-bold block mb-1">
                  Foto Bukti Visual Komponen NG ({imageAttachments.length} Foto Terlampir)
                </span>
                {imageAttachments.length === 1 ? (
                  <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 flex flex-col items-center justify-center min-h-[125mm] max-h-[135mm]">
                    <img
                      src={imageAttachments[0].base64}
                      alt={imageAttachments[0].name || "Foto Part NG"}
                      className="max-h-[118mm] max-w-full object-contain rounded border border-slate-200 shadow-sm"
                    />
                    <span className="text-[8.5px] text-slate-600 font-bold mt-1.5 font-mono">
                      Foto Temuan 1: {imageAttachments[0].name || "Foto Part NG"}
                    </span>
                  </div>
                ) : imageAttachments.length === 2 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {imageAttachments.map((img: any, i: number) => (
                      <div key={i} className="border border-slate-300 rounded-lg p-2 bg-slate-50/50 flex flex-col items-center justify-center min-h-[110mm] max-h-[120mm]">
                        <img
                          src={img.base64}
                          alt={img.name || `Foto Part NG ${i + 1}`}
                          className="max-h-[98mm] max-w-full object-contain rounded border border-slate-200 shadow-sm"
                        />
                        <span className="text-[8px] text-slate-600 font-bold mt-1 font-mono truncate max-w-[90%]">
                          Foto Temuan #{i + 1}: {img.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {imageAttachments.slice(0, 4).map((img: any, i: number) => (
                      <div key={i} className="border border-slate-300 rounded-lg p-1.5 bg-slate-50/50 flex flex-col items-center justify-center min-h-[58mm] max-h-[62mm]">
                        <img
                          src={img.base64}
                          alt={img.name || `Foto Part NG ${i + 1}`}
                          className="max-h-[48mm] max-w-full object-contain rounded border border-slate-200 shadow-sm"
                        />
                        <span className="text-[7.5px] text-slate-600 font-bold mt-0.5 font-mono truncate max-w-[90%]">
                          Foto #{i + 1}: {img.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Table of NG Parts & Footer */}
            <div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 uppercase text-[8px] font-bold block mb-1">
                  Rincian Part NG Terpengaruh
                </span>
                <table className="w-full border-collapse border border-slate-200 text-[8.5px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-black">
                      <th className="border border-slate-200 p-1 text-left">Nama Part</th>
                      <th className="border border-slate-200 p-1 text-center">Qty Total</th>
                      <th className="border border-slate-200 p-1 text-center">Qty NG</th>
                      <th className="border border-slate-200 p-1 text-center">Claim Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableParts.map((p: any, pIdx: number) => (
                      <tr key={pIdx} className="font-semibold text-slate-700">
                        <td className="border border-slate-200 p-1">{p.partName || headerPartName}</td>
                        <td className="border border-slate-200 p-1 text-center font-mono">{p.totalQty || qpr.totalItems || 0} pcs</td>
                        <td className="border border-slate-200 p-1 text-center font-bold text-red-650 font-mono">{p.qtyNG !== undefined ? p.qtyNG : (p.qtyNg || p.qtyClaim || qpr.rejectItems || 0)} pcs</td>
                        <td className="border border-slate-200 p-1 text-center font-bold text-emerald-700">REJECT / CLAIM</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-200 text-[8px] text-slate-500 font-semibold italic flex justify-between items-center">
                <span>Dokumen ini dicetak otomatis sebagai lampiran resmi Quality Problem Report ({qpr.qprNumber}).</span>
                <span>PT Menara Terus Makmur - Quality Division</span>
              </div>
            </div>
          </div>
        ) : (
          /* Multi-attachment mix or Document attachments */
          parsedAttachments.map((file: any, idx: number) => {
            const isImg = isImageAttachment(file);
            return (
              <div
                key={idx}
                className="qpr-attachment-print-page bg-white mx-auto shadow-md border border-slate-300 p-5 text-left font-sans text-slate-800 flex flex-col justify-between"
                style={{
                  width: inline ? "100%" : "210mm",
                  minHeight: inline ? "auto" : "297mm",
                  boxSizing: "border-box"
                }}
              >
                {/* Header */}
                <div>
                  <div className="border-b-2 border-black pb-2 flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-black text-black uppercase tracking-wider">
                        LAMPIRAN BUKTI KETIDAKSESUAIAN PART NG {isImg ? "(FOTO TEMUAN)" : "(DOKUMEN LAMPIRAN)"}
                      </h3>
                      <p className="text-[9px] text-slate-600 font-bold mt-0.5">
                        Lampiran #{idx + 1}: <span className="font-mono text-black font-bold">{file.name || `Lampiran_${idx + 1}`}</span> | Ref. QPR: <span className="font-mono text-blue-700 font-bold">{qpr.qprNumber}</span>
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                      EVIDENCE ATTACHED
                    </span>
                  </div>

                  {/* Metadata Summary */}
                  <div className="grid grid-cols-4 gap-2.5 my-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-semibold">
                    <div>
                      <span className="text-slate-500 uppercase text-[7.5px] font-bold block">Vendor / Supplier</span>
                      <span className="text-black font-extrabold truncate block">{qpr.supplierName || "-"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[7.5px] font-bold block">Ref. No. NCR</span>
                      <span className="text-black font-mono font-bold block">{qpr.refNcrNumber || "-"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[7.5px] font-bold block">Part Name / Number</span>
                      <span className="text-black font-bold truncate block">{headerPartName} ({headerPartNumber})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[7.5px] font-bold block">Total NG / Claim</span>
                      <span className="text-red-700 font-black font-mono block">{qpr.rejectItems || 0} pcs</span>
                    </div>
                  </div>

                  {/* Defect Description */}
                  <div className="mb-2.5">
                    <span className="text-slate-500 uppercase text-[8px] font-bold block mb-0.5">
                      Deskripsi Masalah / Problem Analysis
                    </span>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[9.5px] text-slate-800 italic leading-relaxed">
                      "{qpr.problem || "Ditemukan komponen NG saat proses verifikasi mutu."}"
                    </div>
                  </div>

                  {/* Attachment Content Body */}
                  <div className="my-2">
                    {isImg ? (
                      <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 flex flex-col items-center justify-center min-h-[125mm] max-h-[135mm]">
                        <img
                          src={file.base64}
                          alt={file.name || "Foto Part NG"}
                          className="max-h-[118mm] max-w-full object-contain rounded border border-slate-200 shadow-sm"
                        />
                        <span className="text-[8.5px] text-slate-600 font-bold mt-1.5 font-mono">
                          Foto Bukti Visual: {file.name}
                        </span>
                      </div>
                    ) : (
                      <div className="border border-slate-300 rounded-lg p-4 bg-slate-50/50 space-y-3">
                        <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                          <FileText size={16} />
                          <span>Dokumen Terlampir: {file.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 leading-relaxed font-mono p-3 bg-white border border-slate-200 rounded">
                          Dokumen PDF / File bukti ketidaksesuaian telah diintegrasikan pada berkas Quality Problem Report {qpr.qprNumber}.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table of NG Parts & Footer */}
                <div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 uppercase text-[8px] font-bold block mb-1">
                      Rincian Part NG Terpengaruh
                    </span>
                    <table className="w-full border-collapse border border-slate-200 text-[8.5px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-black">
                          <th className="border border-slate-200 p-1 text-left">Nama Part</th>
                          <th className="border border-slate-200 p-1 text-center">Qty Total</th>
                          <th className="border border-slate-200 p-1 text-center">Qty NG</th>
                          <th className="border border-slate-200 p-1 text-center">Claim Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableParts.map((p: any, pIdx: number) => (
                          <tr key={pIdx} className="font-semibold text-slate-700">
                            <td className="border border-slate-200 p-1">{p.partName || headerPartName}</td>
                            <td className="border border-slate-200 p-1 text-center font-mono">{p.totalQty || qpr.totalItems || 0} pcs</td>
                            <td className="border border-slate-200 p-1 text-center font-bold text-red-650 font-mono">{p.qtyNG !== undefined ? p.qtyNG : (p.qtyNg || p.qtyClaim || qpr.rejectItems || 0)} pcs</td>
                            <td className="border border-slate-200 p-1 text-center font-bold text-emerald-700">REJECT / CLAIM</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-200 text-[8px] text-slate-500 font-semibold italic flex justify-between items-center">
                    <span>Dokumen ini dicetak otomatis sebagai lampiran resmi Quality Problem Report ({qpr.qprNumber}).</span>
                    <span>PT Menara Terus Makmur - Quality Division</span>
                  </div>
                </div>
              </div>
            );
          })
        )
      ) : (
        /* Default Simulated Proof Sheet when no custom upload file exists */
        <div
          className="qpr-attachment-print-page bg-white mx-auto shadow-md border border-slate-300 p-5 text-left font-sans text-slate-800 flex flex-col justify-between"
          style={{
            width: inline ? "100%" : "210mm",
            minHeight: inline ? "auto" : "297mm",
            boxSizing: "border-box"
          }}
        >
          <div>
            <div className="border-b-2 border-black pb-2 flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-black uppercase tracking-wider">
                  LAMPIRAN BUKTI KETIDAKSESUAIAN (NCR ATTACHMENT)
                </h3>
                <p className="text-[9px] text-slate-600 font-bold mt-0.5">
                  Ref. No. NCR: <span className="font-mono text-black font-bold">{qpr.refNcrNumber || "NCR/2026/06/020"}</span> | Ref. QPR: <span className="font-mono text-blue-700 font-bold">{qpr.qprNumber}</span>
                </p>
              </div>
              <span className="text-[10px] font-black text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                CLAIM ATTACHED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-3 text-[9px] font-semibold">
              <div className="space-y-1">
                <span className="text-slate-400 text-[7.5px] uppercase tracking-wider block font-bold">Vendor Name</span>
                <span className="text-slate-800 font-bold">{qpr.supplierName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[7.5px] uppercase tracking-wider block font-bold">QPR Ref No</span>
                <span className="text-slate-800 font-bold font-mono">{qpr.qprNumber}</span>
              </div>
            </div>

            <div className="space-y-1.5 mb-3">
              <span className="text-slate-500 text-[8px] uppercase tracking-wider block font-bold">Defect / Problem Analysis Description</span>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] leading-relaxed text-slate-800 italic">
                "{qpr.problem || "Defect visual/dimensi pada komponen luar setelah proses assembly"}"
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-500 text-[8px] uppercase tracking-wider block font-bold">Daftar Part Terpengaruh</span>
              <table className="w-full border-collapse border border-slate-200 text-[8.5px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-black">
                    <th className="border border-slate-200 p-1 text-left">Part Name</th>
                    <th className="border border-slate-200 p-1 text-center">Qty Total</th>
                    <th className="border border-slate-200 p-1 text-center">Qty NG</th>
                  </tr>
                </thead>
                <tbody>
                  {tableParts.map((p: any, idx: number) => (
                    <tr key={idx} className="font-semibold text-slate-700">
                      <td className="border border-slate-200 p-1">{p.partName || headerPartName}</td>
                      <td className="border border-slate-200 p-1 text-center font-mono">{p.totalQty || qpr.totalItems || 0} pcs</td>
                      <td className="border border-slate-200 p-1 text-center font-bold text-red-650 font-mono">{(p.qtyNG !== undefined ? p.qtyNG : (p.qtyNg || p.qtyClaim || qpr.rejectItems || 0))} pcs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[8px] text-slate-500 font-semibold italic flex justify-between items-center">
            <span>Dokumen ini dicetak otomatis sebagai lampiran resmi Quality Problem Report ({qpr.qprNumber}).</span>
            <span>PT Menara Terus Makmur - Quality Division</span>
          </div>
        </div>
      )}
    </div>
  );

  if (inline) {
    return (
      <div className="w-full">
        {!hideVendorToggle && (
          <div className="flex justify-end mb-3 print:hidden w-full max-w-[210mm] mx-auto">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-250 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={isVendorCopy}
                onChange={(e) => setIsVendorCopy(e.target.checked)}
                className="w-3.5 h-3.5 border border-slate-350 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              Format Vendor (Sembunyikan Problem Occurance)
            </label>
          </div>
        )}
        <div id="qpr-print-root" className="w-full flex flex-col gap-6">
          {documentContent}
          {attachmentPrintPages}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 overflow-y-auto flex flex-col items-center p-4">
      {/* Action Bar */}
      <div className="fixed top-4 right-4 flex gap-2.5 z-50 print:hidden items-center">
        <label className="flex items-center gap-2 px-3 py-2 bg-slate-800/90 text-white rounded-lg text-xs font-bold shadow-lg border border-slate-700 cursor-pointer hover:bg-slate-750 transition-colors">
          <input
            type="checkbox"
            checked={isVendorCopy}
            onChange={(e) => setIsVendorCopy(e.target.checked)}
            className="w-3.5 h-3.5 border border-slate-650 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          Format Vendor (Sembunyikan Occurance)
        </label>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-lg transition-colors cursor-pointer"
        >
          <Printer size={14} />
          Cetak / Print (QPR + Bukti Lampiran)
        </button>
        {onEditRevision && qpr.status === "UNDER_REVISION" && (
          <button
            onClick={onEditRevision}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-lg transition-colors cursor-pointer"
          >
            <Edit size={14} />
            Revisi / Edit
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold shadow-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <X size={14} />
            Batal
          </button>
        )}
      </div>

      <div className="pt-16 pb-8 w-full flex flex-col items-center gap-6">
        <div id="qpr-print-root" className="w-full flex flex-col items-center gap-6">
          {documentContent}
          {attachmentPrintPages}
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm 8mm !important;
          }
          html, body {
            height: auto !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          body * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body.print-qpr-active * { 
            visibility: hidden !important; 
          }
          body.print-qpr-active #qpr-print-root,
          body.print-qpr-active #qpr-print-root * { 
            visibility: visible !important; 
          }
          body.print-qpr-active .fixed,
          body.print-qpr-active .backdrop-blur-sm,
          body.print-qpr-active div[class*="fixed"] {
            position: static !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          body.print-qpr-active #qpr-print-root {
            position: static !important;
            width: 100% !important;
            max-width: 194mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          body.print-qpr-active #qpr-print-area {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 194mm !important;
            height: 278mm !important;
            max-height: 278mm !important;
            min-height: 278mm !important;
            margin: 0 auto !important;
            padding: 4mm 6mm !important;
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          body.print-qpr-active #qpr-attachments-print-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-before: always !important;
            break-before: page !important;
            overflow: visible !important;
          }
          body.print-qpr-active .qpr-attachment-print-page {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 194mm !important;
            height: 278mm !important;
            max-height: 278mm !important;
            min-height: 278mm !important;
            margin: 0 auto !important;
            padding: 5mm 6mm !important;
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          body.print-qpr-active .qpr-attachment-print-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>
    </div>
  );
}


