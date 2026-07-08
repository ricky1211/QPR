"use client";

import React, { useState, useRef } from "react";
import { CheckCircle2, AlertTriangle, X, FileSignature, ChevronDown, Calendar, Eye } from "lucide-react";

export default function OperatorView({
  pendingNcrs,
  setPendingNcrs,
  notifications,
  setNotifications
}) {
  // References for Form Dropdowns
  const suppliers = [
    { id: 1, name: "PT JAYADI", code: "SPL-JAY" },
    { id: 2, name: "PT IKAN BAKAR", code: "SPL-IBK" },
    { id: 3, name: "SHIJIAZHUANG RUICHENG TRADE CO., LTD", code: "SPL-SRC" }
  ];

  const [parts, setParts] = useState([
    { id: 1, partNumber: "MB-001", partName: "Motherboard X1", supplierId: 1 },
    { id: 2, partNumber: "GL-001", partName: "Gelas Kaca", supplierId: 1 },
    { id: 3, partNumber: "HD-002", partName: "Harddisk 1TB", supplierId: 2 },
    { id: 4, partNumber: "CP-003", partName: "CPU Fan Cooler", supplierId: 2 },
    { id: 5, partNumber: "CR-001", partName: "CONE RACE ALL TYPE", supplierId: 3 }
  ]);

  // Step 1: Pre-selection States (Date - global for batch)
  const [selectedDate, setSelectedDate] = useState("");
  
  // Step 2: Form States (Supplier, Part inputRows)
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [inputRows, setInputRows] = useState<Array<{ id: number; partId: string | number; qtyNG: string; ngTypes: string; isManualNg?: boolean }>>([
    { id: Date.now(), partId: "", qtyNG: "", ngTypes: "", isManualNg: false }
  ]);

  // Expanded fields from manual NCR form for Speed & Digitalization
  const [locationFound, setLocationFound] = useState<string[]>([]);
  const [problemType, setProblemType] = useState<string[]>([]);
  const [foundBy, setFoundBy] = useState("MR. HENDRIK (QC INC.)");
  const [description, setDescription] = useState("");
  const [disposition, setDisposition] = useState<string[]>([]);
  const [customerApproval, setCustomerApproval] = useState("");
  const [docsToRevise, setDocsToRevise] = useState<string[]>([]);

  // Local state for NCR history sent during this session
  const [items, setItems] = useState<any[]>([]);

  // Filter parts based on selected supplier, and exclude parts already sent to approval in this session
  const filteredParts = supplierId
    ? parts
        .filter((p) => p.supplierId === supplierId)
        .filter((p) => !items.some((item) => item.partNumber === p.partNumber))
    : [];

  const getFilteredPartsForRow = (currentRowId: number) => {
    return filteredParts.filter(
      (p) => !inputRows.some((row) => row.id !== currentRowId && String(row.partId) === String(p.id))
    );
  };

  // UI state
  const [qtyError, setQtyError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNcrNumber, setSuccessNcrNumber] = useState<string | null>(null);
  const [selectedReviewNcr, setSelectedReviewNcr] = useState<any | null>(null);



  const isStaffApproved = selectedReviewNcr && (selectedReviewNcr.requiredRole === "Section Head" || selectedReviewNcr.requiredRole === "Dept Head" || selectedReviewNcr.requiredRole === "Closed" || selectedReviewNcr.status === "APPROVED");
  const isSpvApproved = selectedReviewNcr && (selectedReviewNcr.requiredRole === "Dept Head" || selectedReviewNcr.requiredRole === "Closed" || selectedReviewNcr.status === "APPROVED");
  const isMngApproved = selectedReviewNcr && (selectedReviewNcr.requiredRole === "Closed" || selectedReviewNcr.status === "APPROVED");

  const selectedSupplier = suppliers.find(s => s.id === supplierId);

  const addNewRow = () => {
    setInputRows([
      ...inputRows,
      { id: Date.now() + Math.random(), partId: "", qtyNG: "", ngTypes: "", isManualNg: false }
    ]);
  };

  const removeRow = (id: number) => {
    if (inputRows.length > 1) {
      setInputRows(inputRows.filter((r) => r.id !== id));
    }
  };

  const updateRowField = (id: number, field: string, value: any) => {
    setInputRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Refs for Date picker trigger
  const dateInputRef = useRef(null);

  // Format Date to friendly Indonesian string including Day Name
  const formatDateFriendly = (dateStr) => {
    if (!dateStr) return "PILIH TANGGAL";
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    try {
      const partsArr = dateStr.split("-");
      if (partsArr.length === 3) {
        const year = partsArr[0];
        const monthIndex = parseInt(partsArr[1], 10) - 1;
        const day = parseInt(partsArr[2], 10);
        
        // Find day index using Date constructor
        const dateObj = new Date(year, monthIndex, day);
        const dayName = days[dateObj.getDay()];
        
        return `${dayName}, ${day} ${months[monthIndex]} ${year}`;
      }
    } catch (e) {}
    return dateStr;
  };

  // Helper trigger to launch date selector natively
  const handleDateCardClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (e) {
        // Fallback for older browsers
        dateInputRef.current.focus();
        dateInputRef.current.click();
      }
    }
  };

  // Directly send data to NCR Approval (Picu Alur NCR)
  const handleDirectSend = () => {
    if (!supplierId) return;
    
    // Filter out rows that are not fully filled
    const activeRows = inputRows.filter(row => row.partId && row.qtyNG && row.ngTypes);
    if (activeRows.length === 0) {
      setQtyError("Harap isi setidaknya satu baris part dengan lengkap!");
      return;
    }

    if (locationFound.length === 0) {
      setQtyError("Harap pilih setidaknya satu Location Found!");
      return;
    }
    if (problemType.length === 0) {
      setQtyError("Harap pilih setidaknya satu Problem Type!");
      return;
    }
    if (disposition.length === 0) {
      setQtyError("Harap pilih Keputusan Disposisi!");
      return;
    }
    if (!customerApproval) {
      setQtyError("Harap tentukan apakah Customer Approval diperlukan!");
      return;
    }

    // Validate quantities for all active rows
    for (const row of activeRows) {
      const qty = parseInt(row.qtyNG) || 0;
      if (qty <= 0) {
        setQtyError(`Qty NG untuk part ${parts.find(p => p.id === parseInt(String(row.partId)))?.partName || ""} harus lebih besar dari 0`);
        return;
      }
    }

    const currentSupplier = suppliers.find((s) => s.id === parseInt(String(supplierId)));
    if (!currentSupplier) return;

    setIsSubmitting(true);
    setQtyError(null);

    // Simulate API submission
    setTimeout(() => {
      const newNcrs: any[] = [];
      const newNotifs: any[] = [];

      activeRows.forEach((row, index) => {
        const currentPart = parts.find((p) => p.id === parseInt(String(row.partId)));
        if (!currentPart) return;

        const ncrNum = `NCR/2026/06/SIM-${Math.floor(100 + Math.random() * 900) + index}`;
        const qty = parseInt(row.qtyNG) || 0;

        const newNcr = {
          id: Date.now() + index,
          ncrNumber: ncrNum,
          date: selectedDate,
          partNumber: currentPart.partNumber,
          partName: currentPart.partName,
          supplierName: currentSupplier.name,
          qty: qty, // Qty NG
          reject: row.ngTypes.trim().toUpperCase(), // NG Types
          locationFound: Array.isArray(locationFound) ? locationFound.join(", ") : locationFound,
          problemType: Array.isArray(problemType) ? problemType.join(", ") : problemType,
          foundBy: foundBy,
          defectType: description || "Quality defect found",
          disposition: Array.isArray(disposition) ? disposition.join(", ") : disposition,
          customerApproval: customerApproval,
          docsToRevise: docsToRevise.join(", "),
          status: "WAITING_APPROVAL",
          requiredRole: "Foreman"
        };

        newNcrs.push(newNcr);

        // Generate notifications
        newNotifs.push({
          id: Date.now() + 100 + index,
          message: `NCR Baru ${ncrNum} berhasil dibuat secara manual oleh Operator untuk ${currentPart.partName} (${currentSupplier.name}).`,
          time: "Baru saja",
          type: "success",
          unread: true
        });

        newNotifs.push({
          id: Date.now() + 200 + index,
          message: `[CC PPIC/Purchase] Dokumen NCR Baru ${ncrNum} untuk supplier ${currentSupplier.name} (Part: ${currentPart.partName}) telah otomatis diteruskan ke bagian PPIC & Purchasing PT MTM.`,
          time: "Baru saja",
          type: "info",
          unread: true
        });
      });

      // 1. Send directly to pending Ncrs (Approval)
      setPendingNcrs((prev) => [...newNcrs, ...prev]);

      // 2. Generate notifications
      setNotifications((prev) => [...newNotifs, ...prev]);

      // 3. Add to items history for review
      setItems((prev) => [
        ...newNcrs.map(ncr => ({
          ...ncr,
          locationFound: locationFound,
          problemType: problemType,
          disposition: disposition,
          docsToRevise: docsToRevise
        })),
        ...prev
      ]);

      // Reset input rows, keep date & supplier
      setInputRows([{ id: Date.now(), partId: "", qtyNG: "", ngTypes: "", isManualNg: false }]);
      setLocationFound([]);
      setProblemType([]);
      setFoundBy("MR. HENDRIK (QC INC.)");
      setDescription("");
      setDisposition([]);
      setCustomerApproval("");
      setDocsToRevise([]);
      setQtyError(null);

      // Show success alert toast
      setIsSubmitting(false);
      setSuccessNcrNumber(newNcrs[0]?.ncrNumber || "BATCH-SUCCESS");
    }, 800);
  };

  const isStepComplete = !!selectedDate && !!supplierId;

  // Render Date selector and Supplier selector at the top
  const renderSelectionCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Date Picker Selector */}
      <div className="relative w-full">
        <button
          type="button"
          onClick={handleDateCardClick}
          className="w-full bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex justify-between items-center transition-all hover:border-slate-200 text-left cursor-pointer"
        >
          <div className="overflow-hidden">
            <span className="text-sm font-extrabold text-slate-800 block truncate">
              {formatDateFriendly(selectedDate)}
            </span>
            <span className="text-[10px] font-bold text-slate-400 block mt-1 uppercase tracking-wider">
              Tanggal Temuan Defect
            </span>
          </div>
          <Calendar size={18} className="text-slate-400 shrink-0" />
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
        />
      </div>

      {/* Supplier Card Selector */}
      <div className="relative w-full">
        <div className="w-full bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex justify-between items-center transition-all hover:border-slate-200 hover:bg-slate-50/50 cursor-pointer">
          <div className="overflow-hidden flex-1">
            <span className="text-sm font-extrabold text-slate-800 block truncate">
              {selectedSupplier ? `${selectedSupplier.name} (${selectedSupplier.code})` : "PILIH SUPPLIER"}
            </span>
            <span className="text-[10px] font-bold text-slate-400 block mt-1 uppercase tracking-wider">
              Supplier / Vendor
            </span>
          </div>
          <ChevronDown size={18} className="text-slate-400 shrink-0 ml-2" />

          {/* Invisible select covering the entire card to trigger dropdown */}
          <select
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value ? parseInt(e.target.value) : "");
              setInputRows([{ id: Date.now(), partId: "", qtyNG: "", ngTypes: "", isManualNg: false }]);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          >
            <option value="">PILIH SUPPLIER</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Success Notification Alert */}
      {successNcrNumber && (
        <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-lg shadow-sm flex items-start justify-between gap-3 animate-blink">
          <div className="flex items-start gap-3 text-left">
            <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-emerald-800">Laporan NCR Langsung Dikirim ke Approval!</p>
              <p className="text-xs text-emerald-600 mt-1">
                Laporan penolakan kualitas <strong className="font-bold">{successNcrNumber}</strong> telah berhasil diterbitkan dan masuk ke daftar approval <strong>STAFF / SPV</strong>.
              </p>
            </div>
          </div>
          <button onClick={() => setSuccessNcrNumber(null)} className="text-emerald-600 hover:text-emerald-800 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Title Header */}
      <div className="text-left pl-1">
        <h4 className="text-lg font-black text-slate-800">Mulai Pembuatan Laporan NCR</h4>
      </div>

      {/* Selectors Block (Date & Supplier Picker) */}
      {renderSelectionCards()}

      {/* Step 2 Form Details: Rendered when date & supplier are selected */}
      {/* Step 2 Form Details: Rendered when date & supplier are selected */}
      {isStepComplete && (
        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            
            {/* Left Column: Card 1 & Card 3 */}
            <div className="lg:col-span-3 space-y-6">
              {/* Card 1: Rincian Laporan Defect (NCR) */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center bg-slate-50/10">
                <div className="flex items-center gap-2">
                  <FileSignature size={18} className="text-blue-500" />
                  <h4 className="text-sm font-black text-slate-800">
                    Rincian Laporan Defect (NCR)
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black rounded uppercase">
                  Form Wajib
                </span>
              </div>

              {/* Form Fields: Part Selection, Qty, and NG Types in a bordered table structure matching Excel/sketch */}
              <div className="space-y-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Input Detail Defect
                  </span>
                  
                  {/* Fitur Part: Add Row button on top-right of the card */}
                  <button
                    type="button"
                    onClick={addNewRow}
                    disabled={!supplierId}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center hover:scale-102 active:scale-98 shadow-sm/5 ${
                      !supplierId
                        ? "bg-slate-150 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    }`}
                  >
                    + Tambah Part
                  </button>
                </div>

                {/* Table Input Row */}
                <div className="border border-slate-400 rounded-lg overflow-hidden shadow-sm bg-white">
                  <table className="w-full table-fixed text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-400 text-slate-900 font-extrabold text-center">
                        <th className={`px-2 py-2 border-r border-slate-400 text-center uppercase tracking-wider text-[10px] ${
                          inputRows.length > 1 ? "w-[40%]" : "w-[48%]"
                        }`}>
                          Pilih Part
                        </th>
                        <th className="px-2 py-2 border-r border-slate-400 w-[22%] text-center uppercase tracking-wider text-[10px]">
                          Qty NG
                        </th>
                        <th className={`px-3 py-2 text-center uppercase tracking-wider ${
                          inputRows.length > 1 ? "border-r border-slate-400 w-[28%]" : "w-[30%]"
                        }`}>
                          NG Type
                        </th>
                        {inputRows.length > 1 && (
                          <th className="px-3 py-2 w-[10%] text-center uppercase tracking-wider text-[10px]">
                            Hapus
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {inputRows.map((row) => {
                        const rowFilteredParts = getFilteredPartsForRow(row.id);
                        return (
                          <tr key={row.id} className="border-t border-slate-400">
                            {/* 1. Pilih Part Select Box */}
                            <td className="p-0 border-r border-slate-400">
                              <select
                                value={row.partId}
                                onChange={(e) => updateRowField(row.id, "partId", e.target.value)}
                                disabled={!supplierId}
                                className="w-full px-3 py-2 text-xs bg-transparent font-bold text-slate-800 focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:text-slate-400 cursor-pointer border-0"
                              >
                                <option value="">-- PILIH PART / BARANG --</option>
                                {rowFilteredParts.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    [{p.partNumber}] {p.partName}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* 2. Qty NG Input */}
                            <td className="p-0 border-r border-slate-400">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="75000"
                                value={row.qtyNG}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "");
                                  updateRowField(row.id, "qtyNG", val);
                                }}
                                className="w-full px-3 py-2 text-xs bg-transparent text-center focus:outline-none focus:ring-0 focus:ring-offset-0 placeholder-slate-400/55 text-slate-800 font-bold border-0"
                              />
                            </td>

                            {/* 3. NG Type Select or Input */}
                            <td className={`p-0 ${inputRows.length > 1 ? "border-r border-slate-400" : ""}`}>
                              {row.isManualNg ? (
                                <div className="relative w-full flex items-center pr-10">
                                  <input
                                    type="text"
                                    placeholder="KETIK JENIS NG MANUAL..."
                                    value={row.ngTypes}
                                    onChange={(e) => updateRowField(row.id, "ngTypes", e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-transparent font-bold text-slate-800 focus:outline-none focus:ring-0 focus:ring-offset-0 border-0 uppercase"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateRowField(row.id, "isManualNg", false);
                                      updateRowField(row.id, "ngTypes", "");
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600 hover:text-blue-800 transition-colors uppercase cursor-pointer"
                                    title="Kembali ke Pilihan Dropdown"
                                  >
                                    List
                                  </button>
                                </div>
                              ) : (
                                <select
                                  value={row.ngTypes}
                                  onChange={(e) => {
                                    if (e.target.value === "MANUAL_INPUT") {
                                      updateRowField(row.id, "isManualNg", true);
                                      updateRowField(row.id, "ngTypes", "");
                                    } else {
                                      updateRowField(row.id, "ngTypes", e.target.value);
                                    }
                                  }}
                                  disabled={!row.partId}
                                  className="w-full px-3 py-2 text-xs bg-transparent font-bold text-slate-800 focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:text-slate-400 cursor-pointer border-0"
                                >
                                  <option value="">PILIH JENIS NG</option>
                                  <option value="MANUAL_INPUT" className="text-blue-600 font-extrabold bg-blue-50">+ Ketik Manual...</option>
                                  <option value="NG DENT">NG DENT</option>
                                  <option value="UNDERFILL">UNDERFILL</option>
                                  <option value="OVER MACHINING">OVER MACHINING</option>
                                  <option value="DENT & UNDERFILL">DENT & UNDERFILL</option>
                                  <option value="NO POWER">NO POWER</option>
                                </select>
                              )}
                            </td>

                            {/* 4. Action/Delete Button */}
                            {inputRows.length > 1 && (
                              <td className="p-0 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeRow(row.id)}
                                  className="w-full py-2 text-red-500 hover:text-red-700 font-extrabold text-sm transition-colors flex items-center justify-center cursor-pointer"
                                  title="Hapus baris part ini"
                                >
                                  <X size={14} className="stroke-[3]" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {qtyError && (
                  <div className="p-3.5 bg-red-50 text-red-600 rounded-md flex items-center gap-1.5 text-xs font-bold animate-pulse-ring">
                    <AlertTriangle size={16} />
                    {qtyError}
                  </div>
                )}
              </div>
            </div>
              {/* Card 3: Keputusan Disposisi & Customer Approval (Panjang Menyamping) */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-3.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-left border-b border-slate-100 pb-2">
                Disposisi &amp; Approval
              </span>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Keputusan Disposisi &amp; Customer Approval Required <span className="text-red-500">*</span>
                </label>
                <div className="border border-slate-400 rounded-lg shadow-sm bg-white">
                  <table className="w-full table-fixed text-center text-xs font-bold border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-400 text-slate-900 font-extrabold">
                        <th colSpan={5} className="py-2 text-center uppercase tracking-wider text-xs border-b border-slate-400">
                          KEPUTUSAN DISPOSISI
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Row 1: Labels */}
                      <tr className="bg-slate-50 text-slate-805 font-bold border-b border-slate-300">
                        <td className="px-1 py-1.5 border-r border-slate-400 w-[22%] uppercase text-[9px] leading-tight">RETURN TO VENDOR</td>
                        <td className="px-1 py-1.5 border-r border-slate-400 w-[22%] uppercase text-[9px] leading-tight">REWORK</td>
                        <td className="px-1 py-1.5 border-r border-slate-400 w-[22%] uppercase text-[9px] leading-tight">SCRAP</td>
                        <td colSpan={2} className="px-1 py-1.5 w-[34%] uppercase bg-slate-100/50 text-[9px] leading-tight">CUSTOMER APPROVAL</td>
                      </tr>

                      {/* Row 2: Checkboxes for top row, Labels for Customer Approval */}
                      <tr className="border-b border-slate-400 text-center font-bold">
                        <td 
                          onClick={() => setDisposition(disposition.includes("RETURN TO VENDOR") ? [] : ["RETURN TO VENDOR"])}
                          className={`border-r border-slate-400 text-center cursor-pointer h-9 transition-all ${
                            disposition.includes("RETURN TO VENDOR") ? "bg-blue-50" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-center h-full">
                            <input
                              type="checkbox"
                              checked={disposition.includes("RETURN TO VENDOR")}
                              readOnly
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer pointer-events-none"
                            />
                          </div>
                        </td>
                        <td 
                          onClick={() => setDisposition(disposition.includes("REWORK") ? [] : ["REWORK"])}
                          className={`border-r border-slate-400 text-center cursor-pointer h-9 transition-all ${
                            disposition.includes("REWORK") ? "bg-blue-50" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-center h-full">
                            <input
                              type="checkbox"
                              checked={disposition.includes("REWORK")}
                              readOnly
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer pointer-events-none"
                            />
                          </div>
                        </td>
                        <td 
                          onClick={() => setDisposition(disposition.includes("SCRAP") ? [] : ["SCRAP"])}
                          className={`border-r border-slate-400 text-center cursor-pointer h-9 transition-all ${
                            disposition.includes("SCRAP") ? "bg-blue-50" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-center h-full">
                            <input
                              type="checkbox"
                              checked={disposition.includes("SCRAP")}
                              readOnly
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer pointer-events-none"
                            />
                          </div>
                        </td>
                        <td className={`px-1 py-1 border-r border-slate-400 w-[17%] uppercase text-center font-bold flex-1 text-[9px] leading-tight h-9 align-middle transition-all duration-200 ${
                          customerApproval === "YES"
                            ? "bg-emerald-100 text-emerald-900 border-b border-emerald-300"
                            : "bg-slate-50 text-slate-805 border-b border-slate-300"
                        }`}>
                          <div className="flex items-center justify-center h-full">YES</div>
                        </td>
                        <td className={`px-1 py-1 w-[17%] uppercase text-center font-bold flex-1 text-[9px] leading-tight h-9 align-middle transition-all duration-200 ${
                          customerApproval === "NO"
                            ? "bg-red-100 text-red-900 border-b border-red-300"
                            : "bg-slate-50 text-slate-805 border-b border-slate-300"
                        }`}>
                          <div className="flex items-center justify-center h-full">NO</div>
                        </td>
                      </tr>

                      {/* Row 3: Labels for bottom row, Checkboxes for Customer Approval */}
                      <tr className="bg-slate-50 text-slate-805 font-bold border-b border-slate-400 text-center">
                        <td className="px-1 py-1.5 border-r border-slate-400 uppercase text-[9px] leading-tight">ACCEPT AS IS</td>
                        <td className="px-1 py-1.5 border-r border-slate-400 uppercase text-[9px] leading-tight">REPAIR</td>
                        <td className="px-1 py-1.5 border-r border-slate-400 uppercase text-[9px] leading-tight">REGRADE</td>
                        <td 
                          rowSpan={2}
                          onClick={() => setCustomerApproval(customerApproval === "YES" ? "" : "YES")}
                          className={`border-r border-slate-400 text-center cursor-pointer transition-all duration-200 ${
                            customerApproval === "YES" ? "bg-emerald-500 text-white" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-center h-full">
                            <input
                              type="checkbox"
                              checked={customerApproval === "YES"}
                              readOnly
                              className={`rounded w-4 h-4 cursor-pointer pointer-events-none transition-all ${
                                customerApproval === "YES"
                                  ? "text-emerald-600 bg-white border-transparent"
                                  : "text-emerald-600 border-slate-300 focus:ring-emerald-500"
                              }`}
                            />
                          </div>
                        </td>
                        <td 
                          rowSpan={2}
                          onClick={() => setCustomerApproval(customerApproval === "NO" ? "" : "NO")}
                          className={`text-center cursor-pointer transition-all duration-200 ${
                            customerApproval === "NO" ? "bg-red-500 text-white" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-center h-full">
                            <input
                              type="checkbox"
                              checked={customerApproval === "NO"}
                              readOnly
                              className={`rounded w-4 h-4 cursor-pointer pointer-events-none transition-all ${
                                customerApproval === "NO"
                                  ? "text-red-600 bg-white border-transparent"
                                  : "text-red-600 border-slate-300 focus:ring-red-500"
                              }`}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Row 4: Checkboxes for bottom row */}
                      <tr className="h-9 text-center">
                        <td 
                          onClick={() => setDisposition(disposition.includes("ACCEPT AS IS") ? [] : ["ACCEPT AS IS"])}
                          className={`border-r border-slate-400 text-center cursor-pointer transition-all ${
                            disposition.includes("ACCEPT AS IS") ? "bg-blue-50" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-center h-full">
                            <input
                              type="checkbox"
                              checked={disposition.includes("ACCEPT AS IS")}
                              readOnly
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer pointer-events-none"
                            />
                          </div>
                        </td>
                        <td 
                          onClick={() => setDisposition(disposition.includes("REPAIR") ? [] : ["REPAIR"])}
                          className={`border-r border-slate-400 text-center cursor-pointer transition-all ${
                            disposition.includes("REPAIR") ? "bg-blue-50" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-center h-full">
                            <input
                              type="checkbox"
                              checked={disposition.includes("REPAIR")}
                              readOnly
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer pointer-events-none"
                            />
                          </div>
                        </td>
                        <td 
                          onClick={() => setDisposition(disposition.includes("REGRADE") ? [] : ["REGRADE"])}
                          className={`border-r border-slate-400 text-center cursor-pointer transition-all ${
                            disposition.includes("REGRADE") ? "bg-blue-50" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-center h-full">
                            <input
                              type="checkbox"
                              checked={disposition.includes("REGRADE")}
                              readOnly
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer pointer-events-none"
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Other Documents to Revise Checklist */}
            <div className="space-y-1.5 text-left bg-white border border-slate-205 p-3 rounded-lg">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Other Documents to Revise</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-50 border border-slate-200/50 p-1.5 rounded-lg">
                {["CONTROL PLAN", "CHECK SHEET", "Q POINT", "MPS"].map((doc) => {
                  const isChecked = docsToRevise.includes(doc);
                  return (
                    <label key={doc} className="flex items-center gap-1 px-1.5 py-1.5 hover:bg-white rounded cursor-pointer text-[8.5px] font-bold text-slate-700 border border-slate-100 bg-white justify-start w-full whitespace-nowrap overflow-hidden text-ellipsis">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDocsToRevise([...docsToRevise, doc]);
                          } else {
                            setDocsToRevise(docsToRevise.filter((d) => d !== doc));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                      />
                      {doc}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Found By */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Found By <span className="text-red-500">*</span></label>
              <select
                value={foundBy}
                onChange={(e) => setFoundBy(e.target.value)}
                className="w-full px-4 py-2 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-bold text-slate-800 cursor-pointer h-[36px]"
              >
                <option value="MR. HENDRIK (QC INC.)">MR. HENDRIK (QC INC.)</option>
                <option value="MR. SLAMET (QC CS)">MR. SLAMET (QC CS)</option>
                <option value="MR. ALFIAN (QC QA)">MR. ALFIAN (QC QA)</option>
                <option value="LAINNYA (QC STAFF)">LAINNYA (QC STAFF)</option>
              </select>
            </div>
          </div>

          {/* Right Column: Card 2 */}
            <div className="lg:col-span-2">
              {/* Card 2: Rincian Informasi Temuan & Dokumentasi */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-3.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1 text-left border-b border-slate-100 pb-2">
                Rincian Informasi Temuan &amp; Dokumentasi
              </span>

              {/* Location Found & Problem Type */}
                {/* Location Found */}
                <div className="space-y-1.5 text-left bg-white border border-slate-205 p-3 rounded-lg">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Location Found <span className="text-red-500">*</span></label>
                  <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200/50 p-2 rounded-lg">
                    {["IN-COMING", "OUT-GOING", "IN-PROSES", "CUSTOMER"].map((loc) => {
                      const isChecked = locationFound.includes(loc);
                      return (
                        <label key={loc} className="flex items-center gap-2 px-3 py-2 hover:bg-white rounded cursor-pointer text-[10px] font-bold text-slate-700 border border-slate-100 bg-white justify-start w-full">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLocationFound([...locationFound, loc]);
                              } else {
                                setLocationFound(locationFound.filter((l) => l !== loc));
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          {loc}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Problem Type */}
                <div className="space-y-1.5 text-left bg-white border border-slate-205 p-3 rounded-lg">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Problem Type <span className="text-red-500">*</span></label>
                  <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200/50 p-2 rounded-lg">
                    {["QUALITY", "QUANTITY"].map((prob) => {
                      const isChecked = problemType.includes(prob);
                      return (
                        <label key={prob} className="flex items-center gap-2 px-3 py-2 hover:bg-white rounded cursor-pointer text-[10px] font-bold text-slate-700 border border-slate-100 bg-white justify-start w-full">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setProblemType([prob]);
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          {prob}
                        </label>
                      );
                    })}
                  </div>
                </div>

              {/* Found By & Other Documents to Revise */}
                {/* Description of Problem & Quick Tags */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Deskripsi Masalah (NG Description)</label>
                  <span className="text-[10px] text-slate-400">Pilih tag cepat untuk mempercepat input</span>
                </div>
                
                {/* Defect Quick Tags helper */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["NG Dent", "Underfill", "Over Machining", "Dent & Underfill", "No Power"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const newText = description ? `${description}, ${tag}` : tag;
                        setDescription(newText);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-205 text-slate-755 rounded text-[10px] font-bold cursor-pointer transition-all active:scale-95 border border-slate-200"
                    >
                      + {tag}
                    </button>
                  ))}
                  {description && (
                    <button
                      type="button"
                      onClick={() => setDescription("")}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <textarea
                  placeholder="Ketik detail temuan defect di sini or gunakan tag di atas..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 font-bold"
                />
              </div>
            </div>
          </div>

        </div>
          
          {/* Card 4: Action Panel (Submit button + warning, panjang di paling bawah) */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-3.5">
              {/* Batch Submit Button */}
              <button
                type="button"
                onClick={handleDirectSend}
                disabled={isSubmitting || !supplierId || inputRows.filter(r => r.partId && r.qtyNG && r.ngTypes).length === 0}
                className={`w-full py-3.5 rounded-lg font-bold text-xs shadow-md transition-all ${
                  isSubmitting || !supplierId || inputRows.filter(r => r.partId && r.qtyNG && r.ngTypes).length === 0
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-blue-600 hover:bg-blue-750 text-white shadow-blue-500/10 cursor-pointer active:scale-95"
                }`}
              >
                {isSubmitting ? "Mengirim Laporan..." : "Kirim Laporan NCR ke Approval"}
              </button>

              <div className="p-3 bg-slate-50 rounded-lg flex items-start gap-2 border border-slate-150 text-left">
                <AlertTriangle size={15} className="text-slate-450 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">
                  Pastikan semua field bertanda bintang (*) telah diisi sebelum mengirim ke approval Quality Manager.
                </p>
              </div>
            </div>

          {/* Sent History Table (Full width at bottom) */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-left">
                  Review Laporan NCR yang Telah Dikirim ke Approval ({items.length})
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold rounded uppercase">
                  Sent History
                </span>
              </div>
              
              {items.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs font-medium bg-slate-50/20">
                  Belum ada laporan NCR yang dikirim dalam sesi ini. Isi rincian di atas lalu klik "Kirim Laporan".
                </div>
              ) : (
                <div className="border border-slate-400 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div>
                    <table className="w-full table-fixed text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-400 text-slate-900 font-extrabold text-center">
                          <th className="px-2 py-2 border-r border-slate-400 w-[45%] text-center uppercase tracking-wider text-[10px]">
                            Pilih Part
                          </th>
                          <th className="px-2 py-2 border-r border-slate-400 w-[15%] text-center uppercase tracking-wider text-[10px]">
                            Qty NG
                          </th>
                          <th className="px-2 py-2 border-r border-slate-400 w-[22%] text-center uppercase tracking-wider text-[10px]">
                            NG Type
                          </th>
                          <th className="px-2 py-2 w-[18%] text-center uppercase tracking-wider text-[10px]">
                            Status &amp; Review
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-350 font-semibold text-slate-700">
                        {items.map((item) => {
                          return (
                            <tr key={item.id} className="transition-colors hover:bg-slate-50 text-center">
                              {/* 1. Pilih Part */}
                              <td className="px-2 py-2 border-r border-slate-350 text-left leading-tight">
                                <span className="font-bold text-slate-900 block text-[11px] leading-snug break-all">{item.ncrNumber}<br/>[{item.partNumber}] {item.partName}</span>
                                <span className="text-blue-600 text-[10px] font-black uppercase tracking-wider block mt-0.5">Supplier: {item.supplierName}</span>
                              </td>

                              {/* 2. Qty NG */}
                              <td className="px-2 py-2 border-r border-slate-350 text-center font-mono text-slate-900 font-bold text-[10px] whitespace-nowrap">
                                {item.qty} pcs
                              </td>

                              {/* 3. NG Type */}
                              <td className="px-2 py-2 border-r border-slate-350 text-center font-mono text-red-650 font-bold uppercase text-[10px] leading-tight">
                                {item.reject}
                              </td>

                              {/* 4. Status & Review Button */}
                              <td className="px-2 py-2 text-center">
                                <div className="flex flex-col items-center gap-1.5 justify-center">
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-250 text-[9px] font-extrabold rounded uppercase tracking-wider block">
                                    Waiting SPV
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReviewNcr(item)}
                                    className="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all cursor-pointer hover:scale-105"
                                    title="Review detail laporan terkirim"
                                  >
                                    <Eye size={12} strokeWidth={2.5} />
                                    Review
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}


      {/* Review NCR Details Modal */}
      {selectedReviewNcr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Review Laporan NCR (Terkirim)</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedReviewNcr.ncrNumber}</h4>
              </div>
              <button onClick={() => setSelectedReviewNcr(null)} className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-left max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Defect details */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 block">Detail Part & Supplier</span>
                    <span className="text-sm font-bold text-slate-800 block mt-1">{selectedReviewNcr.partName}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">{selectedReviewNcr.partNumber} • {selectedReviewNcr.supplierName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center text-xs">
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                      <span className="text-slate-400 block font-bold">Qty NG:</span>
                      <strong className="text-slate-800 font-extrabold">{selectedReviewNcr.qty} pcs</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100/50">
                      <span className="text-slate-400 block font-bold">NG Types:</span>
                      <strong className="text-red-600 font-extrabold uppercase">{selectedReviewNcr.reject}</strong>
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50/20 border border-slate-100 rounded-lg text-[11px] space-y-3 text-left">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      <div>
                        <span className="text-slate-455 font-bold text-[9px] uppercase tracking-wider block">Location Found</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">
                          {Array.isArray(selectedReviewNcr.locationFound) ? selectedReviewNcr.locationFound.join(", ") : selectedReviewNcr.locationFound || "IN-COMING"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-455 font-bold text-[9px] uppercase tracking-wider block">Problem Type</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">
                          {Array.isArray(selectedReviewNcr.problemType) ? selectedReviewNcr.problemType.join(", ") : selectedReviewNcr.problemType || "QUALITY"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-455 font-bold text-[9px] uppercase tracking-wider block">Docs to Revise</span>
                        <strong className="text-slate-800 font-bold block mt-0.5 truncate" title={Array.isArray(selectedReviewNcr.docsToRevise) ? selectedReviewNcr.docsToRevise.join(", ") : selectedReviewNcr.docsToRevise}>
                          {Array.isArray(selectedReviewNcr.docsToRevise) ? selectedReviewNcr.docsToRevise.join(", ") : selectedReviewNcr.docsToRevise || "-"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-455 font-bold text-[9px] uppercase tracking-wider block">Found By</span>
                        <strong className="text-slate-800 font-bold block mt-0.5 truncate" title={selectedReviewNcr.foundBy}>{selectedReviewNcr.foundBy || "QC INSPECTOR"}</strong>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2.5">
                      <span className="text-slate-455 font-bold text-[9px] uppercase tracking-wider block">Deskripsi Cacat / NG</span>
                      <p className="text-slate-800 font-bold bg-white p-2 rounded border border-slate-100/80 leading-normal mt-1 text-[11px] italic">
                        "{selectedReviewNcr.defectType || selectedReviewNcr.description}"
                      </p>
                    </div>
                  </div>

                  {/* Excel-style Read-only Keputusan Disposisi Table */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden text-center text-[9px] font-bold bg-white shadow-sm">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-extrabold text-[10px]">
                          <th colSpan={5} className="py-1.5 text-center uppercase tracking-wider">
                            KEPUTUSAN DISPOSISI
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                          <td className="border-r border-slate-300 py-1 w-[22%]">RETURN TO VENDOR</td>
                          <td className="border-r border-slate-300 py-1 w-[22%]">REWORK</td>
                          <td className="border-r border-slate-300 py-1 w-[22%]">SCRAP</td>
                          <td className="border-r border-slate-300 py-1 w-[17%] bg-slate-100/30 text-center font-bold">YES</td>
                          <td className="py-1 w-[17%] bg-slate-100/30 text-center font-bold">NO</td>
                        </tr>
                        <tr className="border-b border-slate-200 h-8">
                          <td className={`border-r border-slate-300 transition-colors ${
                            (Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition) === "RETURN TO VENDOR" ? "bg-blue-100 text-blue-700" : ""
                          }`}>
                            {(Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition) === "RETURN TO VENDOR" ? "✓" : ""}
                          </td>
                          <td className={`border-r border-slate-300 transition-colors ${
                            (Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition) === "REWORK" ? "bg-blue-100 text-blue-700" : ""
                          }`}>
                            {(Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition) === "REWORK" ? "✓" : ""}
                          </td>
                          <td className={`border-r border-slate-300 transition-colors ${
                            (Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition) === "SCRAP" ? "bg-blue-100 text-blue-700" : ""
                          }`}>
                            {(Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition) === "SCRAP" ? "✓" : ""}
                          </td>
                          <td 
                            rowSpan={2}
                            className={`border-r border-slate-300 transition-colors ${
                              selectedReviewNcr.customerApproval === "YES" ? "bg-emerald-100 text-emerald-800" : ""
                            }`}
                          >
                            {selectedReviewNcr.customerApproval === "YES" ? "✓" : ""}
                          </td>
                          <td 
                            rowSpan={2}
                            className={`transition-colors ${
                              selectedReviewNcr.customerApproval === "NO" ? "bg-red-100 text-red-800" : ""
                            }`}
                          >
                            {selectedReviewNcr.customerApproval === "NO" ? "✓" : ""}
                          </td>
                        </tr>
                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                          <td className="border-r border-slate-300 py-1">ACCEPT AS IS</td>
                          <td className="border-r border-slate-300 py-1">REPAIR</td>
                          <td className="border-r border-slate-300 py-1">REGRADE</td>
                        </tr>
                        <tr className="h-8">
                          <td className={`border-r border-slate-300 transition-colors ${
                            (Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition) === "ACCEPT AS IS" ? "bg-blue-100 text-blue-700" : ""
                          }`}>
                            {(Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition) === "ACCEPT AS IS" ? "✓" : ""}
                          </td>
                          <td className={`border-r border-slate-300 transition-colors ${
                            (Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition) === "REPAIR" ? "bg-blue-100 text-blue-700" : ""
                          }`}>
                            {(Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition) === "REPAIR" ? "✓" : ""}
                          </td>
                          <td className={`border-r border-slate-300 transition-colors ${
                            (Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition) === "REGRADE" ? "bg-blue-100 text-blue-700" : ""
                          }`}>
                            {(Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition) === "REGRADE" ? "✓" : ""}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Signatures & Reviews */}
                <div className="space-y-4">
                  {/* Quality Department Signature Block (PR4-FRM-08001) */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-[11px] shadow-sm/5 text-left">
                    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-extrabold text-slate-800 uppercase text-center tracking-wider text-[10px]">
                      TANDA TANGAN QUALITY DEPT (PR4-FRM-08001)
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-slate-300 text-center font-bold">
                      {/* STAFF Box */}
                      <div className="flex flex-col justify-between h-20 p-1">
                        <div className="text-[8px] text-slate-400 font-black uppercase">Staff (QC Inspector)</div>
                        {isStaffApproved ? (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-800 text-xs font-bold leading-none select-none">
                              {selectedReviewNcr.foundBy ? selectedReviewNcr.foundBy.split(" ")[1] : "Hendrik"}
                            </span>
                            {selectedReviewNcr.staffReview && (
                              <span className="text-[8px] text-slate-505 font-normal mt-0.5 italic block max-w-[80px] truncate" title={selectedReviewNcr.staffReview}>
                                "{selectedReviewNcr.staffReview}"
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-455 italic text-[8px] py-0.5 font-medium leading-tight">
                            Menunggu Staff
                          </div>
                        )}
                        <div className="text-[8px] text-slate-500 border-t border-slate-200 pt-0.5">
                          {selectedReviewNcr.date || "28-7-2025"}
                        </div>
                      </div>

                      {/* SPV Box */}
                      <div className="flex flex-col justify-between h-20 p-1">
                        <div className="text-[8px] text-slate-400 font-black uppercase">SPV (QC SPV)</div>
                        {isSpvApproved ? (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-800 text-xs font-bold leading-none select-none">Approved (SPV)</span>
                            {selectedReviewNcr.spvReview && (
                              <span className="text-[8px] text-slate-505 font-normal mt-0.5 italic block max-w-[80px] truncate" title={selectedReviewNcr.spvReview}>
                                "{selectedReviewNcr.spvReview}"
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[8px] py-0.5 font-medium leading-tight">
                            Menunggu SPV
                          </div>
                        )}
                        <div className="text-[8px] text-slate-500 border-t border-slate-200 pt-0.5">
                          {isSpvApproved ? selectedReviewNcr.date : "-"}
                        </div>
                      </div>

                      {/* MNG Box */}
                      <div className="flex flex-col justify-between h-20 p-1">
                        <div className="text-[8px] text-slate-400 font-black uppercase">MNG (QC Manager)</div>
                        {isMngApproved ? (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-800 text-xs font-bold leading-none select-none">Approved (MNG)</span>
                            {selectedReviewNcr.mngReview && (
                              <span className="text-[8px] text-slate-550 font-normal mt-0.5 italic block max-w-[80px] truncate" title={selectedReviewNcr.mngReview}>
                                "{selectedReviewNcr.mngReview}"
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[8px] py-0.5 font-medium leading-tight">
                            Menunggu MNG
                          </div>
                        )}
                        <div className="text-[8px] text-slate-500 border-t border-slate-200 pt-0.5">
                          {isMngApproved ? selectedReviewNcr.date : "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Reviews Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-left space-y-2.5">
                    <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">
                      Detail Catatan Review Approval
                    </span>
                    <div className="space-y-2 divide-y divide-slate-100">
                      {/* Staff Review */}
                      <div className="pt-2 first:pt-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">Staff (QC Inspector)</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            isStaffApproved ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            {isStaffApproved ? "APPROVED" : "PENDING"}
                          </span>
                        </div>
                        {isStaffApproved && selectedReviewNcr.staffReview && (
                          <p className="text-slate-600 mt-1 italic leading-normal font-semibold">
                            "{selectedReviewNcr.staffReview}"
                          </p>
                        )}
                      </div>

                      {/* SPV Review */}
                      <div className="pt-2 first:pt-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">SPV (QC SPV)</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            isSpvApproved ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            {isSpvApproved ? "APPROVED" : "PENDING"}
                          </span>
                        </div>
                        {isSpvApproved && selectedReviewNcr.spvReview && (
                          <p className="text-slate-600 mt-1 italic leading-normal font-semibold">
                            "{selectedReviewNcr.spvReview}"
                          </p>
                        )}
                      </div>

                      {/* MNG Review */}
                      <div className="pt-2 first:pt-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">MNG (QC Manager)</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            isMngApproved ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            {isMngApproved ? "APPROVED" : "PENDING"}
                          </span>
                        </div>
                        {isMngApproved && selectedReviewNcr.mngReview && (
                          <p className="text-slate-600 mt-1 italic leading-normal font-semibold">
                            "{selectedReviewNcr.mngReview}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedReviewNcr(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup Review
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
