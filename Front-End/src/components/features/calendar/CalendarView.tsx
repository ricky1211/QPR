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
            let dateColor = "text-slate-400";
            const hasRecords = dayDeliveries.length > 0;

            if (hasRecords) {
              const totalNg = dayDeliveries.reduce((sum, item) => sum + item.reject, 0);
              const hasActiveNcr = dayDeliveries.some((item) => item.ncrNumber !== null && item.ncrStatus === "PENDING_APPROVAL");
              const hasApprovedNcr = dayDeliveries.some((item) => item.ncrNumber !== null && item.ncrStatus === "APPROVED");

              if (totalNg > 0) {
                if (hasActiveNcr || hasApprovedNcr) {
                  cellBg = "bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-[inset_0_0_0_1px_rgba(244,63,94,0.1)]";
                  dateColor = "text-white";
                  statusIndicator = <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white animate-pulse"></span>;
                } else {
                  cellBg = "bg-amber-100 hover:bg-amber-200 text-slate-800 transition-colors";
                  dateColor = "text-amber-900";
                  statusIndicator = <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500"></span>;
                }
              } else {
                cellBg = "bg-blue-600 hover:bg-blue-700 text-white transition-colors";
                dateColor = "text-white";
                statusIndicator = <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white"></span>;
              }
            } else {
              cellBg = "bg-white hover:bg-slate-50/50 transition-colors";
              dateColor = "text-slate-400";
            }

            return (
              <div
                key={`day-${day}`}
                onClick={() => hasRecords && setSelectedDayDetail(dayDeliveries)}
                className={`relative p-3 min-h-[115px] flex flex-col justify-between ${cellBg} ${hasRecords ? "cursor-pointer" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-base font-extrabold ${dateColor}`}>{day}</span>
                  {statusIndicator}
                </div>

                {hasRecords && (
                  <div className="space-y-1 mt-3">
                    {dayDeliveries.map((delivery) => (
                      <div key={delivery.id} className="text-[9px] leading-tight p-1 bg-white rounded-lg border border-slate-100 truncate shadow-sm text-slate-800">
                        <span className="font-bold text-slate-900">{delivery.partNumber}</span>
                        <div className="flex justify-between text-slate-550 font-medium">
                          <span>T: {delivery.qty}</span>
                          {delivery.reject > 0 && <span className="text-red-600 font-bold">NG: {delivery.reject}</span>}
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
