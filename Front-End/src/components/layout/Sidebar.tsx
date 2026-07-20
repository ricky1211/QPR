"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  CheckSquare,
  FileCheck2,
  FileText,
  ListTodo,
  Calendar as CalendarIcon,
  List as ListIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Mail,
  ClipboardList,
  Shield
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, username = "admin" }) {
  const isDraftTab = activeTab === "draft-ncr" || activeTab === "draft-qpr" || activeTab === "draft-cl";
  const [ncrExpanded, setNcrExpanded] = useState(activeTab === "buat-ncr" || activeTab === "approve-ncr");
  const [draftExpanded, setDraftExpanded] = useState(isDraftTab);

  // Sync expanded status when active tab changes externally
  useEffect(() => {
    if (activeTab === "buat-ncr" || activeTab === "approve-ncr") {
      setNcrExpanded(true);
    }
    if (activeTab === "draft-ncr" || activeTab === "draft-qpr" || activeTab === "draft-cl") {
      setDraftExpanded(true);
    }
  }, [activeTab]);

  const globalMenus = [
    { id: "calendar", name: "Calendar Logs", icon: CalendarIcon },
    { id: "parts", name: "List Part & Allowance", icon: ListIcon }
  ];

  const handleMenuClick = (id: string) => {
    setActiveTab(id);
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setSidebarOpen(false);
    }
  };

  const handleGroupClick = (group: "ncr" | "draft") => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
      if (group === "ncr") setNcrExpanded(true);
      if (group === "draft") setDraftExpanded(true);
    } else {
      if (group === "ncr") setNcrExpanded(!ncrExpanded);
      if (group === "draft") setDraftExpanded(!draftExpanded);
    }
  };

  const isNcrActive = activeTab === "buat-ncr" || activeTab === "approve-ncr";

  // Role Access Checks
  const isAdmin = username === "admin";
  const isOperator = username === "operator";
  const isSectionHead = username === "sectionhead";
  const isDeptHead = username === "depthead";
  const isDivHead = username === "divhead";
  const isPurchasing = username === "purchasing";
  const isAccounting = username === "accounting";

  const canBuatNcr = isOperator || isAdmin;
  const canApproveNcr = isSectionHead || isDeptHead || isAdmin;
  const hasNcrAccess = canBuatNcr || canApproveNcr;

  const canBuatQpr = isOperator || isAdmin;
  const canApproveQpr = isSectionHead || isDeptHead || isDivHead || isAdmin;
  const canCL = isAccounting || isAdmin;
  const canIMemo = isPurchasing || isAdmin;
  const canListQpr = isAdmin || isOperator || isAccounting || isPurchasing;

  return (
    <>
      {/* Backdrop overlay for tablet/mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm xl:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col justify-between bg-white border-r border-slate-200 transition-all duration-300 ease-in-out transform xl:z-20 ${
          sidebarOpen 
            ? "w-72 translate-x-0 shadow-2xl" 
            : "w-72 xl:w-20 -translate-x-full xl:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">

          {/* Sidebar Header / Logo + Role Badge */}
          <div className={`flex items-center justify-between h-[85px] shrink-0 bg-white border-b border-slate-100 ${sidebarOpen ? "px-4" : "px-4 xl:px-0 xl:justify-center"}`}>
            {sidebarOpen ? (
              <div className="flex flex-col items-start gap-1">
                <img
                  src="/qpr/logo-mtm.png"
                  alt="MTM Logo"
                  className="h-[40px] w-auto object-contain transition-all duration-300"
                />
                <span className="text-[8.5px] font-black bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-200">
                  Akses: {username.toUpperCase()}
                </span>
              </div>
            ) : (
              <>
                <img
                  src="/qpr/logo-mtm.png"
                  alt="MTM Logo"
                  className="h-[40px] w-auto object-contain xl:hidden"
                />
                <div className="hidden xl:flex w-10 h-10 rounded-lg bg-blue-600 text-white font-black text-center items-center justify-center text-xs shadow-md shadow-blue-500/20 animate-in zoom-in-95 duration-200" title={`Akses: ${username.toUpperCase()}`}>
                  {username.slice(0, 3).toUpperCase()}
                </div>
              </>
            )}
            
            {/* Close button — visible on tablet/mobile only */}
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="xl:hidden p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Tutup sidebar"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Sidebar Menus - Dashboard Features */}
          <div className={`shrink-0 transition-all duration-300 ${sidebarOpen ? "px-4 py-4" : "px-4 py-4 xl:px-2"}`}>
            <span className={`px-3 text-xs font-bold text-slate-400 tracking-widest uppercase block mb-2 transition-all ${sidebarOpen ? "block animate-in fade-in" : "xl:hidden"}`}>
              Menu Tugas Peran
            </span>
            <nav className="space-y-1.5">
              {/* Dashboard Utama */}
              <button
                onClick={() => handleMenuClick("dashboard")}
                className={`group flex items-center w-full gap-3 text-left rounded-md transition-all duration-150 touch-manipulation cursor-pointer ${
                  sidebarOpen ? "px-3 py-3" : "px-3 py-3 xl:px-0 xl:justify-center"
                } ${
                  activeTab === "dashboard"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-white hover:bg-blue-600"
                }`}
                title={!sidebarOpen ? "Dashboard Utama" : undefined}
              >
                <LayoutDashboard size={20} className={activeTab === "dashboard" ? "text-white shrink-0" : "text-blue-500 group-hover:text-white transition-colors shrink-0"} />
                <span className={`text-sm font-bold truncate transition-all ${sidebarOpen ? "block animate-in fade-in" : "xl:hidden"}`}>Dashboard Utama</span>
              </button>

              {/* NCR Group Accordion */}
              {hasNcrAccess && (
                <div>
                  <button
                    onClick={() => handleGroupClick("ncr")}
                    className={`group flex items-center justify-between w-full text-left rounded-md transition-all duration-150 touch-manipulation cursor-pointer ${
                      sidebarOpen ? "px-3 py-3" : "px-3 py-3 xl:px-0 xl:justify-center"
                    } ${
                      isNcrActive && sidebarOpen
                        ? "bg-slate-50 text-slate-800"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                    title={!sidebarOpen ? "NCR" : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Shield size={20} className={`shrink-0 ${isNcrActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"} transition-colors`} />
                      <span className={`text-sm font-bold truncate transition-all ${sidebarOpen ? "block animate-in fade-in" : "xl:hidden"}`}>
                        NCR
                      </span>
                    </div>
                    {sidebarOpen && (
                      ncrExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />
                    )}
                  </button>

                  {/* Submenu NCR */}
                  {sidebarOpen && ncrExpanded && (
                    <div className="pl-4 ml-5 border-l border-slate-100 mt-1 space-y-1 animate-slide-down">
                      {[
                        ...(canBuatNcr ? [
                          { id: "buat-ncr", name: "Buat NCR", icon: PlusCircle, color: "text-blue-600" },
                        ] : []),
                        ...(canApproveNcr ? [{ id: "approve-ncr", name: "Approval NCR", icon: CheckSquare, color: "text-amber-500" }] : []),
                      ].map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleMenuClick(sub.id)}
                            className={`group flex items-center w-full gap-3 text-left rounded-md px-3 py-2 transition-all duration-150 cursor-pointer ${
                              isSubActive
                                ? "bg-blue-600 text-white font-black shadow-sm"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-bold"
                            }`}
                          >
                            <SubIcon size={16} className={isSubActive ? "text-white" : `${sub.color} group-hover:text-blue-600`} />
                            <span className="text-sm font-bold truncate">{sub.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Pengisian QPR */}
              {canBuatQpr && (
                <button
                  onClick={() => handleMenuClick("buat-qpr")}
                  className={`group flex items-center w-full gap-3 text-left rounded-md transition-all duration-150 touch-manipulation cursor-pointer ${
                    sidebarOpen ? "px-3 py-3" : "px-3 py-3 xl:px-0 xl:justify-center"
                  } ${
                    activeTab === "buat-qpr"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-white hover:bg-blue-600"
                  }`}
                  title={!sidebarOpen ? "Pengisian QPR" : undefined}
                >
                  <ClipboardList size={20} className={activeTab === "buat-qpr" ? "text-white shrink-0" : "text-violet-500 group-hover:text-white transition-colors shrink-0"} />
                  <span className={`text-sm font-bold truncate transition-all ${sidebarOpen ? "block animate-in fade-in" : "xl:hidden"}`}>Pengisian QPR</span>
                </button>
              )}

              {/* Approval QPR */}
              {canApproveQpr && (
                <button
                  onClick={() => handleMenuClick("approve-qpr")}
                  className={`group flex items-center w-full gap-3 text-left rounded-md transition-all duration-150 touch-manipulation cursor-pointer ${
                    sidebarOpen ? "px-3 py-3" : "px-3 py-3 xl:px-0 xl:justify-center"
                  } ${
                    activeTab === "approve-qpr"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-white hover:bg-blue-600"
                  }`}
                  title={!sidebarOpen ? "Approval QPR" : undefined}
                >
                  <FileCheck2 size={20} className={activeTab === "approve-qpr" ? "text-white shrink-0" : "text-indigo-500 group-hover:text-white transition-colors shrink-0"} />
                  <span className={`text-sm font-bold truncate transition-all ${sidebarOpen ? "block animate-in fade-in" : "xl:hidden"}`}>Approval QPR</span>
                </button>
              )}

              {/* Buat Confirmation Letter */}
              {canCL && (
                <button
                  onClick={() => handleMenuClick("confirmation-letter")}
                  className={`group flex items-center w-full gap-3 text-left rounded-md transition-all duration-150 touch-manipulation cursor-pointer ${
                    sidebarOpen ? "px-3 py-3" : "px-3 py-3 xl:px-0 xl:justify-center"
                  } ${
                    activeTab === "confirmation-letter"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-white hover:bg-blue-600"
                  }`}
                  title={!sidebarOpen ? "Buat Confirmation Letter" : undefined}
                >
                  <PlusCircle size={20} className={activeTab === "confirmation-letter" ? "text-white shrink-0" : "text-rose-500 group-hover:text-white transition-colors shrink-0"} />
                  <span className={`text-sm font-bold truncate transition-all ${sidebarOpen ? "block animate-in fade-in" : "xl:hidden"}`}>Buat CL</span>
                </button>
              )}

              {/* Approval Confirmation Letter */}
              {canCL && (
                <button
                  onClick={() => handleMenuClick("approve-cl")}
                  className={`group flex items-center w-full gap-3 text-left rounded-md transition-all duration-150 touch-manipulation cursor-pointer ${
                    sidebarOpen ? "px-3 py-3" : "px-3 py-3 xl:px-0 xl:justify-center"
                  } ${
                    activeTab === "approve-cl"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-white hover:bg-blue-600"
                  }`}
                  title={!sidebarOpen ? "Approval CL" : undefined}
                >
                  <FileText size={20} className={activeTab === "approve-cl" ? "text-white shrink-0" : "text-indigo-500 group-hover:text-white transition-colors shrink-0"} />
                  <span className={`text-sm font-bold truncate transition-all ${sidebarOpen ? "block animate-in fade-in" : "xl:hidden"}`}>Approval CL</span>
                </button>
              )}

              {/* SSC Billing & Reminder */}
              {canIMemo && (
                <button
                  onClick={() => handleMenuClick("i-memo")}
                  className={`group flex items-center w-full gap-3 text-left rounded-md transition-all duration-150 touch-manipulation cursor-pointer ${
                    sidebarOpen ? "px-3 py-3" : "px-3 py-3 xl:px-0 xl:justify-center"
                  } ${
                    activeTab === "i-memo"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-white hover:bg-blue-600"
                  }`}
                  title={!sidebarOpen ? "SSC Billing & Reminder" : undefined}
                >
                  <Mail size={20} className={activeTab === "i-memo" ? "text-white shrink-0" : "text-teal-500 group-hover:text-white transition-colors shrink-0"} />
                  <span className={`text-sm font-bold truncate transition-all ${sidebarOpen ? "block animate-in fade-in" : "xl:hidden"}`}>SSC Billing &amp; Reminder</span>
                </button>
              )}



              {/* List QPR & CL */}
              {canListQpr && (
                <button
                  onClick={() => handleMenuClick("list-qpr")}
                  className={`group flex items-center w-full gap-3 text-left rounded-md transition-all duration-150 touch-manipulation cursor-pointer ${
                    sidebarOpen ? "px-3 py-3" : "px-3 py-3 xl:px-0 xl:justify-center"
                  } ${
                    activeTab === "list-qpr"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-white hover:bg-blue-600"
                  }`}
                  title={!sidebarOpen ? "List NCR, QPR & CL" : undefined}
                >
                  <ListTodo size={20} className={activeTab === "list-qpr" ? "text-white shrink-0" : "text-emerald-500 group-hover:text-white transition-colors shrink-0"} />
                  <span className={`text-sm font-bold truncate transition-all ${sidebarOpen ? "block animate-in fade-in" : "xl:hidden"}`}>List NCR, QPR &amp; CL</span>
                </button>
              )}
            </nav>
          </div>

          {/* Sidebar Menus - Global Tracking */}
          <div className={`border-t border-slate-100 mt-2 shrink-0 transition-all duration-300 ${sidebarOpen ? "px-4 py-2" : "px-4 py-2 xl:px-2"}`}>
            <span className={`px-3 text-xs font-bold text-slate-400 tracking-widest uppercase block mb-2 transition-all ${sidebarOpen ? "block animate-in fade-in" : "xl:hidden"}`}>
              Global Tracking
            </span>
            <nav className="space-y-1">
              {globalMenus.map((menu) => {
                const IconComp = menu.icon;
                const isActive = activeTab === menu.id;
                return (
                  <button
                    key={menu.id}
                    onClick={() => handleMenuClick(menu.id)}
                    className={`group flex items-center w-full gap-3 text-left rounded-md transition-all duration-150 touch-manipulation cursor-pointer ${
                      sidebarOpen ? "px-3 py-3" : "px-3 py-3 xl:px-0 xl:justify-center"
                    } ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-white hover:bg-blue-600"
                    }`}
                    title={!sidebarOpen ? menu.name : undefined}
                  >
                    <IconComp size={18} className={isActive ? "text-white shrink-0" : "text-slate-400 group-hover:text-white transition-colors shrink-0"} />
                    <span className={`text-sm font-bold truncate transition-all ${sidebarOpen ? "block animate-in fade-in" : "xl:hidden"}`}>{menu.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom spacer */}
          <div className="flex-1" />

          {/* Footer info */}
          <div className={`py-4 border-t border-slate-100 shrink-0 transition-all duration-300 ${sidebarOpen ? "px-6 text-left" : "px-6 xl:px-0 text-left xl:text-center"}`}>
            {sidebarOpen ? (
              <>
                <p className="text-[10px] text-slate-400 font-semibold animate-in fade-in">QPR Portal v1.0</p>
                <p className="text-[10px] text-slate-300 block mt-0.5 animate-in fade-in">PT Menara Terus Makmur</p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-slate-400 font-semibold xl:hidden">QPR Portal v1.0</p>
                <p className="text-[10px] text-slate-300 xl:hidden mt-0.5">PT Menara Terus Makmur</p>
                <div className="hidden xl:flex w-full items-center justify-center font-black text-slate-400 text-[10px] uppercase select-none tracking-tight animate-in zoom-in-95 duration-200">
                  v1.0
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
