"use client";

import React, { useState } from "react";
import PpicView from "./PpicView";
import DeptHeadView from "./DeptHeadView";

export default function ApproveQprDashboard({ pendingQprs, handleApproveQprAction }) {
  const [levelTab, setLevelTab] = useState("ppic"); // 'ppic' or 'dept-head'

  return (
    <div className="space-y-6">
      
      {/* Header and Toggle Level */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white border border-slate-100 rounded-lg shadow-sm gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Otoritas Validasi & Approval QPR</h3>
          <p className="text-xs text-slate-400 mt-1">Review rekonsiliasi denda klaim bulanan supplier dan lakukan tanda tangan digital.</p>
        </div>
        
        {/* Toggle Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-md shrink-0">
          <button
            onClick={() => setLevelTab("ppic")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              levelTab === "ppic" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            PPIC Staff
          </button>
          <button
            onClick={() => setLevelTab("dept-head")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              levelTab === "dept-head" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Dept Head
          </button>
        </div>
      </div>

      {/* Render selected Level View */}
      {levelTab === "ppic" ? (
        <PpicView
          pendingQprs={pendingQprs}
          handleApproveQprAction={handleApproveQprAction}
        />
      ) : (
        <DeptHeadView
          pendingNcrs={[]} // Don't show NCRs in QPR dashboard
          pendingQprs={pendingQprs}
          handleApproveNcrAction={() => {}}
          handleApproveQprAction={handleApproveQprAction}
        />
      )}

    </div>
  );
}
