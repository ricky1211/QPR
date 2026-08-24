"use client";

import React, { useState, useEffect } from "react";
import { Search, Building, CheckCircle, Plus, X, Edit, Loader2 } from "lucide-react";
import { vendorService } from "@/services/vendorService";

interface Vendor {
  id: string;
  vendorCode: string;
  vendorName: string;
  email: string | null;
  status: string;
}

export default function VendorsDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formVendorCode, setFormVendorCode] = useState("");
  const [formVendorName, setFormVendorName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formStatus, setFormStatus] = useState("Aktif");
  const [submitting, setSubmitting] = useState(false);

  // Read role context from cookie
  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/(?:^|; )mtm_user=([^;]*)/);
      setIsAdmin(match?.[1] === "admin");
    }
  }, []);

  const fetchVendors = () => {
    setIsLoading(true);
    vendorService.getAll()
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((v: any) => ({
            id: v.id,
            vendorCode: v.vendorCode,
            vendorName: v.vendorName || `Vendor ${v.vendorCode}`,
            email: v.email || null,
            status: v.status || "Aktif",
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
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleAddClick = () => {
    setEditingVendor(null);
    setFormVendorCode("");
    setFormVendorName("");
    setFormEmail("");
    setFormStatus("Aktif");
    setIsModalOpen(true);
  };

  const handleEditClick = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormVendorCode(vendor.vendorCode);
    setFormVendorName(vendor.vendorName);
    setFormEmail(vendor.email || "");
    setFormStatus(vendor.status || "Aktif");
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVendorCode || !formVendorName) {
      alert("Vendor Code dan Nama Vendor wajib diisi!");
      return;
    }
    setSubmitting(true);
    const payload = {
      vendorCode: formVendorCode,
      vendorName: formVendorName,
      email: formEmail || undefined,
      status: formStatus,
    };

    const apiCall = editingVendor
      ? vendorService.update(editingVendor.id, payload)
      : vendorService.create(payload);

    apiCall
      .then(() => {
        setIsModalOpen(false);
        fetchVendors();
      })
      .catch((err: any) => {
        console.error("Failed to save vendor:", err);
        alert(`Gagal menyimpan vendor: ${err.message || err}`);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & Actions Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-slate-350 rounded-lg shadow-sm gap-4">
        <div className="flex items-center gap-3 w-full sm:max-w-md">
          <div className="relative flex-1 text-left">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari vendor code atau nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/30 text-slate-800 font-semibold"
            />
          </div>
          {isAdmin && (
            <button
              onClick={handleAddClick}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shrink-0"
            >
              <Plus size={14} />
              Tambah Vendor
            </button>
          )}
        </div>
        <div className="text-xs text-slate-455 font-bold uppercase tracking-wider">
          Total Vendor: <span className="font-extrabold text-slate-800">{filteredVendors.length}</span>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="text-xs font-bold">Memuat data vendor...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[10px] tracking-wider uppercase whitespace-nowrap">
                <tr>
                  <th className="px-3 py-2 w-16 text-center">No</th>
                  <th className="px-3 py-2 w-32">Vendor Code</th>
                  <th className="px-3 py-2">Vendor Name</th>
                  <th className="px-3 py-2">Email Address</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  {isAdmin && <th className="px-3 py-2 text-right">Opsi</th>}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors font-medium">
                    <td className="px-3 py-1.5 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                    <td className="px-3 py-1.5 font-mono font-bold text-slate-900">{v.vendorCode}</td>
                    <td className="px-3 py-1.5 text-slate-800 font-semibold">
                      <div className="flex items-center gap-2">
                        <Building size={13} className="text-slate-400 shrink-0" />
                        <span>{v.vendorName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-slate-500 font-mono">{v.email || "-"}</td>
                    <td className="px-3 py-1.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                        v.status === "Aktif"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        <CheckCircle size={9} />
                        {v.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEditClick(v)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all inline-flex items-center gap-0.5 cursor-pointer font-bold text-xs"
                          title="Edit Vendor"
                        >
                          <Edit size={12} />
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredVendors.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-3 py-8 text-center text-slate-400 font-bold italic bg-slate-50">
                      Tidak ditemukan data vendor yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Master Data Vendor</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">
                  {editingVendor ? "Edit Detail Vendor" : "Tambah Vendor Baru"}
                </h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vendor Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  disabled={editingVendor !== null}
                  value={formVendorCode}
                  onChange={(e) => setFormVendorCode(e.target.value)}
                  placeholder="Contoh: VND001"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Vendor <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formVendorName}
                  onChange={(e) => setFormVendorName(e.target.value)}
                  placeholder="Contoh: PT. TEMARU ENGINEERING"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Vendor (Opsional)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Contoh: sales@temaru.co.id"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white cursor-pointer"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
