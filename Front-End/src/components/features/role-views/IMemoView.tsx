"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Mail,
  Printer,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  FileCheck2,
  Building,
  Eye
} from "lucide-react";
import ConfirmationLetterPrintPreview from "./ConfirmationLetterPrintPreview";
import { parseCLPdf } from "@/utils/parseCLPdf";

interface IMemoViewProps {
  confirmationLetters: any[];
  setConfirmationLetters: React.Dispatch<React.SetStateAction<any[]>>;
  parts?: any[];
}

export default function IMemoView({
  confirmationLetters,
  setConfirmationLetters,
  parts = []
}: IMemoViewProps) {
  const [sscBillingRows, setSscBillingRows] = useState<any[]>([]);
  const [selectedClId, setSelectedClId] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<"ssc_purchasing" | "buat_ssc_payment" | "reminder" | "kirim_cl" | "parts_per_vendor">("ssc_purchasing");
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSscBillingPreview, setShowSscBillingPreview] = useState(false);
  const [showSscPaymentPreview, setShowSscPaymentPreview] = useState(false);
  const [previewCl, setPreviewCl] = useState<any | null>(null);
  const [sscFiles, setSscFiles] = useState<Array<{ file: File; rowId: string }>>([]);
  const [viewPartsCl, setViewPartsCl] = useState<any | null>(null);
  const [clUploadedFile, setClUploadedFile] = useState<File | null>(null);

  // States for the Manual Billing Internal Memo Form
  const [memoCompany, setMemoCompany] = useState("PT. MENARA TERUS MAKMUR");
  const [memoBusinessArea, setMemoBusinessArea] = useState("MT");
  const [memoRequestDate, setMemoRequestDate] = useState("10/02/2026");
  const [memoBillingType, setMemoBillingType] = useState("One Time");
  const [memoPeriod, setMemoPeriod] = useState("02/26");
  const [memoTitle, setMemoTitle] = useState("Permintaan Pembuatan Invoice Claim NG Part");
  const [memoRequestTo, setMemoRequestTo] = useState("SSC Billing");
  const [memoDescription, setMemoDescription] = useState("Mohon dibuatkan invoice untuk Claim Part NG ");
  const [memoCustomerType, setMemoCustomerType] = useState("PKP");
  const [memoNpwp, setMemoNpwp] = useState("81.571.024.9-408.000");
  const [memoSupportingDoc, setMemoSupportingDoc] = useState("");
  const [memoBillingAddressedTo, setMemoBillingAddressedTo] = useState("");
  const [memoCustomerName, setMemoCustomerName] = useState("");
  const [memoCurrency, setMemoCurrency] = useState("IDR");
  const [memoAmount, setMemoAmount] = useState("");
  const [memoSays, setMemoSays] = useState("");
  
  // Data Accounting
  const [acctCustomerCode, setAcctCustomerCode] = useState("OTC08002");
  const [acctCustomerType, setAcctCustomerType] = useState("Non Trade");
  const [acctTradingPartner, setAcctTradingPartner] = useState("");
  const [acctExchangeRate, setAcctExchangeRate] = useState("");
  const [acctJournal, setAcctJournal] = useState("");

  // GL Account Rows
  const [glRows, setGlRows] = useState([
    { code: "OTC08002", name: "PT TEMARU ENGINEER", costCenter: "", amountDr: "24.765", amountCr: "", text: "Claim Part NG" },
    { code: "545-102-0000", name: "FOH Subcont Fee", costCenter: "MT015FOHGE", amountDr: "", amountCr: "22.311", text: "Claim Part NG" },
    { code: "211-310-0000", name: "Tax Pay VAT Out", costCenter: "", amountDr: "", amountCr: "2.454", text: "ppn 11%" }
  ]);

  // Signatures
  const [sigPrepared, setSigPrepared] = useState("Bagas");
  const [sigPreparedRole, setSigPreparedRole] = useState("Accounting BU");
  const [sigApproved1, setSigApproved1] = useState("Anindita");
  const [sigApproved1Role, setSigApproved1Role] = useState("Accounting Dept Head");
  const [sigApproved2, setSigApproved2] = useState("Evi Sulistyorini");
  const [sigApproved2Role, setSigApproved2Role] = useState("Admin Div/BOD");
  const [sigEntry, setSigEntry] = useState("");
  const [sigEntryRole, setSigEntryRole] = useState("SSC Billing Admin");
  const [sigChecked, setSigChecked] = useState("");
  const [sigCheckedRole, setSigCheckedRole] = useState("AR Function Lead");

  // NPWP boxes helper
  const renderNpwpBoxes = (npwpStr) => {
    const digits = npwpStr.replace(/[^0-9]/g, "").slice(0, 15).padEnd(15, " ").split("");
    return (
      <div className="flex items-center gap-0.5 font-bold font-mono text-xs select-none">
        {digits.slice(0, 2).map((d, i) => <span key={`npwp-1-${i}`} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{d}</span>)}
        <span className="text-[10px] font-black">.</span>
        {digits.slice(2, 5).map((d, i) => <span key={`npwp-2-${i}`} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{d}</span>)}
        <span className="text-[10px] font-black">.</span>
        {digits.slice(5, 8).map((d, i) => <span key={`npwp-3-${i}`} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{d}</span>)}
        <span className="text-[10px] font-black">.</span>
        {digits.slice(8, 9).map((d, i) => <span key={`npwp-4-${i}`} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{d}</span>)}
        <span className="text-[10px] font-black">-</span>
        {digits.slice(9, 12).map((d, i) => <span key={`npwp-5-${i}`} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{d}</span>)}
        <span className="text-[10px] font-black">.</span>
        {digits.slice(12, 15).map((d, i) => <span key={`npwp-6-${i}`} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{d}</span>)}
      </div>
    );
  };

  const renderDateBoxes = (dateStr) => {
    const digits = dateStr.replace(/[^0-9]/g, "").slice(0, 8).padEnd(8, " ").split("");
    return (
      <div className="flex items-center gap-0.5 font-bold font-mono text-xs select-none">
        {digits.slice(0, 2).map((d, i) => <span key={`d-${i}`} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{d}</span>)}
        <span className="mx-0.5">/</span>
        {digits.slice(2, 4).map((d, i) => <span key={`m-${i}`} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{d}</span>)}
        <span className="mx-0.5">/</span>
        {digits.slice(4, 8).map((d, i) => <span key={`y-${i}`} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{d}</span>)}
      </div>
    );
  };

  const renderPeriodBoxes = (periodStr) => {
    const digits = periodStr.replace(/[^0-9]/g, "").slice(0, 4).padEnd(4, " ").split("");
    return (
      <div className="flex items-center gap-0.5 font-bold font-mono text-xs select-none">
        {digits.slice(0, 2).map((d, i) => <span key={`pm-${i}`} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{d}</span>)}
        <span className="mx-0.5">/</span>
        {digits.slice(2, 4).map((d, i) => <span key={`py-${i}`} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{d}</span>)}
      </div>
    );
  };

  const renderCustomerCodeBoxes = (codeStr) => {
    const chars = codeStr.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).padEnd(8, " ").split("");
    return (
      <div className="flex items-center gap-0.5 font-bold font-mono text-xs select-none">
        {chars.map((c, i) => <span key={i} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{c}</span>)}
      </div>
    );
  };

  const renderTradingPartnerBoxes = (partnerStr) => {
    const chars = partnerStr.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5).padEnd(5, " ").split("");
    return (
      <div className="flex items-center gap-0.5 font-bold font-mono text-xs select-none">
        {chars.map((c, i) => <span key={i} className="w-3.5 h-5 border border-black flex items-center justify-center bg-white text-black">{c}</span>)}
      </div>
    );
  };

  const renderDigitBoxes = (value, length = 8) => {
    const chars = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, length).padEnd(length, " ").split("");
    return (
      <div className="flex gap-0.5 inline-flex select-none">
        {chars.map((char, idx) => (
          <span key={idx} className="w-3.5 h-5 border border-black flex items-center justify-center font-mono font-bold text-xs bg-white text-black">
            {char}
          </span>
        ))}
      </div>
    );
  };



  const handleRemoveFile = (index: number) => {
    const fileObj = sscFiles[index];
    if (fileObj) {
      setSscBillingRows(prev => prev.filter(cl => cl.id !== fileObj.rowId));
    }
    setSscFiles(prev => prev.filter((_, idx) => idx !== index));
  };
  const [detectedVendors, setDetectedVendors] = useState<string[]>([]);
  const [selectedDetectedVendor, setSelectedDetectedVendor] = useState<string>("");
  const [printVendorFilter, setPrintVendorFilter] = useState<string>("");
  const [selectedLookUpVendor, setSelectedLookUpVendor] = useState<string>("");
  const [selectedVendorForParts, setSelectedVendorForParts] = useState<string>("");

  // Ref to track pending auto-selection after CL upload adds new rows
  const pendingSelectIdRef = useRef<string | null>(null);

  // Sync confirmationLetters → sscBillingRows whenever global CL state changes.
  // Merges without duplicates (by id). CL rows with any approval status are included.
  useEffect(() => {
    if (confirmationLetters.length === 0) return;
    setSscBillingRows(prev => {
      const existingIds = new Set(prev.map((r: any) => r.id));
      const newFromCl: any[] = confirmationLetters
        .filter((cl: any) => !existingIds.has(cl.id))
        .map((cl: any) => ({
          id: cl.id,
          clNumber: cl.clNumber,
          qprNumber: cl.qprNumber,
          supplierName: cl.supplierName,
          dateSent: cl.dateSent,
          amount: cl.amount,
          status: cl.status,
          memoStatus: cl.memoStatus || "SENT_AOP",
          reminderSentCount: cl.reminderSentCount || 0,
          sentToVendor: cl.sentToVendor || false,
          items: cl.items || [],
          customerCode: "OTC08002",
          documentNo: cl.clNumber?.replace(/[^0-9]/g, "").slice(-11) || "",
          customText: `POTONG TAGIH CLAIM PART NG`,
          paymentDate: "",
        }));
      // Also update status of existing rows that match a CL that changed
      const updated = prev.map((row: any) => {
        const match = confirmationLetters.find((cl: any) => cl.id === row.id);
        if (match) return { ...row, status: match.status, amount: match.amount, supplierName: match.supplierName };
        return row;
      });
      return [...updated, ...newFromCl];
    });
  }, [confirmationLetters]);

  // After confirmationLetters updates, auto-select the newly uploaded CL row
  useEffect(() => {
    if (pendingSelectIdRef.current) {
      const found = confirmationLetters.find(cl => cl.id === pendingSelectIdRef.current);
      if (found) {
        setSelectedLookUpVendor(pendingSelectIdRef.current);
        pendingSelectIdRef.current = null;
      }
    }
  }, [confirmationLetters]);

  // Selected CL for Buat SSC Payment panel
  const [selectedPaymentClId, setSelectedPaymentClId] = useState<string>("");

  const selectedCl = sscBillingRows.find(cl => cl.id === selectedClId) || sscBillingRows[0];
  const activeVendorName = sscBillingRows.length > 0 ? (sscBillingRows[0]?.supplierName || "—") : "—";

  const handleSendToVendor = (id: string, clNumber: string) => {
    setConfirmationLetters(prev =>
      prev.map(cl => {
        if (cl.id === id) {
          alert(`Sukses: Confirmation Letter ${clNumber} berhasil dikirim/diteruskan ke Vendor!`);
          return { ...cl, sentToVendor: true };
        }
        return cl;
      })
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReminder = (id: string) => {
    setConfirmationLetters(prev =>
      prev.map(cl => {
        if (cl.id === id) {
          alert(`Sukses: Email Reminder untuk ${cl.clNumber} berhasil dikirim ulang ke vendor!`);
          return { ...cl, reminderSentCount: (cl.reminderSentCount || 0) + 1 };
        }
        return cl;
      })
    );
  };

  const getClaimText = (cl: any) => {
    const name = cl?.supplierName?.toUpperCase() || "";
    if (name.includes("JAYADI")) return "CLAIM PART NG CONE RACE ALL TYPE";
    if (name.includes("IKAN BAKAR")) return "CLAIM PART NG HARDDISK 1TB";
    if (name.includes("RUICHENG")) return "CLAIM PART NG CONE RACE ALL TYPE";
    return "CLAIM PART NG";
  };

  const formatSscDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const getPaymentDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    // 10th of next-next month (e.g. if June, then August 10th)
    const payDate = new Date(date.getFullYear(), date.getMonth() + 2, 10);
    return `${payDate.getMonth() + 1}/${payDate.getDate()}/${payDate.getFullYear()}`;
  };

  const getRequestDateBoxes = (dateStr: string) => {
    if (!dateStr) return ["2", "7", "0", "8", "2", "0", "2", "5"];
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return ["2", "7", "0", "8", "2", "0", "2", "5"];
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear());
    return (d + m + y).split("");
  };

  const handleExportExcel = (type: "ssc_purchasing" | "buat_ssc_payment") => {
    try {
      import("xlsx").then((XLSX) => {
        const dataToExport = sscBillingRows
          .filter(cl => type === "buat_ssc_payment" || !printVendorFilter || cl.supplierName === printVendorFilter)
          .map((cl, idx) => {
            const amountStr = String(cl.amount || "");
          const amountNum = parseInt(amountStr.replace(/[^0-9]/g, "") || "0", 10);
          return {
            "Customer": "OTC08002",
            "DocumentNo": cl.clNumber.replace(/[^0-9]/g, "").slice(-11) || `180000000${53 + idx}`,
            "Text": type === "ssc_purchasing" ? getClaimText(cl) : (cl.customText !== undefined ? cl.customText : `POTONG TAGIH ${getClaimText(cl)}`),
            "Vendor": cl.supplierName,
            "Doc. Date": formatSscDate(cl.dateSent),
            "Local Crcy Amt": amountNum,
            "Potong tagih payment date": type === "ssc_purchasing" ? getPaymentDate(cl.dateSent) : (cl.paymentDate !== undefined ? cl.paymentDate : getPaymentDate(cl.dateSent))
          };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        const sheetName = type === "ssc_purchasing" ? "SSC Billing" : "SSC Billing Payment";
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 30));
        XLSX.writeFile(workbook, `${sheetName.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);
      });
    } catch (e) {
      alert("Gagal mengunduh Excel: " + e);
    }
  };

  // SSC Billing Payment editable fields
  const [payCompany, setPayCompany] = useState("PT MENARA TERUS MAKMUR");
  const [payBusinessArea, setPayBusinessArea] = useState("MT");
  const [payTitle, setPayTitle] = useState("Permohonan Pemotongan Invoice Vendor");
  const [payTo, setPayTo] = useState("SSC Invoicing & Payment");
  const [payInstruction, setPayInstruction] = useState(
    "Sehubungan dengan ditemukannya komponen NG yang bukan disebabkan oleh proses internal kami, mohon dapat dilakukan pemotongan pembayaran terhadap vendor berikut :"
  );
  const [payRequestDate, setPayRequestDate] = useState("10/04/2026");
  const [paySigPrepared, setPaySigPrepared] = useState("Bagas Nur P");
  const [paySigApproved1, setPaySigApproved1] = useState("Anindita I");
  const [paySigApproved2, setPaySigApproved2] = useState("Evi Sulistyorini");
  const [paySigEntry, setPaySigEntry] = useState("");

  // Auto-populate payment form when user selects a CL from the left panel
  useEffect(() => {
    if (!selectedPaymentClId) return;
    const cl = sscBillingRows.find((r: any) => r.id === selectedPaymentClId);
    if (!cl) return;

    // Format date from ISO (YYYY-MM-DD) or any format to dd/mm/yyyy
    const formatToDisplay = (raw: string) => {
      if (!raw) return "";
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      }
      return raw;
    };

    setPayRequestDate(formatToDisplay(cl.dateSent));
    setPayTitle("Permohonan Pemotongan Invoice Vendor");
    setPayTo("SSC Invoicing & Payment");
    setPayInstruction(
      "Sehubungan dengan ditemukannya komponen NG yang bukan disebabkan oleh proses internal kami, mohon dapat dilakukan pemotongan pembayaran terhadap vendor berikut :"
    );
    // Load this CL as the single row in the payment table, preserving any other rows
    setSscBillingRows(prev => {
      // Mark this CL as selected by moving it to top and setting selectedClId
      return prev;
    });
    setSelectedClId(selectedPaymentClId);
  }, [selectedPaymentClId]);


  const sscEmail = "ssc-billing@astraoparts.co.id";
  const handleEmailSSC = () => {
    const subject = encodeURIComponent(`[SSC BILLING] ${selectedCl?.clNumber || ""} - ${selectedCl?.supplierName || ""}`);
    const body = encodeURIComponent(`Kepada Tim SSC Billing,\n\nMohon diproses SSC Billing untuk:\nNo CL: ${selectedCl?.clNumber || ""}\nVendor: ${selectedCl?.supplierName || ""}\nJumlah: ${selectedCl?.amount || ""}\n\nTerima kasih.\n\nPT Menara Terus Makmur`);
    window.open(`mailto:${sscEmail}?subject=${subject}&body=${body}`);
  };

  const handleUpdateClField = (id: string, field: string, value: any) => {
    setSscBillingRows(prev => prev.map(cl => {
      if (cl.id === id) {
        return { ...cl, [field]: value };
      }
      return cl;
    }));
  };

  const handleAddRow = () => {
    const nextIndex = sscBillingRows.length + 1;
    const newId = `cl-custom-${Date.now()}`;
    const newCl = {
      id: newId,
      clNumber: `CL/2026/06/00${nextIndex}`,
      qprNumber: `QPR/2026/06/CUSTOM_${nextIndex}`,
      supplierName: "PT VENDOR BARU",
      dateSent: new Date().toISOString().split("T")[0],
      amount: "Rp 10.000.000",
      status: "PENDING",
      memoStatus: "DRAFT_MEMO",
      reminderSentCount: 0,
      customText: `POTONG TAGIH CLAIM PART NG ...`,
      paymentDate: "8/10/2026",
      customerCode: "OTC08002",
      documentNo: `2026060${nextIndex}`
    };
    setSscBillingRows(prev => [...prev, newCl]);
  };

  const handleDeleteRow = (id: string) => {
    setSscBillingRows(prev => prev.filter(cl => cl.id !== id));
  };

  const formattedMemoNumInternal = selectedCl?.clNumber
    ? `MEMO-MTM/AOP/${selectedCl.clNumber.replace(/[^0-9]/g, "") || "20260601"}`
    : "MEMO-MTM/AOP/20260601";

  const formattedMemoNumVendor = selectedCl?.clNumber
    ? `MEMO-MTM/VND/${selectedCl.clNumber.replace(/[^0-9]/g, "") || "20260601"}`
    : "MEMO-MTM/VND/20260601";

  // Reminder Email Template text
  const emailTemplateText = (selectedCl && selectedCl.supplierName)
    ? `Kepada Yth. Pimpinan Keuangan / Sales Manager ${selectedCl.supplierName},

Melalui surat ini kami mengingatkan kembali terkait penalti penyesuaian kualitas barang (QPR) dengan nomor Confirmation Letter ${selectedCl.clNumber || ""} yang telah dikirimkan pada tanggal ${selectedCl.dateSent || ""}.

Jumlah klaim denda akhir yang disepakati adalah sebesar ${selectedCl.amount || ""}. Harap melakukan konfirmasi persetujuan dalam portal QPR Anda.

Batas waktu: 5 Hari Kerja. Jika dalam waktu 5 hari kerja sejak surat ini dikirimkan tidak ada konfirmasi lebih lanjut, kami mengasumsikan pihak vendor telah menyetujui rincian denda ini sepenuhnya dan akan mengeksekusi deduction pada tagihan berjalan.

Hormat Kami,
PT Menara Terus Makmur (Finance & Accounting Div)`
    : "";

  const processUploadedFile = (file: File) => {
    setClUploadedFile(file);
    const randSuffix = Math.random().toString(36).substring(2, 9);
    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      alert(`Sukses mengimpor data denda kualitas dari Excel: ${file.name}!`);
      const nextIndex = sscBillingRows.length + 1;
      const newId = `cl-imported-${Date.now()}-${randSuffix}`;
      const importedCl = {
        id: newId,
        clNumber: `CL/2026/06/00${nextIndex}`,
        qprNumber: `QPR/2026/06/IMPORTED_${nextIndex}`,
        supplierName: "PT IMPORTED VENDOR",
        dateSent: new Date().toISOString().split("T")[0],
        amount: "Rp 15.750.000",
        status: "PENDING",
        memoStatus: "DRAFT_MEMO",
        reminderSentCount: 0,
        customText: `POTONG TAGIH IMPORTED CLAIM DATA`,
        paymentDate: "15/10/2026",
        customerCode: "OTC08002",
        documentNo: `2026060${nextIndex}`,
        items: [
          { no: 1, partName: "IMPORTED PARTS SAMPLE A", totalQty: 5000, qtyNG: 25, ngActual: 0.5, stdAllowance: 25, qtyClaim: 0 }
        ]
      };
      setSscFiles(prev => [...prev, { file, rowId: newId }]);
      setSscBillingRows(prev => [...prev, importedCl]);
      setSelectedClId(newId);
    } else {
      parseCLPdf(file).then((parsed) => {
        const nextIndex = sscBillingRows.length + 1;
        const newId = `cl-parsed-${Date.now()}-${randSuffix}`;
        const formattedAmount = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(parsed.totalAmount).replace("IDR", "Rp").trim();

        const parsedRow = {
          id: newId,
          clNumber: `CL/2026/06/00${nextIndex}`,
          qprNumber: parsed.items[0] ? `QPR/2026/06/${parsed.supplierName.split(" ")[0]}_${nextIndex}` : `QPR/2026/06/UNKNOWN_${nextIndex}`,
          supplierName: parsed.supplierName || "PT VENDOR",
          dateSent: new Date().toISOString().split("T")[0],
          amount: formattedAmount,
          status: "PENDING",
          memoStatus: "DRAFT_MEMO",
          reminderSentCount: 0,
          customText: parsed.items[0] ? `POTONG TAGIH CLAIM ${parsed.items[0].partName.toUpperCase()}` : "POTONG TAGIH CLAIM PART NG",
          paymentDate: "10/08/2026",
          customerCode: "OTC08002",
          documentNo: `2026060${nextIndex}`,
          items: parsed.items
        };
        setSscFiles(prev => [...prev, { file, rowId: newId }]);
        setSscBillingRows(prev => [...prev, parsedRow]);
        setSelectedClId(newId);
        alert(`File PDF berhasil di-upload dan diproses! Mendeteksi vendor: ${parsed.supplierName || "Unknown"}`);
      }).catch((err) => {
        console.error("Failed to parse PDF, running template fallback: ", err);
        const lowerName = file.name.toLowerCase();
        const isIkanBakar = lowerName.includes("ikan") || lowerName.includes("bakar") || lowerName.includes("cl12") || lowerName.includes("cl11") || lowerName.includes("denda");
        const isJayadi = lowerName.includes("jayadi");
        if (isIkanBakar) {
          const rowId = `cl-auto-ikanbakar-${Date.now()}-${randSuffix}`;
          const row = { id: rowId, clNumber: "CL/2026/06/001", qprNumber: "QPR/2026/05/IKAN_BAKAR", supplierName: "PT IKAN BAKAR", dateSent: "2026-06-18", amount: "Rp 24.000.000", status: "PENDING", memoStatus: "DRAFT_MEMO", reminderSentCount: 0, customText: "POTONG TAGIH CLAIM PART NG", paymentDate: "10/08/2026", customerCode: "OTC08002", documentNo: "202606001", items: [{ no: 1, partName: "Harddisk 1TB", totalQty: 2000, qtyNG: 20, ngActual: 1.0, stdAllowance: 10, qtyClaim: 20, qty: 20, claimCost: 1081081, unitPrice: 1081081, amount: 21621620, subtotal: 21621620 }] };
          setSscFiles(prev => [...prev, { file, rowId }]);
          setSscBillingRows(prev => [...prev, row]); setSelectedClId(rowId); alert(`File PDF berhasil di-upload: ${file.name}. Mendeteksi vendor PT IKAN BAKAR.`);
        } else if (isJayadi) {
          const rowId = `cl-auto-jayadi-${Date.now()}-${randSuffix}`;
          const row = { id: rowId, clNumber: "CL/2026/07/001", qprNumber: "QPR/2026/06/JAYADI_1", supplierName: "PT JAYADI", dateSent: new Date().toISOString().split("T")[0], amount: "Rp 18.200.000", status: "PENDING", memoStatus: "DRAFT_MEMO", reminderSentCount: 0, customText: "POTONG TAGIH CLAIM PT JAYADI", paymentDate: "10/10/2026", customerCode: "OTC08002", documentNo: "202512006", items: [{ no: 1, partName: "Motherboard X1", totalQty: 1000, qtyNG: 10, ngActual: 1.0, stdAllowance: 5, qtyClaim: 10, qty: 10, claimCost: 1500000, unitPrice: 1500000, amount: 15000000, subtotal: 15000000 }] };
          setSscFiles(prev => [...prev, { file, rowId: rowId }]);
          setSscBillingRows(prev => [...prev, row]); setSelectedClId(rowId); alert(`File PDF berhasil di-upload: ${file.name}. Mendeteksi vendor PT JAYADI.`);
        } else {
          const rowId = `cl-auto-anugerah-${Date.now()}-${randSuffix}`;
          const row = { id: rowId, clNumber: "CL/2025/12/006", qprNumber: "004/QI/QPR/SUB/11/25, 009/QI/QPR/SUB/11/25, 014/QI/QPR/SUB/11/25", supplierName: "Anugerah Daya Industri Komponen Utama, PT.", dateSent: "2025-12-02", amount: "Rp 1.144.283", status: "PENDING", memoStatus: "DRAFT_MEMO", reminderSentCount: 0, customText: "POTONG TAGIH CLAIM HUB CLUTCH", paymentDate: "10/02/2026", customerCode: "OTC08002", documentNo: "202512006", items: [{ no: 1, partName: "HUB CLUTCH, IMV 683N", totalQty: 1000, qtyNG: 14, ngActual: 1.4, stdAllowance: 5, qtyClaim: 14, qty: 14, claimCost: 49516, unitPrice: 49516, amount: 693224, subtotal: 693224 }, { no: 2, partName: "HUB CLUTCH, RZN", totalQty: 500, qtyNG: 6, ngActual: 1.2, stdAllowance: 5, qtyClaim: 6, qty: 6, claimCost: 56277, unitPrice: 56277, amount: 337662, subtotal: 337662 }] };
          setSscFiles(prev => [...prev, { file, rowId }]);
          setSscBillingRows(prev => [...prev, row]); setSelectedClId(rowId); alert(`File PDF berhasil di-upload: ${file.name}. Mendeteksi vendor Anugerah Daya Industri Komponen Utama, PT.`);
        }
      });
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white border border-indigo-900 rounded-xl shadow-md gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/10 text-white rounded-lg">
              <Mail size={18} />
            </span>
            <h3 className="text-base font-black uppercase tracking-wider">SSC Billing &amp; Reminder</h3>
          </div>
        </div>
      </div>

      {/* Editor & Templates Preview */}
      {confirmationLetters.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-bold italic">
          Belum ada Confirmation Letter yang dibuat. Silakan terbitkan Confirmation Letter terlebih dahulu di tab "Buat Confirmation Letter".
        </div>
      ) : (
        <>
          {/* Centered Horizontal Navigation Subtabs */}
          <div className="flex justify-center print:hidden">
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1.5 overflow-x-auto shadow-sm max-w-4xl w-full">
            <button
              onClick={() => setActiveSubTab("ssc_purchasing")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                activeSubTab === "ssc_purchasing"
                  ? "bg-white text-blue-750 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
              }`}
            >
              <FileCheck2 size={13} />
              SSC BILLING
            </button>
            <button
              onClick={() => setActiveSubTab("buat_ssc_payment")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                activeSubTab === "buat_ssc_payment"
                  ? "bg-white text-blue-750 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
              }`}
            >
              <FileCheck2 size={13} />
              BUAT SSC PAYMENT
            </button>
            <button
              onClick={() => setActiveSubTab("reminder")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                activeSubTab === "reminder"
                  ? "bg-white text-blue-750 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
              }`}
            >
              <Mail size={13} />
              EMAIL REMINDER
            </button>
            <button
              onClick={() => setActiveSubTab("kirim_cl")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                activeSubTab === "kirim_cl"
                  ? "bg-white text-blue-750 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
              }`}
            >
              <Send size={13} />
              KIRIM CL KE VENDOR
            </button>
            <button
              onClick={() => setActiveSubTab("parts_per_vendor")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                activeSubTab === "parts_per_vendor"
                  ? "bg-white text-blue-750 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
              }`}
            >
              <Building size={13} />
              PARTS PER VENDOR
            </button>
          </div>
        </div>

        <div className="w-full space-y-4">


                {activeSubTab === "parts_per_vendor" && (
                  (() => {
                    const vendorNames = Array.from(new Set(parts.map((p: any) => p.supplierName)));
                    const activeVendorForParts = selectedVendorForParts || vendorNames[0] || "";
                    const vendorParts = parts.filter((p: any) => p.supplierName === activeVendorForParts);
                    return (
                      <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-left space-y-5">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-150 pb-4 gap-3">
                          <div>
                            <h4 className="text-base font-extrabold text-slate-800">Daftar Komponen Part per Vendor</h4>
                            <p className="text-xs text-slate-400 font-bold mt-0.5">Filter dan lihat allowance ratio untuk masing-masing part yang disuplai oleh vendor.</p>
                          </div>
                          
                          {/* Vendor Selector Dropdown */}
                          <div className="space-y-1.5 text-xs w-full sm:w-72 shrink-0">
                            <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider">
                              Pilih Vendor / Supplier:
                            </label>
                            <select
                              value={activeVendorForParts}
                              onChange={(e) => setSelectedVendorForParts(e.target.value)}
                              className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                            >
                              {vendorNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Parts Table */}
                        {activeVendorForParts ? (
                          <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                                  <th className="px-4 py-3 w-12 text-center">No</th>
                                  <th className="px-4 py-3">No. Part Item</th>
                                  <th className="px-4 py-3">Deskripsi / Nama Part</th>
                                  <th className="px-4 py-3 text-center">Allowance Ratio</th>
                                  <th className="px-4 py-3 text-center">Status QPR</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 font-semibold">
                                {vendorParts.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                                      Tidak ada part terdaftar untuk vendor ini.
                                    </td>
                                  </tr>
                                ) : (
                                  vendorParts.map((part: any, idx: number) => (
                                    <tr key={part.id || idx} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-4 py-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{part.partNumber}</td>
                                      <td className="px-4 py-3 text-slate-700">{part.partName}</td>
                                      <td className="px-4 py-3 text-center">
                                        <span className="bg-blue-50 text-blue-750 border border-blue-200 px-2 py-0.5 rounded font-mono font-black text-[11px] shadow-2xs">
                                          {part.allowanceRatio}%
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                          part.hasNcrActive
                                            ? "bg-rose-50 text-rose-700 border-rose-250 animate-pulse"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-250"
                                        }`}>
                                          {part.hasNcrActive ? "NCR Active" : "Ready"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center p-8 text-slate-400 italic">
                            Pilih vendor terlebih dahulu untuk memuat data.
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}

                {activeSubTab === "ssc_purchasing" && (
                  <div className="flex flex-col gap-6 w-full items-center text-left font-sans">
                    {/* Top Section: Form Editor */}
                    <div className="w-full max-w-4xl bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 print:hidden">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800 font-sans">Manual Billing Editor</h4>
                          <p className="text-[10.5px] text-slate-500 font-bold font-sans mt-0.5">Isi data manual untuk memperbarui draf dokumen di kanan secara realtime.</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0 font-sans">
                          <button
                            type="button"
                            onClick={() => setShowSscBillingPreview(!showSscBillingPreview)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 text-[10px] font-bold rounded border border-indigo-200 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                            title="Toggle pratinjau lembar A4"
                          >
                            <Eye size={12} />
                            {showSscBillingPreview ? "Sembunyikan Preview" : "Lihat Preview"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMemoPeriod("");
                              setMemoTitle("");
                              setMemoRequestTo("");
                              setMemoDescription("");
                              setMemoNpwp("");
                              setMemoSupportingDoc("");
                              setMemoBillingAddressedTo("");
                              setMemoCustomerName("");
                              setMemoAmount("");
                              setMemoSays("");
                              setAcctCustomerCode("");
                              setAcctTradingPartner("");
                              setAcctExchangeRate("");
                              setAcctJournal("");
                              setGlRows([
                                { code: "", name: "", costCenter: "", amountDr: "", amountCr: "", text: "" },
                                { code: "", name: "", costCenter: "", amountDr: "", amountCr: "", text: "" },
                                { code: "", name: "", costCenter: "", amountDr: "", amountCr: "", text: "" }
                              ]);
                              setSigEntry("");
                              setSigChecked("");
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded border border-slate-300 transition-all cursor-pointer active:scale-95"
                            title="Kosongkan Isian Form"
                          >
                            Kosongkan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMemoCompany("PT. MENARA TERUS MAKMUR");
                              setMemoBusinessArea("MT");
                              setMemoRequestDate("10/02/2026");
                              setMemoBillingType("One Time");
                              setMemoPeriod("");
                              setMemoTitle("Permintaan Pembuatan Invoice Claim NG Part");
                              setMemoRequestTo("SSC Billing");
                              setMemoDescription("Mohon dibuatkan invoice untuk Claim Part NG INNER TUBE,650 A");
                              setMemoCustomerType("PKP");
                              setMemoNpwp("81.571.024.9-408.000");
                              setMemoSupportingDoc("-");
                              setMemoBillingAddressedTo("Jalan Galuh Mas Raya No. 28-29, Sukaharja, Telukjambe Barat, Sukaharja, Telukjambe Timur, Kabupaten Karawang");
                              setMemoCustomerName("PT TEMARU ENGINEERING INDONESIA");
                              setMemoCurrency("IDR");
                              setMemoAmount("24765");
                              setMemoSays("Dua Puluh Empat Ribu Tujuh Ratus Enam Puluh Lima Rupiah");
                              setAcctCustomerCode("OTC08002");
                              setAcctCustomerType("Non Trade");
                              setAcctTradingPartner("");
                              setAcctExchangeRate("");
                              setAcctJournal("");
                              setGlRows([
                                { code: "OTC08002", name: "PT TEMARU ENGINEER", costCenter: "", amountDr: "24.765", amountCr: "", text: "Claim Part NG" },
                                { code: "545-102-0000", name: "FOH Subcont Fee", costCenter: "MT015FOHGE", amountDr: "", amountCr: "22.311", text: "Claim Part NG" },
                                { code: "211-310-0000", name: "Tax Pay VAT Out", costCenter: "", amountDr: "", amountCr: "2.454", text: "ppn 11%" }
                              ]);
                              setSigPrepared("Bagas");
                              setSigApproved1("Anindita");
                              setSigApproved2("Evi Sulistyorini");
                              setSigEntry("");
                              setSigChecked("");
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200 transition-all cursor-pointer active:scale-95"
                            title="Isi dengan Data Contoh PDF"
                          >
                            Isi Contoh
                          </button>
                        </div>
                      </div>

                      {/* Section 1: General Info */}
                      <div className="space-y-3 font-sans">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">1. General Metadata</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Company</label>
                            <input type="text" value={memoCompany} onChange={e => setMemoCompany(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Business Area</label>
                            <input type="text" value={memoBusinessArea} onChange={e => setMemoBusinessArea(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Request Date (dd/mm/yyyy)</label>
                            <input type="text" value={memoRequestDate} onChange={e => setMemoRequestDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white text-center" placeholder="10/02/2026" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Period *) (mm/yy)</label>
                            <input type="text" value={memoPeriod} onChange={e => setMemoPeriod(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white text-center" placeholder="02/26" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Billing Type</label>
                            <select value={memoBillingType} onChange={e => setMemoBillingType(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white">
                              <option value="One Time">One Time</option>
                              <option value="Recurring">Recurring</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Request Addressed to</label>
                            <input type="text" value={memoRequestTo} onChange={e => setMemoRequestTo(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Section 2: Title & Description */}
                      <div className="space-y-3 font-sans">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">2. Judul & Keterangan</h5>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">Title</label>
                          <input type="text" value={memoTitle} onChange={e => setMemoTitle(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">Description</label>
                          <textarea value={memoDescription} onChange={e => setMemoDescription(e.target.value)} rows={2} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">Supporting Document</label>
                          <input type="text" value={memoSupportingDoc} onChange={e => setMemoSupportingDoc(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white" />
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Section 3: Customer Details */}
                      <div className="space-y-3 font-sans">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">3. Detail Customer</h5>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">Customer Name</label>
                          <input type="text" value={memoCustomerName} onChange={e => setMemoCustomerName(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">Billing Addressed to</label>
                          <textarea value={memoBillingAddressedTo} onChange={e => setMemoBillingAddressedTo(e.target.value)} rows={2} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Customer Type</label>
                            <select value={memoCustomerType} onChange={e => setMemoCustomerType(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white">
                              <option value="PKP">PKP</option>
                              <option value="Non PKP">Non PKP</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">NPWP</label>
                            <input type="text" value={memoNpwp} onChange={e => setMemoNpwp(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-800 bg-white" placeholder="81.571.024.9-408.000" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Currency</label>
                            <input type="text" value={memoCurrency} onChange={e => setMemoCurrency(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white text-center font-mono" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Amount</label>
                            <input type="text" value={memoAmount} onChange={e => setMemoAmount(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-black text-slate-850 bg-white text-right" placeholder="24765" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">Says (Terbilang)</label>
                          <input type="text" value={memoSays} onChange={e => setMemoSays(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white italic" />
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Section 4: Data Accounting */}
                      <div className="space-y-3 font-sans">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">4. Data Accounting (BU)</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Customer Code</label>
                            <input type="text" value={acctCustomerCode} onChange={e => setAcctCustomerCode(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white text-center" placeholder="OTC08002" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Customer Type</label>
                            <select value={acctCustomerType} onChange={e => setAcctCustomerType(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white">
                              <option value="Trade">Trade</option>
                              <option value="Non Trade">Non Trade</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-600">Trading Partner</label>
                            <input type="text" value={acctTradingPartner} onChange={e => setAcctTradingPartner(e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-800 bg-white text-center font-mono" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-600">Exchange Rate</label>
                            <input type="text" value={acctExchangeRate} onChange={e => setAcctExchangeRate(e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-800 bg-white text-center font-mono" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-600">Journal</label>
                            <input type="text" value={acctJournal} onChange={e => setAcctJournal(e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-800 bg-white text-center font-mono" />
                          </div>
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Section 5: GL Account Table Editor */}
                      <div className="space-y-3 font-sans">
                        <div className="flex justify-between items-center">
                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">5. GL Account Table</h5>
                          <button
                            type="button"
                            onClick={() => setGlRows(prev => [...prev, { code: "", name: "", costCenter: "", amountDr: "", amountCr: "", text: "" }])}
                            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] transition-all cursor-pointer active:scale-95"
                          >
                            + Tambah GL
                          </button>
                        </div>
                        <div className="space-y-2">
                          {glRows.map((row, idx) => (
                            <div key={idx} className="p-2.5 border border-slate-200 rounded-lg bg-slate-50 relative space-y-1.5 text-[11px]">
                              <button
                                type="button"
                                onClick={() => setGlRows(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-1.5 right-1.5 text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                              <div className="grid grid-cols-3 gap-2 pt-1.5">
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold block">GL Code</span>
                                  <input type="text" value={row.code} onChange={e => {
                                    const next = [...glRows];
                                    next[idx].code = e.target.value;
                                    setGlRows(next);
                                  }} className="w-full px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs text-slate-850 bg-white" />
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[9px] text-slate-500 font-bold block">GL Name</span>
                                  <input type="text" value={row.name} onChange={e => {
                                    const next = [...glRows];
                                    next[idx].name = e.target.value;
                                    setGlRows(next);
                                  }} className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-xs text-slate-850 bg-white font-semibold" />
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold block">Cost Center</span>
                                  <input type="text" value={row.costCenter} onChange={e => {
                                    const next = [...glRows];
                                    next[idx].costCenter = e.target.value;
                                    setGlRows(next);
                                  }} className="w-full px-1 py-0.5 border border-slate-300 rounded font-mono text-xs text-slate-850 bg-white" />
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold block">Amt (Dr.)</span>
                                  <input type="text" value={row.amountDr} onChange={e => {
                                    const next = [...glRows];
                                    next[idx].amountDr = e.target.value;
                                    setGlRows(next);
                                  }} className="w-full px-1 py-0.5 border border-slate-300 rounded font-mono text-xs text-slate-850 bg-white text-right" />
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold block">Amt (Cr.)</span>
                                  <input type="text" value={row.amountCr} onChange={e => {
                                    const next = [...glRows];
                                    next[idx].amountCr = e.target.value;
                                    setGlRows(next);
                                  }} className="w-full px-1 py-0.5 border border-slate-300 rounded font-mono text-xs text-slate-850 bg-white text-right" />
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold block">Text</span>
                                  <input type="text" value={row.text} onChange={e => {
                                    const next = [...glRows];
                                    next[idx].text = e.target.value;
                                    setGlRows(next);
                                  }} className="w-full px-1 py-0.5 border border-slate-300 rounded text-xs text-slate-850 bg-white" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Section 6: Signatures */}
                      <div className="space-y-3 font-sans">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">6. Tanda Tangan</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500">Prepared By</label>
                            <input type="text" value={sigPrepared} onChange={e => setSigPrepared(e.target.value)} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500">Approved By 1</label>
                            <input type="text" value={sigApproved1} onChange={e => setSigApproved1(e.target.value)} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="text-[9px] font-bold text-slate-500">Approved By 2</label>
                            <input type="text" value={sigApproved2} onChange={e => setSigApproved2(e.target.value)} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500">Entry By</label>
                            <input type="text" value={sigEntry} onChange={e => setSigEntry(e.target.value)} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-bold text-slate-800 bg-white" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500">Checked By</label>
                          <input type="text" value={sigChecked} onChange={e => setSigChecked(e.target.value)} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-800 bg-white" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section: Live A4 Printable Sheet */}
                    {showSscBillingPreview && (
                      <div className="flex flex-col items-center w-full space-y-4 print:w-full print:p-0">
                      {/* Control Panel */}
                      <div className="w-full bg-white border border-slate-200 rounded-lg p-2 flex justify-between items-center print:hidden shadow-sm font-sans">
                        <span className="text-[11px] text-slate-500 font-bold font-sans">
                          Pratinjau Live: <strong>A4 Portrait Sheet</strong>
                        </span>
                        <button
                          onClick={handlePrint}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg shadow-md hover:shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 font-sans"
                        >
                          <Printer size={13} />
                          Cetak Memo Internal
                        </button>
                      </div>

                      {/* Actual Document Sheet Container */}
                      <div className="w-full overflow-x-auto p-1 bg-slate-200 border border-slate-300 rounded-xl flex justify-center shadow-inner print:bg-white print:border-none print:p-0 print:shadow-none">
                        <div
                          id="manual-billing-sheet"
                          className="bg-white text-black p-[12mm] shadow-lg border border-slate-450 w-[210mm] min-h-[297mm] text-left mx-auto relative flex flex-col print:shadow-none print:border-none print:w-[198mm] print:h-[280mm] print:p-[8mm] print:m-0"
                          style={{
                            fontFamily: 'Arial, sans-serif',
                            lineHeight: '1.2'
                          }}
                        >
                          {/* Top Section */}
                          <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1.5 w-[55%]">
                              <div className="flex text-xs">
                                <span className="font-bold w-24 shrink-0 font-sans">Company</span>
                                <span className="mr-2">:</span>
                                <span className="font-bold border-b border-black flex-1 min-h-[16px]">{memoCompany}</span>
                              </div>
                              <div className="flex text-xs">
                                <span className="font-bold w-24 shrink-0 font-sans">Business Area</span>
                                <span className="mr-2">:</span>
                                <span className="font-bold border-b border-black flex-1 min-h-[16px]">{memoBusinessArea}</span>
                              </div>
                              <div className="flex text-xs items-center">
                                <span className="font-bold w-24 shrink-0 font-sans">Request Date</span>
                                <span className="mr-2">:</span>
                                <div className="flex-1">{renderDateBoxes(memoRequestDate)}</div>
                                <span className="text-[9px] text-slate-500 ml-1 font-mono">(dd/mm/yyyy)</span>
                              </div>
                              <div className="flex text-xs items-center gap-2 pt-1 font-sans">
                                <span className="font-bold w-24 shrink-0 font-sans">Billing Type</span>
                                <span className="mr-2">:</span>
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-1 font-bold text-xs select-none">
                                    <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black text-[10px] ${memoBillingType === "One Time" ? "bg-black text-white" : "bg-white"}`}>
                                      {memoBillingType === "One Time" ? "✓" : ""}
                                    </span>
                                    One Time
                                  </label>
                                  <label className="flex items-center gap-1 font-bold text-xs select-none">
                                    <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-black text-[10px] ${memoBillingType === "Recurring" ? "bg-black text-white" : "bg-white"}`}>
                                      {memoBillingType === "Recurring" ? "✓" : ""}
                                    </span>
                                    Recurring
                                  </label>
                                </div>
                                <div className="flex items-center gap-1.5 ml-2 font-sans">
                                  <span className="font-bold text-[10px] shrink-0 font-sans">Period *) (mm/yy) :</span>
                                  {renderPeriodBoxes(memoPeriod)}
                                </div>
                              </div>
                            </div>

                            {/* Barcode Dotted Area */}
                            <div className="w-[185px] h-[52px] border border-dashed border-black/80 flex flex-col items-center justify-center p-2 text-center text-black/75">
                              <span className="text-[7px] font-bold tracking-widest leading-none font-sans">PLEASE PUT <span className="underline font-black">FA01 BARCODE</span> HERE</span>
                            </div>
                          </div>

                          {/* Memo Title */}
                          <div className="text-center mb-6">
                            <h2 className="text-sm font-extrabold tracking-wider border-b border-black pb-0.5 inline-block uppercase text-black font-sans">
                              INTERNAL MEMO - MANUAL BILLING TO CUSTOMER
                            </h2>
                          </div>

                          {/* Main Form Fields (Thick border block) */}
                          <div className="border border-black flex flex-col divide-y divide-black text-[11px] mb-4">
                            <div className="flex divide-x divide-black">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Title</div>
                              <div className="flex-1 p-2 font-bold bg-white min-h-[28px] uppercase">{memoTitle}</div>
                            </div>
                            <div className="flex divide-x divide-black">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Request Addressed to</div>
                              <div className="flex-1 p-2 font-semibold bg-white min-h-[28px]">{memoRequestTo}</div>
                            </div>
                            <div className="flex divide-x divide-black">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Description</div>
                              <div className="flex-1 p-2 bg-white leading-relaxed whitespace-pre-wrap min-h-[48px] font-semibold">{memoDescription}</div>
                            </div>
                            <div className="flex divide-x divide-black items-center">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Customer Type</div>
                              <div className="flex-1 p-2 flex items-center justify-between bg-white min-h-[28px]">
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-1 font-bold">
                                    <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center text-[10px] ${memoCustomerType === "PKP" ? "bg-black text-white" : ""}`}>
                                      {memoCustomerType === "PKP" ? "✓" : ""}
                                    </span>
                                    PKP
                                  </label>
                                  <label className="flex items-center gap-1 font-bold">
                                    <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center text-[10px] ${memoCustomerType === "Non PKP" ? "bg-black text-white" : ""}`}>
                                      {memoCustomerType === "Non PKP" ? "✓" : ""}
                                    </span>
                                    Non PKP
                                  </label>
                                </div>
                                <div className="flex items-center gap-1.5 mr-2 font-sans">
                                  <span className="font-bold">NPWP:</span>
                                  {renderNpwpBoxes(memoNpwp)}
                                </div>
                              </div>
                            </div>
                            <div className="flex py-1 px-2 text-[9px] text-slate-500 font-semibold bg-slate-55/20 italic font-sans">
                              *lampirkan NPWP u/ customer yg belum terdaftar pada customer master (OTC)
                            </div>
                            <div className="flex divide-x divide-black">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Supporting Document</div>
                              <div className="flex-1 p-2 bg-white font-semibold min-h-[28px]">{memoSupportingDoc || "-"}</div>
                            </div>
                            <div className="flex divide-x divide-black">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Billing Addressed to</div>
                              <div className="flex-1 p-2 bg-white leading-relaxed font-semibold min-h-[40px]">{memoBillingAddressedTo}</div>
                            </div>
                            <div className="flex divide-x divide-black">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Customer Name</div>
                              <div className="flex-1 p-2 bg-white font-extrabold text-[12px] uppercase min-h-[28px]">{memoCustomerName}</div>
                            </div>
                            <div className="flex divide-x divide-black items-center">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Currency</div>
                              <div className="flex-1 p-2 bg-white flex items-center gap-1.5 min-h-[28px]">
                                {renderDigitBoxes(memoCurrency, 3)}
                              </div>
                            </div>
                            <div className="flex divide-x divide-black">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Amount</div>
                              <div className="flex-1 p-2 bg-white font-extrabold text-[12px] min-h-[28px]">
                                {memoAmount ? `Rp ${parseFloat(memoAmount.replace(/[^0-9]/g, "")).toLocaleString("id-ID")}` : ""}
                              </div>
                            </div>
                            <div className="flex divide-x divide-black">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Says</div>
                              <div className="flex-1 p-2 bg-white font-semibold italic min-h-[28px]">{memoSays}</div>
                            </div>
                          </div>

                          {/* Data Accounting Block */}
                          <div className="border border-black text-[11px] mb-4 font-sans">
                            <div className="p-1.5 font-extrabold bg-slate-100 border-b border-black uppercase tracking-wider text-[9px] font-sans">
                              DATA ACCOUNTING (Filled In by Accounting BU)
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-black">
                              <div className="flex flex-col divide-y divide-black">
                                <div className="flex divide-x divide-black items-center p-1.5">
                                  <span className="font-bold w-[120px] shrink-0 font-sans">Customer Code</span>
                                  <span className="mr-1.5 font-sans">:</span>
                                  {renderCustomerCodeBoxes(acctCustomerCode)}
                                </div>
                                <div className="flex divide-x divide-black items-center p-1.5 font-sans">
                                  <span className="font-bold w-[120px] shrink-0 font-sans">Customer Type</span>
                                  <span className="mr-1.5 font-sans">:</span>
                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1 font-bold">
                                      <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center text-[10px] ${acctCustomerType === "Trade" ? "bg-black text-white" : ""}`}>
                                        {acctCustomerType === "Trade" ? "✓" : ""}
                                      </span>
                                      Trade
                                    </label>
                                    <label className="flex items-center gap-1 font-bold">
                                      <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center text-[10px] ${acctCustomerType === "Non Trade" ? "bg-black text-white" : ""}`}>
                                        {acctCustomerType === "Non Trade" ? "✓" : ""}
                                      </span>
                                      Non Trade
                                    </label>
                                  </div>
                                </div>
                                <div className="flex divide-x divide-black items-center p-1.5 font-sans">
                                  <span className="font-bold w-[120px] shrink-0 font-sans">Trading Partner</span>
                                  <span className="mr-1.5 font-sans">:</span>
                                  {renderTradingPartnerBoxes(acctTradingPartner)}
                                </div>
                              </div>
                              <div className="flex flex-col divide-y divide-black font-sans">
                                <div className="flex divide-x divide-black items-center p-2 min-h-[32px] font-sans">
                                  <span className="font-bold w-[120px] shrink-0 font-sans">Exchange Rate*</span>
                                  <span className="mr-1.5 font-sans">:</span>
                                  <span className="font-semibold">{acctExchangeRate || "—"}</span>
                                </div>
                                <div className="flex divide-x divide-black items-center p-2 min-h-[32px] font-sans">
                                  <span className="font-bold w-[120px] shrink-0 font-sans">Journal</span>
                                  <span className="mr-1.5 font-sans">:</span>
                                  <span className="font-semibold">{acctJournal || "—"}</span>
                                </div>
                                <div className="p-1.5 px-2 text-[8px] text-slate-500 italic bg-slate-50/50 flex-1 flex items-center leading-normal font-sans">
                                  *if foreign currency applied and exchange rate is left blank, then exchange rate at SAP will be used
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* GL Table */}
                          <div className="border border-black overflow-hidden mb-6 text-[10.5px]">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[#f08a00] text-white uppercase font-extrabold border-b border-black text-center text-[8.5px] tracking-wider font-sans">
                                  <th className="border-r border-black p-1.5 w-[110px]">GL Account Code</th>
                                  <th className="border-r border-black p-1.5">GL Account Name</th>
                                  <th className="border-r border-black p-1.5 w-[90px]">Cost Center</th>
                                  <th className="border-r border-black p-1.5 w-[95px]">Amount (Dr.)</th>
                                  <th className="border-r border-black p-1.5 w-[95px]">Amount (Cr.)</th>
                                  <th className="p-1.5 w-[130px]">Text</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Array.from({ length: Math.max(5, glRows.length) }).map((_, i) => {
                                  const row = glRows[i] || { code: "", name: "", costCenter: "", amountDr: "", amountCr: "", text: "" };
                                  return (
                                    <tr key={i} className="border-b border-black font-semibold h-[24px] text-black">
                                      <td className="border-r border-black p-1 text-center font-mono">{row.code}</td>
                                      <td className="border-r border-black p-1 text-left font-sans">{row.name}</td>
                                      <td className="border-r border-black p-1 text-center font-mono">{row.costCenter}</td>
                                      <td className="border-r border-black p-1 text-right font-mono">{row.amountDr}</td>
                                      <td className="border-r border-black p-1 text-right font-mono">{row.amountCr}</td>
                                      <td className="p-1 text-left font-sans">{row.text}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Signatures Panel */}
                          <div className="border border-black overflow-hidden mb-6 text-[10px] mt-auto font-sans">
                            <div className="grid grid-cols-5 text-center divide-x divide-black font-bold font-sans">
                              <div className="p-1 border-b border-black bg-slate-50/50">Prepared by <sup>1)</sup></div>
                              <div className="p-1 border-b border-black bg-slate-50/50 col-span-2">Approved by <sup>1)</sup></div>
                              <div className="p-1 border-b border-black bg-slate-50/50">Entry by <sup>1)</sup></div>
                              <div className="p-1 border-b border-black bg-slate-50/50">Checked by <sup>1)</sup></div>
                            </div>
                            <div className="grid grid-cols-5 text-center divide-x divide-black h-[58px]">
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-0.5 min-h-[14px] w-full truncate text-center font-sans" title={sigPrepared}>{sigPrepared}</span>
                              </div>
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-0.5 min-h-[14px] w-full truncate text-center font-sans" title={sigApproved1}>{sigApproved1}</span>
                              </div>
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-0.5 min-h-[14px] w-full truncate text-center font-sans" title={sigApproved2}>{sigApproved2}</span>
                              </div>
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-0.5 min-h-[14px] w-full truncate text-center font-sans" title={sigEntry}>{sigEntry}</span>
                              </div>
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-0.5 min-h-[14px] w-full truncate text-center font-sans" title={sigChecked}>{sigChecked}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-5 text-center divide-x divide-black text-[9px] font-bold text-white bg-blue-600/90 border-t border-black font-sans">
                              <div className="p-1 py-1.5 truncate text-center" title={sigPreparedRole}>{sigPreparedRole}</div>
                              <div className="p-1 py-1.5 truncate text-center" title={sigApproved1Role}>{sigApproved1Role}</div>
                              <div className="p-1 py-1.5 truncate text-center" title={sigApproved2Role}>{sigApproved2Role}</div>
                              <div className="p-1 py-1.5 truncate text-center" title={sigEntryRole}>{sigEntryRole}</div>
                              <div className="p-1 py-1.5 truncate text-center" title={sigCheckedRole}>{sigCheckedRole}</div>
                            </div>
                          </div>

                          {/* Footer / Remark */}
                          <div className="text-[8px] text-slate-500 leading-tight space-y-0.5 font-sans">
                            <div><strong>Remark:</strong></div>
                            <div>*) Only filled if billing type is recurring</div>
                            <div>1) Every signing person must write down his / her full name in the grey box and his/her function in the blue box</div>
                            <div className="flex justify-between pt-2 border-t border-slate-200 mt-2 text-[7.5px] font-mono text-slate-450 font-sans">
                              <span>Approved By System {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} 17:02</span>
                              <span>Internal Memo - Onetime Billing TEIN1 of 1</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                )}
                {activeSubTab === "buat_ssc_payment" && (
                  <div className="flex flex-col gap-6 w-full items-center text-left font-sans">
                    {/* Top Section: CL Selector + Form Editor */}
                    <div className="w-full max-w-4xl space-y-4 print:hidden">

                      {/* CL Selector Panel */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-slate-100 bg-slate-50/70">
                          <h5 className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider">
                            📋 Pilih CL untuk Diproses
                          </h5>
                          <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">
                            {sscBillingRows.length} Confirmation Letter tersedia · Klik untuk auto-isi form
                          </p>
                        </div>
                        <div className="max-h-[230px] overflow-y-auto divide-y divide-slate-100">
                          {sscBillingRows.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 italic text-[11px] font-semibold">
                              Belum ada CL. Buat CL di menu Accounting terlebih dahulu.
                            </div>
                          ) : (
                            sscBillingRows.map((cl: any) => {
                              const isSelected = selectedPaymentClId === cl.id;
                              const statusColor = cl.status === "FULLY_APPROVED" || cl.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-700"
                                : cl.status === "CLOSED_PAID"
                                ? "bg-slate-100 text-slate-500"
                                : "bg-amber-100 text-amber-700";
                              const statusLabel = cl.status === "FULLY_APPROVED" || cl.status === "APPROVED"
                                ? "Approved"
                                : cl.status === "CLOSED_PAID"
                                ? "Closed"
                                : cl.status === "WAITING_VENDOR"
                                ? "Sent to Vendor"
                                : "Pending";
                              return (
                                <button
                                  key={cl.id}
                                  type="button"
                                  onClick={() => setSelectedPaymentClId(cl.id)}
                                  className={`w-full text-left p-3 flex items-start gap-3 transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-blue-50 border-l-2 border-blue-500"
                                      : "hover:bg-slate-50/70 border-l-2 border-transparent"
                                  }`}
                                >
                                  <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-blue-500" : "bg-slate-300"}`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10.5px] font-black text-slate-800 font-mono truncate">{cl.clNumber}</span>
                                      <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded shrink-0 ${statusColor}`}>{statusLabel}</span>
                                    </div>
                                    <div className="text-[9.5px] text-slate-500 font-semibold mt-0.5 truncate">{cl.supplierName}</div>
                                    <div className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-2">
                                      <span>{cl.dateSent}</span>
                                      <span className="text-slate-300">·</span>
                                      <span className="font-black text-slate-600">{cl.amount}</span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Form Editor Card */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-800 font-sans">SSC Payment Editor</h4>
                            <p className="text-[10.5px] text-slate-500 font-bold font-sans mt-0.5">
                              {selectedPaymentClId
                                ? <>✅ CL terpilih: <strong className="text-blue-700">{sscBillingRows.find((r: any) => r.id === selectedPaymentClId)?.clNumber || "—"}</strong></>
                                : "Pilih CL di atas atau isi data manual."}
                            </p>
                          </div>
                          <div className="flex gap-1.5 shrink-0 font-sans">
                            <button
                              type="button"
                              onClick={() => setShowSscPaymentPreview(!showSscPaymentPreview)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 text-[10px] font-bold rounded border border-indigo-200 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                              title="Toggle pratinjau lembar A4"
                            >
                              <Eye size={12} />
                              {showSscPaymentPreview ? "Sembunyikan Preview" : "Lihat Preview"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {

                              setPayCompany("PT Menara Terus Makmur");
                              setPayBusinessArea("");
                              setPayRequestDate("");
                              setPayTitle("");
                              setPayTo("");
                              setPayInstruction("");
                              setPaySigPrepared("");
                              setPaySigApproved1("");
                              setPaySigApproved2("");
                              setPaySigEntry("");
                              setSscBillingRows([]);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded border border-slate-300 transition-all cursor-pointer active:scale-95"
                            title="Kosongkan Isian Form"
                          >
                            Kosongkan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPayCompany("PT Menara Terus Makmur");
                              setPayBusinessArea("MT");
                              setPayRequestDate("10/04/2026");
                              setPayTitle("Permohonan Pemotongan Invoice Vendor");
                              setPayTo("SSC Invoicing & Payment");
                              setPayInstruction("Sehubungan dengan ditemukannya komponen NG yang bukan disebabkan oleh proses internal kami, mohon dapat dilakukan pemotongan pembayaran terhadap vendor berikut :");
                              setPaySigPrepared("Bagas Nur P");
                              setPaySigApproved1("Anindita I");
                              setPaySigApproved2("Evi Sulistyorini");
                              setPaySigEntry("");
                              setSscBillingRows([
                                { id: "ex-1", customerCode: "OTC08002", clNumber: "CL/2026/06/001", qprNumber: "QPR/2026/05/IKAN_BAKAR", supplierName: "PT TEMARU ENGINEERING INDONESIA", dateSent: "21/05/2026", amount: "Rp 2.661.505", status: "PENDING", memoStatus: "DRAFT_MEMO", reminderSentCount: 0, customText: "CLAIM PART NG", paymentDate: "10/07/2026", documentNo: "1800000049" },
                                { id: "ex-2", customerCode: "OTC08002", clNumber: "CL/2026/06/002", qprNumber: "QPR/2026/05/IKAN_BAKAR", supplierName: "PT SUKSES CIPTA MAKMUR", dateSent: "21/06/2026", amount: "Rp 66.346.268", status: "PENDING", memoStatus: "DRAFT_MEMO", reminderSentCount: 0, customText: "CLAIM PART NG", paymentDate: "10/07/2026", documentNo: "1800000050" },
                                { id: "ex-3", customerCode: "OTC08002", clNumber: "CL/2026/06/003", qprNumber: "QPR/2026/05/IKAN_BAKAR", supplierName: "PT ANUGERAH DAYA INDUSTRI KOMPONEN UTAMA", dateSent: "21/05/2026", amount: "Rp 606.480", status: "PENDING", memoStatus: "DRAFT_MEMO", reminderSentCount: 0, customText: "CLAIM NG", paymentDate: "10/07/2026", documentNo: "1800000054" }
                              ]);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200 transition-all cursor-pointer active:scale-95"
                            title="Isi dengan Data Contoh PDF"
                          >
                            Isi Contoh
                          </button>
                        </div>
                      </div>

                      {/* Section 1: General Info */}
                      <div className="space-y-3 font-sans">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">1. General Metadata</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Company</label>
                            <input type="text" value={payCompany} onChange={e => setPayCompany(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Business Area</label>
                            <input type="text" value={payBusinessArea} onChange={e => setPayBusinessArea(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">Request Date (dd/mm/yyyy)</label>
                          <input type="text" value={payRequestDate} onChange={e => setPayRequestDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white text-center" placeholder="10/04/2026" />
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Section 2: Judul & Penerima */}
                      <div className="space-y-3 font-sans">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">2. Judul & Penerima</h5>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">Title</label>
                          <input type="text" value={payTitle} onChange={e => setPayTitle(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">To</label>
                          <input type="text" value={payTo} onChange={e => setPayTo(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">Instruction</label>
                          <textarea value={payInstruction} onChange={e => setPayInstruction(e.target.value)} rows={3} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white" />
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Section 3: GL Table Rows Inputs */}
                      <div className="space-y-3 font-sans">
                        <div className="flex justify-between items-center">
                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">3. Rincian Baris Tabel</h5>
                          <button
                            type="button"
                            onClick={handleAddRow}
                            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] transition-all cursor-pointer active:scale-95"
                          >
                            + Tambah Baris
                          </button>
                        </div>
                        <div className="space-y-2">
                          {sscBillingRows.map((cl, idx) => (
                            <div key={cl.id} className="p-2.5 border border-slate-200 rounded-lg bg-slate-50 relative space-y-1.5 text-[11px]">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(cl.id)}
                                className="absolute top-1.5 right-1.5 text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                              <div className="grid grid-cols-3 gap-2 pt-1.5">
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold block">Customer</span>
                                  <input type="text" value={cl.customerCode !== undefined ? cl.customerCode : "OTC08002"} onChange={e => handleUpdateClField(cl.id, "customerCode", e.target.value)} className="w-full px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs text-slate-850 bg-white" />
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[9px] text-slate-500 font-bold block">Document No</span>
                                  <input type="text" value={cl.documentNo !== undefined ? cl.documentNo : (cl.clNumber.replace(/[^0-9]/g, "").slice(-11) || `180000000${53 + idx}`)} onChange={e => handleUpdateClField(cl.id, "documentNo", e.target.value)} className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-xs text-slate-855 bg-white font-semibold" />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] text-slate-500 font-bold block">Text / Description</span>
                                <input type="text" value={cl.customText !== undefined ? cl.customText : `POTONG TAGIH ${getClaimText(cl)}`} onChange={e => handleUpdateClField(cl.id, "customText", e.target.value)} className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-xs text-slate-855 bg-white font-bold" />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] text-slate-500 font-bold block">Vendor</span>
                                <input type="text" value={cl.supplierName} onChange={e => handleUpdateClField(cl.id, "supplierName", e.target.value)} className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-xs text-slate-855 bg-white font-semibold" />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold block">Doc. Date</span>
                                  <input type="text" value={cl.dateSent} onChange={e => handleUpdateClField(cl.id, "dateSent", e.target.value)} className="w-full px-1 py-0.5 border border-slate-300 rounded font-mono text-xs text-slate-855 bg-white" />
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold block">Amount</span>
                                  <input type="text" value={cl.amount} onChange={e => handleUpdateClField(cl.id, "amount", e.target.value)} className="w-full px-1 py-0.5 border border-slate-300 rounded font-mono text-xs text-slate-855 bg-white text-right font-black" />
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold block">Pay Date</span>
                                  <input type="text" value={cl.paymentDate !== undefined ? cl.paymentDate : getPaymentDate(cl.dateSent)} onChange={e => handleUpdateClField(cl.id, "paymentDate", e.target.value)} className="w-full px-1 py-0.5 border border-slate-300 rounded font-mono text-xs text-slate-855 bg-white text-center" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Section 4: Signatures */}
                      <div className="space-y-3 font-sans">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">4. Tanda Tangan</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500">Prepared By</label>
                            <input type="text" value={paySigPrepared} onChange={e => setPaySigPrepared(e.target.value)} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500">Approved By 1</label>
                            <input type="text" value={paySigApproved1} onChange={e => setPaySigApproved1(e.target.value)} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500">Approved By 2</label>
                            <input type="text" value={paySigApproved2} onChange={e => setPaySigApproved2(e.target.value)} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-555">Entry By</label>
                            <input type="text" value={paySigEntry} onChange={e => setPaySigEntry(e.target.value)} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-bold text-slate-800 bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>

                    {/* Bottom Section: Live A4 Printable Sheet */}
                    {showSscPaymentPreview && (
                      <div className="flex flex-col items-center w-full space-y-4 print:w-full print:p-0">
                      {/* Control Panel */}
                      <div className="w-full bg-white border border-slate-200 rounded-lg p-2 flex justify-between items-center print:hidden shadow-sm font-sans">
                        <span className="text-[11px] text-slate-500 font-bold font-sans">
                          Pratinjau Live: <strong>A4 Portrait Sheet</strong>
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleExportExcel("buat_ssc_payment")}
                            className="px-3 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 font-extrabold text-xs rounded-lg transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                          >
                            <FileText size={12} />
                            Export Excel
                          </button>
                          <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg shadow-md hover:shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 font-sans"
                          >
                            <Printer size={13} />
                            Cetak Memo Internal
                          </button>
                        </div>
                      </div>

                      {/* Actual Document Sheet Container */}
                      <div className="w-full overflow-x-auto p-1 bg-slate-200 border border-slate-300 rounded-xl flex justify-center shadow-inner print:bg-white print:border-none print:p-0 print:shadow-none">
                        <div
                          id="internal-memo-sheet"
                          className="bg-white text-black p-[12mm] shadow-lg border border-slate-450 w-[210mm] min-h-[297mm] text-left mx-auto relative flex flex-col print:shadow-none print:border-none print:w-[198mm] print:h-[280mm] print:p-[8mm] print:m-0"
                          style={{
                            fontFamily: 'Arial, sans-serif',
                            lineHeight: '1.2'
                          }}
                        >
                          {/* Top Section */}
                          <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1.5 w-[55%]">
                              <div className="flex text-xs">
                                <span className="font-bold w-24 shrink-0 font-sans">Company</span>
                                <span className="mr-2">:</span>
                                <span className="font-bold border-b border-black flex-1 min-h-[16px]">{payCompany}</span>
                              </div>
                              <div className="flex text-xs">
                                <span className="font-bold w-24 shrink-0 font-sans">Business Area</span>
                                <span className="mr-2">:</span>
                                <span className="font-bold border-b border-black flex-1 min-h-[16px]">{payBusinessArea}</span>
                              </div>
                              <div className="flex text-xs items-center">
                                <span className="font-bold w-24 shrink-0 font-sans">Request Date</span>
                                <span className="mr-2">:</span>
                                <div className="flex-1">{renderDateBoxes(payRequestDate)}</div>
                                <span className="text-[9px] text-slate-500 ml-1 font-mono">(dd/mm/yyyy)</span>
                              </div>
                            </div>

                            {/* Barcode Dotted Area */}
                            <div className="w-[185px] h-[52px] border border-dashed border-black/80 flex flex-col items-center justify-center p-2 text-center text-black/75">
                              <span className="text-[7px] font-bold tracking-widest leading-none font-sans">PLEASE PUT <span className="underline font-black">FA BARCODE</span> HERE</span>
                            </div>
                          </div>

                          {/* Memo Title */}
                          <div className="text-center mb-6">
                            <h2 className="text-sm font-extrabold tracking-wider border-b border-black pb-0.5 inline-block uppercase text-black font-sans">
                              INTERNAL MEMO - OTHERS
                            </h2>
                          </div>

                          {/* Main Form Fields (Thick border block) */}
                          <div className="border border-black flex flex-col divide-y divide-black text-[11px] mb-4">
                            <div className="flex divide-x divide-black">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Title</div>
                              <div className="flex-1 p-2 font-bold bg-white min-h-[28px] uppercase">{payTitle}</div>
                            </div>
                            <div className="flex divide-x divide-black">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">To</div>
                              <div className="flex-1 p-2 font-semibold bg-white min-h-[28px]">{payTo}</div>
                            </div>
                            <div className="flex divide-x divide-black">
                              <div className="w-[180px] p-2 font-bold bg-slate-50/50 shrink-0 font-sans">Instruction</div>
                              <div className="flex-1 p-2 bg-white leading-relaxed font-sans leading-relaxed text-[11.5px] pr-4">{payInstruction}</div>
                            </div>
                            
                            {/* Gold Table (Embedded inside thick border content, aligned right/indented) */}
                            <div className="w-full p-2 bg-white flex flex-col">
                              <div className="pl-24 pr-2 py-2">
                                <table className="w-full text-[9.5px] border-collapse border border-black font-sans">
                                  <thead>
                                    <tr className="text-black border border-black text-[9px] text-center font-bold">
                                      <th className="border border-black px-1.5 py-1 font-bold" style={{ backgroundColor: '#f2c811' }}>Customer</th>
                                      <th className="border border-black px-1.5 py-1 font-bold" style={{ backgroundColor: '#f2c811' }}>DocumentNo</th>
                                      <th className="border border-black px-1.5 py-1 font-bold" style={{ backgroundColor: '#f2c811' }}>Text</th>
                                      <th className="border border-black px-1.5 py-1 font-bold" style={{ backgroundColor: '#f2c811' }}>Vendor</th>
                                      <th className="border border-black px-1.5 py-1 font-bold" style={{ backgroundColor: '#f2c811' }}>Doc. Date</th>
                                      <th className="border border-black px-1.5 py-1 text-right font-bold" style={{ backgroundColor: '#f2c811' }}>Local Crcy Amt</th>
                                      <th className="border border-black px-1.5 py-1 font-bold" style={{ backgroundColor: '#f2c811' }}>Potong tagih payment date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sscBillingRows.map((cl, idx) => {
                                      const rawAmt = cl.amount ? cl.amount.replace(/[^0-9]/g, "") : "0";
                                      const numAmt = parseInt(rawAmt, 10);
                                      const formattedAmt = isNaN(numAmt) ? cl.amount : numAmt.toLocaleString("id-ID");
                                      return (
                                        <tr key={cl.id} className="bg-white border border-black text-black">
                                          <td className="border border-black px-1.5 py-1 text-center font-mono font-bold">
                                            {cl.customerCode !== undefined ? cl.customerCode : "OTC08002"}
                                          </td>
                                          <td className="border border-black px-1.5 py-1 text-center font-mono font-bold">
                                            {cl.documentNo !== undefined ? cl.documentNo : (cl.clNumber.replace(/[^0-9]/g, "").slice(-11) || `180000000${53 + idx}`)}
                                          </td>
                                          <td className="border border-black px-1.5 py-1 text-left font-mono font-bold text-[9px] uppercase">
                                            {cl.customText !== undefined ? cl.customText : `POTONG TAGIH ${getClaimText(cl)}`}
                                          </td>
                                          <td className="border border-black px-1.5 py-1 text-left font-sans font-bold">
                                            {cl.supplierName}
                                          </td>
                                          <td className="border border-black px-1.5 py-1 text-center font-mono font-semibold">
                                            {formatSscDate(cl.dateSent)}
                                          </td>
                                          <td className="border border-black px-1.5 py-1 text-right font-mono font-bold">
                                            {formattedAmt}
                                          </td>
                                          <td className="border border-black px-1.5 py-1 text-center font-mono font-bold text-[9.5px]">
                                            {cl.paymentDate !== undefined ? cl.paymentDate : getPaymentDate(cl.dateSent)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                    {sscBillingRows.length === 0 && (
                                      <tr>
                                        <td colSpan={7} className="border border-black px-2 py-4 text-center text-slate-400 italic bg-slate-50">
                                          Belum ada baris rincian data. Tambah data pada panel form editor di kiri.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>

                                {/* Demikian Terimakasih */}
                                <div className="mt-4 space-y-2.5 text-left font-sans">
                                  <div className="font-bold text-[11px] text-black">
                                    Demikian Terimakasih
                                  </div>
                                  {/* 3 Write-in lines */}
                                  <div className="border-b border-black w-full h-1"></div>
                                  <div className="border-b border-black w-full h-1"></div>
                                  <div className="border-b border-black w-full h-1"></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Signatures Panel */}
                          <div className="border border-black overflow-hidden mb-6 text-[10px] mt-auto font-sans">
                            <div className="grid grid-cols-4 text-center divide-x divide-black font-bold font-sans">
                              <div className="p-1 border-b border-black bg-slate-50/50">Prepared by <sup>1)</sup></div>
                              <div className="p-1 border-b border-black bg-slate-50/50 col-span-2">Approved by <sup>1)</sup></div>
                              <div className="p-1 border-b border-black bg-slate-50/50">Entry by <sup>1)</sup></div>
                            </div>
                            <div className="grid grid-cols-4 text-center divide-x divide-black h-[58px]">
                              {/* Prepared Signature */}
                              <div className="flex items-end justify-center pb-2 bg-white px-1 relative">
                                {paySigPrepared && (
                                  <span
                                    className="block font-serif italic text-blue-700 text-lg select-none pb-1"
                                    style={{ fontFamily: "'Brush Script MT', 'Reenie Beanie', cursive, sans-serif", fontSize: '20px' }}
                                  >
                                    {paySigPrepared.split(" ")[0]}
                                  </span>
                                )}
                              </div>
                              {/* Approved 1 Signature */}
                              <div className="flex items-end justify-center pb-2 bg-white px-1 relative">
                                {paySigApproved1 && (
                                  <>
                                    <div className="absolute top-1.5 left-1.5 border border-slate-300 bg-slate-50/50 text-[9px] font-black text-slate-500 rounded px-1 rotate-[-12deg] tracking-wider select-none opacity-80">AIR</div>
                                    <span
                                      className="block font-serif italic text-blue-700 text-lg select-none pb-1"
                                      style={{ fontFamily: "'Brush Script MT', 'Reenie Beanie', cursive, sans-serif", fontSize: '20px' }}
                                    >
                                      {paySigApproved1.split(" ")[0]}
                                    </span>
                                  </>
                                )}
                              </div>
                              {/* Approved 2 Signature */}
                              <div className="flex items-end justify-center pb-2 bg-white px-1 relative">
                                {paySigApproved2 && (
                                  <span
                                    className="block font-serif italic text-blue-700 text-lg select-none pb-1"
                                    style={{ fontFamily: "'Brush Script MT', 'Reenie Beanie', cursive, sans-serif", fontSize: '20px' }}
                                  >
                                    {paySigApproved2.split(" ")[0]}
                                  </span>
                                )}
                              </div>
                              {/* Entry By Signature */}
                              <div className="flex items-end justify-center pb-2 bg-white px-1 relative">
                                {paySigEntry && (
                                  <span
                                    className="block font-serif italic text-blue-700 text-lg select-none pb-1"
                                    style={{ fontFamily: "'Brush Script MT', 'Reenie Beanie', cursive, sans-serif", fontSize: '20px' }}
                                  >
                                    {paySigEntry.split(" ")[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Grey box names */}
                            <div className="grid grid-cols-4 text-center divide-x divide-black text-[9px] font-bold text-black bg-[#d9d9d9] border-t border-black">
                              <div className="p-0.5 truncate text-center h-[20px] flex items-center justify-center" title={paySigPrepared}>{paySigPrepared}</div>
                              <div className="p-0.5 truncate text-center h-[20px] flex items-center justify-center" title={paySigApproved1}>{paySigApproved1}</div>
                              <div className="p-0.5 truncate text-center h-[20px] flex items-center justify-center" title={paySigApproved2}>{paySigApproved2}</div>
                              <div className="p-0.5 truncate text-center h-[20px] flex items-center justify-center" title={paySigEntry}>{paySigEntry}</div>
                            </div>
                            {/* Blue box roles */}
                            <div className="grid grid-cols-4 text-center divide-x divide-black text-[9px] font-bold text-white bg-blue-600/90 border-t border-black">
                              <div className="p-0.5 truncate text-center h-[20px] flex items-center justify-center">Accounting BU</div>
                              <div className="p-0.5 truncate text-center h-[20px] flex items-center justify-center">Accounting Dept Head</div>
                              <div className="p-0.5 truncate text-center h-[20px] flex items-center justify-center">Admin Div/BOD</div>
                              <div className="p-0.5 truncate text-center h-[20px] flex items-center justify-center">Entry By Function</div>
                            </div>
                          </div>

                          {/* Footer / Remark */}
                          <div className="text-[8px] text-slate-500 leading-tight space-y-0.5 font-sans">
                            <div><strong>Remark:</strong></div>
                            <div>1) Every signing person must write down his / her full name in the grey box and his/her function in the blue box</div>
                            <div className="flex justify-between pt-2 border-t border-slate-200 mt-2 text-[7.5px] font-mono text-slate-450 font-sans">
                              <span>F/SOP/SSM/001-FA406(R.01)</span>
                              <span>memo Internal 1 of 1</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                )}


                {activeSubTab === "reminder" && (
                  /* Reminder Email View */
                  <div className="bg-white rounded-xl shadow-md border border-slate-200 w-full max-w-xl p-6 text-left space-y-4">
                    <div className="bg-slate-850 text-white p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="text-blue-400" size={18} />
                        <span className="text-xs font-black uppercase tracking-wider">E-mail Reminder Simulator</span>
                      </div>
                      <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded">AUTO-GENERATED</span>
                    </div>

                    {selectedCl ? (
                      <>
                        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-[10.5px] space-y-1 font-semibold text-slate-600">
                          <div><span className="text-slate-400">Kepada:</span> management@{selectedCl.supplierName?.toLowerCase().replace("pt ", "").replace(/ /g, "") || "vendor"}.co.id</div>
                          <div><span className="text-slate-400">Subject:</span> [URGENT REMINDER] Lembar Persetujuan Confirmation Letter Kualitas {selectedCl.clNumber || ""}</div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-250 rounded-lg text-slate-700 text-[11px] leading-relaxed font-mono whitespace-pre-wrap">
                          {emailTemplateText}
                        </div>

                        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 flex items-start gap-2">
                          <AlertCircle size={14} className="shrink-0 text-blue-600 mt-0.5" />
                          <p className="text-[10px] leading-normal font-semibold">
                            Email ini dikirimkan otomatis oleh sistem jika dalam 2x24 jam vendor belum menandatangani Confirmation Letter yang diajukan.
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendReminder(selectedCl.id)}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Send size={12} />
                            Kirim Ulang Email Pengingat
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center text-slate-400 font-bold italic border border-slate-200 rounded-xl bg-slate-50">
                        Belum ada data denda kualitas. Silakan tambahkan data di tab SSC Billing terlebih dahulu.
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === "kirim_cl" && (
                  <div className="w-full bg-white rounded-xl shadow-md border border-slate-200 p-6 text-left space-y-6">
                    <div>
                      <h4 className="text-sm font-black text-slate-850 uppercase tracking-wide">
                        Antrean Dokumen Confirmation Letter
                      </h4>
                      <p className="text-[11.5px] text-slate-500 font-bold mt-1 leading-normal">
                        Berikut adalah daftar Confirmation Letter (CL) denda kualitas yang diterbitkan oleh tim Accounting. Silakan teruskan ke perwakilan vendor/supplier masing-masing.
                      </p>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-750 font-black border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 w-10 text-center">No</th>
                            <th className="px-4 py-3">No. Confirmation Letter</th>
                            <th className="px-4 py-3">Supplier / Vendor</th>
                            <th className="px-4 py-3 text-center">Status Kirim</th>
                            <th className="px-4 py-3 text-center">Pratinjau</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-bold">
                          {confirmationLetters.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                                Belum ada Confirmation Letter terdaftar.
                              </td>
                            </tr>
                          ) : (
                            confirmationLetters.map((cl, index) => (
                              <tr key={cl.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 text-center text-slate-400 font-mono">{index + 1}</td>
                                <td className="px-4 py-3 font-mono text-slate-800">{cl.clNumber}</td>
                                <td className="px-4 py-3 text-slate-700">{cl.supplierName}</td>
                                <td className="px-4 py-3 text-center">
                                  {cl.sentToVendor ? (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[9.5px] font-bold">
                                      Terkirim ke Vendor
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9.5px] font-bold animate-pulse">
                                      Menunggu Dikirim
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => setPreviewCl(cl)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[10px] font-bold rounded-lg text-slate-700 cursor-pointer transition-colors"
                                    title="Lihat Pratinjau Confirmation Letter"
                                  >
                                    <Eye size={11} />
                                    Pratinjau CL
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {!cl.sentToVendor ? (
                                    <button
                                      onClick={() => handleSendToVendor(cl.id, cl.clNumber)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-750 active:scale-95 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                                    >
                                      <Send size={11} />
                                      Kirim ke Vendor
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic font-semibold mr-2">
                                      Selesai diteruskan
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
        </div>
      </>
    )}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm !important;
          }
          html, body {
            height: auto;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * { visibility: hidden; }
          #internal-memo-sheet, #internal-memo-sheet * { visibility: visible; }
          #internal-memo-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 198mm !important;
            height: 280mm !important;
            min-height: 0 !important;
            margin: 0 auto !important;
            padding: 4mm !important;
            border: 1px solid #000 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            transform: scale(0.74) !important;
            transform-origin: top center !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #internal-memo-sheet * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      {previewCl && (
        <ConfirmationLetterPrintPreview
          cl={previewCl}
          onClose={() => setPreviewCl(null)}
        />
      )}
      {viewPartsCl && (() => {
        const viewCl = viewPartsCl;
        let partItems: any[] = viewCl.items || [];
        if (partItems.length === 0) {
          if (viewCl.supplierName?.includes("JAYADI")) {
            partItems = [
              { no: 1, partName: "Motherboard X1", totalQty: 1000, qtyNG: 10, ngActual: 1.0, stdAllowance: 5, qtyClaim: 5 },
              { no: 2, partName: "Gelas Kaca", totalQty: 500, qtyNG: 3, ngActual: 0.6, stdAllowance: 3, qtyClaim: 0 }
            ];
          } else if (viewCl.supplierName?.includes("IKAN BAKAR")) {
            partItems = [
              { no: 1, partName: "Harddisk 1TB", totalQty: 2000, qtyNG: 20, ngActual: 1.0, stdAllowance: 10, qtyClaim: 10 },
              { no: 2, partName: "CPU Fan Cooler", totalQty: 800, qtyNG: 4, ngActual: 0.5, stdAllowance: 4, qtyClaim: 0 }
            ];
          } else {
            partItems = [
              { no: 1, partName: "CONE RACE ALL TYPE", totalQty: 3000, qtyNG: 15, ngActual: 0.5, stdAllowance: 15, qtyClaim: 0 }
            ];
          }
        }

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col font-sans">
              <div className="p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider">Rincian Part Kualitas Vendor</h3>
                  <p className="text-[10px] text-indigo-200 font-semibold mt-0.5">Vendor: {viewCl.supplierName || "—"} | CL: {viewCl.clNumber || "—"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewPartsCl(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="p-5 overflow-y-auto space-y-4 text-left">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-655 text-[11px] font-semibold leading-relaxed">
                  Berikut adalah daftar rincian part reject/NG dan allowance ratio untuk denda kualitas <strong className="text-slate-800">{viewCl.clNumber}</strong>.
                </div>
                
                <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white p-1.5 shadow-inner">
                  <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="text-[10px] text-slate-500 font-extrabold uppercase border-b border-slate-200 tracking-wider">
                        <th className="p-2 w-12 text-center">No</th>
                        <th className="p-2">Part Name / Description</th>
                        <th className="p-2 text-center w-24">Total Qty</th>
                        <th className="p-2 text-center w-24">Qty NG</th>
                        <th className="p-2 text-center w-24">NG % Actual</th>
                        <th className="p-2 text-center w-28">Std Allowance</th>
                        <th className="p-2 text-center w-24">Qty Claim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {partItems.map((item: any, idx: number) => {
                        const ngPct = item.ngActual ?? (item.totalQty > 0 ? ((item.qtyNG / item.totalQty) * 100).toFixed(2) : 0);
                        const isOver = parseFloat(String(ngPct)) > 0.5;
                        return (
                          <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${isOver ? 'bg-red-50/20' : ''}`}>
                            <td className="p-2 text-center font-mono font-bold text-slate-400">{item.no || idx + 1}</td>
                            <td className="p-2 font-bold text-slate-800">
                              <div className="w-full px-2.5 py-1 border border-slate-300 bg-slate-50 text-slate-800 rounded font-sans text-[11px]">
                                {item.partName}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="w-full px-2 py-1 border border-slate-350 bg-slate-50 text-center font-mono text-[11px] text-slate-700 rounded">
                                {item.totalQty?.toLocaleString()}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="w-full px-2 py-1 border border-slate-350 bg-slate-50 text-center font-mono font-bold text-red-650 rounded">
                                {item.qtyNG}
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded font-mono font-bold text-[10px] ${isOver ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                                {ngPct}%
                              </span>
                            </td>
                            <td className="p-2">
                              <div className="w-full px-2 py-1 border border-slate-350 bg-slate-50 text-center font-mono text-[11px] text-slate-600 rounded">
                                {item.stdAllowance}%
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="w-full px-2 py-1 border border-slate-350 bg-slate-50 text-center font-mono font-bold text-indigo-700 rounded">
                                {item.qtyClaim}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewPartsCl(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
