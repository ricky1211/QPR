"use client";

import React, { useState, useEffect } from "react";
import { Search, AlertTriangle, Edit, Plus, X, ArrowRight, Loader2 } from "lucide-react";
import { partService } from "@/services/partService";
import { vendorService } from "@/services/vendorService";

interface Supplier {
  id: string;
  vendorCode: string;
  vendorName: string;
}

interface Part {
  id: string;
  partNumber: string;
  partName: string;
  supplierId: string;
  supplierName: string;
  allowanceRatio: number | null;
  status: string;
}

export default function PartsDirectory({ handleCreateQpr }: { handleCreateQpr: (part: any) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formPartNumber, setFormPartNumber] = useState("");
  const [formPartName, setFormPartName] = useState("");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formAllowanceRatio, setFormAllowanceRatio] = useState("");
  const [formStatus, setFormStatus] = useState("Aktif");
  const [submitting, setSubmitting] = useState(false);

  // Read role context from cookie
  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/(?:^|; )mtm_user=([^;]*)/);
      setIsAdmin(match?.[1] === "admin");
    }
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [partsData, vendorsData] = await Promise.all([
        partService.getAll(),
        vendorService.getAll()
      ]);

      if (Array.isArray(vendorsData)) {
        setSuppliers(vendorsData.map((v: any) => ({
          id: v.id,
          vendorCode: v.vendorCode,
          vendorName: v.vendorName || `Vendor ${v.vendorCode}`
        })));
      }

      if (Array.isArray(partsData)) {
        const mappedParts: Part[] = [];
        partsData.forEach((p: any) => {
          if (p.vendorParts && p.vendorParts.length > 0) {
            p.vendorParts.forEach((vp: any) => {
              mappedParts.push({
                id: p.id,
                partNumber: p.partNumber,
                partName: p.partDesc || p.partNumber,
                supplierId: vp.vendor?.id || "",
                supplierName: vp.vendor?.vendorName || `Vendor ${vp.vendor?.vendorCode || ""}`,
                allowanceRatio: p.allowanceRatio,
                status: p.status || "Aktif"
              });
            });
          } else {
            mappedParts.push({
              id: p.id,
              partNumber: p.partNumber,
              partName: p.partDesc || p.partNumber,
              supplierId: "",
              supplierName: "Belum Ditugaskan",
              allowanceRatio: p.allowanceRatio,
              status: p.status || "Aktif"
            });
          }
        });
        setParts(mappedParts);
      }
    } catch (err) {
      console.error("Failed to load parts directory data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClick = () => {
    setEditingPart(null);
    setFormPartNumber("");
    setFormPartName("");
    setFormSupplierId("");
    setFormAllowanceRatio("");
    setFormStatus("Aktif");
    setIsModalOpen(true);
  };

  const handleEditClick = (part: Part) => {
    setEditingPart(part);
    setFormPartNumber(part.partNumber);
    setFormPartName(part.partName);
    setFormSupplierId(part.supplierId);
    setFormAllowanceRatio(part.allowanceRatio !== null ? String(part.allowanceRatio) : "");
    setFormStatus(part.status || "Aktif");
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPartNumber || !formPartName || !formSupplierId) {
      alert("Part Number, Nama Part, dan Supplier wajib diisi!");
      return;
    }
    setSubmitting(true);
    const payload = {
      partNumber: formPartNumber,
      partDesc: formPartName,
      allowanceRatio: formAllowanceRatio === "" ? null : parseFloat(formAllowanceRatio),
      status: formStatus,
      supplierId: formSupplierId
    };

    const apiCall = editingPart
      ? partService.update(editingPart.id, payload)
      : partService.create(payload);

    apiCall
      .then(() => {
        setIsModalOpen(false);
        fetchData();
      })
      .catch((err: any) => {
        console.error("Failed to save part:", err);
        alert(`Gagal menyimpan part: ${err.message || err}`);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const filteredParts = parts.filter((p) =>
    p.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
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
              placeholder="Cari part number atau supplier..."
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
              Tambah Part
            </button>
          )}
        </div>
        <div className="text-xs text-slate-455 font-bold uppercase tracking-wider">
          Total Part: <span className="font-extrabold text-slate-800">{filteredParts.length}</span>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="text-xs font-bold">Memuat data part...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[10px] tracking-wider uppercase whitespace-nowrap">
                <tr>
                  <th className="px-3 py-2">Part Number</th>
                  <th className="px-3 py-2">Part Name</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2 text-center">NG Allowance (%)</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-right">Opsi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredParts.map((p, idx) => {
                  const hasAllowance = p.allowanceRatio !== null;
                  return (
                    <tr key={`${p.id}-${p.supplierId || 'none'}-${idx}`} className="hover:bg-slate-50/50 transition-colors font-medium">
                      <td className="px-3 py-1.5 font-mono font-bold text-slate-900">{p.partNumber}</td>
                      <td className="px-3 py-1.5 text-slate-800 font-semibold">{p.partName}</td>
                      <td className="px-3 py-1.5 text-slate-500 font-medium">{p.supplierName}</td>
                      <td className="px-3 py-1.5 text-center">
                        {hasAllowance ? (
                          <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10.5px]">
                            {p.allowanceRatio}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold text-[9.5px]">
                            <AlertTriangle size={9} />
                            Belum diatur
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                          p.status === "Aktif"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right space-x-2 whitespace-nowrap">
                        {isAdmin && (
                          <button
                            onClick={() => handleEditClick(p)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all inline-flex items-center gap-0.5 cursor-pointer font-bold text-xs"
                            title="Edit Part"
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleCreateQpr(p)}
                          disabled={p.status !== "Aktif"}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer text-[10.5px]"
                          title="Buat Dokumen QPR"
                        >
                          <span>Buat QPR</span>
                          <ArrowRight size={10} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredParts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-400 font-bold italic bg-slate-50">
                      Tidak ditemukan data part yang cocok.
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
                <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Master Data Part</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">
                  {editingPart ? "Edit Detail Part" : "Tambah Part Baru"}
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
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Part Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  disabled={editingPart !== null}
                  value={formPartNumber}
                  onChange={(e) => setFormPartNumber(e.target.value)}
                  placeholder="Contoh: MB-001"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Part / Deskripsi <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formPartName}
                  onChange={(e) => setFormPartName(e.target.value)}
                  placeholder="Contoh: Motherboard X1"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supplier / Vendor <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formSupplierId}
                  onChange={(e) => setFormSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-850 font-semibold bg-white cursor-pointer"
                >
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.vendorName} ({s.vendorCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">NG Allowance Ratio (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formAllowanceRatio}
                    onChange={(e) => setFormAllowanceRatio(e.target.value)}
                    placeholder="Contoh: 0.5"
                    className="w-full pl-3 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white"
                  />
                  <span className="absolute right-3.5 top-2 text-xs font-bold text-slate-400">%</span>
                </div>
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
