"use client";

import React from "react";
import { RefreshCw, Bell, ShieldAlert, CheckCircle2, FileText, X } from "lucide-react";

export default function Topbar({
  sidebarOpen,
  setSidebarOpen,
  showNotifications,
  setShowNotifications,
  notifications,
  handleClearNotifications
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100">
      
      {/* Sidebar Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors md:hidden"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none stroke-2">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
        <div>
          <span className="text-xs font-black text-blue-600 tracking-widest uppercase">QPR System</span>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none mt-1">Quality Problem Report</h2>
        </div>
      </div>

      {/* Central Logo Panel */}
      <div className="hidden lg:flex items-center">
        <img
          src="/logo-mtm.png"
          alt="PT Menara Terus Makmur"
          className="h-10 w-auto"
        />
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2">
        
        {/* Refresh Button */}
        <button
          onClick={() => alert("Menyegarkan data dari server...")}
          className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md border border-slate-100 shadow-sm transition-all duration-150"
          title="Refresh Data"
        >
          <RefreshCw size={16} />
        </button>

        {/* Notification Bell Panel */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md border border-slate-100 shadow-sm transition-all duration-150 relative"
            title="Notifikasi"
          >
            <Bell size={16} />
            {notifications.some(n => n.unread) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 shadow-2xl rounded-lg p-4 z-30">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <span className="text-xs font-bold text-slate-950">Notifikasi Masuk</span>
                <button
                  onClick={handleClearNotifications}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Tandai sudah dibaca
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-md border transition-all text-xs ${
                      n.unread ? "bg-blue-50/50 border-blue-100" : "bg-white border-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {n.type === "warning" ? (
                        <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={14} />
                      ) : n.type === "success" ? (
                        <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={14} />
                      ) : (
                        <FileText className="text-blue-500 shrink-0 mt-0.5" size={14} />
                      )}
                      <div>
                        <p className="font-semibold text-slate-800 leading-tight">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-2 mt-3 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Safety First Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200/50 rounded-md text-[10px] font-bold tracking-wider uppercase">
          <span className="flex items-center justify-center w-4 h-4 bg-green-600 rounded-md text-white text-[9px]">✔</span>
          SAFETY FIRST
        </div>

      </div>
    </header>
  );
}
