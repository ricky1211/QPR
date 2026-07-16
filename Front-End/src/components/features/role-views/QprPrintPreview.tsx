"use client";

import React from "react";
import { X, Printer } from "lucide-react";

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

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-3 h-3 border border-black flex items-center justify-center flex-shrink-0">
        {checked && <span style={{ fontSize: "8px" }} className="font-black leading-none">V</span>}
      </div>
      <span style={{ fontSize: "8px" }}>{label}</span>
    </div>
  );
}

export default function QprPrintPreview({ qpr, onClose, inline = false }: QprPreviewProps) {
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
      className={`bg-white mx-auto ${inline ? "w-full shadow-sm" : "shadow-2xl my-4"}`}
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        border: "1px solid #000",
        width: inline ? "100%" : "210mm",
        minHeight: inline ? "auto" : "297mm",
        padding: inline ? "8px" : "15mm",
        boxSizing: "border-box"
      }}
    >
        {/* Company Header */}
        <div className="flex items-center" style={{ borderBottom: "1px solid #000", padding: "6px 10px" }}>
          <div style={{ width: "170px", minWidth: "170px", marginRight: "12px", display: "flex", alignItems: "center" }}>
            <img src="/logo-mtm.jpg" alt="PT MTM Logo" style={{ height: "26px", objectFit: "contain", display: "block" }} />
          </div>
          <div className="flex-1 text-center text-slate-700" style={{ fontSize: "7.5px", lineHeight: "1.6" }}>
            <div className="font-bold" style={{ fontSize: "9px" }}>PT MENARA TERUS MAKMUR</div>
            <div>Jl. Jababeka XI Blok H 1 No. 12, Jababeka Industrial Estate</div>
            <div>17530 CIKARANG BEKASI INDONESIA</div>
            <div>TELP: (62-21) 8934504, FAX: (62-21) 8934505</div>
          </div>
          <div className="text-right text-slate-600" style={{ width: "100px", minWidth: "100px", fontSize: "7.5px" }}>
            <div className="font-bold" style={{ fontSize: "8px" }}>(PR4-FRM-08101)</div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center" style={{ backgroundColor: "#000", color: "#fff", borderBottom: "1px solid #000", padding: "6px 0" }}>
          <div className="font-black tracking-wide uppercase" style={{ fontSize: "18px" }}>QUALITY PROBLEM REPORT</div>
          <div className="font-bold tracking-wider text-slate-350" style={{ fontSize: "9px" }}>( PR4-FRM-08101 )</div>
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
                {qpr.supplierName || "SHIJIAZHUANG RUICHENG TR.CO.LTD."}
              </div>
              <div style={{ fontSize: "8.5px", lineHeight: "1.5", fontWeight: "bold", color: "#334155" }}>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Part Name</span>
                  <span>: {qpr.partName || "ALL TYPE PART FINISH"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Part Number</span>
                  <span>: {qpr.partNumber || ""}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Model</span>
                  <span>: {qpr.model || ""}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Lot/Batch</span>
                  <span>: {qpr.lotBatch || ""}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Date</span>
                  <span>: {formatDateIndo(qpr.date)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "85px 1fr" }}>
                  <span>Problem</span>
                  <span>: {qpr.problem || "VISUAL NG"}</span>
                </div>
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
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "7px", borderBottom: "1px solid #000", padding: "2px", background: "#f1f5f9", textTransform: "uppercase" }}>
                    Problem Occurance in one year
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 32px", borderBottom: "1px solid #000", flex: 1, alignItems: "center" }}>
                    <div style={{ borderRight: "1px solid #000", padding: "2px 4px", fontWeight: "bold", fontSize: "7px" }}>1st time</div>
                    <div style={{ padding: "2px", display: "flex", justifyContent: "center" }}>
                      <span style={{ width: "12px", height: "12px", border: "1px solid #000", display: "inline-block", backgroundColor: "#ef4444" }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 32px", borderBottom: "1px solid #000", flex: 1, alignItems: "center" }}>
                    <div style={{ borderRight: "1px solid #000", padding: "2px 4px", fontWeight: "bold", fontSize: "7px" }}>More Than one</div>
                    <div style={{ padding: "2px", display: "flex", justifyContent: "center" }}>
                      <span style={{ width: "12px", height: "12px", border: "1px solid #000", display: "inline-block", backgroundColor: "white" }} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: "4px", fontSize: "7px", fontWeight: "bold", borderTop: "none" }}>
                  REF. TO NCR NO : <span style={{ fontFamily: "monospace", fontSize: "7px", color: "#1e40af" }}>{qpr.refNcrNumber || "240/QI/NCR/SUP/VII/25"}</span>
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
                <th style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center", fontWeight: "bold", backgroundColor: "#f1f5f9" }}>PART NAME</th>
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
                    <td style={{ border: "1px solid #000", padding: "2.5px 4px", textAlign: "center" }}>{item.no}</td>
                    <td style={{ border: "1px solid #000", padding: "2.5px 6px", fontWeight: "600" }}>{item.partName}</td>
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

        {/* Claim NG Box */}
        <div style={{ borderBottom: "1px solid #000", display: "flex", alignItems: "center", padding: "16px 20px", position: "relative" }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div>
              <div style={{ border: "2px solid #000", padding: "8px 32px", textAlign: "center", fontWeight: "900", fontSize: "14px", letterSpacing: "0.02em" }}>
                Claim NG TO {qpr.supplierName ? qpr.supplierName.toUpperCase().replace("PT ", "") : "SJZ RUICHENG TR.CO."}
              </div>
              <div style={{ marginTop: "6px", fontSize: "10px", fontWeight: "bold", fontStyle: "italic", color: "#475569", textAlign: "center" }}>
                Claim biaya sortir + re-packing
              </div>
            </div>
          </div>
          {/* SVG Bent Arrow pointing up-right to table column */}
          <div style={{ width: "90px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center", paddingRight: "16px" }}>
            <svg width="80" height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5,45 L45,45 L45,28 L35,28 L50,10 L65,28 L55,28 L55,55 L5,55 Z" fill="#ef4444" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* DETAIL KEJADIAN */}
        <div style={{ borderBottom: "1px solid #000", padding: "10px 12px" }}>
          <div style={{ fontWeight: "bold", fontSize: "9px", textTransform: "uppercase", marginBottom: "8px", color: "#374151" }}>DETAIL KEJADIAN :</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <FactorySVG label="MACHINING" />
              <div style={{ fontSize: "7.5px", fontWeight: "bold", color: "#334155", marginTop: "4px" }}>SZJR TR.CO.</div>
            </div>
            
            <FlowArrow />
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <FactorySVG label="" subContent={
                <div className="relative flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
                  <div className="absolute border-2 border-red-650" style={{ width: "30px", height: "30px", transform: "rotate(45deg)" }} />
                  <span className="relative z-10 text-center font-black" style={{ fontSize: "6.5px", color: "#dc2626", lineHeight: "1.1" }}>
                    INCOMING<br/>&amp;<br/>PACKING
                  </span>
                </div>
              } />
              <div style={{ fontSize: "7.5px", fontWeight: "bold", color: "#334155", marginTop: "4px" }}>PT. MTM</div>
            </div>
            
            <FlowArrow />
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ border: "1.5px solid #64748b", borderRadius: "6px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc" }}>
                <div style={{ border: "1px solid #000", background: "#ffffff", padding: "6px 8px", fontWeight: "bold", fontSize: "7.5px", display: "flex", alignItems: "center", justifyContent: "center", width: "70px", height: "38px" }}>
                  ASSY FINISH
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <FlowArrow />
                </div>
                <div style={{ border: "1px solid #000", background: "#ffffff", padding: "2px", display: "flex", alignItems: "center", justifyContent: "center", width: "70px", height: "38px" }}>
                  <div className="relative flex items-center justify-center" style={{ width: "42px", height: "42px" }}>
                    <div className="absolute border-2 border-cyan-500" style={{ width: "30px", height: "30px", transform: "rotate(45deg)" }} />
                    <span className="relative z-10 text-center font-black" style={{ fontSize: "6px", color: "#06b6d4", lineHeight: "1.1" }}>
                      FINAL<br/>INSPEKSI
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "7.5px", fontWeight: "bold", color: "#334155", marginTop: "4px" }}>CUSTOMER</div>
            </div>
          </div>
        </div>

        {/* MTM REQUEST TABLE */}
        <div style={{ borderBottom: "1px solid #000" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.5px" }}>
            <thead>
              <tr style={{ backgroundColor: "transparent" }}>
                <th style={{ border: "1.5px solid #000", backgroundColor: "#f1f5f9", width: "32px", minWidth: "32px", padding: "2.5px 3px" }}>&nbsp;</th>
                <th style={{ border: "1.5px solid #000", borderBottom: "1.5px solid #000", backgroundColor: "#f1f5f9", padding: "2.5px 3px", fontWeight: "bold", textAlign: "center", width: "30px" }}>NO</th>
                <th style={{ border: "1.5px solid #000", borderBottom: "1.5px solid #000", backgroundColor: "#f1f5f9", padding: "2.5px 3px", fontWeight: "bold", textAlign: "center" }}>ITEM</th>
                <th style={{ border: "1.5px solid #000", borderBottom: "1.5px solid #000", backgroundColor: "#f1f5f9", padding: "2.5px 3px", fontWeight: "bold", width: "20px" }}>&nbsp;</th>
                <th style={{ border: "1.5px solid #000", borderBottom: "1.5px solid #000", backgroundColor: "#f1f5f9", padding: "2.5px 3px", fontWeight: "bold", textAlign: "center", width: "60px" }}>D/D</th>
                <th style={{ border: "1.5px solid #000", borderBottom: "1.5px solid #000", backgroundColor: "#f1f5f9", padding: "2.5px 3px", fontWeight: "bold", textAlign: "center", width: "60px" }}>PIC</th>
                <th style={{ border: "1.5px solid #000", borderBottom: "1.5px solid #000", backgroundColor: "#f1f5f9", padding: "2.5px 3px", fontWeight: "bold", textAlign: "center", width: "150px" }}>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {[
                { no: 1, items: ["Sortir Internal Supplier", "Sortir MTM", "Sortir Customer"] },
                { no: 2, items: ["Report Plan Activity"] },
                { no: 3, items: ["PICA"] },
                { no: 4, items: ["Presentasi"] },
                { no: 5, items: ["Audit"] },
                { no: 6, items: ["Others"] },
              ].map((row, rowIndex) => (
                <React.Fragment key={row.no}>
                  {row.items.map((item, i) => (
                    <tr key={`${row.no}-${i}`} style={{ backgroundColor: "transparent" }}>
                      {/* Vertical MTM REQUEST header rendered only in the very first cell of the body */}
                      {rowIndex === 0 && i === 0 && (
                        <td rowSpan={8} style={{ border: "1.5px solid #000", backgroundColor: "#475569", color: "#ffffff", fontWeight: "bold", fontSize: "8px", width: "32px", minWidth: "32px", padding: "2px 0", textAlign: "center", verticalAlign: "middle" }}>
                          <div style={{
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                            whiteSpace: "nowrap",
                            margin: "0 auto",
                            letterSpacing: "0.05em",
                            display: "inline-block"
                          }}>
                            MTM REQUEST
                          </div>
                        </td>
                      )}
                      {i === 0 && (
                        <td rowSpan={row.items.length} style={{ border: "1.5px solid #000", padding: "1.5px 2px", textAlign: "center", fontFamily: "monospace", fontWeight: "bold", fontSize: "8px" }}>
                          {row.no}
                        </td>
                      )}
                      <td style={{ border: "1.5px solid #000", padding: "1.5px 4px", fontSize: "7px", fontWeight: "bold" }}>{item}</td>
                      <td style={{ border: "1.5px solid #000", padding: "1.5px 3px", textAlign: "center", fontWeight: "bold", fontSize: "7.5px" }}>-</td>
                      <td style={{ border: "1.5px solid #000", padding: "1.5px 3px", textAlign: "center", fontWeight: "bold", fontSize: "7.5px" }}>-</td>
                      <td style={{ border: "1.5px solid #000", padding: "1.5px 3px", textAlign: "center", fontWeight: "bold", fontSize: "7.5px" }}>-</td>
                      <td style={{ border: "1.5px solid #000", padding: "1.5px 3px" }}>&nbsp;</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* JENIS CLAIM + Signature */}
        <div style={{ display: "flex" }}>
          {/* Jenis Claim */}
          <div style={{ flex: 1, borderRight: "1px solid #000", padding: "10px 12px" }}>
            <div style={{ fontWeight: "bold", fontSize: "8.5px", textTransform: "uppercase", marginBottom: "8px" }}>JENIS CLAIM :</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
              <CheckItem label="MATERIAL" checked={(qpr.claimType || ["PROSES PACKING", "PROSES CHECK"]).includes("MATERIAL")} />
              <CheckItem label="PAINTING/PLATING" checked={(qpr.claimType || ["PROSES PACKING", "PROSES CHECK"]).includes("PAINTING/PLATING")} />
              <CheckItem label="PROSES PACKING" checked={(qpr.claimType || ["PROSES PACKING", "PROSES CHECK"]).includes("PROSES PACKING")} />
              <CheckItem label="PARKEREZING" checked={(qpr.claimType || ["PROSES PACKING", "PROSES CHECK"]).includes("PARKEREZING")} />
              <CheckItem label="PROSES CHECK" checked={(qpr.claimType || ["PROSES PACKING", "PROSES CHECK"]).includes("PROSES CHECK")} />
              <CheckItem label="HEAT TREATMENT" checked={(qpr.claimType || ["PROSES PACKING", "PROSES CHECK"]).includes("HEAT TREATMENT")} />
            </div>
          </div>

          {/* Signature Block */}
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: "1px solid #000", textAlign: "center", padding: "4px", fontSize: "8px", fontWeight: "bold", color: "#1e293b" }}>
              Cikarang, {formatDateIndo(qpr.date)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr" }}>
              {[
                { 
                  type: "Prepared", 
                  name: "Heru S.", 
                  isSigned: isSectionHeadSigned,
                  sigSvg: (
                    <svg width="40" height="24" viewBox="0 0 100 60" style={{ opacity: 0.85 }}>
                      <path d="M15,40 Q30,15 45,40 T75,40 M35,10 L35,50 M25,25 L85,25" stroke="#1e293b" strokeWidth="2.2" fill="none" />
                    </svg>
                  )
                },
                { 
                  type: "Checked", 
                  name: "Arif T.W.", 
                  isSigned: isDeptHeadSigned,
                  sigSvg: (
                    <svg width="40" height="24" viewBox="0 0 100 60" style={{ opacity: 0.85 }}>
                      <path d="M15,45 Q30,20 45,45 T75,45 M35,15 L35,55 M25,30 L85,30" stroke="#1e293b" strokeWidth="2.2" fill="none" />
                    </svg>
                  )
                },
                { 
                  type: "Approved", 
                  name: "Putu R.S.", 
                  isSigned: isDivHeadSigned,
                  sigSvg: (
                    <svg width="40" height="24" viewBox="0 0 100 60" style={{ opacity: 0.85 }}>
                      <path d="M10,25 Q30,5 50,25 T90,25 M50,10 L50,50" stroke="#0f172a" strokeWidth="2.2" fill="none" />
                      <text x="35" y="45" fill="#1d4ed8" fontSize="9" fontWeight="bold">28/8/25</text>
                    </svg>
                  )
                },
                { 
                  type: "Acknowledge", 
                  name: "Purchasing", 
                  isSigned: isPurchasingSigned,
                  sigSvg: (
                    <svg width="40" height="24" viewBox="0 0 100 60" style={{ opacity: 0.85 }}>
                      <path d="M20,40 Q40,20 60,40 T80,30" stroke="#1e293b" strokeWidth="2.2" fill="none" />
                    </svg>
                  )
                },
                { 
                  type: "Acknowledge", 
                  name: "Accounting", 
                  isSigned: isAccountingSigned,
                  sigSvg: (
                    <svg width="40" height="24" viewBox="0 0 100 60" style={{ opacity: 0.85 }}>
                      <path d="M20,35 Q40,15 60,35" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
                    </svg>
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
                  <div style={{ borderTop: "1px solid #000", padding: "1px 2px", fontSize: "7px", color: "#64748b", textAlign: "center", lineHeight: "1.2", fontWeight: "bold" }}>
                    {sig.name}
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
      <>
        {documentContent}
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
            #qpr-print-area, #qpr-print-area * { visibility: visible; }
              #qpr-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: 100% !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 8mm !important;
                border: none !important;
                box-shadow: none !important;
                page-break-inside: avoid !important;
              }
            }
          `}</style>
        </>
      );
    }
  
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
        <div className="pt-16 pb-8 w-full flex justify-center">
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
            body * { visibility: hidden; }
            #qpr-print-area, #qpr-print-area * { visibility: visible; }
            #qpr-print-area {
              position: relative !important;
              left: 0 !important;
              top: 0 !important;
              width: 190mm !important;
              height: 277mm !important;
              min-height: 0 !important;
              margin: 0 auto !important;
              padding: 8mm !important;
              border: 1.5px solid #000 !important;
              box-shadow: none !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              transform: scale(0.91) !important;
              transform-origin: top center !important;
            }
          }
        `}</style>
    </div>
  );
}
