"use client";

import React from "react";
import {
  PlusCircle,
  CheckSquare,
  FileCheck2,
  FileText,
  ListTodo,
  Calendar as CalendarIcon,
  List as ListIcon
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

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-20 flex flex-col justify-between w-64 bg-white border-r border-slate-100 transition-transform duration-300 transform md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full overflow-y-auto">
        
        {/* Sidebar Header / Logo */}
        <div className="flex items-center justify-center px-6 py-5 border-b border-slate-50 shrink-0 bg-white">
          <img
            src="/logo-mtm-icon.png"
            alt="MTM Logo"
            className="h-14 w-auto object-contain"
          />
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
                  onClick={() => setActiveTab(menu.id)}
                  className={`flex items-center w-full gap-3 px-3 py-2.5 text-left rounded-md transition-all duration-150 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <IconComp size={18} className={isActive ? "text-white" : menu.color} />
                  <span className="text-sm font-bold truncate">{menu.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Menus - Global Tracking */}
        <div className="px-4 py-2 border-t border-slate-50 mt-2 shrink-0">
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
                  onClick={() => setActiveTab(menu.id)}
                  className={`flex items-center w-full gap-3 px-3 py-2 text-left rounded-md transition-all duration-150 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <IconComp size={16} className={isActive ? "text-white" : "text-slate-400"} />
                  <span className="text-sm font-bold truncate">{menu.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-50 shrink-0">
        <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-md border border-slate-100">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0"></div>
          <span className="text-xs font-bold text-slate-600">Simulasi Sistem Aktif</span>
        </div>
      </div>
    </aside>
  );
}
