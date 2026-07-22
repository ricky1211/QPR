"use client";

import React, { useState } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from "lucide-react";
import QprPrintPreview from "./QprPrintPreview";

const suppliers = [
  { id: 1, name: "PT JAYADI", code: "SPL-JAY" },
  { id: 2, name: "PT IKAN BAKAR", code: "SPL-IBK" },
  { id: 3, name: "SHIJIAZHUANG RUICHENG TRADE CO., LTD", code: "SPL-SRC" }
];

const partsBySupplier: Record<number, { id: number; partNumber: string; partName: string }[]> = {
  1: [
    { id: 1, partNumber: "MB-001", partName: "Motherboard X1" },
    { id: 2, partNumber: "GL-001", partName: "Gelas Kaca" },
    { id: 5, partNumber: "KB-004", partName: "Keyboard Mechanical" }
  ],
  2: [
    { id: 3, partNumber: "HD-002", partName: "Harddisk 1TB" },
    { id: 4, partNumber: "CP-003", partName: "CPU Fan Cooler" }
  ],
  3: [
    { id: 6, partNumber: "CR-001", partName: "CONE RACE ALL TYPE" }
  ]
};

interface PartRow {
  id: number;
  partId: string;
  totalQty: string;
  qtyNg: string;
  stdAllowance: string;
}

interface BuatQprViewProps {
  pendingQprs?: any[];
  setPendingQprs?: React.Dispatch<React.SetStateAction<any[]>>;
  pendingNcrs?: any[];
}

export default function BuatQprView({ pendingQprs, setPendingQprs, pendingNcrs = [] }: BuatQprViewProps) {
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [period, setPeriod] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [refNcrNumber, setRefNcrNumber] = useState("");
  const [problem, setProblem] = useState("VISUAL NG");
  const [claimType, setClaimType] = useState<string[]>(["PROSES PACKING", "PROSES CHECK"]);
  const [partRows, setPartRows] = useState<PartRow[]>([
    { id: Date.now(), partId: "", totalQty: "", qtyNg: "", stdAllowance: "0" }
  ]);
  const [previewQpr, setPreviewQpr] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedNum, setSubmittedNum] = useState("");

  // NCR slide-down panel state
  const [ncrPanelOpen, setNcrPanelOpen] = useState(false);
  const [selectedNcrId, setSelectedNcrId] = useState<number | null>(null);

  // Filter approved/closed NCRs
  const approvedNcrs = (pendingNcrs || []).filter(n => {
    return n.status === "APPROVED" || n.status === "CLOSED";
  });

  // Group NCRs by Vendor -> Part
  const groupedNcrs = React.useMemo(() => {
    const groups: Record<string, Record<string, any[]>> = {};

    approvedNcrs.forEach(ncr => {
      const vendor = ncr.supplierName || "Unknown Vendor";
      const partKey = `${ncr.partName || "Unknown Part"} (${ncr.partNumber || "-"})`;

      if (!groups[vendor]) {
        groups[vendor] = {};
      }
      if (!groups[vendor][partKey]) {
        groups[vendor][partKey] = [];
      }
      groups[vendor][partKey].push(ncr);
    });

    return groups;
  }, [approvedNcrs]);

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Auto-fill form from selected NCR
  const handleSelectNcr = (ncr: any) => {
    setSelectedNcrId(ncr.id);
    // Find matching supplier
    const matchedSupplier = suppliers.find(
      s => s.name.toLowerCase() === (ncr.supplierName || "").toLowerCase()
    );
    if (matchedSupplier) {
      setSupplierId(matchedSupplier.id);
      const supParts = partsBySupplier[matchedSupplier.id] || [];

      if (ncr.partsDetail && ncr.partsDetail.length > 0) {
        const rows = ncr.partsDetail.map((p: any, index: number) => {
          const matchedPart = supParts.find(
            sp => sp.partNumber === p.partNumber || sp.partName.toLowerCase() === p.partName.toLowerCase()
          );
          return {
            id: Date.now() + index,
            partId: matchedPart ? String(matchedPart.id) : "",
            totalQty: String(p.qtyNG * 20 || 10000), // Default total Qty matching standard delivery sizing
            qtyNg: String(p.qtyNG || 0),
            stdAllowance: String(Math.round((p.qtyNG * 20 || 10000) * 0.005))
          };
        });
        setPartRows(rows);
      } else {
        const matchedPart = supParts.find(
          p => p.partNumber === ncr.partNumber || p.partName.toLowerCase() === (ncr.partName || "").toLowerCase()
        );
        setPartRows([{
          id: Date.now(),
          partId: matchedPart ? String(matchedPart.id) : "",
          totalQty: String(ncr.qty * 20 || 10000),
          qtyNg: String(ncr.reject || ncr.qty || 0),
          stdAllowance: String(Math.round((ncr.qty * 20 || 10000) * 0.005))
        }]);
      }
    }
    setRefNcrNumber(ncr.ncrNumber || "");
    // Auto-set period from NCR date (month name)
    if (ncr.date) {
      const d = new Date(ncr.date);
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      setPeriod(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }
    setNcrPanelOpen(false);
  };

  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const availableParts = supplierId ? (partsBySupplier[supplierId] || []) : [];

  const getPartsForRow = (rowId: number) => {
    return availableParts.filter(
      p => !partRows.some(r => r.id !== rowId && String(r.partId) === String(p.id))
    );
  };

  const updateRow = (id: number, field: keyof PartRow, value: string) => {
    setPartRows(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value };
        if (field === "totalQty") {
          const qty = parseInt(value) || 0;
          updated.stdAllowance = String(Math.round(qty * 0.005));
        }
        return updated;
      }
      return r;
    }));
  };

  const addRow = () => {
    setPartRows(prev => [...prev, { id: Date.now(), partId: "", totalQty: "", qtyNg: "", stdAllowance: "0" }]);
  };

  const removeRow = (id: number) => {
    if (partRows.length > 1) setPartRows(prev => prev.filter(r => r.id !== id));
  };

  const totalQtyNg = partRows.reduce((acc, r) => acc + (parseInt(r.qtyNg) || 0), 0);
  const totalQty = partRows.reduce((acc, r) => acc + (parseInt(r.totalQty) || 0), 0);
  const totalStdAllowance = partRows.reduce((acc, r) => acc + Math.round((parseInt(r.totalQty) || 0) * 0.005), 0);
  const billableQty = totalQtyNg - totalStdAllowance;

  const claimTypeOptions = [
    "MATERIAL", "PROSES PACKING", "PROSES CHECK",
    "PAINTING/PLATING", "PARKEREZING", "HEAT TREATMENT"
  ];

  const handleSubmit = () => {
    if (!supplierId || !period || !date || partRows.some(r => !r.partId || !r.totalQty || !r.qtyNg)) {
      alert("Harap lengkapi semua field wajib (Supplier, Periode, Tanggal, dan data Part).");
      return;
    }

    // Part price map
    const partPrices: Record<string, number> = {
      "1": 250000, // MB-001
      "2": 25000,  // GL-001
      "3": 300000, // HD-002
      "4": 120000, // CP-003
      "5": 150000, // KB-004
      "6": 80000   // CR-001
    };

    let calculatedClaimVal = 0;
    const partsData = partRows.map((row, idx) => {
      const matchedPart = availableParts.find(p => String(p.id) === String(row.partId));
      const totalVal = parseInt(row.totalQty) || 0;
      const ngVal = parseInt(row.qtyNg) || 0;
      const stdVal = Math.round(totalVal * 0.005);
      const qtyClaim = Math.max(0, ngVal - stdVal);
      const price = partPrices[row.partId] || 50000;
      calculatedClaimVal += qtyClaim * price;

      return {
        no: idx + 1,
        partName: matchedPart ? matchedPart.partName : "ALL TYPE PART FINISH",
        totalQty: totalVal,
        qtyNG: ngVal,
        ngActual: totalVal > 0 ? (ngVal / totalVal) * 100 : 0.0,
        stdAllowance: stdVal,
        qtyClaim
      };
    });

    const qprNum = `QPR/${date.slice(0, 7).replace("-", "/")}/${selectedSupplier?.name.replace("PT ", "").replace(/ /g, "_").toUpperCase()}`;
    const newQpr = {
      id: Date.now(),
      qprNumber: qprNum,
      date,
      supplierName: selectedSupplier?.name,
      period,
      totalItems: totalQty,
      rejectItems: totalQtyNg,
      allowanceRatio: `${((totalStdAllowance / (totalQty || 1)) * 100).toFixed(1)}%`,
      claimAmount: `Rp ${calculatedClaimVal.toLocaleString("id-ID")}`,
      status: "WAITING_APPROVAL",
      requiredRole: "Section Head",
      parts: partsData,
      refNcrNumber,
      problem,
      claimType,
      pdfFileName: pdfFile ? pdfFile.name : null
    };

    if (setPendingQprs) {
      setPendingQprs((prev: any[]) => [newQpr, ...prev]);
    }
    setSubmittedNum(qprNum);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSupplierId("");
    setPeriod("");
    setDate(new Date().toISOString().split("T")[0]);
    setRefNcrNumber("");
    setProblem("VISUAL NG");
    setClaimType(["PROSES PACKING", "PROSES CHECK"]);
    setPartRows([{ id: Date.now(), partId: "", totalQty: "", qtyNg: "", stdAllowance: "0" }]);
    setPdfFile(null);
    setSubmitted(false);
    setSubmittedNum("");
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-wider">QPR Berhasil Disubmit!</h3>
            <p className="text-xs text-slate-500 font-semibold mt-2">
              Dokumen QPR <span className="font-mono text-blue-700 font-bold">{submittedNum}</span> telah berhasil dibuat dan dikirim ke Section Head untuk validasi.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
            >
              Buat QPR Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white border border-indigo-900 rounded-xl shadow-md gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/10 text-white rounded-lg">
              <ClipboardList size={18} />
            </span>
            <h3 className="text-base font-black uppercase tracking-wider">Pengisian Form QPR</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Main Form */}
        <div className="lg:col-span-2 space-y-5">

          {/* NCR Slide-Down Panel */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setNcrPanelOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-blue-50/70 transition-all cursor-pointer group border-b border-slate-100"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-blue-600 transition-colors" />
                <span className="text-[11px] font-black text-slate-800 group-hover:text-blue-700 uppercase tracking-wider transition-colors">
                  List NCR
                </span>
                {approvedNcrs.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded-full shadow-xs">
                    {approvedNcrs.length} tersedia
                  </span>
                )}
              </div>
              {ncrPanelOpen ? <ChevronUp size={16} className="text-blue-600 transition-colors" /> : <ChevronDown size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />}
            </button>

            {ncrPanelOpen && (
              <div className="p-4 border-t border-slate-100 max-h-[400px] overflow-y-auto">
                {approvedNcrs.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <FileText size={28} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">Belum ada NCR yang fully approved dan melewati batas 0.5%.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Klik salah satu NCR di bawah untuk mengisi form otomatis secara detail:
                    </p>
                    {Object.entries(groupedNcrs).map(([vendor, partsGroup]) => (
                      <div key={vendor} className="border border-slate-200 rounded-xl p-3 bg-slate-55/40 space-y-3 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                          <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{vendor}</h5>
                        </div>
                        <div className="space-y-3.5 pl-1">
                          {Object.entries(partsGroup).map(([partKey, ncrsList]) => (
                            <div key={partKey} className="space-y-2">
                              <h6 className="text-[10px] font-black text-blue-700 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/50 inline-block">
                                {partKey}
                              </h6>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {ncrsList.map(ncr => {
                                  const ngRatio = (typeof ncr.reject === 'number' && typeof ncr.qty === 'number') 
                                    ? ((ncr.reject / ncr.qty) * 100).toFixed(2) 
                                    : "0.00";
                                  const isSelected = selectedNcrId === ncr.id;
                                  return (
                                    <button
                                      key={ncr.id}
                                      type="button"
                                      onClick={() => handleSelectNcr(ncr)}
                                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all cursor-pointer relative overflow-hidden group/item ${
                                        isSelected
                                          ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500'
                                          : 'border-slate-200 bg-white hover:bg-blue-50/20 hover:border-blue-300 hover:shadow-xs'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-800 font-mono group-hover/item:text-blue-700 transition-colors">
                                          {ncr.ncrNumber}
                                        </span>
                                        <span className="text-[9px] font-black text-red-650 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                          NG {ngRatio}%
                                        </span>
                                      </div>
                                      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-slate-650 font-bold">
                                        <span className="text-slate-800 font-extrabold">{formatDateIndo(ncr.date)}</span>
                                        <span>•</span>
                                        <span>{ncr.reject || 0} NG dari {ncr.qty || 0} pcs</span>
                                      </div>
                                      {ncr.defectType && (
                                        <div className="mt-1 text-[8px] text-slate-400 italic font-medium truncate">
                                          Defect: {ncr.defectType}
                                        </div>
                                      )}
                                      {isSelected && (
                                        <div className="absolute top-0 right-0 h-full w-1.5 bg-blue-600" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 1: Header Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              1. Informasi Dasar QPR
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Supplier */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Supplier / Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={e => { setSupplierId(Number(e.target.value) || ""); setPartRows([{ id: Date.now(), partId: "", totalQty: "", qtyNg: "", stdAllowance: "0" }]); }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white cursor-pointer"
                >
                  <option value="">— Pilih Supplier —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Period */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Periode Klaim <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  value={period ? `${period.split(" ")[1]}-${["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].indexOf(period.split(" ")[0]) + 1 < 10 ? "0" + (["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].indexOf(period.split(" ")[0]) + 1) : ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].indexOf(period.split(" ")[0]) + 1}` : ""}
                  onChange={e => {
                    if (!e.target.value) { setPeriod(""); return; }
                    const [yr, mo] = e.target.value.split("-");
                    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
                    setPeriod(`${months[parseInt(mo) - 1]} ${yr}`);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white cursor-pointer"
                />
              </div>

              {/* Tanggal */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Tanggal Dokumen <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white cursor-pointer"
                />
              </div>

              {/* Ref NCR */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Ref. No NCR
                </label>
                <input
                  type="text"
                  value={refNcrNumber}
                  onChange={e => setRefNcrNumber(e.target.value)}
                  placeholder="NCR/2026/06/012"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white placeholder-slate-400"
                />
              </div>

              {/* Problem */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Problem / Defect
                </label>
                <input
                  type="text"
                  value={problem}
                  onChange={e => setProblem(e.target.value)}
                  placeholder="VISUAL NG"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white"
                />
              </div>

              {/* Upload PDF */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Upload File PDF Lampiran
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm">
                    <FileText size={14} />
                    Pilih File PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== "application/pdf") {
                            alert("Hanya diperbolehkan mengupload file PDF!");
                            return;
                          }
                          setPdfFile(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {pdfFile && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                      <span className="truncate max-w-[200px]">{pdfFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setPdfFile(null)}
                        className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer"
                        title="Hapus file"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Part Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                2. Data Part & Quantity NG
              </h4>
              <button
                onClick={addRow}
                disabled={!supplierId}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
              >
                <Plus size={11} /> Tambah Part
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider text-center">
                    <th className="border border-slate-300 px-3 py-2 text-left min-w-[200px]">Part Name / Deskripsi</th>
                    <th className="border border-slate-300 px-2 py-2 w-24">Total Qty (pcs)</th>
                    <th className="border border-slate-300 px-2 py-2 w-24">Qty NG (pcs)</th>
                    <th className="border border-slate-300 px-2 py-2 w-24">NG Actual (%)</th>
                    <th className="border border-slate-300 px-2 py-2 w-24">Std Allowance 0.5% (pcs)</th>
                    <th className="border border-slate-300 px-2 py-2 w-24">Qty Claim (pcs)</th>
                    <th className="border border-slate-300 px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {partRows.map(row => {
                    const qty = parseInt(row.totalQty) || 0;
                    const ng = parseInt(row.qtyNg) || 0;
                    const std = Math.round(qty * 0.005);
                    const claim = ng - std;
                    const ngActual = qty > 0 ? ((ng / qty) * 100).toFixed(2) : "0.00";
                    return (
                      <tr key={row.id} className="border border-slate-300 hover:bg-slate-50/50 transition-colors">
                        <td className="border border-slate-300 px-2 py-1.5">
                          <select
                            value={row.partId}
                            onChange={e => updateRow(row.id, "partId", e.target.value)}
                            disabled={!supplierId}
                            className="w-full text-xs border-0 bg-transparent focus:ring-0 text-slate-800 font-semibold disabled:text-slate-400 cursor-pointer"
                          >
                            <option value="">— Pilih Part —</option>
                            {getPartsForRow(row.id).map(p => (
                              <option key={p.id} value={p.id}>{p.partName} ({p.partNumber})</option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5">
                          <input
                            type="number"
                            value={row.totalQty}
                            onChange={e => updateRow(row.id, "totalQty", e.target.value)}
                            placeholder="0"
                            min="0"
                            className="w-full text-xs border-0 bg-transparent focus:ring-0 text-slate-800 font-semibold text-center"
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5">
                          <input
                            type="number"
                            value={row.qtyNg}
                            onChange={e => updateRow(row.id, "qtyNg", e.target.value)}
                            placeholder="0"
                            min="0"
                            className="w-full text-xs border-0 bg-transparent focus:ring-0 text-red-600 font-bold text-center"
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-700 bg-slate-50/20">
                          {ngActual}%
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-700 bg-slate-50/20">
                          {std.toLocaleString("id-ID")}
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-emerald-700">
                          {claim.toLocaleString("id-ID")}
                        </td>
                        <td className="border border-slate-300 px-1 py-1.5 text-center">
                          {partRows.length > 1 && (
                            <button
                              onClick={() => removeRow(row.id)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-bold text-center text-xs border border-slate-300">
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-600 text-left font-black">TOTAL</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-800">{totalQty.toLocaleString("id-ID")}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-red-600 font-black">{totalQtyNg.toLocaleString("id-ID")}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-700 bg-slate-50">{totalQty > 0 ? ((totalQtyNg / totalQty) * 100).toFixed(2) : "0.00"}%</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-700">{totalStdAllowance.toLocaleString("id-ID")}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-emerald-700 font-black">{billableQty.toLocaleString("id-ID")}</td>
                    <td className="border border-slate-300"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Jenis Claim */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              3. Jenis Claim
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {claimTypeOptions.map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={claimType.includes(opt)}
                    onChange={e => {
                      if (e.target.checked) setClaimType(prev => [...prev, opt]);
                      else setClaimType(prev => prev.filter(c => c !== opt));
                    }}
                    className="w-3.5 h-3.5 border border-slate-300 rounded text-blue-600 cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">{opt}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT: Calculation + Summary */}
        <div className="space-y-5">

          {/* Claim Quality Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Ringkasan Kuantitas Klaim
            </h4>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Total Qty Kirim:</span>
                <span className="font-bold text-slate-800">{totalQty.toLocaleString("id-ID")} pcs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Total Qty NG:</span>
                <span className="font-bold text-red-650">{totalQtyNg.toLocaleString("id-ID")} pcs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Std Allowance Qty:</span>
                <span className="font-bold text-slate-800">{totalStdAllowance.toLocaleString("id-ID")} pcs</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-1">
                <span className="font-black text-slate-800">TOTAL KLAIM (NET):</span>
                <span className="font-black text-emerald-700 text-base">{billableQty.toLocaleString("id-ID")} pcs</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-150 rounded-lg text-blue-800 text-[10px] leading-normal font-medium">
              Info: Penginputan nominal denda keuangan akan dieksekusi secara terpisah oleh Divisi Accounting saat penerbitan Confirmation Letter.
            </div>
          </div>


          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => {
                if (!supplierId || !period || !date) {
                  alert("Harap isi Supplier, Periode, dan Tanggal terlebih dahulu untuk preview.");
                  return;
                }
                setPreviewQpr({
                  qprNumber: `QPR/${date.slice(0,7).replace("-","/")}/${selectedSupplier?.name.replace("PT ","").replace(/ /g,"_").toUpperCase()}`,
                  supplierName: selectedSupplier?.name || "",
                  period,
                  date,
                  totalItems: totalQty,
                  rejectItems: totalQtyNg,
                  allowanceRatio: `${((totalStdAllowance / (totalQty || 1)) * 100).toFixed(1)}%`,
                  claimAmount: "-",
                  requiredRole: "Section Head",
                  status: "WAITING_APPROVAL",
                  parts: partRows.map((row, idx) => {
                    const matchedPart = availableParts.find(p => String(p.id) === String(row.partId));
                    const totalVal = parseInt(row.totalQty) || 0;
                    const ngVal = parseInt(row.qtyNg) || 0;
                    const stdVal = Math.round(totalVal * 0.005);
                    return {
                      no: idx + 1,
                      partName: matchedPart ? matchedPart.partName : "ALL TYPE PART FINISH",
                      totalQty: totalVal,
                      qtyNG: ngVal,
                      ngActual: totalVal > 0 ? (ngVal / totalVal) * 100 : 0.0,
                      stdAllowance: stdVal,
                      qtyClaim: ngVal - stdVal
                    };
                  }),
                  refNcrNumber,
                  problem,
                  claimType
                });
              }}
              className="w-full py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText size={13} />
              Preview Form QPR
            </button>
            <button
              onClick={handleSubmit}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send size={13} />
              Submit QPR ke Section Head
            </button>
          </div>
        </div>
      </div>

      {/* QPR Print Preview Modal */}
      {previewQpr && (
        <QprPrintPreview
          qpr={previewQpr}
          onClose={() => setPreviewQpr(null)}
        />
      )}
    </div>
  );
}
