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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  
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
    if (!dateStr) return "Pilih Tanggal";
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
              {selectedSupplier ? `${selectedSupplier.name} (${selectedSupplier.code})` : "Pilih Supplier..."}
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
            <option value="">Pilih Supplier...</option>
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
    <div className="max-w-3xl mx-auto space-y-6">
      
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
      {isStepComplete && (
        <div className="space-y-6 animate-slide-up">
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-5">
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

            {/* Selected Summary Info */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4 flex-1 text-left">
                <div>
                  <span className="text-slate-400 block font-bold">Tanggal Defect:</span>
                  <span className="text-slate-800 font-bold mt-0.5 block">{formatDateFriendly(selectedDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Supplier Terpilih:</span>
                  <span className="text-blue-600 font-black mt-0.5 block">{selectedSupplier?.name}</span>
                </div>
              </div>
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
                  className={`px-2.5 py-1 border rounded-md text-[11px] font-bold transition-all flex items-center hover:scale-102 active:scale-98 shadow-sm/5 ${
                    !supplierId
                      ? "bg-slate-150 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer"
                  }`}
                >
                  + Tambah Part
                </button>
              </div>

              {/* Table Input Row */}
              <div className="border border-slate-400 rounded-lg overflow-hidden shadow-sm bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 text-slate-900 font-extrabold text-center">
                      <th className="px-3 py-2.5 border-r border-slate-400 w-5/12 text-center uppercase tracking-wider">
                        Pilih Part
                      </th>
                      <th className="px-3 py-2.5 border-r border-slate-400 w-2/12 text-center uppercase tracking-wider">
                        Qty NG
                      </th>
                      <th className={`px-3 py-2.5 text-center uppercase tracking-wider ${
                        inputRows.length > 1 ? "border-r border-slate-400 w-4/12" : "w-5/12"
                      }`}>
                        NG Type
                      </th>
                      {inputRows.length > 1 && (
                        <th className="px-3 py-2.5 w-1/12 text-center uppercase tracking-wider">
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
                              className="w-full px-3 py-2.5 text-xs bg-transparent font-bold text-slate-800 focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:text-slate-400 cursor-pointer border-0"
                            >
                              <option value="">-- Pilih Part / Barang --</option>
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
                              type="number"
                              min="1"
                              placeholder="75000"
                              value={row.qtyNG}
                              onChange={(e) => updateRowField(row.id, "qtyNG", e.target.value)}
                              className="w-full px-3 py-2.5 text-xs bg-transparent text-center focus:outline-none focus:ring-0 focus:ring-offset-0 placeholder-slate-400/55 text-slate-800 font-bold border-0"
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
                                  className="w-full px-3 py-2.5 text-xs bg-transparent font-bold text-slate-800 focus:outline-none focus:ring-0 focus:ring-offset-0 border-0 uppercase"
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
                                className="w-full px-3 py-2.5 text-xs bg-transparent font-bold text-slate-800 focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:text-slate-400 cursor-pointer border-0"
                              >
                                <option value="">PILIH JENIS NG...</option>
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
                                className="w-full py-2.5 text-red-500 hover:text-red-700 font-extrabold text-sm transition-colors flex items-center justify-center cursor-pointer"
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

            {/* Rincian Tambahan Dokumen NCR (PR4-FRM-08001) */}
            <div className="space-y-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1 text-left">
                Rincian Informasi Temuan & Disposisi Part
              </span>

              {/* Checkboxes Group 1: Location Found & Problem Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Location Found <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 p-2.5 rounded-lg">
                    {["IN-COMING", "OUT-GOING", "IN-PROSES", "CUSTOMER"].map((loc) => {
                      const isChecked = locationFound.includes(loc);
                      return (
                        <label key={loc} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer text-[10px] font-bold text-slate-705 border border-slate-100">
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

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Problem Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 p-2.5 rounded-lg">
                    {["QUALITY", "QUANTITY"].map((prob) => {
                      const isChecked = problemType.includes(prob);
                      return (
                        <label key={prob} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-55 rounded cursor-pointer text-[10px] font-bold text-slate-705 border border-slate-100">
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
              </div>

              {/* Found By: Dropdown selector (scroll/pilihan mode) */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Found By <span className="text-red-500">*</span></label>
                <select
                  value={foundBy}
                  onChange={(e) => setFoundBy(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-bold text-slate-800 cursor-pointer"
                >
                  <option value="MR. HENDRIK (QC INC.)">MR. HENDRIK (QC INC.)</option>
                  <option value="MR. SLAMET (QC CS)">MR. SLAMET (QC CS)</option>
                  <option value="MR. ALFIAN (QC QA)">MR. ALFIAN (QC QA)</option>
                  <option value="LAINNYA (QC STAFF)">LAINNYA (QC STAFF)</option>
                </select>
              </div>

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
                      className="px-2 py-0.5 text-[9px] font-bold text-red-500 hover:underline cursor-pointer"
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

              {/* Disposition Checkboxes */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Keputusan Disposisi <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white border border-slate-200 p-2.5 rounded-lg">
                  {["RETURN TO VENDOR", "REWORK", "SCRAP", "ACCEPT AS IS", "REPAIR", "REGRADE"].map((disp) => {
                    const isChecked = disposition.includes(disp);
                    return (
                      <label key={disp} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-55 rounded cursor-pointer text-[10px] font-bold text-slate-705 border border-slate-100">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setDisposition([disp]);
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        {disp}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Customer Approval Required Checkboxes (Yes/No with single-select behavior) */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Customer Approval Required? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 p-2.5 rounded-lg max-w-xs">
                  {["YES", "NO"].map((choice) => {
                    const isChecked = customerApproval === choice;
                    return (
                      <label key={choice} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-55 rounded cursor-pointer text-[10px] font-bold text-slate-705 border border-slate-100">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => setCustomerApproval(choice)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        {choice}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Documents to Revise Checklist */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Other Documents to Revise</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white border border-slate-200 p-2.5 rounded-lg">
                  {["CONTROL PLAN", "CHECK SHEET", "Q POINT", "MPS"].map((doc) => {
                    const isChecked = docsToRevise.includes(doc);
                    return (
                      <label key={doc} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-55 rounded cursor-pointer text-[10px] font-bold text-slate-707 border border-slate-100">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setDocsToRevise([doc]);
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        {doc}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Batch Submit Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleDirectSend}
                disabled={isSubmitting || !supplierId || inputRows.filter(r => r.partId && r.qtyNG && r.ngTypes).length === 0}
                className={`px-6 py-3 rounded-md font-bold text-xs shadow-md transition-all ${
                  isSubmitting || !supplierId || inputRows.filter(r => r.partId && r.qtyNG && r.ngTypes).length === 0
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-blue-600 hover:bg-blue-750 text-white shadow-blue-500/10 cursor-pointer active:scale-95"
                }`}
              >
                {isSubmitting ? "Mengirim Laporan..." : "Kirim Laporan NCR ke Approval"}
              </button>
            </div>
            <div className="space-y-2 pt-4 border-t border-slate-100">
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-400 text-slate-900 font-extrabold text-center">
                          <th className="px-3 py-2.5 border-r border-slate-400 w-5/12 text-center uppercase tracking-wider">
                            Pilih Part
                          </th>
                          <th className="px-3 py-2.5 border-r border-slate-400 w-2/12 text-center uppercase tracking-wider">
                            Qty NG
                          </th>
                          <th className="px-3 py-2.5 border-r border-slate-400 w-3/12 text-center uppercase tracking-wider">
                            NG Type
                          </th>
                          <th className="px-3 py-2.5 w-2/12 text-center uppercase tracking-wider">
                            Status & Review
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-350 font-semibold text-slate-700">
                        {items.map((item) => {
                          return (
                            <tr key={item.id} className="transition-colors hover:bg-slate-50 text-center">
                              {/* 1. Pilih Part */}
                              <td className="px-3 py-3 border-r border-slate-350 text-left">
                                <span className="font-bold text-slate-900 block">{item.ncrNumber} - [{item.partNumber}] {item.partName}</span>
                                <span className="text-blue-600 text-[10px] font-black uppercase tracking-wider block mt-0.5">Supplier: {item.supplierName}</span>
                              </td>

                              {/* 2. Qty NG */}
                              <td className="px-3 py-3 border-r border-slate-350 text-center font-mono text-slate-900 font-bold">
                                {item.qty} pcs
                              </td>

                              {/* 3. NG Type */}
                              <td className="px-3 py-3 border-r border-slate-350 text-center font-mono text-red-600 font-bold uppercase">
                                {item.reject}
                              </td>

                              {/* 4. Status & Review Button */}
                              <td className="px-3 py-3 text-center">
                                <div className="flex flex-col items-center gap-1.5 justify-center">
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-250 text-[9px] font-extrabold rounded uppercase tracking-wider block">
                                    Waiting SPV
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReviewNcr(item)}
                                    className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200/50 hover:bg-blue-100 text-blue-600 font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all cursor-pointer hover:scale-105"
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
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Review Laporan NCR (Terkirim)</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedReviewNcr.ncrNumber}</h4>
              </div>
              <button onClick={() => setSelectedReviewNcr(null)} className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-left max-h-[65vh] overflow-y-auto">
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

              <div className="p-3 bg-blue-50/20 border border-slate-100 rounded-md space-y-2.5 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Location Found:</span>
                  <span className="text-slate-800 font-bold">{Array.isArray(selectedReviewNcr.locationFound) ? selectedReviewNcr.locationFound.join(", ") : selectedReviewNcr.locationFound}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Problem Type:</span>
                  <span className="text-slate-800 font-bold">{Array.isArray(selectedReviewNcr.problemType) ? selectedReviewNcr.problemType.join(", ") : selectedReviewNcr.problemType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Found By:</span>
                  <span className="text-slate-800 font-bold">{selectedReviewNcr.foundBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Customer Approval?</span>
                  <span className="text-slate-800 font-bold">{selectedReviewNcr.customerApproval}</span>
                </div>
                {selectedReviewNcr.docsToRevise && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Docs to Revise:</span>
                    <span className="text-slate-800 font-bold truncate max-w-[200px]" title={Array.isArray(selectedReviewNcr.docsToRevise) ? selectedReviewNcr.docsToRevise.join(", ") : selectedReviewNcr.docsToRevise}>{Array.isArray(selectedReviewNcr.docsToRevise) ? selectedReviewNcr.docsToRevise.join(", ") : selectedReviewNcr.docsToRevise}</span>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-2 flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">Deskripsi Cacat / NG:</span>
                  <p className="text-slate-800 font-bold bg-white p-2 rounded border border-slate-100/80 leading-normal italic">"{selectedReviewNcr.defectType || selectedReviewNcr.description}"</p>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-500 font-medium">Keputusan Disposisi:</span>
                  <span className="text-blue-600 font-black">{Array.isArray(selectedReviewNcr.disposition) ? selectedReviewNcr.disposition.join(", ") : selectedReviewNcr.disposition}</span>
                </div>
              </div>

              {/* Quality Department Signature Block (PR4-FRM-08001) */}
              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-[11px] mt-4 shadow-sm/5 text-left">
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
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedReviewNcr(null)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer"
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
