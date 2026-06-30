"use client";

import React from "react";
import { Search, AlertTriangle, Edit2, ArrowRight } from "lucide-react";

export default function PartsDirectory({
  parts,
  searchQuery,
  setSearchQuery,
  setEditingPart,
  setEditAllowanceVal,
  handleCreateQpr
}) {
  return (
    <div className="space-y-6">
      
      {/* Search & Actions Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-slate-100 rounded-lg shadow-sm gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari part number atau supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/30"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Menampilkan total <span className="font-bold text-slate-800">{parts.length}</span> data part terdaftar.
        </div>
      </div>

      {/* Parts Directory Table */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Part Number</th>
                <th className="px-6 py-4">Part Name</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4 text-center">NG Allowance (%)</th>
                <th className="px-6 py-4">Status Pipeline</th>
                <th className="px-6 py-4 text-right">Opsi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {parts
                .filter((p) =>
                  p.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((p) => {
                  let badgeStyle = "bg-slate-100 text-slate-600";
                  if (p.status === "UNDER ALLOWANCE") {
                    badgeStyle = "bg-emerald-100 text-emerald-700 font-bold";
                  } else if (p.status === "WAITING QPR CREATION") {
                    badgeStyle = "bg-blue-100 text-blue-700 font-bold";
                  } else if (p.status === "WAITING NCRs") {
                    badgeStyle = "bg-amber-100 text-amber-700 font-bold";
                  } else if (p.status === "OVERDUE 10 HARI") {
                    badgeStyle = "bg-red-500 text-white font-bold animate-blink";
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{p.partNumber}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{p.partName}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{p.supplierName}</td>
                      <td className="px-6 py-4 text-center">
                        {p.allowanceRatio !== null ? (
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                            {p.allowanceRatio}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg font-bold text-[10px]">
                            <AlertTriangle size={12} />
                            Belum diatur
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase inline-block ${badgeStyle}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingPart(p);
                            setEditAllowanceVal(p.allowanceRatio === null ? "" : String(p.allowanceRatio));
                          }}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          title="Edit NG Allowance"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleCreateQpr(p)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Buat Dokumen QPR"
                        >
                          <span>Buat QPR</span>
                          <ArrowRight size={12} />
                        </button>
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
