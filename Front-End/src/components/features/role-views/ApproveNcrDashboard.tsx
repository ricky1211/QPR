"use client";

import React, { useState } from "react";
import SectionHeadView from "./SectionHeadView";
import DeptHeadView from "./DeptHeadView";

export default function ApproveNcrDashboard({ pendingNcrs, handleApproveNcrAction }) {
  const [levelTab, setLevelTab] = useState("foreman"); // 'foreman', 'section-head', or 'dept-head'

  return (
    <div className="space-y-6">
      
      {/* Header and Toggle Level */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white border border-slate-100 rounded-lg shadow-sm gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Otoritas Persetujuan NCR</h3>
          <p className="text-xs text-slate-400 mt-1">Review laporan defect kualitas material harian dan lakukan tanda tangan digital.</p>
        </div>
        
        {/* Toggle Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-md shrink-0">
          <button
            onClick={() => setLevelTab("foreman")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              levelTab === "foreman" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            STAFF
          </button>
          <button
            onClick={() => setLevelTab("section-head")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              levelTab === "section-head" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            SPV
          </button>
          <button
            onClick={() => setLevelTab("dept-head")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              levelTab === "dept-head" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            MNG
          </button>
        </div>
      </div>

      {/* Render selected Level View */}
      {levelTab === "foreman" && (
        <SectionHeadView
          pendingNcrs={pendingNcrs}
          handleApproveNcrAction={handleApproveNcrAction}
          role="Foreman"
        />
      )}
      {levelTab === "section-head" && (
        <SectionHeadView
          pendingNcrs={pendingNcrs}
          handleApproveNcrAction={handleApproveNcrAction}
          role="Section Head"
        />
      )}
      {levelTab === "dept-head" && (
        <DeptHeadView
          pendingNcrs={pendingNcrs}
          pendingQprs={[]} // Don't show QPRs in NCR dashboard
          handleApproveNcrAction={handleApproveNcrAction}
          handleApproveQprAction={() => {}}
        />
      )}

    </div>
  );
}
