"use client";

import React from "react";
import { FileSpreadsheet, Eye, MessageSquare, AlertCircle } from "lucide-react";

export default function PurchasingView() {
  const purchasingClaims = [
    {
      id: 1,
      qprNumber: "QPR/2026/04/JAYADI",
      supplierName: "PT JAYADI",
      period: "April 2026",
      amount: "Rp 18.200.000",
      vendorDecision: "Potong Tagihan (Deduction)",
      fileUploaded: "Agreement_Letter_Deduction_Jayadi.pdf",
      status: "CLOSED_PAID"
    },
    {
      id: 2,
      qprNumber: "QPR/2026/05/IKAN_BAKAR",
      supplierName: "PT IKAN BAKAR",
      period: "Mei 2026",
      amount: "Rp 24.000.000",
      vendorDecision: "Transfer Tunai (Cash)",
      fileUploaded: "Bukti_Transfer_IkanBakar.pdf",
      status: "CLOSED_PAID"
    },
    {
      id: 3,
      qprNumber: "QPR/2026/05/JAYADI",
      supplierName: "PT JAYADI",
      period: "Mei 2026",
      amount: "Rp 12.500.000",
      vendorDecision: "Menunggu Keputusan Vendor",
      fileUploaded: null,
      status: "WAITING_VENDOR"
    }
  ];

  return (
    <div className="space-y-6">
      

      {/* Monitoring QPR Table */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dashboard Monitoring</span>
          <h4 className="text-sm font-bold text-slate-800 mt-1">Status Keputusan Klaim QPR Vendor</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">No. QPR</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Nilai Klaim</th>
                <th className="px-4 py-3">Pilihan Vendor</th>
                <th className="px-4 py-3">Bukti Lampiran</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {purchasingClaims.map((claim) => {
                let badgeStyle = "bg-slate-50 text-slate-600 border border-slate-200/60";
                let dotColor = "bg-slate-400";
                let statusText = claim.status;

                if (claim.status === "CLOSED_PAID") {
                  badgeStyle = "bg-green-50 text-green-700 border border-green-200/60";
                  dotColor = "bg-green-500";
                  statusText = "Closed Paid";
                } else if (claim.status === "WAITING_VENDOR") {
                  badgeStyle = "bg-amber-50 text-amber-700 border border-amber-200/60";
                  dotColor = "bg-amber-500";
                  statusText = "Waiting Vendor";
                }

                return (
                  <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{claim.qprNumber}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{claim.supplierName}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-600">{claim.period}</td>
                    <td className="px-4 py-2.5 font-extrabold text-slate-800">{claim.amount}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{claim.vendorDecision}</td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">
                      {claim.fileUploaded ? (
                        <span className="flex items-center gap-1 text-blue-600 cursor-pointer hover:underline">
                          <Eye size={12} />
                          {claim.fileUploaded.slice(0, 15)}...
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Belum diunggah</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${badgeStyle}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mr-1.5 shrink-0 ${claim.status === "WAITING_VENDOR" ? "animate-pulse" : ""}`}></span>
                        {statusText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
