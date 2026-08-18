"use client";

import React, { useState, useEffect } from "react";
import { Search, Building, Clock, CheckCircle } from "lucide-react";
import { vendorService } from "@/services/vendorService";

interface Vendor {
  id: string;
  vendorCode: string;
  vendorName: string;
  status: string;
}

export default function VendorsDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    vendorService.getAll()
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((v: any) => ({
            id: v.id,
            vendorCode: v.vendorCode,
            vendorName: v.vendorName || `Vendor ${v.vendorCode}`,
            status: "Aktif",
          }));
          setVendors(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to load vendors:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredVendors = vendors.filter(
    (v) =>
      v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & Actions Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-slate-350 rounded-lg shadow-sm gap-4">
        <div className="relative w-full sm:max-w-xs text-left">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari vendor code atau nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/30 text-slate-800 font-semibold"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Menampilkan total <span className="font-bold text-slate-800">{filteredVendors.length}</span> data vendor terdaftar.
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white border border-slate-400 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-200 text-slate-900 font-extrabold border-b border-slate-600">
              <tr>
                <th className="px-4 py-3 w-16 text-center">No</th>
                <th className="px-4 py-3">Vendor Code</th>
                <th className="px-4 py-3">Vendor Name</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-300">
              {filteredVendors.map((v, idx) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors font-semibold">
                  <td className="px-4 py-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-700">{v.vendorCode}</td>
                  <td className="px-4 py-3 text-slate-800 font-extrabold flex items-center gap-2">
                    <Building size={14} className="text-slate-400 shrink-0" />
                    {v.vendorName}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250">
                      <CheckCircle size={10} />
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400 font-bold italic bg-slate-50">
                    Tidak ditemukan data vendor yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
