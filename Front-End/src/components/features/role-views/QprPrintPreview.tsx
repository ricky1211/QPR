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
  };
  onClose: () => void;
}

const PART_ITEMS = [
  { no: 1, partName: "ALL TYPE PART FINISH", totalQty: 75000, qtyNG: 75000, ngActual: 100.0 },
  { no: 2, partName: "ALL TYPE PART FINISH", totalQty: 75000, qtyNG: 75000, ngActual: 100.0 },
  { no: 3, partName: "ALL TYPE PART FINISH", totalQty: 75000, qtyNG: 75000, ngActual: 100.0 },
  { no: 4, partName: "ALL TYPE PART FINISH", totalQty: 75000, qtyNG: 75000, ngActual: 100.0 },
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

export default function QprPrintPreview({ qpr, onClose }: QprPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
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

      {/* QPR Document */}
      <div
        id="qpr-print-area"
        className="bg-white shadow-2xl w-full max-w-3xl my-16"
        style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", border: "1px solid #000" }}
      >
        {/* Company Header */}
        <div className="flex items-center" style={{ borderBottom: "1px solid #000", padding: "6px 10px" }}>
          <div style={{ width: "160px", minWidth: "160px", marginRight: "12px" }}>
            <div className="font-black text-slate-800 uppercase leading-tight" style={{ fontSize: "10px" }}>
              PT MENARA TERUS MAKMUR
            </div>
            <div className="text-slate-500 mt-0.5 leading-tight" style={{ fontSize: "7px" }}>
              A Member of <span className="font-bold text-red-600">ASTRA</span> Otoparts Group
            </div>
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
        <div className="text-center" style={{ backgroundColor: "#fde047", borderBottom: "1px solid #000", padding: "6px 0" }}>
          <div className="font-black tracking-wide uppercase" style={{ fontSize: "18px" }}>QUALITY PROBLEM REPORT</div>
          <div className="font-bold tracking-wider" style={{ fontSize: "9px" }}>( PR4-FRM-08101 )</div>
        </div>

        {/* Supplier Info + Status Section */}
        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          {/* Left: Supplier info */}
          <div style={{ flex: 1, borderRight: "1px solid #000" }}>
            {[
              { label: "SUPPLIER / VENDOR", val: qpr.supplierName, bold: true },
              { label: "Part Name", val: ": ALL TYPE PART FINISH" },
              { label: "Part Number", val: ": —" },
              { label: "Model", val: ": —" },
              { label: "Lot/Batch", val: ": —" },
              { label: "Date", val: `: ${qpr.date}` },
              { label: "Problem", val: ": VISUAL NG" },
            ].map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr", borderBottom: i < 6 ? "1px solid #000" : "none" }}>
                <div style={{ borderRight: "1px solid #000", padding: "2px 6px", fontWeight: "bold", fontSize: "8.5px" }}>{row.label}</div>
                <div style={{ padding: "2px 6px", fontSize: "8.5px", fontWeight: row.bold ? "bold" : "normal" }}>{row.val}</div>
              </div>
            ))}
          </div>

          {/* Right: Doc No + Status blocks */}
          <div style={{ width: "260px", minWidth: "260px" }}>
            {/* Doc no, revision, issue date */}
            {[
              { label: "Doc No.", val: qpr.qprNumber },
              { label: "Revision", val: "A" },
              { label: "Issue Date", val: formattedDate },
            ].map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "70px 1fr", borderBottom: "1px solid #000" }}>
                <div style={{ borderRight: "1px solid #000", padding: "2px 6px", fontWeight: "bold", fontSize: "8px" }}>{row.label}</div>
                <div style={{ padding: "2px 6px", fontSize: "8px", fontFamily: "monospace" }}>{row.val}</div>
              </div>
            ))}

            {/* Problem Occurrence */}
            <div style={{ borderBottom: "1px solid #000" }}>
              <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "7.5px", borderBottom: "1px solid #000", padding: "2px 6px", background: "#f1f5f9" }}>
                Problem Occurance in one year
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #000" }}>
                <div style={{ borderRight: "1px solid #000", padding: "3px 6px", fontWeight: "bold", fontSize: "7.5px" }}>1st time</div>
                <div style={{ padding: "3px 6px", display: "flex", justifyContent: "center" }}>
                  <span style={{ width: "14px", height: "14px", border: "1px solid #000", display: "inline-block" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ borderRight: "1px solid #000", padding: "3px 6px", fontWeight: "bold", fontSize: "7.5px" }}>More Than one</div>
                <div style={{ padding: "3px 6px", display: "flex", justifyContent: "center" }}>
                  <span style={{ width: "14px", height: "14px", border: "1px solid #000", display: "inline-block", backgroundColor: "#ef4444" }} />
                </div>
              </div>
            </div>

            {/* STATUS */}
            <div style={{ borderBottom: "1px solid #000" }}>
              <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "7.5px", borderBottom: "1px solid #000", padding: "2px", background: "#f1f5f9" }}>STATUS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #000" }}>
                {["Rework", "Repair", "Reject"].map((s, i) => (
                  <div key={s} style={{ borderRight: i < 2 ? "1px solid #000" : "none", textAlign: "center", padding: "2px", fontWeight: "bold", fontSize: "7px" }}>{s}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                {[false, false, true].map((checked, i) => (
                  <div key={i} style={{ borderRight: i < 2 ? "1px solid #000" : "none", padding: "4px", display: "flex", justifyContent: "center" }}>
                    <span style={{ width: "14px", height: "14px", border: "1px solid #000", display: "inline-block", backgroundColor: checked ? "#ef4444" : "white" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* PART CATEGORY */}
            <div>
              <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "7.5px", borderBottom: "1px solid #000", padding: "2px", background: "#f1f5f9" }}>PART CATEGORY</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #000" }}>
                {["Ordinary", "Function", "Safety"].map((s, i) => (
                  <div key={s} style={{ borderRight: i < 2 ? "1px solid #000" : "none", textAlign: "center", padding: "2px", fontWeight: "bold", fontSize: "7px" }}>{s}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                {[false, false, false].map((checked, i) => (
                  <div key={i} style={{ borderRight: i < 2 ? "1px solid #000" : "none", padding: "4px", display: "flex", justifyContent: "center" }}>
                    <span style={{ width: "14px", height: "14px", border: "1px solid #000", display: "inline-block", backgroundColor: checked ? "#ef4444" : "white" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* REF TO NCR */}
        <div style={{ borderBottom: "1px solid #000", padding: "3px 8px", fontSize: "8px" }}>
          <span style={{ fontWeight: "bold" }}>REF. TO NCR NO</span>
          <span style={{ marginLeft: "16px", fontFamily: "monospace", fontWeight: "bold", color: "#1e40af" }}>240/QI/NCR/SUP/VII/25</span>
          <span style={{ marginLeft: "40px", fontWeight: "bold" }}>NO QPR</span>
          <span style={{ marginLeft: "8px", fontFamily: "monospace", fontWeight: "bold", color: "#b91c1c" }}>002/QI/QPR/SUB/8/25</span>
        </div>

        {/* Parts Table */}
        <div style={{ borderBottom: "1px solid #000" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                {["NO", "PART NAME", "TOTAL QTY (PCS)", "QTY NG (PCS)", "NG ACTUAL (%)", "STD NG ALLOWANCE 0% (PCS)", "QTY CLAIM (PCS)"].map((h, i) => (
                  <th key={i} style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", fontWeight: "bold" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PART_ITEMS.map((item) => (
                <tr key={item.no}>
                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>{item.no}</td>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", fontWeight: "600" }}>{item.partName}</td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>{item.totalQty.toLocaleString("id-ID")}</td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>{item.qtyNG.toLocaleString("id-ID")}</td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", fontWeight: "bold", color: "#b91c1c" }}>{item.ngActual.toFixed(1)}</td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>0</td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", fontWeight: "bold" }}>75,000</td>
                </tr>
              ))}
              {[...Array(2)].map((_, i) => (
                <tr key={`empty-${i}`}>
                  {[...Array(7)].map((__, j) => (
                    <td key={j} style={{ border: "1px solid #000", padding: "4px 6px", height: "20px" }}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Claim NG Box */}
        <div style={{ borderBottom: "1px solid #000", display: "flex", alignItems: "center", padding: "12px 16px" }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div>
              <div style={{ border: "2px solid #000", padding: "8px 24px", textAlign: "center", fontWeight: "900", fontSize: "13px" }}>
                Claim NG to {qpr.supplierName}
              </div>
              <div style={{ marginTop: "6px", fontSize: "8px", fontStyle: "italic", color: "#64748b", textAlign: "center" }}>
                Claim karpe returnir + re-packing
              </div>
            </div>
          </div>
          <div style={{ marginLeft: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 0, height: 0, borderLeft: "20px solid transparent", borderRight: "20px solid transparent", borderBottom: "36px solid #dc2626" }} />
          </div>
        </div>

        {/* DETAIL KEJADIAN */}
        <div style={{ borderBottom: "1px solid #000", padding: "10px 12px" }}>
          <div style={{ fontWeight: "bold", fontSize: "9px", textTransform: "uppercase", marginBottom: "8px", color: "#374151" }}>DETAIL KEJADIAN :</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ border: "1px solid #000", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontWeight: "bold", fontSize: "8px", width: "72px", height: "44px", padding: "4px" }}>
                MACHINING
              </div>
              <div style={{ fontSize: "7px", fontWeight: "bold", color: "#64748b", marginTop: "4px" }}>SZJR TR.CO.</div>
            </div>
            <FlowArrow />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ border: "2px solid #dc2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontWeight: "900", fontSize: "8px", color: "#dc2626", width: "72px", height: "52px", lineHeight: "1.2" }}>
                INCOMING<br />&amp;<br />PACKING
              </div>
              <div style={{ fontSize: "7px", fontWeight: "bold", color: "#64748b", marginTop: "4px" }}>PT. MTM</div>
            </div>
            <FlowArrow />
            <FlowBox label="ASSY FINISH" />
            <FlowArrow />
            <div style={{ border: "1px dashed #94a3b8", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontWeight: "bold", fontSize: "8px", width: "72px", height: "44px", padding: "4px" }}>
              FINAL<br />INSPEKSI
            </div>
            <FlowArrow />
            <FlowBox label="CUSTOMER" />
          </div>
        </div>

        {/* MTM REQUEST TABLE */}
        <div style={{ borderBottom: "1px solid #000" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                {["NO", "ITEM", "D/D", "PIC", "REMARKS"].map((h, i) => (
                  <th key={i} style={{ border: "1px solid #000", padding: "3px 6px", fontWeight: "bold", textAlign: i === 0 ? "center" : "left" }}>{h}</th>
                ))}
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
              ].map((row) => (
                <React.Fragment key={row.no}>
                  {row.items.map((item, i) => (
                    <tr key={`${row.no}-${i}`}>
                      {i === 0 && (
                        <td rowSpan={row.items.length} style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center", fontFamily: "monospace" }}>
                          {row.no}
                        </td>
                      )}
                      <td style={{ border: "1px solid #000", padding: "2px 6px", fontSize: "7.5px" }}>{item}</td>
                      <td style={{ border: "1px solid #000", padding: "2px 6px", textAlign: "center", color: "#cbd5e1" }}>-</td>
                      <td style={{ border: "1px solid #000", padding: "2px 6px", textAlign: "center", color: "#cbd5e1" }}>-</td>
                      <td style={{ border: "1px solid #000", padding: "2px 6px", textAlign: "center", color: "#cbd5e1" }}>-</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: "1px solid #000", textAlign: "center", padding: "3px", fontWeight: "bold", fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            MTM REQUEST
          </div>
        </div>

        {/* JENIS CLAIM + Signature */}
        <div style={{ display: "flex" }}>
          {/* Jenis Claim */}
          <div style={{ flex: 1, borderRight: "1px solid #000", padding: "10px 12px" }}>
            <div style={{ fontWeight: "bold", fontSize: "8.5px", textTransform: "uppercase", marginBottom: "8px" }}>JENIS CLAIM :</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
              <CheckItem label="MATERIAL" checked={false} />
              <CheckItem label="PAINTING/PLATING" checked={false} />
              <CheckItem label="PROSES PACKING" checked={true} />
              <CheckItem label="PARKEREZING" checked={false} />
              <CheckItem label="PROSES CHECK" checked={true} />
              <CheckItem label="HEAT TREATMENT" checked={false} />
            </div>
          </div>

          {/* Signature Block */}
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: "1px solid #000", textAlign: "center", padding: "4px", fontSize: "8px", fontWeight: "600", color: "#64748b" }}>
              {qpr.date || formattedDate}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr" }}>
              {["Prepared", "Checked", "Approved", "Acknowledge", "Acknowledge"].map((sig, i) => (
                <div key={i} style={{ borderRight: i < 4 ? "1px solid #000" : "none", textAlign: "center" }}>
                  <div style={{ borderBottom: "1px solid #000", padding: "2px 4px", fontWeight: "bold", fontSize: "7px", background: "#f8fafc" }}>{sig}</div>
                  <div style={{ minHeight: "50px" }} />
                  <div style={{ borderTop: "1px solid #000", padding: "2px 4px", fontSize: "7px", color: "#64748b", textAlign: "center", lineHeight: "1.3" }}>
                    {i === 0 && "Heru S."}
                    {i === 1 && "Arif T.W."}
                    {i === 2 && "Putu R.S."}
                    {i === 3 && "Purchasing"}
                    {i === 4 && "Accounting"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #qpr-print-area, #qpr-print-area * { visibility: visible; }
          #qpr-print-area { position: fixed; left: 0; top: 0; width: 100%; margin: 0; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
