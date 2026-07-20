"use client";

import React from "react";
import { X, Printer, Send } from "lucide-react";

interface AopMemoPreviewProps {
  memo: {
    clNumber: string;
    supplierName: string;
    dateSent: string;
    amount: string;
    status: string;
  };
  onClose: () => void;
  onSend?: () => void;
}

export default function AopMemoPrintPreview({ memo, onClose, onSend }: AopMemoPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const memoNum = `MEMO-MTM/AOP/${memo.clNumber.replace(/[^0-9]/g, "") || "20260601"}`;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Action Bar */}
      <div className="fixed top-4 right-4 flex gap-2 z-50 print:hidden">
        {onSend && (
          <button
            onClick={onSend}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold shadow-lg transition-colors cursor-pointer"
          >
            <Send size={14} />
            Kirim ke AOP
          </button>
        )}
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

      {/* Internal Memorandum PDF Document Layout */}
      <div
        id="aop-memo-print-area"
        className="bg-white shadow-2xl my-4 text-slate-900 text-left border border-black mx-auto"
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          width: "210mm",
          minHeight: "297mm",
          padding: "15mm",
          boxSizing: "border-box"
        }}
      >
        {/* MTM Astra Otoparts Letterhead */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-6">
          <div>
            <span className="font-black text-base text-slate-800 tracking-wider">PT MENARA TERUS MAKMUR</span>
            <span className="block text-[8px] font-bold text-slate-500 italic uppercase">A Member of ASTRA Otoparts Group</span>
          </div>
          <div className="text-right text-[7px] text-slate-400 font-semibold leading-normal">
            <div>Jababeka Industrial Estate Block H-1 No. 12</div>
            <div>Cikarang, Bekasi, Jawa Barat - Indonesia</div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center my-6">
          <h1 className="text-base font-black uppercase tracking-widest border-b border-black pb-1.5 inline-block">
            INTERNAL MEMORANDUM
          </h1>
          <div className="text-slate-500 text-[10px] font-bold mt-2 font-mono text-center">
            NO: {memoNum}
          </div>
        </div>

        {/* Memo Grid Metadata Header */}
        <div className="border border-black p-4 mb-6 space-y-2 bg-slate-50 font-sans text-[10.5px] leading-relaxed">
          <div className="grid grid-cols-6 gap-1">
            <span className="font-extrabold text-slate-500 col-span-1">KEPADA</span>
            <span className="font-black text-slate-900 col-span-5">: Finance & Accounting Div. AOP (Astra Otoparts Group)</span>
            
            <span className="font-extrabold text-slate-500 col-span-1">DARI</span>
            <span className="font-black text-slate-900 col-span-5">: Finance & Accounting Department PT MTM</span>
            
            <span className="font-extrabold text-slate-500 col-span-1">TANGGAL</span>
            <span className="font-medium text-slate-700 col-span-5">: Cikarang, {memo.dateSent}</span>
            
            <span className="font-extrabold text-slate-500 col-span-1">HAL</span>
            <span className="font-black text-red-650 col-span-5">: Pengajuan Accrual Klaim Denda Kualitas QPR - {memo.supplierName}</span>
          </div>
        </div>

        {/* Body Text */}
        <div className="space-y-4 text-[10.5px] leading-relaxed mb-6 font-medium text-slate-700 text-justify">
          <p>Dengan hormat,</p>
          <p>
            Bersama memo ini kami informasikan pengajuan rencana pemotongan tagihan (Deduction Note) atas klaim penalti denda finansial kualitas QPR terhadap supplier <strong>{memo.supplierName}</strong> periode berjalan.
          </p>
          <p>
            Detail surat konfirmasi denda finansial kualitas (Confirmation Letter) yang dikirimkan ke vendor adalah sebagai berikut:
          </p>
        </div>

        {/* Details Table */}
        <div className="mb-6">
          <table className="w-full text-[10.5px] text-left border-collapse border border-black font-semibold text-slate-800">
            <thead>
              <tr className="bg-slate-100 border-b border-black text-[9.5px] text-slate-700">
                <th className="border border-black px-4 py-2">Parameter Dokumen</th>
                <th className="border border-black px-4 py-2">Rincian / Nilai Klaim</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-4 py-2 bg-slate-50/50">Nama Vendor / Supplier</td>
                <td className="border border-black px-4 py-2 text-slate-900">{memo.supplierName}</td>
              </tr>
              <tr>
                <td className="border border-black px-4 py-2 bg-slate-50/50">No. Confirmation Letter</td>
                <td className="border border-black px-4 py-2 font-mono text-indigo-700">{memo.clNumber}</td>
              </tr>
              <tr>
                <td className="border border-black px-4 py-2 bg-slate-50/50">Nilai Denda Keuangan</td>
                <td className="border border-black px-4 py-2 text-red-650 font-black text-sm">{memo.amount}</td>
              </tr>
              <tr>
                <td className="border border-black px-4 py-2 bg-slate-50/50">Status Otorisasi Vendor</td>
                <td className="border border-black px-4 py-2">
                  {memo.status === "APPROVED" ? (
                    <span className="text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9.5px]">
                      Sudah di-Approval Vendor
                    </span>
                  ) : (
                    <span className="text-amber-700 font-extrabold bg-amber-50 border border-amber-250 px-2.5 py-0.5 rounded-full text-[9.5px]">
                      Belum di-Approval Vendor (Pending)
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Conclusion text */}
        <div className="space-y-4 text-[10.5px] leading-relaxed mb-10 font-medium text-slate-700 text-justify">
          <p>
            Rincian data penalti di atas telah diverifikasi dan disetujui oleh internal Quality Assurance Dept Head dan Plant Head MTM. Kami mengajukan pencadangan piutang penalti keuangan ini di pembukuan Astra Otoparts Finance Group agar diproses pada siklus pembayaran vendor bulan berikutnya.
          </p>
          <p>Demikian memorandum internal ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
        </div>

        {/* Signature blocks */}
        <div className="grid grid-cols-2 gap-12 text-[10.5px] leading-relaxed font-bold mt-12">
          {/* Prepared by */}
          <div className="flex flex-col min-h-[100px] justify-between">
            <div>
              <span>Dibuat Oleh,</span>
              <span className="block text-slate-500 text-[9.5px] mt-0.5">Finance Department MTM</span>
            </div>
            <div>
              <div className="border-b border-black w-40 h-8 flex items-end">
                <span className="font-serif italic text-blue-700 text-xs block ml-1 select-none">Heri S.</span>
              </div>
              <span className="block text-slate-800 mt-1">Heri Susanto</span>
              <span className="block text-slate-400 text-[9px] font-medium">Accounting & Finance Staff</span>
            </div>
          </div>

          {/* Approved by */}
          <div className="flex flex-col min-h-[100px] justify-between">
            <div>
              <span>Disetujui Oleh,</span>
              <span className="block text-slate-500 text-[9.5px] mt-0.5">Accounting & Finance Head MTM</span>
            </div>
            <div>
              <div className="border-b border-black w-40 h-8 flex items-end">
                <span className="font-serif italic text-blue-700 text-xs block ml-1 select-none">Anindita I.</span>
              </div>
              <span className="block text-slate-800 mt-1">Anindita Irmaningtyas</span>
              <span className="block text-slate-400 text-[9px] font-medium">Dep. Head Accounting & Finance</span>
            </div>
          </div>
        </div>

        {/* Footer print details */}
        <div className="text-center text-[7.5px] text-slate-400 mt-16 pt-3 border-t border-slate-100 select-none">
          PT Menara Terus Makmur Internal Document • PR4-FRM-08105
        </div>

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
          #aop-memo-print-area, #aop-memo-print-area * { visibility: visible; }
          #aop-memo-print-area {
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
