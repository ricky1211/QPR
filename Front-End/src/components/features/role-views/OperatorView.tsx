"use client";

import React, { useState, useRef, useEffect } from "react";
import { CheckCircle2, AlertTriangle, X, FileSignature, ChevronDown, Calendar } from "lucide-react";

export default function OperatorView({
  pendingNcrs,
  setPendingNcrs,
  notifications,
  setNotifications
}) {
  // References for Form Dropdowns
  const suppliers = [
    { id: 1, name: "PT JAYADI", code: "SPL-JAY" },
    { id: 2, name: "PT IKAN BAKAR", code: "SPL-IBK" }
  ];

  const parts = [
    { id: 1, partNumber: "MB-001", partName: "Motherboard X1", supplierId: 1 },
    { id: 2, partNumber: "GL-001", partName: "Gelas Kaca", supplierId: 1 },
    { id: 3, partNumber: "HD-002", partName: "Harddisk 1TB", supplierId: 2 },
    { id: 4, partNumber: "CP-003", partName: "CPU Fan Cooler", supplierId: 2 }
  ];

  // Step 1: Pre-selection States (Date & Supplier)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [supplierId, setSupplierId] = useState<number | "">("");
  
  // Dropdown open states
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);

  // Step 2: Form States (Only Part, Qty, and NG)
  const [partId, setPartId] = useState<number | string>("");
  const [initialQuantity, setInitialQuantity] = useState("");
  const [rejectQuantity, setRejectQuantity] = useState("");

  // Step 3: Batch Items List State
  const [items, setItems] = useState<any[]>([]);

  // UI state
  const [qtyError, setQtyError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNcrNumber, setSuccessNcrNumber] = useState<string | null>(null);

  // Filter parts based on selected supplier and exclude already added parts
  const filteredParts = supplierId
    ? parts.filter((p) => p.supplierId === supplierId && !items.some((item) => item.partId === p.id))
    : [];

  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const selectedPart = parts.find(p => p.id === parseInt(String(partId)));

  const hasInputs = partId !== "" && initialQuantity !== "" && rejectQuantity !== "";
  const canSubmitDirectly = hasInputs && (parseInt(rejectQuantity) <= parseInt(initialQuantity));
  const isSubmitEnabled = (items.length > 0 || canSubmitDirectly) && !isSubmitting;

  // Refs for Dropdowns and input date trigger
  const supplierRef = useRef(null);
  const dateInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (supplierRef.current && !supplierRef.current.contains(event.target)) {
        setIsSupplierOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Handle Qty Validations
  const handleQtyChange = (e) => {
    const { name, value } = e.target;
    if (name === "initialQuantity") {
      setInitialQuantity(value);
      const reject = parseInt(rejectQuantity) || 0;
      const initial = parseInt(value) || 0;
      if (reject > initial && initial > 0) {
        setQtyError("Reject Qty tidak boleh melebihi Checked Qty");
      } else {
        setQtyError(null);
      }
    } else if (name === "rejectQuantity") {
      setRejectQuantity(value);
      const reject = parseInt(value) || 0;
      const initial = parseInt(initialQuantity) || 0;
      if (reject > initial && initial > 0) {
        setQtyError("Reject Qty tidak boleh melebihi Checked Qty");
      } else {
        setQtyError(null);
      }
    }
  };

  // Add Item to batch list
  const handleAddItem = () => {
    if (!partId || !initialQuantity || !rejectQuantity) return;
    
    const initial = parseInt(initialQuantity) || 0;
    const reject = parseInt(rejectQuantity) || 0;

    if (reject > initial) {
      setQtyError("Reject Qty tidak boleh melebihi Checked Qty");
      return;
    }

    const currentPart = parts.find((p) => p.id === parseInt(String(partId)));
    if (!currentPart) return;

    const newItem = {
      id: Date.now(),
      partId: parseInt(String(partId)),
      partNumber: currentPart.partNumber,
      partName: currentPart.partName,
      qty: initial,
      reject: reject
    };

    setItems((prev) => [...prev, newItem]);

    // Reset inputs
    setPartId("");
    setInitialQuantity("");
    setRejectQuantity("");
    setQtyError(null);
  };

  // Remove Item from batch list
  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    let submissionItems = [...items];
    if (submissionItems.length === 0) {
      if (partId && initialQuantity && rejectQuantity) {
        const initial = parseInt(initialQuantity) || 0;
        const reject = parseInt(rejectQuantity) || 0;
        if (reject <= initial) {
          const currentPart = parts.find((p) => p.id === parseInt(String(partId)));
          if (currentPart) {
            submissionItems.push({
              id: Date.now(),
              partId: parseInt(String(partId)),
              partNumber: currentPart.partNumber,
              partName: currentPart.partName,
              qty: initial,
              reject: reject
            });
          }
        }
      }
    }

    if (!supplierId || !selectedDate || submissionItems.length === 0) return;

    setIsSubmitting(true);
    
    // Simulate API request delay
    setTimeout(() => {
      const currentSupplier = selectedSupplier || { name: "Custom Supplier" };
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
          supplierName: currentSupplier.name,
          qty: item.qty,
          reject: item.reject,
          defectType: "Quality defect found",
          disposition: "RETURN TO VENDOR",
          status: "WAITING_APPROVAL",
          requiredRole: "Foreman"
        };
        newNcrs.push(newNcr);

        const newNotif = {
          id: Date.now() + index + 100,
          message: `NCR Baru ${ncrNum} berhasil dibuat secara manual oleh Operator untuk ${item.partName} (${currentSupplier.name}).`,
          time: "Baru saja",
          type: "success",
          unread: true
        };
        newNotifs.push(newNotif);
      });

      setPendingNcrs((prev) => [...newNcrs, ...prev]);
      setNotifications((prev) => [...newNotifs, ...prev]);

      // Reset form, items & steps
      setSupplierId("");
      setPartId("");
      setInitialQuantity("");
      setRejectQuantity("");
      setItems([]);
      setSelectedDate(new Date().toISOString().split("T")[0]);

      // Show success alert
      setIsSubmitting(false);
      setSuccessNcrNumber(ncrNumbers.join(", "));
    }, 1500);
  };

  const isStepComplete = supplierId && selectedDate;

  // Render dropdown cards (Date & Supplier)
  const renderSelectionCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
      
      {/* Date Picker Selector */}
      <div className="relative w-full">
        {/* Styled Card display button */}
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
        {/* Invisible native input under ref control */}
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
        />
      </div>

      {/* Dropdown Supplier / Vendor */}
      <div className="relative w-full" ref={supplierRef}>
        <div
          onClick={() => setIsSupplierOpen(!isSupplierOpen)}
          className={`bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:border-slate-200 transition-all cursor-pointer flex justify-between items-center ${isSupplierOpen ? "ring-2 ring-blue-500/20 border-blue-400" : ""}`}
        >
          <div className="overflow-hidden">
            <span className="text-sm font-extrabold text-slate-800 block truncate">
              {selectedSupplier ? selectedSupplier.name : "Pilih Supplier Target"}
            </span>
            <span className="text-[10px] font-bold text-slate-405 block mt-1 uppercase tracking-wider text-slate-400">
              {selectedSupplier ? selectedSupplier.code : "Klik untuk memilih supplier"}
            </span>
          </div>
          <div className="flex items-center">
            {supplierId && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSupplierId("");
                  setPartId("");
                  setItems([]);
                  setIsSupplierOpen(false);
                }}
                className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 flex items-center justify-center transition-all border border-red-200/50 shadow-sm mr-2 hover:scale-105 shrink-0"
                title="Batal Pilihan Supplier"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            )}
            <ChevronDown size={20} className={`text-slate-400 transition-transform duration-250 ${isSupplierOpen ? "transform rotate-180 text-blue-500" : ""}`} />
          </div>
        </div>

        {isSupplierOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-205 rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto p-2 space-y-1 border-slate-200">
            {suppliers.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  setSupplierId(s.id);
                  setPartId(""); // Reset part when supplier changes
                  setItems([]); // Reset batch items when supplier changes
                  setIsSupplierOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-left text-xs font-bold transition-all ${
                  supplierId === s.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{s.name} ({s.code})</span>
                {supplierId === s.id && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
              </button>
            ))}
          </div>
        )}
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

      {/* Selectors Block */}
      {renderSelectionCards()}

      {/* Step 2 Form Details: Rendered when supplier + date are filled */}
      {isStepComplete && (
        <form onSubmit={handleFormSubmit} className="space-y-6 animate-slide-up">
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center bg-slate-50/10">
              <div className="flex items-center gap-2">
                <FileSignature size={18} className="text-blue-500" />
                <h4 className="text-sm font-black text-slate-800">Rincian Laporan Defect (NCR)</h4>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black rounded uppercase">
                Form Wajib
              </span>
            </div>

            {/* Selected Summary Info with Reset button */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div>
                  <span className="text-slate-400 block font-bold">Tanggal Defect:</span>
                  <span className="text-slate-800 font-bold mt-0.5 block">{formatDateFriendly(selectedDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Supplier Terpilih:</span>
                  <span className="text-slate-800 font-bold mt-0.5 block">{selectedSupplier?.name}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSupplierId("");
                  setPartId("");
                  setItems([]);
                }}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md font-bold transition-all border border-red-200/40 shrink-0 ml-4"
              >
                Batal Pilihan
              </button>
            </div>

            {/* Form Fields: Part / Barang Dropdown (Step 2) */}
            <div className="space-y-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Input Item Defect Baru
              </span>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Part / Barang <span className="text-red-500">*</span></label>
                <select
                  value={partId}
                  onChange={(e) => setPartId(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-bold text-slate-800"
                >
                  <option value="">-- Pilih Part / Barang --</option>
                  {filteredParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.partNumber}] {p.partName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checked vs Reject Quantities (Qty & NG) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">Qty Checked <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="initialQuantity"
                    min="1"
                    placeholder="Contoh: 1000"
                    value={initialQuantity}
                    onChange={handleQtyChange}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400/50 bg-white text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">Qty Reject NG <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="rejectQuantity"
                    min="1"
                    placeholder="Contoh: 15"
                    value={rejectQuantity}
                    onChange={handleQtyChange}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400/50 bg-white text-slate-800"
                  />
                </div>
              </div>

              {qtyError && (
                <div className="p-3.5 bg-red-50 text-red-600 rounded-md flex items-center gap-1.5 text-xs font-bold animate-pulse-ring">
                  <AlertTriangle size={16} />
                  {qtyError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!partId || !initialQuantity || !rejectQuantity || !!qtyError}
                  className={`px-4 py-2.5 rounded-md font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ${
                    !partId || !initialQuantity || !rejectQuantity || !!qtyError
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10 cursor-pointer"
                  }`}
                >
                  Tambah Data
                </button>
              </div>
            </div>

            {/* Table of Added Defect Items */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Daftar Item Defect dalam Batch ({items.length})
              </span>
              
              {items.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs font-medium bg-slate-50/20">
                  Belum ada item yang ditambahkan ke daftar. Silakan isi form di atas dan klik "Tambah Data".
                </div>
              ) : (
                <div className="border border-slate-400 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-200 border-b border-slate-600 text-slate-900 font-extrabold">
                          <th className="px-3 py-2 pl-5">Part / Barang</th>
                          <th className="px-3 py-2 text-center">Qty Checked</th>
                          <th className="px-3 py-2 text-center">Qty Reject NG</th>
                          <th className="px-3 py-2 text-center">Defect Rate</th>
                          <th className="px-3 py-2 pr-5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 font-semibold text-slate-700">
                        {items.map((item) => {
                          const rate = ((item.reject / item.qty) * 100).toFixed(1);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-1.5 pl-5">
                                <span className="font-bold text-slate-900 block">[{item.partNumber}]</span>
                                <span className="text-slate-400 text-[10px] block mt-0.5">{item.partName}</span>
                              </td>
                              <td className="px-3 py-1.5 text-center font-mono text-slate-900">{item.qty} pcs</td>
                              <td className="px-3 py-1.5 text-center font-mono text-red-600">{item.reject} pcs</td>
                              <td className="px-3 py-1.5 text-center font-mono">
                                <span className="px-2 py-0.5 bg-red-600 text-white border border-red-700 rounded text-[10px] font-bold shadow-sm">
                                  {rate}%
                                </span>
                              </td>
                              <td className="px-3 py-1.5 pr-5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 flex items-center justify-center transition-all mx-auto border border-red-200/50 shadow-sm hover:scale-105 cursor-pointer"
                                  title="Hapus dari daftar"
                                >
                                  <X size={14} strokeWidth={2.5} />
                                </button>
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

            {/* Form Actions (Merged inside Card 2) */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={!isSubmitEnabled}
                className={`w-full px-6 py-3 rounded-md font-bold text-sm shadow-md transition-all ${
                  !isSubmitEnabled
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-blue-600 hover:bg-blue-750 text-white shadow-blue-500/10 cursor-pointer"
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

