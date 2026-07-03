"use client";

import React from "react";
import {
  PlusCircle,
  CheckSquare,
  FileCheck2,
  FileText,
  ListTodo,
  Calendar as CalendarIcon,
  List as ListIcon,
  X,
  Menu
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
  const dashboardMenus = [
    { id: "buat-ncr", name: "Buat NCR", icon: PlusCircle, color: "text-blue-500" },
    { id: "approve-ncr", name: "Approval NCR", icon: CheckSquare, color: "text-amber-500" },
    { id: "approve-qpr", name: "Approval QPR", icon: FileCheck2, color: "text-indigo-500" },
    { id: "confirmation-letter", name: "Buat Confirmation Letter", icon: FileText, color: "text-rose-500" },
    { id: "list-qpr", name: "List QPR", icon: ListTodo, color: "text-emerald-500" }
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
        className={`fixed inset-y-0 left-0 z-30 flex flex-col justify-between w-72 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out transform xl:translate-x-0 xl:z-20 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">

          {/* Sidebar Header / Logo + Close button (tablet/mobile) */}
          <div className="flex items-center justify-between px-4 h-[72px] shrink-0 bg-white border-b border-slate-100">
            <img
              src="/logo-mtm.png"
              alt="MTM Logo"
              className="h-[60px] w-auto object-contain"
            />
            {/* Close button — visible on tablet/mobile only */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="xl:hidden p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sidebar Menus - Dashboard Features */}
          <div className="px-4 py-4 shrink-0">
            <span className="px-3 text-xs font-bold text-slate-400 tracking-widest uppercase block mb-2">
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
                    className={`group flex items-center w-full gap-3 px-3 py-3 text-left rounded-md transition-all duration-150 touch-manipulation cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:text-white hover:bg-blue-600"
                    }`}
                  >
                    <IconComp size={20} className={isActive ? "text-white" : `${menu.color} group-hover:text-white transition-colors`} />
                    <span className="text-sm font-bold truncate">{menu.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Menus - Global Tracking */}
          <div className="px-4 py-2 border-t border-slate-100 mt-2 shrink-0">
            <span className="px-3 text-xs font-bold text-slate-400 tracking-widest uppercase block mb-2">
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
                    className={`group flex items-center w-full gap-3 px-3 py-3 text-left rounded-md transition-all duration-150 touch-manipulation cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:text-white hover:bg-blue-600"
                    }`}
                  >
                    <IconComp size={18} className={isActive ? "text-white" : "text-slate-400 group-hover:text-white transition-colors"} />
                    <span className="text-sm font-bold truncate">{menu.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom spacer */}
          <div className="flex-1" />

          {/* Footer info */}
          <div className="px-6 py-4 border-t border-slate-100 shrink-0">
            <p className="text-[10px] text-slate-400 font-semibold">QPR Portal v1.0</p>
            <p className="text-[10px] text-slate-300">PT Menara Terus Makmur</p>
          </div>
        </div>
      </aside>
    </>
  );
}
