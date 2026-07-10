"use client";

import React from "react";
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
  Menu,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
  const dashboardMenus = [
    { id: "dashboard", name: "Dashboard Utama", icon: LayoutDashboard, color: "text-blue-500" },
    { id: "buat-ncr", name: "Buat NCR", icon: PlusCircle, color: "text-blue-600" },
    { id: "approve-ncr", name: "Approval NCR", icon: CheckSquare, color: "text-amber-500" },
    { id: "approve-qpr", name: "Approval QPR", icon: FileCheck2, color: "text-indigo-500" },
    { id: "confirmation-letter", name: "Buat Confirmation Letter", icon: FileText, color: "text-rose-500" },
    { id: "list-qpr", name: "List NCR & QPR", icon: ListTodo, color: "text-emerald-500" }
  ];

  const globalMenus = [
    { id: "calendar", name: "Calendar Logs", icon: CalendarIcon },
    { id: "parts", name: "List Part & Allowance", icon: ListIcon }
  ];

  const handleMenuClick = (id: string) => {
    setActiveTab(id);
    // Auto-close sidebar on tablet/mobile after selecting a menu
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setSidebarOpen(false);
    }
  };

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

          {/* Sidebar Header / Logo */}
          <div className={`flex items-center justify-between h-[72px] shrink-0 bg-white border-b border-slate-100 ${sidebarOpen ? "px-4" : "px-4 xl:px-0 xl:justify-center"}`}>
            {sidebarOpen ? (
              <img
                src="/logo-mtm.png"
                alt="MTM Logo"
                className="h-[60px] w-auto object-contain transition-all duration-300 animate-in fade-in duration-200"
              />
            ) : (
              <>
                <img
                  src="/logo-mtm.png"
                  alt="MTM Logo"
                  className="h-[60px] w-auto object-contain xl:hidden"
                />
                <div className="hidden xl:flex w-10 h-10 rounded-lg bg-blue-600 text-white font-black text-center items-center justify-center text-xs shadow-md shadow-blue-500/20 animate-in zoom-in-95 duration-200">
                  MTM
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
              Main Dashboard
            </span>
            <nav className="space-y-1">
              {dashboardMenus.map((menu) => {
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
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:text-white hover:bg-blue-600"
                    }`}
                    title={!sidebarOpen ? menu.name : undefined}
                  >
                    <IconComp size={20} className={isActive ? "text-white shrink-0" : `${menu.color} group-hover:text-white transition-colors shrink-0`} />
                    <span className={`text-sm font-bold truncate transition-all ${sidebarOpen ? "block animate-in fade-in" : "xl:hidden"}`}>{menu.name}</span>
                  </button>
                );
              })}
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
                        ? "bg-blue-600 text-white"
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
