"use client";

import React, { useState, useEffect } from "react";
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
import { vendorService } from "@/services/vendorService";
import { partService } from "@/services/partService";
import { qprService, mapQprFromDb, generateNextQprNumber } from "@/services/qprService";

function PartSearchDropdown({
  value,
  onChange,
  onSelectPart,
  parts,
  placeholder = "Cari Part / Deskripsi..."
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectPart?: (part: any) => void;
  parts: any[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedPart = parts.find(p => String(p.id) === String(value));

  useEffect(() => {
    if (selectedPart) {
      setQuery(selectedPart.partName || selectedPart.partNumber || "");
    } else if (!value) {
      setQuery("");
    }
  }, [value, selectedPart]);

  const filtered = parts.filter(p =>
    (p.partName || "").toLowerCase().includes(query.toLowerCase()) ||
    (p.partNumber || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full text-left">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setIsOpen(true);
            const found = parts.find(p =>
              (p.partName || "").toLowerCase() === val.toLowerCase() ||
              (p.partNumber || "").toLowerCase() === val.toLowerCase()
            );
            if (found) {
              onChange(String(found.id));
              if (onSelectPart) onSelectPart(found);
            } else {
              onChange("");
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white cursor-pointer pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1 min-w-[320px] max-w-[460px] max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-50 divide-y divide-slate-100 font-sans text-xs">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-slate-400 italic">
                Tidak ada part ditemukan
              </div>
            ) : (
              filtered.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(String(p.id));
                    setQuery(p.partName || p.partNumber);
                    setIsOpen(false);
                    if (onSelectPart) onSelectPart(p);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 hover:bg-blue-50 transition-colors block cursor-pointer ${
                    String(p.id) === String(value) ? "bg-blue-50/80 font-bold text-blue-700" : "text-slate-800 font-bold"
                  }`}
                >
                  <div className="font-bold text-slate-900 leading-snug break-words">{p.partName}</div>
                  <div className="text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-1 mt-1">
                    <span>No: {p.partNumber}</span>
                    {p.vendorName && <span className="text-slate-400 truncate max-w-[140px] font-normal">{p.vendorName}</span>}
                    <span className="text-emerald-600 font-semibold">Std Allowance: {p.allowanceRatio ?? 0.5}%</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

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
  selectedQprForEdit?: any;
  setSelectedQprForEdit?: (qpr: any) => void;
}

export default function BuatQprView({
  pendingQprs,
  setPendingQprs,
  pendingNcrs = [],
  selectedQprForEdit = null,
  setSelectedQprForEdit = () => {}
}: BuatQprViewProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [partsBySupplier, setPartsBySupplier] = useState<Record<string, any[]>>({});
  const [allParts, setAllParts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supplierId, setSupplierId] = useState<string | "">("");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [refNcrNumber, setRefNcrNumber] = useState("");
  const [problem, setProblem] = useState("");
  const [claimType, setClaimType] = useState<string[]>([]);
  const [partRows, setPartRows] = useState<PartRow[]>([
    { id: Date.now(), partId: "", totalQty: "", qtyNg: "", stdAllowance: "0" }
  ]);
  const [previewQpr, setPreviewQpr] = useState<any>(null);
  const [attachments, setAttachments] = useState<Array<{ name: string; base64: string }>>([]);
  const [activePreviewIdx, setActivePreviewIdx] = useState<number>(0);
  const [remarks, setRemarks] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedNum, setSubmittedNum] = useState("");

  const base64ToBlobUrl = (base64Str: string): string => {
    if (!base64Str) return "";
    if (!base64Str.startsWith("data:application/pdf")) {
      return base64Str;
    }
    try {
      const parts = base64Str.split(";base64,");
      const contentType = parts[0].split(":")[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([uInt8Array], { type: contentType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error converting base64 to blob:", error);
      return base64Str;
    }
  };

  const pdfBlobUrl = React.useMemo(() => {
    const activeAttachment = attachments[activePreviewIdx];
    if (!activeAttachment || !activeAttachment.base64) return "";
    const url = base64ToBlobUrl(activeAttachment.base64);
    return `${url}#toolbar=0&navpanes=0`;
  }, [attachments, activePreviewIdx]);

  // Fetch real vendors and parts mapping on mount
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      vendorService.getAll(),
      partService.getAll().catch(() => [])
    ])
      .then(([vendorsList, partsListResponse]) => {
        if (Array.isArray(vendorsList)) {
          const mappedSuppliers = vendorsList.map((v: any) => ({
            id: v.id,
            code: v.vendorCode,
            name: v.vendorName || `Vendor ${v.vendorCode}`,
          }));
          setSuppliers(mappedSuppliers);

          const mappedPartsBySup: Record<string, any[]> = {};
          const flatParts: any[] = [];

          vendorsList.forEach((v: any) => {
            const partsList: any[] = [];
            if (v.vendorParts && Array.isArray(v.vendorParts)) {
              v.vendorParts.forEach((vp: any) => {
                if (vp.part) {
                  const partItem = {
                    id: vp.part.id,
                    partNumber: vp.part.partNumber,
                    partName: vp.part.partDesc || vp.part.partNumber,
                    allowanceRatio: vp.part.allowanceRatio !== undefined && vp.part.allowanceRatio !== null ? vp.part.allowanceRatio : 0.5,
                    vendorId: v.id,
                    vendorName: v.vendorName
                  };
                  partsList.push(partItem);
                  flatParts.push(partItem);
                }
              });
            }
            mappedPartsBySup[v.id] = partsList;
          });

          // Also merge standalone parts if any
          if (Array.isArray(partsListResponse)) {
            partsListResponse.forEach((p: any) => {
              if (!flatParts.some(fp => String(fp.id) === String(p.id))) {
                const vpVendor = p.vendorParts?.[0]?.vendor;
                const partItem = {
                  id: p.id,
                  partNumber: p.partNumber,
                  partName: p.partDesc || p.partNumber,
                  allowanceRatio: p.allowanceRatio !== undefined && p.allowanceRatio !== null ? p.allowanceRatio : 0.5,
                  vendorId: vpVendor?.id || "",
                  vendorName: vpVendor?.vendorName || ""
                };
                flatParts.push(partItem);
                if (partItem.vendorId) {
                  if (!mappedPartsBySup[partItem.vendorId]) mappedPartsBySup[partItem.vendorId] = [];
                  mappedPartsBySup[partItem.vendorId].push(partItem);
                }
              }
            });
          }

          setPartsBySupplier(mappedPartsBySup);
          setAllParts(flatParts);
        }
      })
      .catch((err) => {
        console.error("Failed to load vendors & parts:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Load selectedQprForEdit details if present on mount/change
  React.useEffect(() => {
    if (selectedQprForEdit && suppliers.length > 0) {
      const matchedSupplier = suppliers.find(
        s => s.name.toLowerCase() === (selectedQprForEdit.supplierName || "").toLowerCase()
      );
      if (matchedSupplier) {
        setSupplierId(matchedSupplier.id);
        setSupplierSearchQuery(matchedSupplier.name);
        
        const supParts = partsBySupplier[matchedSupplier.id] || [];
        if (selectedQprForEdit.parts && selectedQprForEdit.parts.length > 0) {
          const rows = selectedQprForEdit.parts.map((p: any, idx: number) => {
            const matchedPart = supParts.find(
              sp => sp.partName.toLowerCase() === p.partName.toLowerCase()
            );
            return {
              id: Date.now() + idx,
              partId: matchedPart ? String(matchedPart.id) : "",
              totalQty: String(p.totalQty || 1000),
              qtyNg: String(p.qtyNG !== undefined ? p.qtyNG : (p.qtyNg || 30)),
              stdAllowance: String(p.stdAllowance || 5)
            };
          });
          setPartRows(rows);
        }
      }

      // Convert period from "Mei 2026" / "Juni 2026" text to "2026-05" format for <input type="month">
      const rawPeriod = selectedQprForEdit.period || "";
      let convertedPeriod = rawPeriod;
      const monthNamesIndo = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const periodMatch = rawPeriod.match(/^(\w+)\s+(\d{4})$/);
      if (periodMatch) {
        const monthIdx = monthNamesIndo.findIndex(
          m => m.toLowerCase() === periodMatch[1].toLowerCase()
        );
        if (monthIdx !== -1) {
          convertedPeriod = `${periodMatch[2]}-${String(monthIdx + 1).padStart(2, "0")}`;
        }
      }
      // Also handle if already in YYYY-MM format
      if (/^\d{4}-\d{2}$/.test(rawPeriod)) {
        convertedPeriod = rawPeriod;
      }
      setPeriod(convertedPeriod);

      setDate(selectedQprForEdit.date || new Date().toISOString().split("T")[0]);
      setRefNcrNumber(selectedQprForEdit.refNcrNumber || "");
      setProblem(selectedQprForEdit.problem || "");
      setClaimType(Array.isArray(selectedQprForEdit.claimType) ? selectedQprForEdit.claimType : []);
      setRemarks(selectedQprForEdit.remarks || "");
      if (selectedQprForEdit.pdfFileBase64) {
        try {
          if (selectedQprForEdit.pdfFileBase64.startsWith("[")) {
            setAttachments(JSON.parse(selectedQprForEdit.pdfFileBase64));
          } else {
            setAttachments([{
              name: selectedQprForEdit.pdfFileName || "revision_attachment.pdf",
              base64: selectedQprForEdit.pdfFileBase64
            }]);
          }
        } catch (e) {
          setAttachments([{
            name: selectedQprForEdit.pdfFileName || "revision_attachment.pdf",
            base64: selectedQprForEdit.pdfFileBase64
          }]);
        }
      } else {
        setAttachments([]);
      }
      setActivePreviewIdx(0);
    }
  }, [selectedQprForEdit, suppliers, partsBySupplier]);

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
      setSupplierSearchQuery(matchedSupplier.name);
      const supParts = partsBySupplier[matchedSupplier.id] || [];

      if (ncr.partsDetail && ncr.partsDetail.length > 0) {
        const rows = ncr.partsDetail.map((p: any, index: number) => {
          const matchedPart = supParts.find(
            sp => sp.partNumber === p.partNumber || sp.partName.toLowerCase() === p.partName.toLowerCase()
          );
          const ratio = matchedPart?.allowanceRatio !== undefined && matchedPart?.allowanceRatio !== null ? matchedPart.allowanceRatio : 0.5;
          return {
            id: Date.now() + index,
            partId: matchedPart ? String(matchedPart.id) : "",
            totalQty: String(p.qtyNG * 20 || 10000), // Default total Qty matching standard delivery sizing
            qtyNg: String(p.qtyNG || 0),
            stdAllowance: String(Math.round((p.qtyNG * 20 || 10000) * (ratio / 100)))
          };
        });
        setPartRows(rows);
      } else {
        const matchedPart = supParts.find(
          p => p.partNumber === ncr.partNumber || p.partName.toLowerCase() === (ncr.partName || "").toLowerCase()
        );
        const ratio = matchedPart?.allowanceRatio !== undefined && matchedPart?.allowanceRatio !== null ? matchedPart.allowanceRatio : 0.5;
        setPartRows([{
          id: Date.now(),
          partId: matchedPart ? String(matchedPart.id) : "",
          totalQty: String(ncr.qty * 20 || 10000),
          qtyNg: String(ncr.reject || ncr.qty || 0),
          stdAllowance: String(Math.round((ncr.qty * 20 || 10000) * (ratio / 100)))
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
  const availableParts = (supplierId ? partsBySupplier[supplierId] : allParts) || [];
  const partsListForSelection = availableParts.length > 0 ? availableParts : allParts;

  const getPartsForRow = (rowId: number) => {
    return partsListForSelection.filter(
      p => !partRows.some(r => r.id !== rowId && String(r.partId) === String(p.id))
    );
  };

  const updateRow = (id: number, field: keyof PartRow, value: string) => {
    setPartRows(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value };
        if (field === "totalQty" || field === "partId") {
          const qty = parseInt(updated.totalQty) || 0;
          const matchedPart = partsListForSelection.find(p => String(p.id) === String(updated.partId));
          const ratio = matchedPart?.allowanceRatio !== undefined && matchedPart?.allowanceRatio !== null ? matchedPart.allowanceRatio : 0.5;
          updated.stdAllowance = String(Math.round(qty * (ratio / 100)));
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
  const totalStdAllowance = partRows.reduce((acc, r) => acc + (parseInt(r.stdAllowance) || 0), 0);
  const billableQty = partRows.reduce((acc, r) => {
    const ng = parseInt(r.qtyNg) || 0;
    const std = parseInt(r.stdAllowance) || 0;
    return acc + Math.max(0, ng - std);
  }, 0);

  const claimTypeOptions = [
    "MATERIAL", "PROSES PACKING", "PROSES CHECK",
    "PAINTING/PLATING", "PARKEREZING", "HEAT TREATMENT",
    "PROSES FORGING", "PROSES M/C", "OTHERS"
  ];

  const getMissingFields = (isSubmit: boolean = false) => {
    const missing = [];
    if (!supplierId) missing.push("Supplier / Vendor");
    if (!period) missing.push("Periode Klaim");
    if (!date) missing.push("Tanggal Dokumen");
    if (!refNcrNumber) missing.push("Ref. No NCR");
    if (!problem) missing.push("Problem / Defect");
    if (attachments.length === 0) missing.push("Upload PDF Lampiran");
    
    if (isSubmit) {
      const partsIncomplete = partRows.some(r => !r.partId || !r.totalQty || !r.qtyNg);
      if (partsIncomplete) {
        missing.push("Data Part (Part ID, Qty Kirim, atau Qty NG belum terisi)");
      }
    }
    
    return missing.join(", ");
  };

  const handleSubmit = () => {
    const hasNgExceeded = partRows.some(r => {
      const qty = parseInt(r.totalQty) || 0;
      const ng = parseInt(r.qtyNg) || 0;
      return qty > 0 && ng > qty;
    });

    if (hasNgExceeded) {
      alert("Peringatan: Qty NG tidak boleh melebihi Total Qty. Harap periksa kembali.");
      return;
    }

    if (!supplierId || !period || !date || !refNcrNumber || !problem || attachments.length === 0 || partRows.some(r => !r.partId || !r.totalQty || !r.qtyNg)) {
      const missingList = getMissingFields(true);
      alert(`Harap lengkapi field wajib berikut terlebih dahulu: ${missingList}.`);
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
    const qprPartsPayload = partRows.map((row) => {
      const totalVal = parseInt(row.totalQty) || 0;
      const ngVal = parseInt(row.qtyNg) || 0;
      const stdVal = parseInt(row.stdAllowance) || 0;
      const qtyClaim = Math.max(0, ngVal - stdVal);
      const price = partPrices[row.partId] || 50000;
      calculatedClaimVal += qtyClaim * price;

      return {
        partId: row.partId,
        totalQty: totalVal,
        qtyNg: ngVal,
        stdAllowance: stdVal,
        qtyClaim,
        unitPrice: price,
        taxRate: 0.11
      };
    });

    const qprNum = selectedQprForEdit 
      ? selectedQprForEdit.qprNumber 
      : generateNextQprNumber(pendingQprs || [], date);

    const payload = {
      qprNumber: qprNum,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      vendorId: supplierId,
      status: "WAITING_APPROVAL",
      requiredRole: "Section Head",
      refNcrNumber,
      problem,
      claimType: Array.isArray(claimType) ? claimType.join(", ") : claimType,
      totalQty: totalQty,
      totalQtyNg: totalQtyNg,
      totalStdAllowance: totalStdAllowance,
      billableQty: billableQty,
      claimAmount: calculatedClaimVal,
      pdfFileName: attachments.map(a => a.name).join(", "),
      pdfFileBase64: JSON.stringify(attachments),
      qprParts: qprPartsPayload
    };

    const savePromise = selectedQprForEdit
      ? qprService.update(selectedQprForEdit.id, payload)
      : qprService.create(payload);

    savePromise
      .then(() => {
        if (setPendingQprs) {
          qprService.getAll().then((data) => {
            if (Array.isArray(data)) {
              setPendingQprs(data.map((q: any) => mapQprFromDb(q)));
            }
          });
        }
      })
      .catch((err) => {
        console.error("Failed to save QPR to database:", err);
        alert(`Gagal menyimpan QPR ke database: ${err.message || err}`);
      });

    // Clear sessionStorage revision data
    if (typeof window !== "undefined") {
      try { sessionStorage.removeItem("selectedQprForEdit"); } catch {}
    }
    setSelectedQprForEdit(null);
    setSubmittedNum(qprNum);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSupplierId("");
    setSupplierSearchQuery("");
    setIsSupplierDropdownOpen(false);
    setPeriod("");
    setDate(new Date().toISOString().split("T")[0]);
    setRefNcrNumber("");
    setProblem("");
    setClaimType([]);
    setRemarks("");
    setPartRows([{ id: Date.now(), partId: "", totalQty: "", qtyNg: "", stdAllowance: "0" }]);
    setAttachments([]);
    setActivePreviewIdx(0);
    setSubmitted(false);
    setSubmittedNum("");
    // Clear sessionStorage revision data
    if (typeof window !== "undefined") {
      try { sessionStorage.removeItem("selectedQprForEdit"); } catch {}
    }
    if (setSelectedQprForEdit) setSelectedQprForEdit(null);
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
            <h3 className="text-base font-black uppercase tracking-wider">
              {selectedQprForEdit ? "Revisi / Edit Dokumen QPR" : "Pengisian Form QPR"}
            </h3>
          </div>
        </div>
        {selectedQprForEdit && (
          <button
            type="button"
            onClick={() => {
              setSelectedQprForEdit(null);
              handleReset();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-lg shadow-sm border border-red-500 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            ✕ Kosongkan & Batalkan Revisi
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Main Form */}
        <div className="lg:col-span-2 space-y-5">

          {/* NCR Slide-Down Panel (Hidden) */}

          {/* Section 1: Header Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              1. Informasi Dasar QPR
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Supplier */}
              <div className="space-y-1.5 relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Supplier / Vendor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={supplierSearchQuery}
                    onChange={e => {
                      const val = e.target.value;
                      setSupplierSearchQuery(val);
                      setIsSupplierDropdownOpen(true);
                      // Reset selection if input is modified
                      const found = suppliers.find(s => s.name.toLowerCase() === val.toLowerCase());
                      if (found) {
                        setSupplierId(found.id);
                        setPartRows([{ id: Date.now(), partId: "", totalQty: "", qtyNg: "", stdAllowance: "0" }]);
                      } else {
                        setSupplierId("");
                      }
                    }}
                    onFocus={() => setIsSupplierDropdownOpen(true)}
                    placeholder="Cari Supplier / Vendor..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white cursor-pointer pr-8"
                  />
                  {supplierSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSupplierId("");
                        setSupplierSearchQuery("");
                        setIsSupplierDropdownOpen(false);
                        setPartRows([{ id: Date.now(), partId: "", totalQty: "", qtyNg: "", stdAllowance: "0" }]);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {isSupplierDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSupplierDropdownOpen(false)} 
                    />
                    <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-50 divide-y divide-slate-100 font-sans text-xs">
                      {(() => {
                        const filtered = suppliers.filter(s =>
                          s.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())
                        );
                        if (filtered.length === 0) {
                          return (
                            <div className="p-3 text-center text-slate-400 italic">
                              Tidak ada supplier ditemukan
                            </div>
                          );
                        }
                        return filtered.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSupplierId(s.id);
                              setSupplierSearchQuery(s.name);
                              setIsSupplierDropdownOpen(false);
                              setPartRows([{ id: Date.now(), partId: "", totalQty: "", qtyNg: "", stdAllowance: "0" }]);
                            }}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 transition-colors text-slate-800 font-bold block"
                          >
                            {s.name}
                          </button>
                        ));
                      })()}
                    </div>
                  </>
                )}
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
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
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
                  Ref. No NCR <span className="text-red-500">*</span>
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
                  Problem / Defect <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={problem}
                  onChange={e => setProblem(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white"
                />
              </div>

              {/* Upload Lampiran (PDF / Foto / JPEG / PNG) */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Upload File Lampiran (PDF, Foto / JPG / PNG) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm">
                    <FileText size={14} />
                    Pilih File PDF / Foto
                    <input
                      type="file"
                      accept="application/pdf,image/*,.png,.jpg,.jpeg,.webp"
                      multiple
                      onChange={e => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        
                        const invalidFiles = files.filter(f => !f.type.startsWith("image/") && f.type !== "application/pdf" && !/\.(pdf|png|jpg|jpeg|webp)$/i.test(f.name));
                        if (invalidFiles.length > 0) {
                          alert("Hanya diperbolehkan mengupload file PDF, JPEG, JPG, atau PNG!");
                          return;
                        }

                        let loadedCount = 0;
                        const newAttachments: Array<{ name: string; base64: string }> = [];

                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            newAttachments.push({ name: file.name, base64 });
                            loadedCount++;
                            if (loadedCount === files.length) {
                              setAttachments(prev => {
                                const updated = [...prev, ...newAttachments];
                                setActivePreviewIdx(updated.length - files.length);
                                return updated;
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                        
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((file, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePreviewIdx(idx)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activePreviewIdx === idx
                            ? "bg-blue-50 border border-blue-300 text-blue-700 shadow-sm"
                            : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <FileText size={12} className={activePreviewIdx === idx ? "text-blue-600" : "text-slate-400"} />
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttachments(prev => {
                              const filtered = prev.filter((_, i) => i !== idx);
                              if (activePreviewIdx >= filtered.length) {
                                setActivePreviewIdx(Math.max(0, filtered.length - 1));
                              }
                              return filtered;
                            });
                          }}
                          className="text-red-500 hover:text-red-750 font-bold ml-1 cursor-pointer"
                          title="Hapus file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {attachments.length > 0 && attachments[activePreviewIdx] && (
                  <div className="w-full h-[250px] bg-slate-50 border border-slate-250 rounded-lg overflow-hidden relative shadow-inner mt-3 flex items-center justify-center">
                    <div className="absolute top-2 right-2 z-10 bg-slate-900/60 text-white text-[9px] font-black px-2 py-1 rounded backdrop-blur-[1.5px] uppercase tracking-wider select-none">
                      Preview File: {attachments[activePreviewIdx].name}
                    </div>
                    {attachments[activePreviewIdx].base64.startsWith("data:image/") || /\.(png|jpg|jpeg|webp)$/i.test(attachments[activePreviewIdx].name) ? (
                      <img
                        src={attachments[activePreviewIdx].base64}
                        alt={attachments[activePreviewIdx].name}
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    ) : (
                      <iframe
                        src={pdfBlobUrl}
                        className="w-full h-full border-0"
                        title="Direct Upload Preview"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Remarks / Catatan Tambahan
                </label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Masukkan remarks/catatan tambahan untuk QPR di sini..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white placeholder-slate-400"
                />
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
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <Plus size={11} /> Tambah Part
              </button>
            </div>

            <div className="w-full overflow-visible">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider text-center">
                    <th className="border border-slate-300 px-3 py-2 text-left min-w-[200px]">Part Name / Deskripsi</th>
                    <th className="border border-slate-300 px-2 py-2 w-24">Total Qty (pcs)</th>
                    <th className="border border-slate-300 px-2 py-2 w-24">Qty NG (pcs)</th>
                    <th className="border border-slate-300 px-2 py-2 w-24">NG Actual (%)</th>
                    <th className="border border-slate-300 px-2 py-2 w-24">Std Allowance 0.5% (pcs)</th>
                    <th className="border border-slate-300 px-2 py-2 w-24">Qty Claim (pcs)</th>
                    {partRows.length > 1 && <th className="border border-slate-300 px-2 py-2 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {partRows.map(row => {
                    const qty = parseInt(row.totalQty) || 0;
                    const ng = parseInt(row.qtyNg) || 0;
                    const std = Math.round(qty * 0.005);
                    const claim = Math.max(0, ng - std);
                    const ngActual = qty > 0 ? ((ng / qty) * 100).toFixed(2) : "0.00";
                    const isNgExceeded = qty > 0 && ng > qty;
                    return (
                      <tr key={row.id} className="border border-slate-300 hover:bg-slate-50/50 transition-colors">
                        <td className="border border-slate-300 px-2 py-1.5 min-w-[220px]">
                          <PartSearchDropdown
                            value={row.partId}
                            onChange={(val) => updateRow(row.id, "partId", val)}
                            onSelectPart={(selectedP) => {
                              if (!supplierId && selectedP.vendorId) {
                                setSupplierId(selectedP.vendorId);
                                setSupplierSearchQuery(selectedP.vendorName || "");
                              }
                              const ratio = selectedP.allowanceRatio !== undefined && selectedP.allowanceRatio !== null ? selectedP.allowanceRatio : 0.5;
                              const rowTotal = parseInt(row.totalQty) || 0;
                              if (rowTotal > 0) {
                                updateRow(row.id, "stdAllowance", String(Math.round(rowTotal * (ratio / 100))));
                              }
                            }}
                            parts={partsListForSelection}
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={row.totalQty}
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              updateRow(row.id, "totalQty", val);
                            }}
                            placeholder="0"
                            className="w-full text-xs border-0 bg-transparent focus:ring-0 text-slate-800 font-semibold text-center"
                          />
                        </td>
                        <td className={`border border-slate-300 px-2 py-1.5 transition-colors ${isNgExceeded ? 'bg-red-50' : ''}`}>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={row.qtyNg}
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              updateRow(row.id, "qtyNg", val);
                            }}
                            placeholder="0"
                            className={`w-full text-xs border-0 bg-transparent focus:ring-0 font-bold text-center ${
                              isNgExceeded ? 'text-red-700 font-extrabold focus:outline-none' : 'text-red-600'
                            }`}
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
                        {partRows.length > 1 && (
                          <td className="border border-slate-300 px-1 py-1.5 text-center">
                            <button
                              onClick={() => removeRow(row.id)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </td>
                        )}
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
                    {partRows.length > 1 && <td className="border border-slate-300"></td>}
                  </tr>
                </tbody>
              </table>
            </div>
            {partRows.some(r => {
              const qty = parseInt(r.totalQty) || 0;
              const ng = parseInt(r.qtyNg) || 0;
              return qty > 0 && ng > qty;
            }) && (
              <div className="flex items-center gap-2 text-red-700 text-[11px] font-bold bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <AlertTriangle size={14} className="shrink-0 text-red-650" />
                <span>Peringatan: Qty NG tidak boleh melebihi Total Qty. Harap periksa kembali.</span>
              </div>
            )}
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
                const hasNgExceeded = partRows.some(r => {
                  const qty = parseInt(r.totalQty) || 0;
                  const ng = parseInt(r.qtyNg) || 0;
                  return qty > 0 && ng > qty;
                });
                if (hasNgExceeded) {
                  alert("Peringatan: Qty NG tidak boleh melebihi Total Qty. Harap periksa kembali.");
                  return;
                }
                if (!supplierId || !period || !date || !refNcrNumber || !problem || attachments.length === 0) {
                  const missingList = getMissingFields(false);
                  alert(`Harap lengkapi field wajib berikut terlebih dahulu: ${missingList}.`);
                  return;
                }
                setPreviewQpr({
                  qprNumber: selectedQprForEdit?.qprNumber || generateNextQprNumber(pendingQprs || [], date),
                  supplierName: selectedSupplier?.name || "",
                  partName: (() => {
                    const validRows = partRows.filter(r => r.partId);
                    if (validRows.length > 1) return "All Type";
                    const firstRow = validRows[0];
                    if (firstRow && firstRow.partId) {
                      const matched = availableParts.find(p => String(p.id) === String(firstRow.partId));
                      return matched ? matched.partName : "ALL TYPE PART FINISH";
                    }
                    return "All Type";
                  })(),
                  partNumber: (() => {
                    const validRows = partRows.filter(r => r.partId);
                    const firstRow = validRows[0];
                    if (firstRow && firstRow.partId) {
                      const matched = availableParts.find(p => String(p.id) === String(firstRow.partId));
                      return matched ? matched.partNumber : "-";
                    }
                    return "-";
                  })(),
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
                    const stdVal = parseInt(row.stdAllowance) || 0;
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
                  claimType,
                  remarks,
                  pdfFileName: attachments.map(a => a.name).join(", "),
                  pdfFileBase64: JSON.stringify(attachments),
                  pdfFiles: attachments
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
          qpr={{ ...previewQpr, vendorClaimCount: (() => {
            const name = previewQpr.supplierName;
            const existingCount = (pendingQprs || []).filter((q: any) => q.supplierName === name).length;
            return existingCount + 1;
          })() }}
          onClose={() => setPreviewQpr(null)}
        />
      )}
    </div>
  );
}
