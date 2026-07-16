"use client";

import React from "react";
import { X, Printer } from "lucide-react";

interface NcrPreviewProps {
  ncr: {
    docNumber?: string;
    ncrNumber?: string;
    date: string;
    supplierName: string;
    partNumber?: string;
    partName?: string;
    qty?: number;
    reject?: string | number;
    defectType?: string;
    disposition?: string;
    status?: string;
    requiredRole?: string;
    images?: string[];
    foundBy?: string;
    docsToRevise?: string | string[];
    locationFound?: string;
    problemType?: string;
    [key: string]: any;
  };
  onClose?: () => void;
  inline?: boolean;
}

export default function NcrPrintPreview({ ncr, onClose, inline = false }: NcrPreviewProps) {
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

  const docNo = ncr.ncrNumber || ncr.docNumber || "NCR/2026/06/001";
  const partNo = ncr.partNumber || "-";
  const rawPartName = ncr.partName || "CONE RACE ALL TYPE";
  const partName = rawPartName.toUpperCase().includes("ALL TYPE") ? "ALL TYPE" : rawPartName;
  const totalQty = ncr.qty || 75000;
  const rejectQtyStr = String(ncr.reject || "75.000 SET");
  const defect = ncr.defectType || "CONDITION PART NG DENT, UNDERFILL, OVER MACHINNING, ETC.";
  const dispType = ncr.disposition || "RETURN TO VENDOR";
  const locStr = ncr.locationFound || "IN-COMING";
  const probStr = ncr.problemType || "QUALITY";
  const inspectorStr = ncr.foundBy || "MR. HENDRIK (QC INC.)";

  // Checkbox state helpers
  const isRework = dispType.includes("REWORK");
  const isScrap = dispType.includes("SCRAP");
  const isReturn = dispType.includes("RETURN TO VENDOR");
  const isAccept = dispType.includes("ACCEPT AS IS");
  const isRepair = dispType.includes("REPAIR");
  const isRegrade = dispType.includes("REGRADE");

  // Signature status flags
  const isPreparedSigned = ncr.requiredRole !== "Foreman" || ncr.status === "APPROVED";
  const isCheckedSigned = ncr.requiredRole === "Dept Head" || ncr.requiredRole === "Closed" || ncr.status === "APPROVED";
  const isApprovedSigned = ncr.requiredRole === "Closed" || ncr.status === "APPROVED";

  const documentContent = (
    <div
      id="ncr-print-area"
      className={`bg-white mx-auto ${inline ? "w-full shadow-sm" : "shadow-2xl my-4"}`}
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "9.5px",
        border: "1.5px solid #000",
        width: inline ? "100%" : "210mm",
        maxWidth: "100%",
        minHeight: inline ? "auto" : "297mm",
        padding: inline ? "6px" : "10mm",
        boxSizing: "border-box",
        pageBreakInside: "avoid",
        breakInside: "avoid",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#fff"
      }}
    >

        {/* Company Header matching real NCR layout (3-column grid) */}
        <div style={{ display: "grid", gridTemplateColumns: "170px 1fr 130px", borderBottom: "2px solid #000", boxSizing: "border-box" }}>
          {/* Column 1: Logo Image only (image already has logo text) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 10px", borderRight: "1px solid #000" }}>
            <img src="/logo-mtm.jpg" alt="PT MTM Logo" style={{ height: "26px", objectFit: "contain", display: "block" }} />
          </div>

          {/* Column 2: Title */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", borderRight: "1px solid #000", padding: "4px" }}>
            <h2 style={{ fontSize: "12px", fontWeight: "900", margin: 0, fontFamily: "sans-serif", letterSpacing: "0.2px" }}>NONCONFORMANCE REPORT</h2>
            <span style={{ fontSize: "8.5px", fontWeight: "bold", marginTop: "2px" }}>(PR4-FRM-08001)</span>
          </div>

          {/* Column 3: Metadata */}
          <div style={{ display: "flex", flexDirection: "column", fontSize: "7.5px", fontFamily: "sans-serif", boxSizing: "border-box" }}>
            <div style={{ display: "grid", gridTemplateColumns: "50px 1fr", borderBottom: "1px solid #000", padding: "2px 6px", fontWeight: "bold" }}>
              <span>REV :</span>
              <span>B</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "50px 1fr", borderBottom: "1px solid #000", padding: "2px 6px", fontWeight: "bold" }}>
              <span>DATE :</span>
              <span>28 July 2025</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "50px 1fr", padding: "2px 6px", fontWeight: "bold" }}>
              <span>NO. :</span>
              <span className="font-mono">{docNo}</span>
            </div>
          </div>
        </div>

        {/* To / CC Section */}
        <div className="grid grid-cols-2 border-b border-black text-[9px] font-bold text-left leading-normal font-sans">
          <div className="p-2 border-r border-black uppercase text-slate-700">
            <span>TO : {ncr.supplierName || "SHIJIAZHUANG RUICHENG TRADE CO., LTD"}</span>
          </div>
          <div className="p-2 text-slate-700">
            <span>CC : PURCHASE & PPIC PT. MTM</span>
          </div>
        </div>

        {/* Part Detail Grid aligned to 2-row layout */}
        <table className="w-full border-collapse font-sans text-left text-[8.5px]" style={{ borderBottom: "1px solid #000" }}>
          <tbody>
            {/* Row 1: Headers and Inspector info */}
            <tr style={{ borderBottom: "1px solid #000" }}>
              <td style={{ width: "35%", borderRight: "1px solid #000", padding: "3px 6px", fontWeight: "bold" }}>
                PART NO : {partNo}
              </td>
              <td style={{ width: "25%", borderRight: "1px solid #000", padding: "3.5px 6px", fontWeight: "black", textTransform: "uppercase", textAlign: "center", color: "#475569" }}>
                LOCATION FOUND
              </td>
              <td style={{ width: "20%", borderRight: "1px solid #000", padding: "3.5px 6px", fontWeight: "black", textTransform: "uppercase", textAlign: "center", color: "#475569" }}>
                PROBLEM
              </td>
              <td style={{ width: "20%", padding: "3px 6px", fontWeight: "bold" }}>
                FOUND BY :
                <span style={{ float: "right", fontWeight: "900", color: "#0f172a" }}>{inspectorStr}</span>
              </td>
            </tr>
            {/* Row 2: Part Name and checkboxes */}
            <tr>
              <td style={{ borderRight: "1px solid #000", padding: "4px 6px", fontWeight: "bold", verticalAlign: "top" }}>
                PART NAME :
                <div style={{ marginTop: "4px", fontSize: "9px", fontWeight: "900", color: "#000" }}>{partName}</div>
              </td>
              <td style={{ borderRight: "1px solid #000", padding: "4px 6px", verticalAlign: "top" }}>
                <div className="grid grid-cols-2 gap-x-1 gap-y-1 font-bold text-[7.5px]">
                  <div className="flex items-center gap-1">
                    <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${locStr.includes("IN-COMING") ? "bg-slate-900 text-white" : ""}`}>
                      {locStr.includes("IN-COMING") && "✓"}
                    </span>
                    <span>IN-COMING</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${locStr.includes("OUT-GOING") ? "bg-slate-900 text-white" : ""}`}>
                      {locStr.includes("OUT-GOING") && "✓"}
                    </span>
                    <span>OUT-GOING</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${locStr.includes("IN-PROSES") ? "bg-slate-900 text-white" : ""}`}>
                      {locStr.includes("IN-PROSES") && "✓"}
                    </span>
                    <span>IN-PROSES</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${locStr.includes("CUSTOMER") ? "bg-slate-900 text-white" : ""}`}>
                      {locStr.includes("CUSTOMER") && "✓"}
                    </span>
                    <span>CUSTOMER</span>
                  </div>
                </div>
              </td>
              <td style={{ borderRight: "1px solid #000", padding: "4px 6px", verticalAlign: "top" }}>
                <div className="space-y-1 font-bold text-[7.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${probStr.includes("QUALITY") ? "bg-slate-900 text-white" : ""}`}>
                      {probStr.includes("QUALITY") && "✓"}
                    </span>
                    <span>QUALITY</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${probStr.includes("QUANTITY") ? "bg-slate-900 text-white" : ""}`}>
                      {probStr.includes("QUANTITY") && "✓"}
                    </span>
                    <span>QUANTITY</span>
                  </div>
                </div>
              </td>
              <td style={{ padding: "4px 6px", verticalAlign: "bottom", fontSize: "7.5px", color: "#64748b" }} className="font-bold">
                MR. SLAMET (QC CS)
              </td>
            </tr>
          </tbody>
        </table>

        {/* Description problem & QTY */}
        <div className="grid grid-cols-4 border-b border-black text-left font-sans">
          <div className="col-span-3 p-2.5">
            <span className="font-extrabold text-[8.5px] text-slate-700 block uppercase tracking-wide mb-1">DESCRIPTION PROBLEM :</span>
            <div className="text-[8.5px] leading-relaxed font-bold text-slate-850">
              CONDITION PART NG: {defect.toUpperCase()}
            </div>
          </div>
          <div className="col-span-1 p-2.5 border-l border-black flex flex-col justify-between text-[8px]">
            <span className="font-bold text-slate-500 uppercase">QTY :</span>
            <div className="font-black text-[9px] text-slate-900 leading-tight">
              {totalQty.toLocaleString("id-ID")} OF {totalQty.toLocaleString("id-ID")} SET
            </div>
          </div>
        </div>

        {/* # INFO LOT COME TO MTM Section */}
        <div className="border-b border-black p-3 text-left font-sans text-[8.5px] leading-normal bg-white">
          <span className="font-black block text-slate-900 mb-1"># INFO LOT COME TO MTM : JULY 2025</span>
          <div className="pl-2 font-bold text-slate-850 space-y-0.5">
            {ncr.partsDetail && ncr.partsDetail.length > 0 ? (
              <>
                {ncr.partsDetail.map((p: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-2 max-w-xs">
                    <span>{idx + 1}. {p.partName.toUpperCase()}</span>
                    <span>= {p.qtyNG.toLocaleString("id-ID")} PCS</span>
                  </div>
                ))}
                <div className="grid grid-cols-2 max-w-xs font-black border-t border-black pt-0.5 mt-0.5">
                  <span>TOTAL</span>
                  <span>= {ncr.qty ? ncr.qty.toLocaleString("id-ID") : totalQty.toLocaleString("id-ID")} SET</span>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 max-w-xs">
                  <span>1. {partName.toUpperCase()}</span>
                  <span>= {totalQty.toLocaleString("id-ID")} PCS</span>
                </div>
                <div className="grid grid-cols-2 max-w-xs font-black border-t border-black pt-0.5 mt-0.5">
                  <span>TOTAL</span>
                  <span>= {totalQty.toLocaleString("id-ID")} SET</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Activity Table with Man Power arrows */}
        <div className="border-b border-black font-sans">
          <table className="w-full text-left border-collapse text-[8.5px]">
            <thead>
              <tr className="bg-slate-50 font-black border-b border-black text-slate-900 text-center">
                <th className="px-3 py-1 border-r border-black" style={{ width: "45%" }}># ACTIVITY :</th>
                <th className="px-3 py-1 border-r border-black" style={{ width: "25%" }}># MAN POWER / DAY</th>
                <th className="px-3 py-1" style={{ width: "30%" }}>#CONSUMABLE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black font-bold text-slate-850">
              <tr>
                <td className="px-3 py-1.5 border-r border-black text-left">1. SORT BY INSPECTOR AT MTM</td>
                <td className="px-3 py-1.5 border-r border-black text-center relative">
                  <span>4 MAN POWER 1000 SET / DAY</span>
                </td>
                <td className="px-3 py-1.5">- GLOVER 6PCS</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border-r border-black text-left">2. ADD ANTIRUST</td>
                <td className="px-3 py-1.5 border-r border-black text-center text-slate-600">▲</td>
                <td className="px-3 py-1.5">- OIL RUST PROTECT 3L/DAY</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border-r border-black text-left">3. REPACKING AGAIN</td>
                <td className="px-3 py-1.5 border-r border-black text-center text-slate-600">▲</td>
                <td className="px-3 py-1.5">- PEN MARKER</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border-r border-black text-left">4. SORT CUSTOMER</td>
                <td className="px-3 py-1.5 border-r border-black text-center text-slate-600">▲</td>
                <td className="px-3 py-1.5"></td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border-r border-black text-left">5. EQUIPMENT DRY + TABLE</td>
                <td className="px-3 py-1.5 border-r border-black text-center text-slate-600">▲</td>
                <td className="px-3 py-1.5"></td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border-r border-black text-left">6. ADD MARKING</td>
                <td className="px-3 py-1.5 border-r border-black text-center text-slate-600">▲</td>
                <td className="px-3 py-1.5"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Disposition Section */}
        <div className="grid grid-cols-3 border-b border-black text-left text-[9px] font-bold font-sans">
          <div className="col-span-2 border-r border-black p-3 space-y-2">
            <span className="text-[9px] text-slate-900 block uppercase font-extrabold">DISPOSITION</span>
            <div className="grid grid-cols-2 gap-3 text-[8.5px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isRework ? "bg-slate-900 text-white" : ""}`}>
                  {isRework && "✓"}
                </span>
                <span>REWORK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isAccept ? "bg-slate-900 text-white" : ""}`}>
                  {isAccept && "✓"}
                </span>
                <span>ACCEPT AS IS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isScrap ? "bg-slate-900 text-white" : ""}`}>
                  {isScrap && "✓"}
                </span>
                <span>SCRAP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isRepair ? "bg-slate-900 text-white" : ""}`}>
                  {isRepair && "✓"}
                </span>
                <span>REPAIR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isReturn ? "bg-slate-900 text-white" : ""}`}>
                  {isReturn && "✓"}
                </span>
                <span>RETURN TO VENDOR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isRegrade ? "bg-slate-900 text-white" : ""}`}>
                  {isRegrade && "✓"}
                </span>
                <span>REGRADE</span>
              </div>
            </div>
          </div>

          <div className="col-span-1 p-3 flex flex-col justify-between text-[8px] font-bold">
            <span className="text-[8.5px] text-slate-900 block leading-normal uppercase">CUSTOMER APPROVAL REQUERED ?</span>
            <div className="flex gap-4 items-center justify-center py-2 text-[8.5px]">
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${ncr.customerApproval === "YES" ? "bg-slate-900 text-white" : ""}`}>
                  {ncr.customerApproval === "YES" && "✓"}
                </span>
                <span>YES</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${ncr.customerApproval === "NO" || !ncr.customerApproval ? "bg-slate-900 text-white" : ""}`}>
                  {(ncr.customerApproval === "NO" || !ncr.customerApproval) && "✓"}
                </span>
                <span>NO</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Complex Signatures & Reviews layout */}
        <table className="w-full border-collapse font-sans text-left text-[8px]" style={{ border: "1px solid #000", borderTop: "none", borderBottom: "none" }}>
          <tbody>
            <tr>
              {/* Quality Dept Column (Left) */}
              <td rowSpan={2} className="align-top p-0" style={{ width: "15%", borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                <table className="w-full h-full text-center" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ borderBottom: "1px solid #000", padding: "3px 2px", fontSize: "7px", fontWeight: "bold" }}>
                        DATE : {ncr.date || "28-7-2025"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderBottom: "1px solid #000", padding: "4px 2px", fontSize: "7.5px", fontWeight: "900", background: "#f8fafc", letterSpacing: "0.5px" }}>
                        QUALITY DEPT
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderBottom: "1px solid #000", height: "46px", position: "relative", padding: "2px" }}>
                        {isPreparedSigned ? (
                          <div className="absolute inset-0 flex items-center justify-center pb-2">
                            <svg width="45" height="18" viewBox="0 0 100 40">
                              <path d="M10,25 C30,10 50,35 70,15 C80,5 90,30 95,20" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                            </svg>
                          </div>
                        ) : (
                          <span className="text-slate-350 italic text-[7px] text-center block pt-3">(Pending)</span>
                        )}
                        <div className="absolute bottom-0 right-1 text-[6.5px] text-slate-500 font-extrabold">(STAFF)</div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderBottom: "1px solid #000", height: "46px", position: "relative", padding: "2px" }}>
                        {isCheckedSigned ? (
                          <div className="absolute inset-0 flex items-center justify-center pb-2">
                            <svg width="45" height="18" viewBox="0 0 100 40">
                              <path d="M15,30 Q35,5 55,25 T85,10" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                            </svg>
                          </div>
                        ) : (
                          <span className="text-slate-350 italic text-[7px] text-center block pt-3">(Pending)</span>
                        )}
                        <div className="absolute bottom-0 right-1 text-[6.5px] text-slate-500 font-extrabold">(SPV)</div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ height: "46px", position: "relative", padding: "2px" }}>
                        {isApprovedSigned ? (
                          <div className="absolute inset-0 flex items-center justify-center pb-2">
                            <svg width="45" height="18" viewBox="0 0 100 40">
                              <path d="M5,15 C20,35 45,5 65,30 C75,10 85,35 95,15" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                            </svg>
                          </div>
                        ) : (
                          <span className="text-slate-350 italic text-[7px] text-center block pt-3">(Pending)</span>
                        )}
                        <div className="absolute bottom-0 right-1 text-[6.5px] text-slate-500 font-extrabold">(MNG)</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>

              {/* Cause Column (Center Left) */}
              <td rowSpan={2} className="align-top p-2.5 font-bold" style={{ width: "29%", borderRight: "1px solid #000", borderBottom: "1px solid #000" }}>
                <div style={{ fontSize: "8px", fontWeight: "900", marginBottom: "4px" }}>CAUSE :</div>
                <div style={{ fontSize: "8px", lineHeight: "1.4", color: "#1e293b", fontWeight: "bold" }}>
                  {ncr.cause || ""}
                </div>
              </td>

              {/* Corrective Action Block (Center Right) */}
              <td className="align-top p-2.5 font-bold" style={{ width: "46%", borderRight: "1px solid #000", borderBottom: "1px solid #000", height: "92px" }}>
                <span style={{ fontSize: "8px", fontWeight: "900" }}>CORRECTIVE ACTION :</span>
                <div style={{ fontSize: "8px", lineHeight: "1.4", color: "#1e293b", fontWeight: "bold", marginTop: "4px" }}>
                  {ncr.correctiveAction || ""}
                </div>
              </td>

              {/* Prod Dept / Vendor Column (Right) - structured identical to Quality Dept */}
              <td rowSpan={2} className="align-top p-0 font-bold" style={{ width: "10%", borderBottom: "1px solid #000" }}>
                <table className="w-full h-full text-center" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ borderBottom: "1px solid #000", padding: "3px 2px", fontSize: "7px", fontWeight: "bold" }}>
                        &nbsp;
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderBottom: "1px solid #000", padding: "4px 2px", fontSize: "7.5px", fontWeight: "900", background: "#f8fafc", letterSpacing: "0.5px", lineHeight: "1.2" }}>
                        PROD DEPT /<br/>VENDOR
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderBottom: "1px solid #000", height: "46px", position: "relative", padding: "2px" }}>
                        <div className="absolute bottom-0 right-1 text-[6.5px] text-slate-400 font-extrabold">(STAFF)</div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderBottom: "1px solid #000", height: "46px", position: "relative", padding: "2px" }}>
                        <div className="absolute bottom-0 right-1 text-[6.5px] text-slate-400 font-extrabold">(SPV)</div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ height: "46px", position: "relative", padding: "2px" }}>
                        <div className="absolute bottom-0 right-1 text-[6.5px] text-slate-400 font-extrabold">(MNG)</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              {/* Preventive Action Block */}
              <td className="align-top p-2.5 font-bold" style={{ width: "46%", borderRight: "1px solid #000", borderBottom: "1px solid #000", height: "92px" }}>
                <span style={{ fontSize: "8px", fontWeight: "900" }}>PREVENTIVE ACTION :</span>
                <div style={{ fontSize: "8px", lineHeight: "1.4", color: "#1e293b", fontWeight: "bold", marginTop: "4px" }}>
                  {ncr.preventiveAction || ""}
                </div>
              </td>
            </tr>
          </tbody>
        </table>


        {/* Footer Notes & Document Checkboxes */}
        <div className="grid grid-cols-12 text-[8px] font-bold text-slate-800 divide-x divide-black bg-white font-sans border-b border-black">
          <div className="col-span-8 p-3 text-left leading-relaxed">
            <strong className="text-slate-900">NOTE :</strong>
            <div className="mt-1 space-y-0.5 text-[7.5px] text-slate-700">
              <div><strong>Rework</strong> : If the part can be repaired to standard with the addition of certain processes.</div>
              <div><strong>Scrap</strong> : If the part can no longer be processed.</div>
              <div><strong>Return to Vendor</strong> : If the part is supplied by the vendor.</div>
              <div><strong>Accept as is</strong> : If the product does not require any additional processing, it can be delivered.</div>
              <div><strong>Repair</strong> : If the part can be repaired outside the part's process.</div>
              <div><strong>Regrade</strong> : If the part can be processed directly by lowering the class of the part.</div>
            </div>
          </div>
          <div className="col-span-4 p-3 text-left space-y-1.5">
            <span className="text-[7.5px] text-slate-900 block uppercase font-black">Other documents that need to be rev. :</span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[7.5px] font-bold">
              {["CONTROL PLAN", "CHECK SHEET", "Q POINT", "MPS"].map((doc) => {
                const docsArr: string[] = Array.isArray(ncr.docsToRevise)
                  ? ncr.docsToRevise
                  : (ncr.docsToRevise || "").split(", ").map(d => d.trim()).filter(Boolean);
                const isChecked = docsArr.includes(doc);
                return (
                  <div key={doc} className="flex items-center gap-1">
                    <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isChecked ? "bg-slate-900 text-white" : ""}`}>
                      {isChecked && "✓"}
                    </span>
                    <span>{doc}</span>
                  </div>
                );
              })}
              {/* Row 5: empty dots */}
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 border border-black flex items-center justify-center"></span>
                <span className="text-slate-400 font-normal">........................</span>
              </div>
              {/* Row 6: empty dots */}
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 border border-black flex items-center justify-center"></span>
                <span className="text-slate-400 font-normal">........................</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta Text matching real paper */}
        <div className="flex justify-between items-center p-2 text-[7px] text-slate-500 font-bold font-sans">
          <span>FILE : QEHSS on (Z:)\PR4-FRM-08001, Non conformance Report</span>
          <span>Revisi Form : C , Effective Date : Dec 12, 2017</span>
        </div>
      </div>
  );

  if (inline) {
    return (
      <>
        {documentContent}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            html, body {
              width: 210mm;
              height: 297mm;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }
            body * {
              visibility: hidden !important;
            }
            #ncr-print-area, #ncr-print-area * {
              visibility: visible !important;
            }
            #ncr-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              background: #fff !important;
              display: block !important;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#25304b]/95 z-50 flex items-start justify-center p-6 py-10 overflow-y-auto print:p-0 print:bg-white">
      {/* Action Bar */}
      <div className="fixed top-4 right-4 flex gap-2 z-50 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-lg transition-colors cursor-pointer"
        >
          <Printer size={14} />
          Cetak / Print
        </button>
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
      <div className="w-full flex justify-center print:block">
        {documentContent}
      </div>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html, body {
            height: auto;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          /* Hide all page content visually */
          body * {
            visibility: hidden !important;
          }
          /* Show only the NCR print area */
          #ncr-print-area, #ncr-print-area * {
            visibility: visible !important;
          }
          #ncr-print-area {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 190mm !important;
            height: 277mm !important;
            border: 1.5px solid #000 !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            background: #fff !important;
            page-break-inside: avoid !important;
            display: block !important;
            transform: scale(0.92) !important;
            transform-origin: top center !important;
          }
        }
      `}</style>
    </div>
  );
}
