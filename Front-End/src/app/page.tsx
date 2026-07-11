"use client";

import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronDown, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

// Layout components
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

// Feature views & dashboards
import OperatorView from "@/components/features/role-views/OperatorView";
import ApproveNcrDashboard from "@/components/features/role-views/ApproveNcrDashboard";
import ApproveQprDashboard from "@/components/features/role-views/ApproveQprDashboard";
import AccountingView from "@/components/features/role-views/AccountingView";
import ListQprDashboard from "@/components/features/role-views/ListQprDashboard";
import Dashboard from "@/components/features/dashboard/Dashboard";
import IMemoView from "@/components/features/role-views/IMemoView";
import BuatQprView from "@/components/features/role-views/BuatQprView";

// Global tracking views & modals
import CalendarView from "@/components/features/calendar/CalendarView";
import PartsDirectory from "@/components/features/parts/PartsDirectory";
import EditAllowanceModal from "@/components/features/parts/EditAllowanceModal";


// Mock Data
import {
  mockParts,
  mockDeliveries,
  mockNotifications,
  mockPendingNcrs,
  mockPendingQprs
} from "@/utils/mockData";

export default function Home() {
  // Tabs: 'dashboard', 'buat-ncr', 'approve-ncr', 'approve-qpr', 'confirmation-letter', 'list-qpr', 'calendar', 'parts'
  const [activeTab, setActiveTab] = useState("dashboard");

  // State for custom alert modal
  const [customAlert, setCustomAlert] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: ""
  });

  useEffect(() => {
    const originalAlert = window.alert;

    // Override global alert
    window.alert = (msg: string) => {
      setCustomAlert({
        isOpen: true,
        message: msg
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Sidebar mobile toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Month Picker State
  const [selectedMonth, setSelectedMonth] = useState("June");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Notification bell state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  // Dynamic lists for simulation
  const [pendingNcrs, setPendingNcrs] = useState(mockPendingNcrs);
  const [pendingQprs, setPendingQprs] = useState(mockPendingQprs);
  const [confirmationLetters, setConfirmationLetters] = useState([
    {
      id: "cl-1",
      clNumber: "CL/2026/06/001",
      qprNumber: "QPR/2026/04/JAYADI",
      supplierName: "PT JAYADI",
      dateSent: "2026-06-10",
      amount: "Rp 18.200.000",
      status: "APPROVED", // Sudah di Approval
      memoStatus: "SENT_AOP", // Terkirim ke AOP
      reminderSentCount: 1
    },
    {
      id: "cl-2",
      clNumber: "CL/2026/06/002",
      qprNumber: "QPR/2026/05/IKAN_BAKAR",
      supplierName: "PT IKAN BAKAR",
      dateSent: "2026-06-18",
      amount: "Rp 24.000.000",
      status: "PENDING", // Belum di Approval
      memoStatus: "SENT_AOP",
      reminderSentCount: 2
    },
    {
      id: "cl-3",
      clNumber: "CL/2026/06/003",
      qprNumber: "QPR/2026/05/JAYADI",
      supplierName: "PT JAYADI",
      dateSent: "2026-06-25",
      amount: "Rp 12.500.000",
      status: "PENDING", // Belum di Approval
      memoStatus: "DRAFT_MEMO",
      reminderSentCount: 1
    }
  ]);

  const handleGenerateCL = (qpr: any, amount: string) => {
    const newClId = `cl-${Date.now()}`;
    const cleanAmount = amount.startsWith("Rp") ? amount : `Rp ${amount}`;
    const newCl = {
      id: newClId,
      clNumber: `CL/2026/06/${qpr.supplierName.replace("PT ", "").replace(/ /g, "_")}_${Math.floor(Math.random() * 900 + 100)}`,
      qprNumber: qpr.qprNumber,
      supplierName: qpr.supplierName,
      dateSent: new Date().toISOString().split("T")[0],
      amount: cleanAmount,
      status: "PENDING",
      memoStatus: "SENT_AOP",
      reminderSentCount: 1
    };
    setConfirmationLetters(prev => [newCl, ...prev]);
    setPendingQprs(prev => prev.map(q => q.qprNumber === qpr.qprNumber ? { ...q, status: "CLOSED", requiredRole: "Closed" } : q));
  };

  const [parts, setParts] = useState(mockParts);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPart, setEditingPart] = useState(null);
  const [editAllowanceVal, setEditAllowanceVal] = useState("");

  // Target QPR creation state / Allowance Error popup
  const [showAllowanceError, setShowAllowanceError] = useState(false);
  const [errorPartName, setErrorPartName] = useState("");

  // Calendar click state
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  const monthList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const yearList = [2025, 2026, 2027];

  const handleMonthSelect = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setShowMonthPicker(false);
  };

  const handleClearNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // Triggering QPR creation check for allowance ratio
  const handleCreateQpr = (part) => {
    if (part.allowanceRatio === null) {
      setErrorPartName(`${part.partName} (${part.partNumber})`);
      setShowAllowanceError(true);
    } else {
      // 1. Generate new QPR draft
      const newQprId = Date.now();
      const newQprNum = `QPR/2026/06/${part.partNumber.replace("-", "")}`;
      const newQpr = {
        id: newQprId,
        qprNumber: newQprNum,
        date: new Date().toISOString().split("T")[0],
        supplierName: part.supplierName,
        period: "Juni 2026",
        totalItems: 1000,
        rejectItems: 30,
        allowanceRatio: `${part.allowanceRatio}%`,
        claimAmount: `Rp ${(30 * 250000).toLocaleString("id-ID")}`,
        status: "WAITING_APPROVAL",
        requiredRole: "Section Head" // Goes to Section Head first
      };

      setPendingQprs(prev => [newQpr, ...prev]);

      // 2. Update part status
      setParts(prev => prev.map(p => p.id === part.id ? { ...p, status: "QPR CREATED" } : p));

      // 3. Add to notifications
      const newNotif = {
        id: Date.now(),
        message: `Draf QPR ${newQprNum} berhasil dibuat untuk ${part.supplierName} dan dikirim ke Quality Dept untuk validasi.`,
        time: "Baru saja",
        type: "info",
        unread: true
      };
      setNotifications(prev => [newNotif, ...prev]);

      alert(`Sukses: Draf klaim QPR ${newQprNum} berhasil dibuat untuk ${part.supplierName} dan dikirim ke Quality Dept untuk Validasi!`);
    }
  };

  const handleSaveAllowance = (e) => {
    e.preventDefault();
    if (!editingPart) return;

    const parsedVal = editAllowanceVal === "" ? null : parseFloat(editAllowanceVal);

    setParts(prev => prev.map(p => {
      if (p.id === editingPart.id) {
        return {
          ...p,
          allowanceRatio: parsedVal,
          status: parsedVal !== null ? "WAITING QPR CREATION" : p.status
        };
      }
      return p;
    }));

    setEditingPart(null);
  };

  // Perform NCR Approval Action
  const handleApproveNcrAction = (id, ncrNum, reviewComment = "") => {
    let alertMsg = "";
    let notifMsg = "";
    
    setPendingNcrs(prev => {
      const updated = prev.map((n: any) => {
        if (n.id === id) {
          if (n.requiredRole === "Foreman") {
            alertMsg = `Sukses: NCR ${ncrNum} disetujui oleh Foreman dan diteruskan ke Section Head!`;
            notifMsg = `NCR ${ncrNum} disetujui oleh Foreman dan diteruskan ke Section Head.`;
            return { ...n, requiredRole: "Section Head", staffReview: reviewComment || n.staffReview };
          } else if (n.requiredRole === "Section Head") {
            alertMsg = `Sukses: NCR ${ncrNum} disetujui oleh Section Head dan diteruskan ke Dept Head!`;
            notifMsg = `NCR ${ncrNum} disetujui oleh Section Head dan diteruskan ke Dept Head.`;
            return { ...n, requiredRole: "Dept Head", spvReview: reviewComment || n.spvReview };
          } else if (n.requiredRole === "Dept Head") {
            alertMsg = `Sukses: NCR ${ncrNum} disetujui sepenuhnya oleh Dept Head!`;
            notifMsg = `NCR ${ncrNum} telah disetujui sepenuhnya oleh Dept Head.`;
            return { ...n, requiredRole: "Closed", status: "APPROVED", mngReview: reviewComment || n.mngReview };
          }
        }
        return n;
      }).filter(Boolean);
      
      const newNotif = {
        id: Date.now(),
        message: notifMsg || `NCR ${ncrNum} berhasil disetujui digital.`,
        time: "Baru saja",
        type: "success",
        unread: true
      };
      setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
      if (alertMsg) alert(alertMsg);
 
      return updated;
    });
  };

  // Perform QPR Approval Action
  const handleApproveQprAction = (id, qprNum) => {
    let alertMsg = "";
    let notifMsg = "";

    setPendingQprs(prev => {
      const updated = prev.map(q => {
        if (q.id === id) {
          if (q.requiredRole === "Section Head") {
            alertMsg = `Sukses: Klaim QPR ${qprNum} disetujui oleh Section Head dan diteruskan ke Dept Head!`;
            notifMsg = `Klaim QPR ${qprNum} disetujui oleh Section Head dan diteruskan ke Dept Head.`;
            return { ...q, requiredRole: "Dept Head" };
          } else if (q.requiredRole === "Dept Head") {
            alertMsg = `Sukses: Klaim QPR ${qprNum} disetujui oleh Dept Head dan diteruskan ke Div Head!`;
            notifMsg = `Klaim QPR ${qprNum} disetujui oleh Dept Head dan diteruskan ke Div Head.`;
            return { ...q, requiredRole: "Div Head" };
          } else if (q.requiredRole === "Div Head") {
            alertMsg = `Sukses: Klaim QPR ${qprNum} disetujui oleh Div Head, diposting ke Accounting untuk penerbitan Confirmation Letter & Acknowledge Purchasing!`;
            notifMsg = `Klaim QPR ${qprNum} disetujui oleh Div Head dan diposting ke Vendor/Accounting.`;
            return { ...q, requiredRole: "Purchasing", status: "APPROVED_INTERNAL" };
          } else if (q.requiredRole === "Purchasing") {
            alertMsg = `Sukses: Klaim QPR ${qprNum} di-acknowledge oleh Purchasing!`;
            notifMsg = `Klaim QPR ${qprNum} di-acknowledge oleh Purchasing.`;
            return { ...q, requiredRole: "Closed", status: "APPROVED" };
          }
        }
        return q;
      }).filter(Boolean);

      const newNotif = {
        id: Date.now() + 1,
        message: notifMsg || `Klaim QPR ${qprNum} telah disetujui digital.`,
        time: "Baru saja",
        type: "success",
        unread: true
      };
      setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
      if (alertMsg) alert(alertMsg);

      return updated;
    });
  };

  const getDaysInMonth = (month, year) => {
    const monthIndex = monthList.indexOf(month);
    const date = new Date(year, monthIndex, 1);
    const days = [];

    let startDayOfWeek = date.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }

    return days;
  };

  const currentMonthKey = `${selectedYear}-${String(monthList.indexOf(selectedMonth) + 1).padStart(2, "0")}`;
  const monthlyDeliveries = mockDeliveries[currentMonthKey] || [];

  const calendarDays = getDaysInMonth(selectedMonth, selectedYear);
  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50 text-slate-800 antialiased font-sans">
      
      {/* SIDEBAR PANEL */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* MAIN LAYOUT */}
      <div className={`flex flex-col flex-1 min-w-0 min-h-screen overflow-x-hidden transition-all duration-300 ${sidebarOpen ? "xl:pl-72" : "xl:pl-20 pl-0"}`}>
        
        {/* TOPBAR PANEL */}
        <Topbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          notifications={notifications}
          handleClearNotifications={handleClearNotifications}
        />

        {/* CONTAINER CONTENT */}
        <main className="flex-1 p-3 sm:p-4 lg:p-5 overflow-x-hidden">
          <div className="w-full mx-auto space-y-4">

            {/* Target Month picker for Calendar only */}
            {activeTab === "calendar" && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-slate-100 rounded-lg shadow-sm gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <CalendarIcon size={14} />
                    Target Month
                  </h3>
                  
                  <div className="relative mt-2">
                    <button
                      onClick={() => setShowMonthPicker(!showMonthPicker)}
                      className="flex items-center justify-between gap-3 px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-bold text-slate-800 hover:bg-slate-50/50 hover:border-slate-300 transition-all shadow-sm"
                    >
                      <span>{selectedMonth} {selectedYear}</span>
                      <ChevronDown size={14} className="text-slate-400" />
                    </button>

                    {showMonthPicker && (
                      <div className="absolute left-0 mt-2 p-3 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-30">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Pilih Periode</span>
                        <div className="grid grid-cols-3 gap-1 mb-2">
                          {monthList.map((m) => (
                            <button
                              key={m}
                              onClick={() => handleMonthSelect(m, selectedYear)}
                              className={`px-2 py-1.5 text-xs font-semibold rounded-lg text-center transition-colors ${selectedMonth === m ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                            >
                              {m.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 pt-2 flex justify-between gap-1">
                          {yearList.map((y) => (
                            <button
                              key={y}
                              onClick={() => handleMonthSelect(selectedMonth, y)}
                              className={`flex-1 py-1 text-xs font-semibold rounded-lg text-center transition-colors ${selectedYear === y ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                            >
                              {y}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 leading-normal border-l-0 sm:border-l sm:border-slate-100 pl-0 sm:pl-4">
                  <p className="font-bold text-slate-700">Periode Evaluasi Aktif</p>
                  <p className="mt-1">Pilih bulan target untuk melihat logs kalender.</p>
                </div>
              </div>
            )}

            {/* ROUTING CORRESPONDING JOBDESK VIEW */}
            {activeTab === "dashboard" && (
              <Dashboard
                pendingNcrs={pendingNcrs}
                pendingQprs={pendingQprs}
                parts={parts}
                setActiveTab={setActiveTab}
                confirmationLetters={confirmationLetters}
                setConfirmationLetters={setConfirmationLetters}
              />
            )}

            {activeTab === "buat-ncr" && (
              <OperatorView
                pendingNcrs={pendingNcrs}
                setPendingNcrs={setPendingNcrs}
                notifications={notifications}
                setNotifications={setNotifications}
                parts={parts}
              />
            )}

            {activeTab === "approve-ncr" && (
              <ApproveNcrDashboard
                pendingNcrs={pendingNcrs}
                handleApproveNcrAction={handleApproveNcrAction}
              />
            )}

            {activeTab === "approve-qpr" && (
              <ApproveQprDashboard
                pendingQprs={pendingQprs}
                handleApproveQprAction={handleApproveQprAction}
              />
            )}

            {activeTab === "buat-qpr" && (
              <BuatQprView
                pendingQprs={pendingQprs}
                setPendingQprs={setPendingQprs}
              />
            )}

            {activeTab === "confirmation-letter" && (
              <AccountingView 
                confirmationLetters={confirmationLetters}
                setConfirmationLetters={setConfirmationLetters}
                handleGenerateCL={handleGenerateCL}
                pendingQprs={pendingQprs}
              />
            )}

            {activeTab === "i-memo" && (
              <IMemoView
                confirmationLetters={confirmationLetters}
                setConfirmationLetters={setConfirmationLetters}
              />
            )}

            {activeTab === "list-qpr" && (
              <ListQprDashboard />
            )}

            {activeTab === "calendar" && (
              <CalendarView
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                monthList={monthList}
                calendarDays={calendarDays}
                weekdays={weekdays}
                monthlyDeliveries={monthlyDeliveries}
                setSelectedDayDetail={setSelectedDayDetail}
              />
            )}

            {activeTab === "parts" && (
              <PartsDirectory
                parts={parts}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setEditingPart={setEditingPart}
                setEditAllowanceVal={setEditAllowanceVal}
                handleCreateQpr={handleCreateQpr}
              />
            )}



            {/* DAY DETAILS CALENDAR MODAL */}
            {selectedDayDetail && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Detail Kedatangan Barang</span>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">Tanggal: {selectedDayDetail[0].date}</h4>
                    </div>
                    <button
                      onClick={() => setSelectedDayDetail(null)}
                      className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-4">
                    {selectedDayDetail.map((delivery) => (
                      <div key={delivery.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="text-sm font-bold text-slate-900">{delivery.partName}</h5>
                            <span className="text-xs font-semibold text-slate-400">{delivery.partNumber} • {delivery.supplierName}</span>
                          </div>
                          {delivery.reject > 0 ? (
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold">NG Exceeded</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">Good / Under</span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="p-3 bg-white border border-slate-100 rounded-md text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Kirim</span>
                            <span className="text-lg font-bold text-slate-800">{delivery.qty} pcs</span>
                          </div>
                          <div className="p-3 bg-white border border-slate-100 rounded-md text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Reject</span>
                            <span className={`text-lg font-bold ${delivery.reject > 0 ? "text-red-600" : "text-slate-800"}`}>{delivery.reject} pcs</span>
                          </div>
                        </div>

                        {delivery.reject > 0 && (
                          <div className="p-3.5 bg-red-50/50 border border-red-100/50 rounded-md space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Jenis Masalah:</span>
                              <span className="font-bold text-slate-800">{delivery.defectType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Disposisi Awal:</span>
                              <span className="font-bold text-slate-800">{delivery.disposition}</span>
                            </div>
                            {delivery.ncrNumber && (
                              <div className="flex justify-between items-center pt-2 border-t border-red-100/60">
                                <span className="font-bold text-slate-800">No. NCR:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded">{delivery.ncrNumber}</span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${delivery.ncrStatus === "APPROVED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                    {delivery.ncrStatus === "APPROVED" ? "Closed" : "Pending"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
                    <button
                      onClick={() => setSelectedDayDetail(null)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs shadow-md shadow-blue-600/10 transition-colors"
                    >
                      Tutup Rincian
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT NG ALLOWANCE MODAL */}
            <EditAllowanceModal
              editingPart={editingPart}
              setEditingPart={setEditingPart}
              editAllowanceVal={editAllowanceVal}
              setEditAllowanceVal={setEditAllowanceVal}
              handleSaveAllowance={handleSaveAllowance}
            />

            {/* ERROR POPUP: NO ALLOWANCE CONFIG */}
            {showAllowanceError && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border border-red-100 animate-pulse-ring">
                  <div className="p-6 flex flex-col items-center text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
                      <ShieldAlert size={28} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-950 uppercase tracking-tight">Peringatan: Gagal Buat QPR</h4>
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errorPartName}</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Supplier belum memiliki konfigurasi <span className="font-bold text-slate-700">NG Allowance</span>. Silakan hubungi Admin untuk mengatur nilai toleransi terlebih dahulu sebelum melanjutkan pembuatan QPR.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center">
                    <button
                      onClick={() => setShowAllowanceError(false)}
                      className="w-full px-5 py-3 bg-red-600 hover:bg-red-750 text-white rounded-md font-bold text-xs shadow-md shadow-red-600/10 transition-colors"
                    >
                      Mengerti & Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CUSTOM SUCCESS / ALERT MODAL POPUP */}
            {customAlert.isOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 flex flex-col items-center text-center space-y-4">
                    {customAlert.message.toLowerCase().includes("gagal") || 
                     customAlert.message.toLowerCase().includes("peringatan") || 
                     customAlert.message.toLowerCase().includes("harus") ? (
                      <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 border border-amber-250 flex items-center justify-center shadow-inner">
                        <AlertTriangle size={28} className="animate-bounce" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-250 flex items-center justify-center shadow-inner relative">
                        <CheckCircle2 size={32} className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20" />
                        <CheckCircle2 size={32} className="relative z-10" />
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-950 uppercase tracking-tight">
                        {customAlert.message.toLowerCase().includes("gagal") || 
                         customAlert.message.toLowerCase().includes("peringatan") || 
                         customAlert.message.toLowerCase().includes("harus")
                          ? "Pemberitahuan" 
                          : "Approval Sukses"}
                      </h4>
                    </div>
                    
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      {customAlert.message}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <button
                      onClick={() => setCustomAlert({ isOpen: false, message: "" })}
                      className="w-full px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-md shadow-blue-600/10 transition-colors cursor-pointer"
                    >
                      OK / Selesai
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>

      </div>
    </div>
  );
}
