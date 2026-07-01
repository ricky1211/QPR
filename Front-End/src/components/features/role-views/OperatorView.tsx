"use client";

import React, { useState, useRef, useEffect } from "react";
import { CheckCircle2, AlertTriangle, X, FileSignature, ChevronDown, Calendar, Edit2, Check } from "lucide-react";

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

  const parts = [
    { id: 1, partNumber: "MB-001", partName: "Motherboard X1", supplierId: 1 },
    { id: 2, partNumber: "GL-001", partName: "Gelas Kaca", supplierId: 1 },
    { id: 3, partNumber: "HD-002", partName: "Harddisk 1TB", supplierId: 2 },
    { id: 4, partNumber: "CP-003", partName: "CPU Fan Cooler", supplierId: 2 },
    { id: 5, partNumber: "CR-001", partName: "CONE RACE ALL TYPE", supplierId: 3 }
  ];

  // Step 1: Pre-selection States (Date - global for batch)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Step 2: Form States (Supplier, Part, Qty, and NG)
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [partId, setPartId] = useState<number | string>("");
  const [qtyNG, setQtyNG] = useState("");
  const [ngTypes, setNgTypes] = useState("");

  // Expanded fields from manual NCR form for Speed & Digitalization
  const [locationFound, setLocationFound] = useState<string[]>(["IN-COMING"]);
  const [problemType, setProblemType] = useState<string[]>(["QUALITY"]);
  const [foundBy, setFoundBy] = useState("MR. HENDRIK (QC INC.)");
  const [description, setDescription] = useState("");
  const [disposition, setDisposition] = useState<string[]>(["RETURN TO VENDOR"]);
  const [customerApproval, setCustomerApproval] = useState("YES");
  const [docsToRevise, setDocsToRevise] = useState<string[]>(["CONTROL PLAN", "CHECK SHEET"]);

  // Step 3: Batch Items List State
  const [items, setItems] = useState<any[]>([]);

  // UI state
  const [qtyError, setQtyError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNcrNumber, setSuccessNcrNumber] = useState<string | null>(null);

  // Row editing row ID state
  const [editingRowId, setEditingRowId] = useState<number | null>(null);

  // Filter parts based on selected supplier
  const filteredParts = supplierId
    ? parts.filter((p) => p.supplierId === supplierId && (editingRowId !== null || !items.some((item) => item.partId === p.id)))
    : [];

  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const selectedPart = parts.find(p => p.id === parseInt(String(partId)));

  const isSubmitEnabled = items.length > 0 && !isSubmitting;

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

  // Add or Update Item in batch list
  const handleAddItem = () => {
    if (!supplierId || !partId || !qtyNG || !ngTypes) return;
    
    const qty = parseInt(qtyNG) || 0;
    if (qty <= 0) {
      setQtyError("Qty NG harus lebih besar dari 0");
      return;
    }

    const currentSupplier = suppliers.find((s) => s.id === parseInt(String(supplierId)));
    const currentPart = parts.find((p) => p.id === parseInt(String(partId)));
    if (!currentSupplier || !currentPart) return;

    if (editingRowId !== null) {
      // Update existing item in batch
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingRowId
            ? {
                ...item,
                supplierId: parseInt(String(supplierId)),
                supplierName: currentSupplier.name,
                partId: parseInt(String(partId)),
                partNumber: currentPart.partNumber,
                partName: currentPart.partName,
                qty: qty,
                reject: ngTypes.trim().toUpperCase(),
                locationFound: locationFound,
                problemType: problemType,
                foundBy: foundBy,
                description: description,
                disposition: disposition,
                customerApproval: customerApproval,
                docsToRevise: docsToRevise
              }
            : item
        )
      );
      setEditingRowId(null);
    } else {
      // Add new item to batch
      const newItem = {
        id: Date.now(),
        supplierId: parseInt(String(supplierId)),
        supplierName: currentSupplier.name,
        partId: parseInt(String(partId)),
        partNumber: currentPart.partNumber,
        partName: currentPart.partName,
        qty: qty,
        reject: ngTypes.trim().toUpperCase(),
        locationFound: locationFound,
        problemType: problemType,
        foundBy: foundBy,
        description: description,
        disposition: disposition,
        customerApproval: customerApproval,
        docsToRevise: docsToRevise
      };
      setItems((prev) => [...prev, newItem]);
    }

    // Reset inputs to default values
    setSupplierId("");
    setPartId("");
    setQtyNG("");
    setNgTypes("");
    setLocationFound(["IN-COMING"]);
    setProblemType(["QUALITY"]);
    setFoundBy("MR. HENDRIK (QC INC.)");
    setDescription("");
    setDisposition(["RETURN TO VENDOR"]);
    setCustomerApproval("YES");
    setDocsToRevise(["CONTROL PLAN", "CHECK SHEET"]);
    setQtyError(null);
  };

  // Remove Item from batch list
  const handleRemoveItem = (id) => {
    if (editingRowId === id) {
      handleCancelEdit();
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Load item into form fields for editing
  const handleStartEdit = (item) => {
    setEditingRowId(item.id);
    setSupplierId(item.supplierId);
    setPartId(item.partId);
    setQtyNG(String(item.qty));
    setNgTypes(String(item.reject));
    setLocationFound(Array.isArray(item.locationFound) ? item.locationFound : [item.locationFound]);
    setProblemType(Array.isArray(item.problemType) ? item.problemType : [item.problemType]);
    setFoundBy(item.foundBy);
    setDescription(item.description);
    setDisposition(Array.isArray(item.disposition) ? item.disposition : [item.disposition]);
    setCustomerApproval(item.customerApproval);
    setDocsToRevise(item.docsToRevise);
    setQtyError(null);
  };

  // Cancel edit mode and clear form
  const handleCancelEdit = () => {
    setEditingRowId(null);
    setSupplierId("");
    setPartId("");
    setQtyNG("");
    setNgTypes("");
    setLocationFound(["IN-COMING"]);
    setProblemType(["QUALITY"]);
    setFoundBy("MR. HENDRIK (QC INC.)");
    setDescription("");
    setDisposition(["RETURN TO VENDOR"]);
    setCustomerApproval("YES");
    setDocsToRevise(["CONTROL PLAN", "CHECK SHEET"]);
    setQtyError(null);
  };

  // Form submit handler
  const handleFormSubmit = (e) => {
    e.preventDefault();

    let submissionItems = [...items];
    if (submissionItems.length === 0) {
      if (supplierId && partId && qtyNG && ngTypes) {
        const qty = parseInt(qtyNG) || 0;
        if (qty > 0) {
          const currentSupplier = suppliers.find((s) => s.id === parseInt(String(supplierId)));
          const currentPart = parts.find((p) => p.id === parseInt(String(partId)));
          if (currentSupplier && currentPart) {
            submissionItems.push({
              id: Date.now(),
              supplierId: parseInt(String(supplierId)),
              supplierName: currentSupplier.name,
              partId: parseInt(String(partId)),
              partNumber: currentPart.partNumber,
              partName: currentPart.partName,
              qty: qty,
              reject: ngTypes.trim().toUpperCase(),
              locationFound: locationFound,
              problemType: problemType,
              foundBy: foundBy,
              description: description,
              disposition: disposition,
              customerApproval: customerApproval,
              docsToRevise: docsToRevise
            });
          }
        }
      }
    }

    if (!selectedDate || submissionItems.length === 0) return;

    setIsSubmitting(true);
    
    // Simulate API request delay
    setTimeout(() => {
      const newNcrs = [];
      const newNotifs = [];
      const ncrNumbers = [];

      submissionItems.forEach((item, index) => {
        const ncrNum = `NCR/2026/06/SIM-${Math.floor(100 + Math.random() * 900)}`;
        ncrNumbers.push(ncrNum);

        const newNcr = {
          id: Date.now() + index,
          ncrNumber: ncrNum,
          date: selectedDate,
          partNumber: item.partNumber,
          partName: item.partName,
          supplierName: item.supplierName,
          qty: item.qty, // this is Qty NG
          reject: item.reject, // this is NG Types
          locationFound: Array.isArray(item.locationFound) ? item.locationFound.join(", ") : item.locationFound,
          problemType: Array.isArray(item.problemType) ? item.problemType.join(", ") : item.problemType,
          foundBy: item.foundBy,
          defectType: item.description || "Quality defect found",
          disposition: Array.isArray(item.disposition) ? item.disposition.join(", ") : item.disposition,
          customerApproval: item.customerApproval,
          docsToRevise: item.docsToRevise.join(", "),
          status: "WAITING_APPROVAL",
          requiredRole: "Foreman"
        };
        newNcrs.push(newNcr);

        const newNotif = {
          id: Date.now() + index + 100,
          message: `NCR Baru ${ncrNum} berhasil dibuat secara manual oleh Operator untuk ${item.partName} (${item.supplierName}).`,
          time: "Baru saja",
          type: "success",
          unread: true
        };
        newNotifs.push(newNotif);

        const ccNotif = {
          id: Date.now() + index + 200,
          message: `[CC PPIC/Purchase] Dokumen NCR Baru ${ncrNum} untuk supplier ${item.supplierName} (Part: ${item.partName}) telah otomatis diteruskan ke bagian PPIC & Purchasing PT MTM.`,
          time: "Baru saja",
          type: "info",
          unread: true
        };
        newNotifs.push(ccNotif);
      });

      setPendingNcrs((prev) => [...newNcrs, ...prev]);
      setNotifications((prev) => [...newNotifs, ...prev]);

      // Reset form, items & steps
      setSupplierId("");
      setPartId("");
      setQtyNG("");
      setNgTypes("");
      setLocationFound(["IN-COMING"]);
      setProblemType(["QUALITY"]);
      setFoundBy("MR. HENDRIK (QC INC.)");
      setDescription("");
      setDisposition(["RETURN TO VENDOR"]);
      setCustomerApproval("YES");
      setDocsToRevise(["CONTROL PLAN", "CHECK SHEET"]);
      setItems([]);
      setEditingRowId(null);
      setSelectedDate(new Date().toISOString().split("T")[0]);

      // Show success alert
      setIsSubmitting(false);
      setSuccessNcrNumber(ncrNumbers.join(", "));
    }, 1500);
  };

  const isStepComplete = !!selectedDate;

  // Render Date selector at the top
  const renderSelectionCards = () => (
    <div className="grid grid-cols-1 gap-6 w-full">
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
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Success Notification Alert */}
      {successNcrNumber && (
        <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-lg shadow-sm flex items-start justify-between gap-3 animate-blink">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-emerald-800">Dokumen NCR Berhasil Diterbitkan!</p>
              <p className="text-xs text-emerald-600 mt-1">
                Surat penolakan kualitas <strong className="font-bold">{successNcrNumber}</strong> telah dicatat oleh sistem dan diteruskan ke <strong>Foreman</strong> untuk persetujuan.
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

      {/* Selectors Block (Date Picker) */}
      {renderSelectionCards()}

      {/* Step 2 Form Details: Rendered when date is filled */}
      {isStepComplete && (
        <form onSubmit={handleFormSubmit} className="space-y-6 animate-slide-up">
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center bg-slate-50/10">
              <div className="flex items-center gap-2">
                <FileSignature size={18} className="text-blue-500" />
                <h4 className="text-sm font-black text-slate-800">
                  {editingRowId !== null ? "Edit Data Temuan & Disposisi Part" : "Rincian Laporan Defect (NCR)"}
                </h4>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black rounded uppercase">
                {editingRowId !== null ? "Edit Mode" : "Form Wajib"}
              </span>
            </div>

            {/* Selected Summary Info */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4 flex-1 text-left">
                <div>
                  <span className="text-slate-400 block font-bold">Tanggal Defect:</span>
                  <span className="text-slate-800 font-bold mt-0.5 block">{formatDateFriendly(selectedDate)}</span>
                </div>
              </div>
            </div>

            {/* Form Fields: Supplier & Part Selection */}
            <div className="space-y-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1 text-left">
                {editingRowId !== null ? "Ubah Part & Supplier" : "Pilih Supplier & Part / Barang"}
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Supplier select */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Supplier / Vendor <span className="text-red-500">*</span></label>
                  <select
                    value={supplierId}
                    onChange={(e) => {
                      setSupplierId(e.target.value ? parseInt(e.target.value) : "");
                      setPartId(""); // Reset part when supplier changes
                    }}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Part select */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Part / Barang <span className="text-red-500">*</span></label>
                  <select
                    value={partId}
                    onChange={(e) => setPartId(e.target.value)}
                    disabled={!supplierId}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="">{supplierId ? "-- Pilih Part / Barang --" : "-- Pilih Supplier Dahulu --"}</option>
                    {filteredParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.partNumber}] {p.partName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Qty NG vs NG Types */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Qty NG <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 75000"
                    value={qtyNG}
                    onChange={(e) => setQtyNG(e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400/50 bg-white text-slate-800 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">NG Types <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Contoh: NG DENT, UNDERFILL"
                    value={ngTypes}
                    onChange={(e) => setNgTypes(e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400/50 bg-white text-slate-800 font-bold uppercase"
                  />
                  
                  {/* Defect Quick Tags helper for NG Types */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {["NG Dent", "Underfill", "Over Machining", "Dent & Underfill", "No Power"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const formattedTag = tag.toUpperCase();
                          const newText = ngTypes ? `${ngTypes}, ${formattedTag}` : formattedTag;
                          setNgTypes(newText);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-205 text-slate-750 rounded text-[10px] font-bold cursor-pointer transition-all active:scale-95 border border-slate-200"
                      >
                        + {tag}
                      </button>
                    ))}
                    {ngTypes && (
                      <button
                        type="button"
                        onClick={() => setNgTypes("")}
                        className="px-2 py-0.5 text-[9px] font-bold text-red-500 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
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
                        <label key={prob} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer text-[10px] font-bold text-slate-705 border border-slate-100">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProblemType([...problemType, prob]);
                              } else {
                                setProblemType(problemType.filter((p) => p !== prob));
                              }
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
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-205 text-slate-750 rounded text-[10px] font-bold cursor-pointer transition-all active:scale-95 border border-slate-200"
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
                  placeholder="Ketik detail temuan defect di sini atau gunakan tag di atas..."
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
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDisposition([...disposition, disp]);
                            } else {
                              setDisposition(disposition.filter((d) => d !== disp));
                            }
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
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDocsToRevise([...docsToRevise, doc]);
                            } else {
                              setDocsToRevise(docsToRevise.filter(d => d !== doc));
                            }
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

            {/* Tambah / Update Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              {editingRowId !== null ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-5 py-2.5 rounded-md font-bold text-xs bg-slate-100 hover:bg-slate-202 text-slate-700 transition-all border border-slate-250 cursor-pointer"
                  >
                    Batal Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!supplierId || !partId || !qtyNG || !ngTypes || !!qtyError}
                    className="px-5 py-2.5 rounded-md font-bold text-xs bg-emerald-600 hover:bg-emerald-750 text-white shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
                  >
                    Simpan Perubahan Part
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!supplierId || !partId || !qtyNG || !ngTypes || !!qtyError}
                  className={`px-5 py-2.5 rounded-md font-bold text-xs shadow-md transition-all ${
                    !supplierId || !partId || !qtyNG || !ngTypes || !!qtyError
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-blue-600 hover:bg-blue-755 text-white shadow-blue-500/10 cursor-pointer animate-all"
                  }`}
                >
                  Tambah Data Part ke Batch
                </button>
              )}
            </div>

            {/* Table of Added Defect Items */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-left">
                Daftar Item Defect & Rincian dalam Batch ({items.length})
              </span>
              
              {items.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs font-medium bg-slate-50/20">
                  Belum ada item yang ditambahkan ke daftar. Silakan isi rincian di atas lalu klik "Tambah Data Part ke Batch".
                </div>
              ) : (
                <div className="border border-slate-400 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-200 border-b border-slate-600 text-slate-900 font-extrabold">
                          <th className="px-3 py-2 pl-5 w-1/2">Part / Barang & Temuan</th>
                          <th className="px-3 py-2 text-center w-1/5">Qty NG</th>
                          <th className="px-3 py-2 text-center w-1/4">NG Types</th>
                          <th className="px-3 py-2 pr-5 text-center w-1/6">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 font-semibold text-slate-700">
                        {items.map((item) => {
                          const isBeingEdited = editingRowId === item.id;
                          return (
                            <tr key={item.id} className={`transition-colors ${isBeingEdited ? "bg-blue-50/40" : "hover:bg-slate-50"}`}>
                              <td className="px-3 py-3 pl-5 text-left">
                                <span className="font-bold text-slate-900 block">[{item.partNumber}] {item.partName}</span>
                                <span className="text-blue-600 text-[10px] font-black uppercase tracking-wider block mt-1">Supplier: {item.supplierName}</span>
                                
                                {/* Summarized findings details inside the row */}
                                <div className="mt-2.5 space-y-1 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 shadow-sm/5">
                                  <div>
                                    <span className="font-extrabold text-slate-600">Location:</span> <span className="bg-slate-200 text-slate-700 px-1 rounded text-[9px] font-bold">{Array.isArray(item.locationFound) ? item.locationFound.join(", ") : item.locationFound}</span> • <span className="font-extrabold text-slate-600">Prob:</span> <span className="bg-slate-200 text-slate-700 px-1 rounded text-[9px] font-bold">{Array.isArray(item.problemType) ? item.problemType.join(", ") : item.problemType}</span>
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-slate-600">Reporter:</span> {item.foundBy}
                                  </div>
                                  <div className="text-slate-700 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-150 mt-1 italic">
                                    "{item.description || "Tidak ada deskripsi spesifik."}"
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-slate-600">Disposition:</span> <span className="text-blue-600 font-black">{Array.isArray(item.disposition) ? item.disposition.join(", ") : item.disposition}</span> (Appr Required: {item.customerApproval})
                                  </div>
                                  {item.docsToRevise.length > 0 && (
                                    <div>
                                      <span className="font-extrabold text-slate-600">Docs to Revise:</span> {item.docsToRevise.join(", ")}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center font-mono text-slate-900 font-bold">{item.qty} pcs</td>
                              <td className="px-3 py-3 text-center font-mono text-red-600 font-bold uppercase">{item.reject}</td>
                              <td className="px-3 py-3 pr-5 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(item)}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all border shadow-sm hover:scale-105 cursor-pointer ${isBeingEdited ? "bg-blue-600 border-blue-700 text-white" : "bg-blue-50 border-blue-200/50 text-blue-500 hover:bg-blue-100 hover:text-blue-700"}`}
                                    title="Edit rincian data part ini"
                                  >
                                    <Edit2 size={13} strokeWidth={2.5} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 flex items-center justify-center transition-all border border-red-200/50 shadow-sm hover:scale-105 cursor-pointer"
                                    title="Hapus dari daftar"
                                  >
                                    <X size={14} strokeWidth={2.5} />
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

            {/* Form Actions (Submit NCR Batch) */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={!isSubmitEnabled}
                className={`w-full px-6 py-3 rounded-md font-bold text-sm shadow-md transition-all ${
                  !isSubmitEnabled
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-blue-600 hover:bg-blue-755 text-white shadow-blue-500/10 cursor-pointer"
                }`}
              >
                {isSubmitting ? "Menerbitkan NCR..." : "Terbitkan & Picu Alur NCR"}
              </button>
            </div>

          </div>

        </form>
      )}

    </div>
  );
}
