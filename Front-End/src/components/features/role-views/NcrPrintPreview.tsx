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
    images?: string[];
    foundBy?: string;
    docsToRevise?: string | string[];
    locationFound?: string;
    problemType?: string;
  };
  onClose: () => void;
}

export default function NcrPrintPreview({ ncr, onClose }: NcrPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const docNo = ncr.ncrNumber || ncr.docNumber || "NCR/2026/06/001";
  const partNo = ncr.partNumber || "-";
  const partName = ncr.partName || "CONE RACE ALL TYPE";
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

      {/* NCR PDF Document Layout */}
      <div
        id="ncr-print-area"
        className="bg-white shadow-2xl w-full max-w-3xl my-16 text-slate-900 border border-black"
        style={{ fontFamily: "Arial, sans-serif", fontSize: "10px" }}
      >
        {/* Header Grid */}
        <div className="grid grid-cols-4 border-b border-black">
          {/* Logo & Company Name */}
          <div className="col-span-1 p-3 border-r border-black flex flex-col justify-center">
            <span className="font-black text-[10px] leading-tight block">PT MENARA TERUS MAKMUR</span>
            <span className="text-[7px] text-slate-500 block leading-tight mt-0.5">
              A Member of <span className="font-bold text-red-650">ASTRA</span> Otoparts Group
            </span>
          </div>

          {/* Form Title */}
          <div className="col-span-2 p-3 border-r border-black flex flex-col justify-center items-center text-center">
            <h2 className="font-black text-sm tracking-wide">NONCONFORMANCE REPORT</h2>
            <span className="font-bold text-[8.5px] mt-0.5">(PR4-FRM-08001)</span>
          </div>

          {/* Document metadata */}
          <div className="col-span-1 p-3 flex flex-col justify-center text-[7.5px] space-y-0.5 text-left leading-normal font-semibold">
            <div><strong>REV :</strong> B</div>
            <div className="border-t border-slate-200 pt-0.5"><strong>DATE :</strong> {ncr.date}</div>
            <div className="border-t border-slate-200 pt-0.5"><strong>NO :</strong> <span className="font-mono">{docNo}</span></div>
          </div>
        </div>

        {/* To / CC Section */}
        <div className="grid grid-cols-2 border-b border-black text-[8px] font-bold text-left leading-normal">
          <div className="p-2 border-r border-black">
            <span>TO : {ncr.supplierName}</span>
          </div>
          <div className="p-2">
            <span>CC : PURCHASE & PPIC PT. MTM</span>
          </div>
        </div>

        {/* Part Detail Grid */}
        <div className="grid grid-cols-4 border-b border-black text-[8.5px] font-bold text-left leading-normal">
          <div className="p-2 border-r border-black">
            <span>PART NO : {partNo}</span>
          </div>
          <div className="p-2 border-r border-black space-y-1">
            <span>LOCATION FOUND:</span>
            <div className="grid grid-cols-2 gap-1 text-[7px] font-medium">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 border border-black flex items-center justify-center font-bold">
                  {locStr.includes("IN-COMING") && "✓"}
                </span>
                <span>IN-COMING</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 border border-black flex items-center justify-center font-bold">
                  {locStr.includes("OUT-GOING") && "✓"}
                </span>
                <span>OUT-GOING</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 border border-black flex items-center justify-center font-bold">
                  {locStr.includes("IN-PROSES") && "✓"}
                </span>
                <span>IN-PROSES</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 border border-black flex items-center justify-center font-bold">
                  {locStr.includes("CUSTOMER") && "✓"}
                </span>
                <span>CUSTOMER</span>
              </div>
            </div>
          </div>
          <div className="p-2 border-r border-black">
            <span>PART NAME :</span>
            <div className="mt-1 text-[8.5px] font-bold text-slate-800">{partName}</div>
          </div>
          <div className="p-2 space-y-1">
            <span>PROBLEM:</span>
            <div className="flex gap-3 text-[7.5px] font-medium">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 border border-black flex items-center justify-center font-bold">
                  {probStr.includes("QUALITY") && "✓"}
                </span>
                <span>QUALITY</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 border border-black flex items-center justify-center font-bold">
                  {probStr.includes("QUANTITY") && "✓"}
                </span>
                <span>QUANTITY</span>
              </div>
            </div>
            <div className="text-[7px] text-slate-500 font-semibold mt-1">FOUND BY: {inspectorStr}</div>
          </div>
        </div>

        {/* Description problem */}
        <div className="border-b border-black p-3 text-left">
          <div className="font-bold text-[8.5px] text-slate-700 uppercase tracking-wider mb-2">DESCRIPTION PROBLEM :</div>
          <div className="bg-slate-50 p-2.5 border border-slate-200 rounded leading-relaxed text-[8.5px]">
            <p className="font-bold">CONDITION PART NG: {defect.toUpperCase()}</p>
            <p className="text-slate-500 mt-1">Sistem mendeteksi deviasi visual pada lot kedatangan. Part cacat atau tidak sesuai standar QA.</p>
          </div>
          <div className="mt-3 flex justify-between items-center text-[8.5px]">
            <span><strong>QTY RECEIVED :</strong> {totalQty.toLocaleString("id-ID")} PCS</span>
            <span className="text-red-650 font-black"><strong>QTY NG :</strong> {(ncr.qty || 0).toLocaleString("id-ID")} PCS</span>
            <span><strong>NG TYPES :</strong> {rejectQtyStr}</span>
          </div>
        </div>

        {/* Info Lot */}
        <div className="border-b border-black p-3 text-left bg-slate-50/20 text-[8px] leading-relaxed">
          <span className="font-bold block text-slate-600 mb-1"># INFO LOT COME TO MTM:</span>
          <div className="pl-3 list-decimal font-medium text-slate-700">
            <div>1. LOT RECEIVED AT MTM = {totalQty.toLocaleString("id-ID")} PCS</div>
            <div>2. TOTAL QUALITY INSPECTED = {totalQty.toLocaleString("id-ID")} PCS</div>
            <div>3. PART NG FOUND = {(ncr.qty || 0).toLocaleString("id-ID")} PCS</div>
          </div>
        </div>

        {/* Activity Table */}
        <div className="border-b border-black">
          <table className="w-full text-left border-collapse text-[8px]">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-black text-slate-700">
                <th className="px-3 py-1.5 border-r border-black w-8 text-center">NO</th>
                <th className="px-3 py-1.5 border-r border-black"># ACTIVITY</th>
                <th className="px-3 py-1.5 border-r border-black text-center w-40"># MAN POWER / DAY</th>
                <th className="px-3 py-1.5 text-left w-48"># CONSUMABLE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-semibold text-slate-800">
              <tr>
                <td className="px-3 py-1.5 border-r border-black text-center">1</td>
                <td className="px-3 py-1.5 border-r border-black">SORT BY INSPECTOR AT MTM</td>
                <td className="px-3 py-1.5 border-r border-black text-center">4 MAN POWER / DAY</td>
                <td className="px-3 py-1.5">GLOVES 6 PCS, PEN MARKER</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border-r border-black text-center">2</td>
                <td className="px-3 py-1.5 border-r border-black">ADD ANTIRUST & REPACKING</td>
                <td className="px-3 py-1.5 border-r border-black text-center">2 MAN POWER / DAY</td>
                <td className="px-3 py-1.5">OIL RUST PROTECT 3L/DAY</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 border-r border-black text-center">3</td>
                <td className="px-3 py-1.5 border-r border-black">EQUIPMENT DRY + TABLE SORT</td>
                <td className="px-3 py-1.5 border-r border-black text-center">1 MAN POWER / DAY</td>
                <td className="px-3 py-1.5">CLEANING WIPES, PLASTIC WRAP</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Disposition Section */}
        <div className="grid grid-cols-3 border-b border-black text-left text-[8.5px] font-bold">
          {/* Left Checkboxes */}
          <div className="col-span-2 border-r border-black p-3 space-y-2">
            <span className="text-[9px] text-slate-500 block uppercase">DISPOSITION DECISION</span>
            <div className="grid grid-cols-2 gap-3 text-[8px] font-semibold">
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isRework ? "bg-red-500 text-white" : ""}`}>
                  {isRework && "✓"}
                </span>
                <span>REWORK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isAccept ? "bg-red-500 text-white" : ""}`}>
                  {isAccept && "✓"}
                </span>
                <span>ACCEPT AS IS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isScrap ? "bg-red-500 text-white" : ""}`}>
                  {isScrap && "✓"}
                </span>
                <span>SCRAP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isRepair ? "bg-red-500 text-white" : ""}`}>
                  {isRepair && "✓"}
                </span>
                <span>REPAIR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isReturn ? "bg-red-500 text-white" : ""}`}>
                  {isReturn && "✓"}
                </span>
                <span>RETURN TO VENDOR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black ${isRegrade ? "bg-red-500 text-white" : ""}`}>
                  {isRegrade && "✓"}
                </span>
                <span>REGRADE</span>
              </div>
            </div>
          </div>

          {/* Right Customer Approval */}
          <div className="col-span-1 p-3 flex flex-col justify-between">
            <span className="text-[8px] text-slate-500 block leading-normal uppercase">CUSTOMER APPROVAL REQUIRED?</span>
            <div className="flex gap-4 items-center justify-center py-2 text-[8px] font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border border-black flex items-center justify-center font-black">
                  {ncr.customerApproval === "YES" && "✓"}
                </span>
                <span>YES</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border border-black flex items-center justify-center font-black">
                  {ncr.customerApproval === "NO" && "✓"}
                </span>
                <span>NO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action / Action Notes Grid */}
        <div className="grid grid-cols-2 border-b border-black text-left text-[8px] font-semibold divide-x divide-black">
          <div className="p-3 space-y-1">
            <span className="text-[7.5px] text-slate-400 uppercase">CAUSE / PENYEBAB:</span>
            <p className="text-slate-800 leading-normal">
              Deviasi terjadi karena ausnya cetakan mesin produksi vendor yang melampaui batas toleransi visual standard.
            </p>
          </div>
          <div className="p-3 space-y-1">
            <span className="text-[7.5px] text-slate-400 uppercase">CORRECTIVE & PREVENTIVE ACTION:</span>
            <p className="text-slate-800 leading-normal">
              Vendor setuju mengganti tooling cetakan per 5 Juli 2026 dan menyortir internal 100% barang sebelum pengiriman berikutnya.
            </p>
          </div>
        </div>

        {/* Signatures & Notes */}
        <div className="grid grid-cols-2 text-[8px] leading-normal font-semibold">
          {/* Signatures table */}
          <div className="border-r border-black flex flex-col">
            <div className="border-b border-black bg-slate-50 text-center py-1 font-bold text-slate-650 uppercase">
              QUALITY DEPT AUTHORIZATION (PT MTM)
            </div>
            <div className="grid grid-cols-3 divide-x divide-black flex-1 text-center font-medium">
              <div className="flex flex-col justify-between p-1.5 min-h-[70px]">
                <span className="text-[7px] text-slate-400 uppercase">PREPARED</span>
                <span className="font-mono text-[7px] text-green-700 font-bold block my-1">Digital Signed</span>
                <span className="border-t border-slate-200 pt-0.5 text-slate-600">Heru Staff QA</span>
              </div>
              <div className="flex flex-col justify-between p-1.5 min-h-[70px]">
                <span className="text-[7px] text-slate-400 uppercase">CHECKED</span>
                <span className="font-mono text-[7px] text-green-700 font-bold block my-1">Digital Signed</span>
                <span className="border-t border-slate-200 pt-0.5 text-slate-600">Arif SPV QA</span>
              </div>
              <div className="flex flex-col justify-between p-1.5 min-h-[70px]">
                <span className="text-[7px] text-slate-400 uppercase">APPROVED</span>
                <span className="font-mono text-[7px] text-green-700 font-bold block my-1">Digital Signed</span>
                <span className="border-t border-slate-200 pt-0.5 text-slate-600">Putu MGR QA</span>
              </div>
            </div>
          </div>

          {/* Supplier Authorization signature slot */}
          <div className="flex flex-col">
            <div className="border-b border-black bg-slate-50 text-center py-1 font-bold text-slate-650 uppercase">
              VENDOR / SUBCONT AUTHORIZATION (ACCEPTANCE)
            </div>
            <div className="grid grid-cols-3 divide-x divide-black flex-1 text-center font-medium">
              <div className="flex flex-col justify-between p-1.5 min-h-[70px]">
                <span className="text-[7px] text-slate-400 uppercase">STAFF</span>
                <span className="font-mono text-[7px] text-green-700 font-bold block my-1">Signed</span>
                <span className="border-t border-slate-200 pt-0.5 text-slate-600">Operator</span>
              </div>
              <div className="flex flex-col justify-between p-1.5 min-h-[70px]">
                <span className="text-[7px] text-slate-400 uppercase">SPV</span>
                <span className="font-mono text-[7px] text-green-700 font-bold block my-1">Signed</span>
                <span className="border-t border-slate-200 pt-0.5 text-slate-600">Supervisor</span>
              </div>
              <div className="flex flex-col justify-between p-1.5 min-h-[70px]">
                <span className="text-[7px] text-slate-400 uppercase">MANAGER</span>
                <span className="font-mono text-[7px] text-green-700 font-bold block my-1">Approved digital</span>
                <span className="border-t border-slate-200 pt-0.5 text-slate-600">Director / Representative</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attached Photos / Foto Bukti Cacat */}
        {ncr.images && ncr.images.length > 0 && (
          <div className="border-t border-black p-3 text-left">
            <span className="font-bold text-[8px] text-slate-500 block uppercase mb-2">ATTACHED PHOTOS / FOTO BUKTI CACAT:</span>
            <div className="grid grid-cols-4 gap-2 print:grid-cols-4">
              {ncr.images.map((img: string, idx: number) => (
                <div key={idx} className="border border-slate-300 rounded overflow-hidden aspect-square bg-slate-50 relative flex items-center justify-center max-h-[120px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} className="w-full h-full object-cover" alt={`Bukti Cacat ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer notes & Other Documents */}
        <div className="border-t border-black grid grid-cols-3 text-[7.5px] font-semibold text-slate-800 divide-x divide-black bg-slate-50/50">
          <div className="col-span-2 p-2.5 text-left text-slate-505 leading-normal font-medium">
            <strong>NOTE :</strong>
            <div className="mt-1 space-y-0.5">
              <div><strong>Rework</strong> : If the part can be repaired to standard with the addition of certain processes.</div>
              <div><strong>Scrap</strong> : If the part can no longer be processed.</div>
              <div><strong>Return to Vendor</strong> : If the part is supplied by the vendor.</div>
              <div><strong>Accept as is</strong> : If the product does not require any additional processing, it can be delivered.</div>
              <div><strong>Repair</strong> : If the part can be repaired outside the part's process.</div>
              <div><strong>Regrade</strong> : If the part can be processed directly by lowering the class of the part.</div>
            </div>
            <div className="text-[6.5px] text-slate-400 mt-2">FILE: QEHSS (Z:)\PR4-FRM-08001, Non conformance Report • Effective Date: Dec 12, 2017</div>
          </div>
          <div className="col-span-1 p-2.5 text-left space-y-1.5 font-bold">
            <span className="text-[7px] text-slate-500 block uppercase">Other documents that need to be rev. :</span>
            <div className="space-y-1 text-[7px]">
              {["CONTROL PLAN", "CHECK SHEET", "Q POINT", "MPS"].map((doc) => {
                const docsArr: string[] = Array.isArray(ncr.docsToRevise)
                  ? ncr.docsToRevise
                  : (ncr.docsToRevise || "").split(", ").map(d => d.trim()).filter(Boolean);
                const isChecked = docsArr.includes(doc);
                return (
                  <div key={doc} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border border-black flex items-center justify-center font-black">
                      {isChecked && "✓"}
                    </span>
                    <span>{doc}</span>
                  </div>
                );
              })}
              {/* Custom typed document */}
              {(() => {
                const docsArr: string[] = Array.isArray(ncr.docsToRevise)
                  ? ncr.docsToRevise
                  : (ncr.docsToRevise || "").split(", ").map(d => d.trim()).filter(Boolean);
                const customDocs = docsArr.filter(d => !["CONTROL PLAN", "CHECK SHEET", "Q POINT", "MPS"].includes(d));
                if (customDocs.length > 0) {
                  return (
                    <div className="flex items-start gap-1.5 pt-1 border-t border-slate-200">
                      <span className="w-3 h-3 border border-black flex items-center justify-center font-black mt-0.5">✓</span>
                      <span className="italic text-[6.5px] leading-tight break-all">OTHER: {customDocs.join(", ")}</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #ncr-print-area, #ncr-print-area * { visibility: visible; }
          #ncr-print-area { position: fixed; left: 0; top: 0; width: 100%; margin: 0; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
