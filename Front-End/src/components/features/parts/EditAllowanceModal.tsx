"use client";

import React from "react";
import { X } from "lucide-react";

export default function EditAllowanceModal({
  editingPart,
  setEditingPart,
  editAllowanceVal,
  setEditAllowanceVal,
  handleSaveAllowance
}) {
  if (!editingPart) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Admin Konfigurasi</span>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">Edit NG Allowance</h4>
          </div>
          <button
            onClick={() => setEditingPart(null)}
            className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveAllowance}>
          <div className="p-6 space-y-4">
            
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 block">Item Target</span>
              <span className="text-sm font-bold text-slate-800 block mt-1">{editingPart.partName}</span>
              <span className="text-xs font-semibold text-slate-400 block mt-0.5">
                {editingPart.partNumber} • {editingPart.supplierName}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">NG Allowance Ratio (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Contoh: 0.5"
                  value={editAllowanceVal}
                  onChange={(e) => setEditAllowanceVal(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute right-4 top-3 text-sm font-bold text-slate-400">%</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Nilai persentase defect maksimum yang ditoleransi perusahaan per bulan sebelum penagihan QPR.
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingPart(null)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs shadow-md shadow-blue-600/10 transition-colors"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
