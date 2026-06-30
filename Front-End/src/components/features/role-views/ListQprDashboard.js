"use client";

import React, { useState } from "react";
import PurchasingView from "./PurchasingView";
import SubcontView from "./SubcontView";

export default function ListQprDashboard() {
  const [qprTab, setQprTab] = useState("monitor"); // 'monitor' or 'settle'

  return (
    <div className="space-y-6">
      
      {/* Header and Toggle Level */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white border border-slate-100 rounded-lg shadow-sm gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Daftar Dokumen & Status QPR</h3>
          <p className="text-xs text-slate-400 mt-1">Memonitor status penyelesaian denda vendor dan mengunggah dokumen persetujuan.</p>
        </div>
        
        {/* Toggle Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-md shrink-0">
          <button
            onClick={() => setQprTab("monitor")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              qprTab === "monitor" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Monitoring Vendor
          </button>
          <button
            onClick={() => setQprTab("settle")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              qprTab === "settle" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Settle Claim (Subcont)
          </button>
        </div>
      </div>

      {/* Render selected View */}
      {qprTab === "monitor" ? (
        <PurchasingView />
      ) : (
        <SubcontView />
      )}

    </div>
  );
}
