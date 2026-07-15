"use client";

import React from "react";
import { X, Printer } from "lucide-react";

interface ClPreviewProps {
  cl: {
    docNumber?: string;
    clNumber?: string;
    date: string;
    vendorName: string;
    partNumber?: string;
    partName?: string;
    qty?: number;
    reject?: string | number;
    claimAmount?: string;
    defectType?: string;
    status?: string;
    [key: string]: any;
  };
  onClose?: () => void;
  inline?: boolean;
}

export default function ClPrintPreview({ cl, onClose, inline = false }: ClPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const docNo = cl.clNumber || cl.docNumber || "CL/2026/06/001";
  const partNo = cl.partNumber || "-";
  const partName = cl.partName || "-";
  const totalQty = cl.qty || 0;
  const rejectQty = cl.reject || 0;
  const amount = cl.claimAmount || "Rp 0";
  const defect = cl.defectType || "-";

  const documentContent = (
    <div
      id="cl-print-area"
      className={`bg-white text-slate-900 border border-black mx-auto p-8 ${inline ? "w-full shadow-sm" : "shadow-2xl w-full max-w-3xl my-16"}`}
      style={{ fontFamily: "Arial, sans-serif", fontSize: "11px" }}
    >
      {/* MTM Header */}
      <div className="flex justify-between items-start border-b border-black pb-4 text-left">
        <div>
          <span className="font-black text-sm leading-tight block">PT MENARA TERUS MAKMUR</span>
          <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">
            A Member of <span className="font-bold text-red-650">ASTRA</span> Otoparts Group
          </span>
          <span className="text-[8px] text-slate-400 block leading-tight mt-1">
            Jl. Jababeka XI Blok H No. 12, Cikarang Industrial Estate, Bekasi 17530
          </span>
        </div>
        <div className="text-right text-[9px] leading-normal font-semibold">
          <div><strong>DATE :</strong> {cl.date}</div>
          <div><strong>NO :</strong> <span className="font-mono">{docNo}</span></div>
        </div>
      </div>

      {/* Title */}
      <div className="my-6 text-center">
        <h2 className="font-black text-base tracking-wide uppercase border-b-2 border-slate-900 inline-block pb-1">
          CONFIRMATION LETTER OF QUALITY PENALTY (CL)
        </h2>
      </div>

      {/* Formal Greetings */}
      <div className="text-left space-y-3 leading-relaxed">
        <p className="font-bold text-slate-800">Kepada Yth. Pimpinan / Manajemen Vendor,</p>
        <p className="font-bold text-indigo-900 text-xs">{cl.vendorName}</p>
        
        <p className="mt-4">
          Dengan hormat, bersama surat ini kami informasikan rincian pemotongan / penalti atas part reject (NG) yang dipasok oleh perusahaan Bapak/Ibu. Berdasarkan laporan pemeriksaan kualitas produk masuk (Incoming QC), berikut adalah rincian produk cacat dan nominal denda klaim yang disepakati:
        </p>

        {/* Detailed Table */}
        <div className="my-4 border border-black rounded overflow-hidden">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-50 border-b border-black font-extrabold text-slate-800">
                <th className="p-2 border-r border-black w-24">Part Number</th>
                <th className="p-2 border-r border-black">Part Name</th>
                <th className="p-2 border-r border-black text-center w-20">Reject Qty</th>
                <th className="p-2 border-r border-black text-center w-24">Defect Type</th>
                <th className="p-2 text-right w-28">Nilai Klaim</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-300 font-semibold text-slate-700">
                <td className="p-2 border-r border-black font-mono">{partNo}</td>
                <td className="p-2 border-r border-black">{partName}</td>
                <td className="p-2 border-r border-black text-center font-mono">{rejectQty} pcs</td>
                <td className="p-2 border-r border-black text-center text-red-750 font-bold">{defect}</td>
                <td className="p-2 text-right font-black text-emerald-650">{amount}</td>
              </tr>
              <tr className="bg-slate-50/50 font-bold">
                <td colSpan={4} className="p-2 border-r border-black text-right uppercase">Total Klaim Pemotongan</td>
                <td className="p-2 text-right font-black text-emerald-700 text-xs">{amount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Kami memohon kerja sama pihak Vendor untuk segera menandatangani lembar konfirmasi persetujuan denda ini untuk kelancaran proses penagihan/pembayaran ssc billing & ssc payment di departemen Accounting.
        </p>
      </div>

      {/* Signature Section */}
      <div className="mt-12 grid grid-cols-2 gap-12 text-center text-slate-800 font-bold">
        <div className="flex flex-col justify-between h-28 border border-dashed border-slate-305 p-3 rounded bg-slate-50/20">
          <span>Menyetujui, Wakil Vendor / Supplier</span>
          <div className="font-mono text-[9px] text-emerald-750 bg-emerald-50 py-1 rounded border border-emerald-100 flex items-center justify-center gap-1">
            <span>✓ DIGITAL SIGNATURE VERIFIED</span>
          </div>
          <span className="border-t border-slate-400 pt-1 text-[9px] uppercase">{cl.vendorName}</span>
        </div>

        <div className="flex flex-col justify-between h-28 border border-dashed border-slate-305 p-3 rounded bg-slate-50/20">
          <span>Hormat Kami, PT Menara Terus Makmur</span>
          <div className="font-mono text-[9px] text-blue-750 bg-blue-50 py-1 rounded border border-blue-100 flex items-center justify-center gap-1">
            <span>✓ ACCOUNTING MANAGER SIGNED</span>
          </div>
          <span className="border-t border-slate-400 pt-1 text-[9px]">DEPT. ACCOUNTING MTM</span>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return documentContent;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-100 rounded-xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col my-8">
        
        {/* Modal Controls Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-emerald-50 text-emerald-700 rounded"><Printer size={16} /></span>
            <span className="text-sm font-black text-slate-800">Cetak Surat Konfirmasi Denda (CL)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-750 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer size={14} />
              Cetak Dokumen
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Document Body */}
        <div className="flex-1 overflow-y-auto px-8 py-4 bg-slate-100/50 flex justify-center items-center">
          {documentContent}
        </div>
      </div>
    </div>
  );
}
