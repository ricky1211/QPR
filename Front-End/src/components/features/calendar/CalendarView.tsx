"use client";

import React from "react";

export default function CalendarView({
  selectedMonth,
  selectedYear,
  monthList,
  calendarDays,
  weekdays,
  monthlyDeliveries,
  setSelectedDayDetail
}) {
  return (
    <div className="space-y-6">
      
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-slate-100 rounded-lg shadow-sm gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Visualisasi Pengiriman Harian</h3>
          <p className="text-xs text-slate-400 mt-1">Menampilkan data reject dibandingkan dengan limit allowance per supplier.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Aman
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> NG &lt; Limit
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Pemicu NCR
          </span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden">
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 py-3 text-center text-xs font-bold text-slate-500">
          {weekdays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-px bg-slate-300">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="bg-white min-h-[110px]"></div>;
            }

            const dateStr = `${selectedYear}-${String(monthList.indexOf(selectedMonth) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayDeliveries = monthlyDeliveries.filter((d) => d.date === dateStr);

            let cellBg = "bg-white";
            let statusIndicator = null;
            const hasRecords = dayDeliveries.length > 0;

            if (hasRecords) {
              const totalNg = dayDeliveries.reduce((sum, item) => sum + item.reject, 0);
              const hasActiveNcr = dayDeliveries.some((item) => item.ncrNumber !== null && item.ncrStatus === "PENDING_APPROVAL");
              const hasApprovedNcr = dayDeliveries.some((item) => item.ncrNumber !== null && item.ncrStatus === "APPROVED");

              if (totalNg > 0) {
                if (hasActiveNcr || hasApprovedNcr) {
                  cellBg = "bg-rose-50/50 hover:bg-rose-50 transition-colors";
                  statusIndicator = <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse-ring"></span>;
                } else {
                  cellBg = "bg-amber-50/50 hover:bg-amber-50 transition-colors";
                  statusIndicator = <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400"></span>;
                }
              } else {
                cellBg = "bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors";
                statusIndicator = <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500"></span>;
              }
            } else {
              cellBg = "bg-white hover:bg-slate-50/50 transition-colors";
            }

            return (
              <div
                key={`day-${day}`}
                onClick={() => hasRecords && setSelectedDayDetail(dayDeliveries)}
                className={`relative p-3 min-h-[115px] flex flex-col justify-between ${cellBg} ${hasRecords ? "cursor-pointer" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{day}</span>
                  {statusIndicator}
                </div>

                {hasRecords && (
                  <div className="space-y-1 mt-3">
                    {dayDeliveries.map((delivery) => (
                      <div key={delivery.id} className="text-[9px] leading-tight p-1 bg-white/70 rounded-lg border border-slate-100 truncate shadow-sm">
                        <span className="font-bold text-slate-800">{delivery.partNumber}</span>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>T: {delivery.qty}</span>
                          {delivery.reject > 0 && <span className="text-red-500 font-bold">NG: {delivery.reject}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
