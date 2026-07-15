"use client";

import React, { useState, useEffect } from "react";
import SectionHeadView from "./SectionHeadView";
import DeptHeadView from "./DeptHeadView";

export default function ApproveNcrDashboard({ pendingNcrs, handleApproveNcrAction, username = "admin" }) {
  const getInitialTab = () => {
    if (username === "depthead") return "dept-head";
    return "section-head"; // Default to Section Head (SPV) for admin and sectionhead
  };

  const [levelTab, setLevelTab] = useState(getInitialTab());

  useEffect(() => {
    setLevelTab(getInitialTab());
  }, [username]);

  const isAdmin = username === "admin";

  return (
    <div className="space-y-6 text-left">
      
      {/* Header and Toggle Level */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white border border-slate-100 rounded-lg shadow-sm gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">NCR Approvals</h3>
          {!isAdmin && (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block">
              Otorisasi: {levelTab === "section-head" ? "SPV" : "MNG"}
            </span>
          )}
        </div>
        
        {/* Toggle Switcher — Only visible for Admin (Super User) */}
        {isAdmin && (
          <div className="flex bg-slate-100 p-1 rounded-md shrink-0">
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
        )}
      </div>

      {/* Render selected Level View */}
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
          pendingQprs={[]}
          showNcr={true}
          showQpr={false}
          handleApproveNcrAction={handleApproveNcrAction}
          handleApproveQprAction={() => {}}
        />
      )}

    </div>
  );
}
