"use client";
 
import React, { useTransition, useState } from "react";
import { RefreshCw, Bell, ShieldAlert, CheckCircle2, FileText, Menu, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { webhookService } from "@/services/webhookService";
 
export default function Topbar({
  sidebarOpen,
  setSidebarOpen,
  showNotifications,
  setShowNotifications,
  notifications,
  handleClearNotifications,
  activeTab
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  // Read display name from non-httpOnly cookie
  React.useEffect(() => {
    const match = document.cookie.match(/(?:^|; )mtm_display_name=([^;]*)/);
    if (match) setDisplayName(decodeURIComponent(match[1]));
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await webhookService.syncAll();
      alert("Sinkronisasi master data (Supplier & Parts) dari Gateway berhasil!");
    } catch (err: any) {
      console.error("Sync error:", err);
      alert(`Gagal sinkronisasi data: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 h-[64px] sm:h-[72px] bg-white/90 backdrop-blur-md border-b border-slate-200">
      
      {/* Hamburger + Title */}
      <div className="flex items-center gap-3">
        {/* Hamburger — visible on all screens smaller than xl (1280px) — covers tablets */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors touch-manipulation cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>

        {activeTab === "dashboard" ? (
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-wider uppercase leading-tight">
              Dashboard
            </h2>
          </div>
        ) : (
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-wider uppercase leading-tight">
              Quality Problem Report
            </h2>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-semibold hidden sm:block">
              PT Menara Terus Makmur
            </p>
          </div>
        )}
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        
        {/* Refresh Button */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="p-2 sm:p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-all touch-manipulation cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sinkronisasi Data"
        >
          <RefreshCw size={15} className={isSyncing ? "animate-spin text-blue-600" : ""} />
        </button>

        {/* Notification Bell Panel */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 sm:p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-all touch-manipulation cursor-pointer relative"
            title="Notifikasi"
          >
            <Bell size={15} />
            {notifications.some(n => n.unread) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>

          {/* Notification Popover — responsive width */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white border border-slate-200 shadow-2xl rounded-lg p-4 z-30">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <span className="text-xs font-bold text-slate-950">Notifikasi Masuk</span>
                <button
                  onClick={handleClearNotifications}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors touch-manipulation cursor-pointer"
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
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 touch-manipulation cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logged-in user display & dropdown */}
        {displayName && (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-150 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 shrink-0 animate-in fade-in duration-300"
              title="Profil Pengguna"
            >
              <div className="w-5.5 h-5.5 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-500/20">
                <span className="text-white font-black text-[9px]">{displayName.slice(0,1).toUpperCase()}</span>
              </div>
              <span className="text-[11px] font-extrabold text-blue-700 max-w-[120px] truncate select-none">{displayName}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 ml-0.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 shadow-xl rounded-lg p-2.5 z-30 animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sign In As:</div>
                  <div className="text-[11px] font-black text-slate-700 truncate">{displayName}</div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isPending}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer text-xs font-bold disabled:opacity-50"
                >
                  <LogOut size={13} className="shrink-0" />
                  <span>{isPending ? "Keluar..." : "Logout"}</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
}
