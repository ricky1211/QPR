"use client";

import React from "react";
import { X, Printer, Edit, FileText } from "lucide-react";

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

export default function QprPrintPreview({ qpr, onClose, inline = false, onEditRevision }: QprPreviewProps) {
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

  const parsedAttachments = React.useMemo(() => {
    if (qpr.pdfFiles && Array.isArray(qpr.pdfFiles)) {
      return qpr.pdfFiles;
    }
    if (qpr.pdfFileBase64) {
      try {
        if (qpr.pdfFileBase64.startsWith('[')) {
          return JSON.parse(qpr.pdfFileBase64);
        }
      } catch (e) {}
      return [{ name: qpr.pdfFileName || "attachment.pdf", base64: qpr.pdfFileBase64 }];
    }
    return [];
  }, [qpr.pdfFiles, qpr.pdfFileBase64, qpr.pdfFileName]);

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
    const upper = fullName.toUpperCase();
    if (upper.includes("JAYADI")) return "PT. JAYADI";
    if (upper.includes("IKAN BAKAR")) return "PT. IKAN BAKAR";
    if (upper.includes("RUICHENG")) return "SZJR TR.CO.";
    if (upper.includes("MENARA TERUS MAKMUR")) return "PT. MTM";
    return fullName.replace("PT ", "PT. ").substring(0, 15);
  };
  const shortVendorName = getShortVendorName(qpr.supplierName);

  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    if (inline) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
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

  // QPR Signature states based on workflow role
  const isSectionHeadSigned = qpr.requiredRole !== "Section Head" || qpr.status === "APPROVED";
  const isDeptHeadSigned = (qpr.requiredRole !== "Section Head" && qpr.requiredRole !== "Dept Head") || qpr.status === "APPROVED";
  const isDivHeadSigned = (qpr.requiredRole !== "Section Head" && qpr.requiredRole !== "Dept Head" && qpr.requiredRole !== "Div Head") || qpr.status === "APPROVED";
  const isPurchasingSigned = qpr.requiredRole === "Closed" || qpr.status === "APPROVED" || qpr.status === "CLOSED";
  const isAccountingSigned = qpr.requiredRole === "Closed" || qpr.status === "APPROVED" || qpr.status === "CLOSED";

  const documentContent = (
    <div
      id="qpr-print-area"
      className={`bg-white mx-auto ${inline ? "w-full shadow-sm" : "shadow-2xl my-4"} flex flex-col`}
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        border: "1px solid #000",
        width: inline ? "100%" : "210mm",
        minHeight: inline ? "auto" : "297mm",
        padding: inline ? "8px" : "15mm",
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
                <span contentEditable suppressContentEditableWarning className="focus:bg-yellow-50 focus:outline-none print:bg-transparent">{qpr.supplierName || "SHIJIAZHUANG RUICHENG TR.CO.LTD."}</span>
              </div>
              <div style={{ fontSize: "8.5px", lineHeight: "1.5", fontWeight: "bold", color: "#334155" }}>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Part Name</span>
                  <span>: <span contentEditable suppressContentEditableWarning className="focus:bg-yellow-50 focus:outline-none print:bg-transparent">{qpr.partName || "ALL TYPE PART FINISH"}</span></span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Part Number</span>
                  <span>: <span contentEditable suppressContentEditableWarning className="focus:bg-yellow-50 focus:outline-none print:bg-transparent">{qpr.partNumber || ""}</span></span>
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
              {(qpr.parts || PART_ITEMS).map((item: any) => {
                const totalQty = item.totalQty || 0;
                const qtyNG = item.qtyNG !== undefined ? item.qtyNG : item.qtyNg || 0;
                const stdAllowance = item.stdAllowance !== undefined ? item.stdAllowance : Math.round(totalQty * 0.005);
                const ngActual = item.ngActual !== undefined ? item.ngActual : (totalQty > 0 ? (qtyNG / totalQty) * 100 : 0);
                const qtyClaim = item.qtyClaim !== undefined ? item.qtyClaim : qtyNG - stdAllowance;
                return (
                  <tr key={item.no}>
                    <td style={{ border: "1px solid #000", padding: "3px 4px", textAlign: "center" }}>{item.no}</td>
                    <td style={{ border: "1px solid #000", padding: "4px 8px", fontWeight: "bold", wordBreak: "break-word", whiteSpace: "normal", lineHeight: "1.35", color: "#0f172a" }}>{item.partName}</td>
                    <td style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center" }}>{totalQty.toLocaleString("id-ID")}</td>
                    <td style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center" }}>{qtyNG.toLocaleString("id-ID")}</td>
                    <td style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center", fontWeight: "bold", color: "#b91c1c" }}>{ngActual.toFixed(2)}%</td>
                    <td style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center" }}>{stdAllowance.toLocaleString("id-ID")}</td>
                    <td style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center", fontWeight: "bold" }}>{qtyClaim.toLocaleString("id-ID")}</td>
                  </tr>
                );
              })}
              {[...Array(2)].map((_, i) => (
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
        <div style={{ borderBottom: "1px solid #000", padding: "10px 12px", flexGrow: 1, display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "8px" }}>
          <div style={{ fontWeight: "bold", fontSize: "9px", textTransform: "uppercase", color: "#374151", whiteSpace: "nowrap" }}>REMARKS :</div>
          <div 
            contentEditable 
            suppressContentEditableWarning
            className="focus:bg-yellow-50 focus:outline-none print:bg-transparent"
            style={{ fontSize: "8.5px", minHeight: "45px", flexGrow: 1, outline: "none", whiteSpace: "pre-wrap", color: "#1f2937" }}
          >
            {qpr.remarks || ""}
          </div>
        </div>

        {/* JENIS CLAIM + Signature */}
        <div style={{ display: "flex", borderBottom: "1.5px solid #000", marginTop: "auto" }}>
          {/* Jenis Claim */}
          <div style={{ flex: 1, borderLeft: "1px solid #000", borderRight: "1px solid #000", padding: "10px 12px" }}>
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
          <div style={{ flex: 1, borderLeft: "1px solid #000", borderRight: "1px solid #000" }}>
            <div style={{ borderBottom: "1px solid #000", textAlign: "center", padding: "4px", fontSize: "8px", fontWeight: "bold", color: "#1e293b" }}>
              Cikarang, {formatDateIndo(qpr.date)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
              {[
                { 
                  type: "Prepared", 
                  name: qpr.user?.name || "QPR Creator", 
                  role: "(Creator)",
                  isSigned: true,
                  sigSvg: (
                    <svg width="40" height="24" viewBox="0 0 100 60" style={{ opacity: 0.85 }}>
                      <path d="M15,35 Q30,10 45,35 T75,35 M35,5 L35,45" stroke="#1e293b" strokeWidth="2.2" fill="none" />
                    </svg>
                  )
                },
                { 
                  type: "Checked", 
                  name: "Heru S.", 
                  role: "(Section Head)",
                  isSigned: isSectionHeadSigned,
                  sigSvg: (
                    <svg width="40" height="24" viewBox="0 0 100 60" style={{ opacity: 0.85 }}>
                      <path d="M15,40 Q30,15 45,40 T75,40 M35,10 L35,50 M25,25 L85,25" stroke="#1e293b" strokeWidth="2.2" fill="none" />
                    </svg>
                  )
                },
                { 
                  type: "Checked", 
                  name: "Septian N.", 
                  role: "(Dept. Head Quality)",
                  isSigned: isDeptHeadSigned,
                  sigSvg: (
                    <svg width="40" height="24" viewBox="0 0 100 60" style={{ opacity: 0.85 }}>
                      <path d="M15,45 Q30,20 45,45 T75,45 M35,15 L35,55 M25,30 L85,30" stroke="#1e293b" strokeWidth="2.2" fill="none" />
                    </svg>
                  )
                },
                { 
                  type: "Approved", 
                  name: "Putu R. S.", 
                  role: "(Div. Head)",
                  isSigned: isDivHeadSigned,
                  sigSvg: (
                    <svg width="40" height="24" viewBox="0 0 100 60" style={{ opacity: 0.85 }}>
                      <path d="M10,25 Q30,5 50,25 T90,25 M50,10 L50,50" stroke="#0f172a" strokeWidth="2.2" fill="none" />
                    </svg>
                  )
                }
              ].map((sig, i) => (
                <div key={i} style={{ borderRight: i < 3 ? "1px solid #000" : "none", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "60px" }}>
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

  if (inline) {
    return (
      <div className="w-full flex flex-col items-center">
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
        {documentContent}

        {/* Lampiran PDF check block (inline) */}
        {parsedAttachments.length > 0 && (
          <div className="w-full max-w-[210mm] mt-4 print:hidden flex flex-col gap-2">
            {parsedAttachments.length > 1 && (
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-lg w-full">
                {parsedAttachments.map((file: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveAttachmentIdx(idx)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeAttachmentIdx === idx
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <FileText size={11} />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                  </button>
                ))}
              </div>
            )}
            {/* Direct File View (PDF Embed or Simulation) - Inline version */}
            <div className="w-full h-[450px] bg-slate-50 rounded-lg overflow-hidden border border-slate-200 relative shadow-sm">
              {activeAttachment && activeAttachment.base64 ? (
                <iframe
                  src={pdfBlobUrl}
                  className="w-full h-full border-0"
                  title={`Uploaded PDF Attachment: ${activeAttachment.name}`}
                />
              ) : (
                <div className="w-full h-full pt-9 px-6 pb-4 overflow-y-auto flex flex-col items-center">
                  {/* Simulated A4 PDF Document Sheet */}
                  <div className="w-full max-w-[170mm] min-h-[300px] bg-white border border-slate-200 shadow-sm p-6 text-left font-sans text-slate-650 space-y-4">
                    <div className="border-b border-slate-200 pb-2.5 flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-slate-800">BUKTI KETIDAKSESUAIAN (NCR ATTACHMENT)</h4>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">Reference NCR No: {qpr.refNcrNumber || "NCR/2026/06/020"}</p>
                      </div>
                      <span className="text-[9px] font-black text-red-650 bg-red-50 border border-red-100 px-2 py-0.5 rounded">CLAIM ATTACHED</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[9px] font-semibold">
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[8px] uppercase tracking-wider block">Vendor Name</span>
                        <span className="text-slate-700 font-bold">{qpr.supplierName}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[8px] uppercase tracking-wider block">QPR Ref No</span>
                        <span className="text-slate-700 font-bold font-mono">{qpr.qprNumber}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-slate-400 text-[8px] uppercase tracking-wider block">Defect / Problem Analysis Description</span>
                      <div className="bg-slate-50/50 p-2.5 rounded border border-slate-150 text-[9.5px] leading-relaxed text-slate-700 italic">
                        "{qpr.problem || "Defect visual/dimensi pada komponen luar setelah proses assembly"}"
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-slate-400 text-[8px] uppercase tracking-wider block">Daftar Part Terpengaruh</span>
                      <table className="w-full border-collapse border border-slate-150 text-[8.5px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-black">
                            <th className="border border-slate-150 p-1 text-left">Part Name</th>
                            <th className="border border-slate-150 p-1 text-center">Qty NG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qpr.parts && qpr.parts.length > 0 ? (
                            qpr.parts.map((p: any, idx: number) => (
                              <tr key={idx} className="font-semibold text-slate-650">
                                <td className="border border-slate-150 p-1">{p.partName}</td>
                                <td className="border border-slate-150 p-1 text-center font-bold text-red-650">{p.qtyNG || p.qtyNg || p.qtyClaim || 0} pcs</td>
                              </tr>
                            ))
                          ) : (
                            <tr className="font-semibold text-slate-650">
                              <td className="border border-slate-150 p-1">{qpr.partName || "ALL TYPE PART FINISH"}</td>
                              <td className="border border-slate-150 p-1 text-center font-bold text-red-650">{qpr.rejectItems || 0} pcs</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
            #qpr-print-area, #qpr-print-area * { visibility: visible; }
            #qpr-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 198mm !important;
              height: 285mm !important;
              min-height: 0 !important;
              margin: 0 auto !important;
              padding: 6mm !important;
              border: none !important;
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
          Cetak / Print
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
      <div className="pt-16 pb-8 w-full flex flex-col items-center gap-4">
        {documentContent}
        {/* Lampiran PDF check block */}
        {parsedAttachments.length > 0 && (
          <div className="w-full max-w-[210mm] mx-auto print:hidden mt-4 flex flex-col gap-2">
            {parsedAttachments.length > 1 && (
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-lg w-full">
                {parsedAttachments.map((file: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveAttachmentIdx(idx)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeAttachmentIdx === idx
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <FileText size={11} />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                  </button>
                ))}
              </div>
            )}
            {/* Direct File View (PDF Simulation) */}
            <div className="w-full h-[600px] bg-slate-50 rounded-lg overflow-hidden border border-slate-300 relative shadow-sm">
              {activeAttachment && activeAttachment.base64 ? (
                <iframe
                  src={pdfBlobUrl}
                  className="w-full h-full border-0"
                  title={`Uploaded PDF Attachment: ${activeAttachment.name}`}
                />
              ) : (
                <div className="w-full h-full pt-9 px-8 pb-4 overflow-y-auto flex flex-col items-center">
                  {/* Simulated A4 PDF Document Sheet */}
                  <div className="w-full max-w-[180mm] min-h-[400px] bg-white border border-slate-300 shadow-sm p-8 text-left font-sans text-slate-700 space-y-4">
                    <div className="border-b-2 border-slate-400 pb-3 flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-slate-800">BUKTI KETIDAKSESUAIAN (NCR ATTACHMENT)</h4>
                        <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Reference NCR No: {qpr.refNcrNumber || "-"}</p>
                      </div>
                      <span className="text-xs font-bold text-red-650 bg-red-50 border border-red-200 px-2.5 py-1 rounded">CLAIM ATTACHED</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[10px] font-semibold">
                      <div className="space-y-1.5">
                        <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Vendor Name</span>
                        <span className="text-slate-800 font-bold">{qpr.supplierName}</span>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-slate-400 text-[9px] uppercase tracking-wider block">QPR Ref No</span>
                        <span className="text-slate-855 font-bold font-mono">{qpr.qprNumber}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-slate-450 text-[9px] uppercase tracking-wider block">Defect / Problem Analysis Description</span>
                      <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[10.5px] leading-relaxed text-slate-800 italic">
                        "{qpr.problem || "Defect visual/dimensi pada komponen luar setelah proses assembly"}"
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-slate-450 text-[9px] uppercase tracking-wider block">Daftar Part Terpengaruh</span>
                      <table className="w-full border-collapse border border-slate-200 text-[9px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-black">
                            <th className="border border-slate-200 p-1.5 text-left">Part Name</th>
                            <th className="border border-slate-200 p-1.5 text-center">Qty NG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qpr.parts && qpr.parts.length > 0 ? (
                            qpr.parts.map((p: any, idx: number) => (
                              <tr key={idx} className="font-semibold text-slate-700">
                                <td className="border border-slate-200 p-1.5">{p.partName}</td>
                                <td className="border border-slate-200 p-1.5 text-center font-bold text-red-650">{(p.qtyNG !== undefined ? p.qtyNG : (p.qtyNg || p.qtyClaim || 0))} pcs</td>
                              </tr>
                            ))
                          ) : (
                            <tr className="font-semibold text-slate-750">
                              <td className="border border-slate-200 p-1.5">{qpr.partName || "ALL TYPE PART FINISH"}</td>
                              <td className="border border-slate-200 p-1.5 text-center font-bold text-red-650">{qpr.rejectItems || 0} pcs</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
          #qpr-print-area, #qpr-print-area * { visibility: visible; }
          #qpr-print-area {
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


