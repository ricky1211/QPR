"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Eye, MessageSquare, AlertCircle, X, Calendar, User, Info, RefreshCw, FileText } from "lucide-react";
import QprPrintPreview from "./QprPrintPreview";

export default function PurchasingView() {
  const [purchasingClaims, setPurchasingClaims] = useState([
    {
      id: 1,
      qprNumber: "QPR/2026/04/JAYADI",
      supplierName: "PT JAYADI",
      date: "2026-04-10",
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
      date: "2026-05-15",
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
      date: "2026-05-20",
      period: "Mei 2026",
      amount: "Rp 12.500.000",
      vendorDecision: "Menunggu Keputusan Vendor",
      fileUploaded: null,
      status: "WAITING_VENDOR"
    }
  ]);

  // Filtering states
  const [filterDate, setFilterDate] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal details state
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [previewQpr, setPreviewQpr] = useState(null);

  // Get unique vendors from claims
  const uniqueVendors = Array.from(new Set(purchasingClaims.map(c => c.supplierName)));

  // Filter logic
  const filteredClaims = purchasingClaims.filter(claim => {
    const matchesDate = filterDate ? claim.date === filterDate : true;
    const matchesVendor = filterVendor ? claim.supplierName === filterVendor : true;
    const matchesStatus = filterStatus ? claim.status === filterStatus : true;
    return matchesDate && matchesVendor && matchesStatus;
  });

  const handleResetFilters = () => {
    setFilterDate("");
    setFilterVendor("");
    setFilterStatus("");
  };

  return (
    <div className="space-y-6">
      
      {/* Filters Section */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm space-y-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block text-left">
          Filter Data Klaim
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          {/* Date Filter */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tanggal Temuan
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch (err) {}
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-semibold bg-slate-50/50 cursor-pointer"
              />
            </div>
          </div>

          {/* Vendor Filter */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Nama Subcont / Vendor
            </label>
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-semibold bg-slate-50/50"
            >
              <option value="">Semua Vendor</option>
              {uniqueVendors.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Status Klaim
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-semibold bg-slate-50/50"
            >
              <option value="">Semua Status</option>
              <option value="CLOSED_PAID">Closed Paid</option>
              <option value="WAITING_VENDOR">Waiting Vendor</option>
            </select>
          </div>

          {/* Reset button */}
          <div>
            <button
              onClick={handleResetFilters}
              disabled={!filterDate && !filterVendor && !filterStatus}
              className={`w-full px-4 py-2 text-xs font-bold rounded-md border flex items-center justify-center gap-1.5 transition-all ${
                !filterDate && !filterVendor && !filterStatus
                  ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 cursor-pointer"
              }`}
            >
              <RefreshCw size={12} />
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Monitoring QPR Table */}
      <div className="bg-white border border-slate-400 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-400 bg-slate-100 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">Dashboard Monitoring</span>
            <h4 className="text-sm font-bold text-slate-800 mt-1 text-left">Status Keputusan Klaim QPR Vendor</h4>
          </div>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded shadow-sm">
            Total: {filteredClaims.length} Data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-200 text-slate-900 font-extrabold border-b border-slate-600">
              <tr>
                <th className="px-3 py-2 w-12 text-center">No</th>
                <th className="px-3 py-2">Nama Subcont</th>
                <th className="px-3 py-2 text-center w-36">Status</th>
                <th className="px-3 py-2 text-center w-28">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-300">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400 font-semibold">
                    Tidak ada data yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim, index) => {
                  let badgeStyle = "bg-slate-50 text-slate-600 border border-slate-200/60";
                  let dotColor = "bg-slate-400";
                  let statusText = claim.status;

                  if (claim.status === "CLOSED_PAID") {
                    badgeStyle = "bg-green-600 text-white shadow-sm border border-green-700";
                    statusText = "Closed Paid";
                  } else if (claim.status === "WAITING_VENDOR") {
                    badgeStyle = "bg-amber-500 text-white shadow-sm border border-amber-600";
                    statusText = "Waiting Vendor";
                  }

                  return (
                    <tr key={claim.id} className="hover:bg-slate-50 transition-colors font-semibold">
                      <td className="px-3 py-1.5 text-center text-slate-400 font-bold font-mono">{index + 1}</td>
                      <td className="px-3 py-1.5 font-bold text-slate-800">{claim.supplierName}</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${badgeStyle}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setPreviewQpr({
                              qprNumber: claim.qprNumber,
                              supplierName: claim.supplierName,
                              period: claim.period,
                              date: claim.date,
                              totalItems: 300,
                              rejectItems: 12,
                              allowanceRatio: "0.5%",
                              claimAmount: claim.amount,
                              status: claim.status,
                            })}
                            className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-full transition-all cursor-pointer flex items-center justify-center hover:scale-105 shadow-sm"
                            title="Preview QPR"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            onClick={() => setSelectedClaim(claim)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all cursor-pointer flex items-center justify-center hover:scale-105 shadow-sm"
                            title="Lihat Detail"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal Pop-up */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-300 flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-300 flex justify-between items-center bg-slate-50/50">
              <div className="text-left">
                <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Detail Rincian Klaim</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedClaim.qprNumber}</h4>
              </div>
              <button 
                onClick={() => setSelectedClaim(null)} 
                className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-4 text-left text-xs font-semibold">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Nama Subcont / Supplier</span>
                <span className="text-sm font-bold text-slate-800 block mt-1">{selectedClaim.supplierName}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">QPR Date: {selectedClaim.date}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                  <span className="text-slate-400 block font-bold">Periode:</span>
                  <strong className="text-slate-800 font-bold mt-0.5 block">{selectedClaim.period}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                  <span className="text-slate-400 block font-bold">Nilai Klaim:</span>
                  <strong className="text-red-600 font-extrabold mt-0.5 block">{selectedClaim.amount}</strong>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Keputusan Pilihan Vendor</span>
                  <span className="text-slate-800 font-bold block mt-0.5">{selectedClaim.vendorDecision}</span>
                </div>
                <div className="border-t border-slate-200/60 pt-2 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Bukti Dokumen Lampiran</span>
                  {selectedClaim.fileUploaded ? (
                    <span className="flex items-center gap-1 text-blue-600 cursor-pointer hover:underline font-bold mt-1 text-[11px]">
                      <Eye size={12} />
                      {selectedClaim.fileUploaded}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic block mt-0.5">Belum diunggah</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-300 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedClaim(null)} 
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs shadow-md shadow-blue-600/10 transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QPR Print Preview Modal */}
      {previewQpr && (
        <QprPrintPreview
          qpr={previewQpr}
          onClose={() => setPreviewQpr(null)}
        />
      )}

    </div>
  );
}
