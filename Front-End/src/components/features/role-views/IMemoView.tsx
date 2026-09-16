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
  Eye,
  Upload,
  Paperclip,
  Loader2
} from "lucide-react";
import ConfirmationLetterPrintPreview from "./ConfirmationLetterPrintPreview";
import QprPrintPreview from "./QprPrintPreview";
import { parseCLPdf } from "@/utils/parseCLPdf";
import { sscService, mapBillingFromDb, mapPaymentFromDb } from "@/services/sscService";
import { clService } from "@/services/clService";
import { vendorService } from "@/services/vendorService";

interface IMemoViewProps {
  confirmationLetters: any[];
  setConfirmationLetters: React.Dispatch<React.SetStateAction<any[]>>;
  parts?: any[];
  createdSscBillings?: any[];
  setCreatedSscBillings?: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveTab?: (tab: string) => void;
  setNotifications?: React.Dispatch<React.SetStateAction<any[]>>;
  username?: string;
}

export default function IMemoView({
  confirmationLetters,
  setConfirmationLetters,
  parts = [],
  createdSscBillings = [],
  setCreatedSscBillings = () => {},
  setActiveTab,
  setNotifications = null,
  username = "admin"
}: IMemoViewProps) {
  // Role Access Checks
  const isPurchasing = username === "purchasing";
  const isFinance = username === "finance";
  const isAdmin = username === "admin" || !username;

  // Permissions:
  // Kirim CL: HANYA Purchasing (Cicik Andria) & Admin
  // SSC Billing & SSC Payment: HANYA Finance & Admin
  // Parts Vendor: All
  const canAccessKirimCl = isPurchasing || isAdmin;
  const canAccessSscBilling = isFinance || isAdmin;
  const canAccessSscPayment = isFinance || isAdmin;
  const canAccessParts = isPurchasing || isFinance || isAdmin;

  const [sscBillingRows, setSscBillingRows] = useState<any[]>([]);
  const [selectedClId, setSelectedClId] = useState<string>("");
  const [selectedBillingClId, setSelectedBillingClId] = useState<string>("");
  const [createdSscPayments, setCreatedSscPayments] = useState<any[]>([]);
  const [draftSearchTerm, setDraftSearchTerm] = useState<string>("");
  const [draftFilterSupplier, setDraftFilterSupplier] = useState<string>("ALL");
  const [activeSubTab, setActiveSubTab] = useState<
    "kirim_cl" | "ssc_purchasing" | "buat_ssc_payment" | "draft_ssc_billing" | "draft_ssc_payment" | "parts_per_vendor" | "reminder"
  >(() => {
    if (username === "purchasing") return "kirim_cl";
    if (username === "finance") return "ssc_purchasing";
    return "kirim_cl";
  });

  // Automatically enforce accessible subtab if role changes or unauthorized subtab is set
  useEffect(() => {
    if (username === "purchasing") {
      if (activeSubTab === "ssc_purchasing" || activeSubTab === "buat_ssc_payment") {
        setActiveSubTab("kirim_cl");
      }
    } else if (username === "finance") {
      if (activeSubTab === "kirim_cl" || (activeSubTab as any) === "reminder") {
        setActiveSubTab("ssc_purchasing");
      }
    }
  }, [username, activeSubTab]);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSscBillingPreview, setShowSscBillingPreview] = useState(false);
  const [showSscPaymentPreview, setShowSscPaymentPreview] = useState(false);
  const [previewCl, setPreviewCl] = useState<any | null>(null);
  const [previewQpr, setPreviewQpr] = useState<any | null>(null);
  const [sscFiles, setSscFiles] = useState<Array<{ file: File; rowId: string }>>([]);
  const [viewPartsCl, setViewPartsCl] = useState<any | null>(null);
  const [clUploadedFile, setClUploadedFile] = useState<File | null>(null);

  // Vendor email sender states & working days logic
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [selectedVendorName, setSelectedVendorName] = useState<string>("");
  const [vendorEmailInput, setVendorEmailInput] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("Confirmation Letter – Part NG");
  const [emailCopied, setEmailCopied] = useState<boolean>(false);
  const [selectedClForEmailId, setSelectedClForEmailId] = useState<string>("");
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);

  // Fetch vendors from DB on mount
  useEffect(() => {
    vendorService.getAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVendorsList(data);
        }
      })
      .catch((err) => console.warn("Notice: Failed to load vendors for email view:", err));
  }, []);

  // Compute all available vendors from confirmationLetters, parts, and DB vendors
  const allAvailableVendors = React.useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    
    // Add from DB vendors
    vendorsList.forEach((v: any) => {
      const name = v.vendorName || `Vendor ${v.vendorCode}`;
      if (name) {
        map.set(name.toLowerCase(), {
          name: name,
          email: v.email || `marketing@${name.replace(/^PT\.?\s+/i, "").replace(/^CV\.?\s+/i, "").replace(/\s+(INDONESIA|TBA|TBK|ENGINEERING|MANUFACTURING|JAYA|MITRA).*$/i, "").trim().toLowerCase()}.co.id`
        });
      }
    });

    // Add from confirmation letters
    confirmationLetters.forEach((cl: any) => {
      if (cl.supplierName && !map.has(cl.supplierName.toLowerCase())) {
        const short = cl.supplierName.replace(/^PT\.?\s+/i, "").replace(/^CV\.?\s+/i, "").replace(/\s+(INDONESIA|TBA|TBK|ENGINEERING|MANUFACTURING|JAYA|MITRA).*$/i, "").trim().toLowerCase();
        map.set(cl.supplierName.toLowerCase(), {
          name: cl.supplierName,
          email: `marketing@${short || "vendor"}.co.id`
        });
      }
    });

    // Ensure PT ADIKU MITRA JAYA is present if not already
    if (!map.has("pt adiku mitra jaya") && !map.has("adiku")) {
      map.set("pt adiku mitra jaya", {
        name: "PT ADIKU MITRA JAYA",
        email: "marketing@adiku.co.id"
      });
    }

    return Array.from(map.values());
  }, [vendorsList, confirmationLetters]);

  // Set initial selected vendor
  useEffect(() => {
    if (allAvailableVendors.length > 0 && !selectedVendorName) {
      setSelectedVendorName(allAvailableVendors[0].name);
      setVendorEmailInput(allAvailableVendors[0].email);
    }
  }, [allAvailableVendors, selectedVendorName]);

  // When vendor changes, update email input
  const handleVendorChange = (vendorName: string) => {
    setSelectedVendorName(vendorName);
    const found = allAvailableVendors.find(v => v.name.toLowerCase() === vendorName.toLowerCase());
    if (found) {
      setVendorEmailInput(found.email);
    } else {
      const short = vendorName.replace(/^PT\.?\s+/i, "").replace(/^CV\.?\s+/i, "").replace(/\s+(INDONESIA|TBA|TBK|ENGINEERING|MANUFACTURING|JAYA|MITRA).*$/i, "").trim().toLowerCase();
      setVendorEmailInput(`marketing@${short || "vendor"}.co.id`);
    }
  };

  // Filter CLs belonging to selected vendor
  const vendorCls = React.useMemo(() => {
    if (!selectedVendorName) return [];
    return confirmationLetters.filter((cl: any) => {
      const sup = (cl.supplierName || "").toLowerCase();
      const sel = selectedVendorName.toLowerCase();
      return sup.includes(sel) || sel.includes(sup);
    });
  }, [confirmationLetters, selectedVendorName]);

  // Date calculation helper: add N days directly to start date (e.g. 17 Sept + 10 days = 27 Sept)
  const addWorkingDays = (startDate: Date, days: number): Date => {
    const result = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    result.setDate(result.getDate() + days);
    return result;
  };

  const formatIndoDate = (date: Date): string => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const countWorkingDaysBetween = (start: Date, end: Date): number => {
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (e <= s) return 0;
    let count = 0;
    const cur = new Date(s);
    while (cur < e) {
      cur.setDate(cur.getDate() + 1);
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
    }
    return count;
  };

  const [sendDateIso, setSendDateIso] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [workingDays, setWorkingDays] = useState<number>(10);

  const parsedSendDate = React.useMemo(() => {
    if (!sendDateIso) return new Date();
    const parts = sendDateIso.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(sendDateIso);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [sendDateIso]);

  const formattedSendDate = React.useMemo(() => {
    return formatIndoDate(parsedSendDate);
  }, [parsedSendDate]);

  // Due Date is automatically calculated 10 working days from the send date
  const calculatedDueDate = React.useMemo(() => {
    return formatIndoDate(addWorkingDays(parsedSendDate, workingDays));
  }, [parsedSendDate, workingDays]);

  const handleQuickDueDays = (days: number) => {
    setWorkingDays(days);
  };

  const vendorShortName = React.useMemo(() => {
    if (!selectedVendorName) return "Vendor";
    return selectedVendorName
      .replace(/^PT\.?\s+/i, "")
      .replace(/^CV\.?\s+/i, "")
      .replace(/\s+(INDONESIA|TBA|TBK|ENGINEERING|MANUFACTURING|JAYA|MITRA).*$/i, "")
      .trim();
  }, [selectedVendorName]);

  const emailToHeader = React.useMemo(() => {
    return `"'Marketing ${vendorShortName}'"<${vendorEmailInput}>`;
  }, [vendorShortName, vendorEmailInput]);

  // Helper to parse clean numeric amount from strings or numbers
  const parseNumericClaim = (val: any): number => {
    if (typeof val === "number" && !isNaN(val)) return val;
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9]/g, "");
    return parseInt(clean, 10) || 0;
  };

  // Helper to extract clean part name from CL or QPR
  const resolvePartDesc = (cl: any): string => {
    if (!cl) return "ALL TYPE PART FINISH";
    if (cl.partName && cl.partName !== "-" && cl.partName !== "") return cl.partName;
    if (cl.items && Array.isArray(cl.items) && cl.items.length > 0 && cl.items[0]?.partName) {
      return cl.items[0].partName;
    }
    if (cl.qprSourceData?.parts && Array.isArray(cl.qprSourceData.parts) && cl.qprSourceData.parts.length > 0 && cl.qprSourceData.parts[0]?.partName) {
      return cl.qprSourceData.parts[0].partName;
    }
    if (cl.qpr?.qprParts && Array.isArray(cl.qpr.qprParts) && cl.qpr.qprParts.length > 0) {
      const p = cl.qpr.qprParts[0];
      return p.part?.partDesc || p.part?.partNumber || p.partName || "ALL TYPE PART FINISH";
    }
    return "INNER TUBE,650 A";
  };

  const activeClForEmail = React.useMemo(() => {
    const baseCl = (
      vendorCls.find((c: any) => c.id === selectedClForEmailId) ||
      vendorCls[0] ||
      confirmationLetters.find((c: any) => (c.supplierName || "").toLowerCase().includes((selectedVendorName || "").toLowerCase())) ||
      confirmationLetters[0] || {
        id: "cl_default",
        clNumber: `CL/2026/09/${(selectedVendorName || "VENDOR").replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_570`,
        qprNumber: "01/QI/QPR/SUB/09/26",
        supplierName: selectedVendorName || "PT. ARAI RUBBER SEAL IND",
        partName: "INNER TUBE,650 A",
        claimAmount: 2358750,
        totalClaimAmount: 2358750,
        amount: 2358750,
        status: "APPROVED"
      }
    );
    return {
      ...baseCl,
      dateSent: sendDateIso
    };
  }, [vendorCls, selectedClForEmailId, confirmationLetters, selectedVendorName, sendDateIso]);

  const activeQprForEmail = React.useMemo(() => {
    return (
      activeClForEmail?.qpr || {
        id: "qpr_preview",
        qprNumber: activeClForEmail?.qprNumber || "01/QI/QPR/SUB/09/26",
        supplierName: activeClForEmail?.supplierName || selectedVendorName || "PT. ARAI RUBBER SEAL IND",
        partName: resolvePartDesc(activeClForEmail),
        status: "APPROVED",
        refNcrNumber: activeClForEmail?.refNcrNumber || "NCR/2026/09/001",
        problem: activeClForEmail?.problem || "Claim Part NG / Out of Tolerance",
        rejectItems: activeClForEmail?.qty || activeClForEmail?.qtyNG || 25,
        claimAmount: activeClForEmail?.amount || activeClForEmail?.claimAmount || "2358750",
        approvedBy: ["Creator", "Section Head", "Dept Head", "Div Head", "Purchasing"],
        approvalProgress: {
          approvedAtSectionHead: true,
          approvedAtDeptHead: true,
          approvedAtDivHead: true,
          approvedAtPurchasing: true
        }
      }
    );
  }, [activeClForEmail, selectedVendorName]);

  const generatedEmailBody = React.useMemo(() => {
    return `Dear Team ${vendorShortName},

Berikut kami sampaikan Confirmation Letter terkait part NG sesuai dengan data terlampir.

Mohon bantuannya untuk melakukan konfirmasi sesuai dengan due date, yaitu maksimal ${workingDays} hari sejak Confirmation Letter diterima, atau paling lambat pada ${calculatedDueDate}.

Terima kasih atas perhatian dan kerja samanya.

Best regards, 

Purchasing Department
PT MENARA TERUS MAKMUR
Jl. Jababeka XI Blok H-3 no 12
Cikarang Bekasi 17530 Indonesia`;
  }, [vendorShortName, workingDays, calculatedDueDate]);

  const handleSendVendorEmail = async (specificCl?: any) => {
    if (!vendorEmailInput) {
      alert("Harap masukkan alamat email vendor!");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const targetCls = specificCl ? [specificCl] : (activeClForEmail ? [activeClForEmail] : (vendorCls.length > 0 ? vendorCls : []));
    const targetClIds = targetCls.map(c => c.id || c.clNumber).filter(Boolean);

    // Gather client attachments if available
    const clientAttachments: any[] = [];
    if (activeQprForEmail?.pdfFiles && Array.isArray(activeQprForEmail.pdfFiles)) {
      activeQprForEmail.pdfFiles.forEach((f: any) => {
        if (f.base64) {
          clientAttachments.push({ filename: f.name || "Dokumen_QPR.pdf", content: f.base64 });
        }
      });
    } else if (activeQprForEmail?.pdfFileBase64) {
      try {
        if (activeQprForEmail.pdfFileBase64.startsWith("[")) {
          JSON.parse(activeQprForEmail.pdfFileBase64).forEach((f: any) => {
            if (f.base64) clientAttachments.push({ filename: f.name || "Dokumen_QPR.pdf", content: f.base64 });
          });
        } else {
          clientAttachments.push({ filename: activeQprForEmail.pdfFileName || "Dokumen_QPR.pdf", content: activeQprForEmail.pdfFileBase64 });
        }
      } catch (e) {}
    }

    setIsSendingEmail(true);
    try {
      // Send directly via Backend SMTP
      const result = await clService.sendEmail({
        clIds: targetClIds,
        clId: targetClIds[0],
        to: vendorEmailInput,
        subject: emailSubject || "Confirmation Letter – Part NG",
        body: generatedEmailBody,
        vendorName: selectedVendorName,
        dueDate: calculatedDueDate,
        attachments: clientAttachments,
      });

      // Update local state
      setConfirmationLetters(prev =>
        prev.map(cl => {
          const isMatch = targetCls.some(tc => tc.id === cl.id || tc.clNumber === cl.clNumber);
          if (isMatch) {
            return {
              ...cl,
              purchasingSentCl: true,
              purchasingSentDate: todayStr,
              sentToVendor: true
            };
          }
          return cl;
        })
      );

      if (setNotifications) {
        const clCode = targetCls[0]?.clNumber || "CL";
        const supName = selectedVendorName || "Vendor";
        setNotifications((prev: any[]) => [{
          id: Date.now(),
          message: `Surat CL ${clCode} berhasil dikirimkan ke email ${supName} (${vendorEmailInput}) dan menunggu persetujuan Vendor.`,
          time: "Baru saja",
          type: "success" as const,
          unread: true
        }, ...prev]);
      }

      const attInfo = result?.attachmentsCount 
        ? `\n📁 Berkas Lampiran: ${result.attachmentsCount} file (Surat CL & Dokumen QPR)`
        : '';
      const serverNotice = result?.simulated
        ? `\nℹ️ Status: Tercatat di sistem (Mode Simulasi Server)`
        : `\n⚡ Status: Terkirim via SMTP Server`;

      alert(
        `Email Confirmation Letter berhasil diproses!\n\n` +
        `• Vendor: ${selectedVendorName || "Vendor"}\n` +
        `• Email Tujuan: ${vendorEmailInput}\n` +
        `• Tgl Kirim Dokumen: ${formattedSendDate}\n` +
        `• Jatuh Tempo: ${calculatedDueDate} (${workingDays} HK)\n` +
        `${attInfo}` +
        `${serverNotice}`
      );
    } catch (err: any) {
      console.error("Failed to auto-send email:", err);
      // Fallback with user option
      const fallbackToMailto = confirm(
        `Gagal mengirim email otomatis melalui server: ${err.message || "Koneksi backend terputus"}.\n\nApakah Anda ingin membuka email client (Outlook/Webmail) manual sebagai alternatif?`
      );
      if (fallbackToMailto) {
        const subject = encodeURIComponent(emailSubject || "Confirmation Letter – Part NG");
        const body = encodeURIComponent(generatedEmailBody);
        window.open(`mailto:${vendorEmailInput}?subject=${subject}&body=${body}`);
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopyEmailText = () => {
    const fullEmailText = `To: ${emailToHeader}\nSubject: ${emailSubject}\n\n${generatedEmailBody}`;
    navigator.clipboard.writeText(fullEmailText);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const handleToggleVendorApproval = async (cl: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !cl.vendorApproved;
    const todayStr = new Date().toISOString().split("T")[0];
    const payload = {
      vendorApproved: newStatus,
      vendorApprovedDate: newStatus ? todayStr : null,
      readyForSSC: newStatus,
      status: newStatus ? "APPROVED" : (cl.status === "APPROVED" || cl.status === "FULLY_APPROVED" ? "PENDING" : cl.status)
    };

    try {
      await clService.update(cl.id, payload);
    } catch (err) {
      console.warn("Notice: Failed to update vendor approval on server:", err);
    }

    setConfirmationLetters(prev =>
      prev.map(item => {
        if (item.id === cl.id || item.clNumber === cl.clNumber) {
          return {
            ...item,
            ...payload
          };
        }
        return item;
      })
    );

    if (newStatus) {
      alert(`Status CL ${cl.clNumber} (${cl.supplierName}) berhasil diubah menjadi: DISETUJUI VENDOR!\n\nData CL otomatis terlempar dan langsung tersedia di antrian SSC Billing & SSC Payment.`);
    } else {
      alert(`Status CL ${cl.clNumber} diubah menjadi: BELUM DISETUJUI VENDOR.`);
    }
  };

  const handleUploadVendorApprovedCl = async (cl: any, file: File) => {
    if (!file) return;
    const todayStr = new Date().toISOString().split("T")[0];
    const fileUrl = URL.createObjectURL(file);
    const payload: any = {
      vendorApproved: true,
      vendorApprovedDate: todayStr,
      vendorApprovedDocName: file.name,
      vendorApprovedDocUrl: fileUrl,
      signedClFileName: file.name,
      signedClFileUrl: fileUrl,
      readyForSSC: true,
      status: "APPROVED"
    };

    try {
      await clService.update(cl.id, payload);
    } catch (err) {
      console.warn("Notice: Failed to update vendor approval on server:", err);
    }

    setConfirmationLetters(prev =>
      prev.map(item => {
        if (item.id === cl.id || item.clNumber === cl.clNumber) {
          return {
            ...item,
            ...payload
          };
        }
        return item;
      })
    );

    alert(`Sukses Upload Dokumen CL Approval Vendor: ${file.name}!\n\nStatus CL ${cl.clNumber} kini resmi DISETUJUI VENDOR dan otomatis terlempar ke antrian SSC Billing & SSC Payment.`);
  };

  const handleManualCreateAndUploadCl = async (file: File) => {
    if (!file) return;
    const todayStr = new Date().toISOString().split("T")[0];
    const fileUrl = URL.createObjectURL(file);
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const vendorClean = (selectedVendorName || "VENDOR").replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
    const newClNumber = `CL/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${vendorClean}_${randSuffix}`;

    const newCl: any = {
      id: `cl_manual_${Date.now()}`,
      clNumber: newClNumber,
      qprNumber: `01/QI/QPR/SUB/${String(new Date().getMonth() + 1).padStart(2, "0")}/${String(new Date().getFullYear()).slice(-2)}`,
      supplierName: selectedVendorName || "PT. Vendor Indonesia",
      partName: "Manual Part NG",
      claimAmount: 0,
      totalClaimAmount: 0,
      amount: 0,
      status: "APPROVED",
      vendorApproved: true,
      vendorApprovedDate: todayStr,
      vendorApprovedDocName: file.name,
      vendorApprovedDocUrl: fileUrl,
      signedClFileName: file.name,
      signedClFileUrl: fileUrl,
      readyForSSC: true,
      dateSent: todayStr,
    };

    try {
      await clService.create(newCl);
    } catch (err) {
      console.warn("Notice: Failed to persist manual CL on server:", err);
    }

    setConfirmationLetters(prev => [newCl, ...prev]);
    setSelectedClForEmailId(newCl.id);

    alert(`Sukses Upload Dokumen CL Approval Vendor: ${file.name}!\n\nDokumen ${newClNumber} berhasil didaftarkan dan langsung aktif untuk antrian SSC Billing & Payment.`);
  };

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
  const [sigPrepared, setSigPrepared] = useState("Bagas Nur Pratama");
  const [sigPreparedRole, setSigPreparedRole] = useState("Accounting BU");
  const [sigApproved1, setSigApproved1] = useState("Anindita Irnilaningtyas");
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
    setSscBillingRows(prev => {
      if (confirmationLetters.length === 0) return [];

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
          vendorApproved: cl.vendorApproved || false,
          vendorApprovedDate: cl.vendorApprovedDate || "",
          readyForSSC: cl.vendorApproved || false,
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
        if (match) return { 
          ...row, 
          status: match.status, 
          amount: match.amount, 
          supplierName: match.supplierName,
          vendorApproved: match.vendorApproved,
          vendorApprovedDate: match.vendorApprovedDate,
          readyForSSC: match.vendorApproved,
          sentToVendor: match.sentToVendor
        };
        return row;
      });
      return [...updated.filter(r => confirmationLetters.some(cl => cl.id === r.id)), ...newFromCl];
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

  // Auto-populate billing form when user selects a CL from the left panel
  useEffect(() => {
    if (!selectedBillingClId) return;
    const cl = sscBillingRows.find((r: any) => r.id === selectedBillingClId);
    if (!cl) return;

    const formatToDisplay = (raw: string) => {
      if (!raw) return "";
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      }
      return raw;
    };

    setMemoRequestDate(formatToDisplay(cl.dateSent));
    setMemoCustomerName(cl.supplierName);
    setMemoAmount(cl.amount ? cl.amount.replace(/[^0-9]/g, "") : "");
    setMemoPeriod(cl.dateSent ? `${String(new Date(cl.dateSent).getMonth() + 1).padStart(2, "0")}/${String(new Date(cl.dateSent).getFullYear()).slice(-2)}` : "02/26");
    setMemoTitle("Permintaan Pembuatan Invoice Claim NG Part");
    setMemoDescription(`Mohon dibuatkan invoice untuk Claim Part NG dari ${cl.supplierName} atas CL ${cl.clNumber}`);
    setAcctCustomerCode(cl.customerCode || "OTC08002");
    
    // Auto-generate some GL rows based on amount
    const rawAmt = cl.amount ? cl.amount.replace(/[^0-9]/g, "") : "0";
    const numAmt = parseInt(rawAmt, 10) || 0;
    if (numAmt > 0) {
      const dpp = Math.round(numAmt / 1.11);
      const vat = numAmt - dpp;
      
      const formatNum = (n: number) => {
        return n.toLocaleString("id-ID");
      };

      setGlRows([
        { code: cl.customerCode || "OTC08002", name: cl.supplierName, costCenter: "", amountDr: formatNum(numAmt), amountCr: "", text: "Claim Part NG" },
        { code: "545-102-0000", name: "FOH Subcont Fee", costCenter: "MT015FOHGE", amountDr: "", amountCr: formatNum(dpp), text: "Claim Part NG" },
        { code: "211-310-0000", name: "Tax Pay VAT Out", costCenter: "", amountDr: "", amountCr: formatNum(vat), text: "ppn 11%" }
      ]);
    }

    setSelectedClId(selectedBillingClId);
  }, [selectedBillingClId]);

  // Selected CL for Buat SSC Payment panel
  const [selectedPaymentClId, setSelectedPaymentClId] = useState<string>("");

  // Auto-populate payment form when user selects an SSC Billing from the selector
  useEffect(() => {
    if (!selectedPaymentClId) return;
    const selectedBilling = createdSscBillings.find((r: any) => r.id === selectedPaymentClId);
    const targetCl = confirmationLetters.find(cl => cl.id === selectedPaymentClId || cl.clNumber === selectedBilling?.clNumber);
    const billingOrCl = selectedBilling || targetCl;
    if (!billingOrCl) return;

    const formatToDisplay = (raw: string) => {
      if (!raw) return "";
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      }
      return raw;
    };

    setPayCompany("PT Menara Terus Makmur");
    setPayBusinessArea("MT");
    setPayRequestDate(formatToDisplay(billingOrCl.dateSent || billingOrCl.memoRequestDate || new Date().toISOString()));
    setPayTitle("Permohonan Pemotongan Invoice Vendor");
    setPayTo("SSC Invoicing & Payment");
    setPayInstruction("Sehubungan dengan ditemukannya komponen NG yang bukan disebabkan oleh proses internal kami, mohon dapat dilakukan pemotongan pembayaran terhadap vendor berikut :");
    setPaySigPrepared("Bagas Nur Pratama");
    setPaySigPreparedRole("Accounting BU");
    setPaySigApproved1("Anindita Irnilaningtyas");
    setPaySigApproved1Role("Accounting Dept Head");
    setPaySigApproved2("Evi Sulistyorini");
    setPaySigApproved2Role("Admin Div/BOD");
    setPaySigEntry("");
    setPaySigEntryRole("SSC Billing Admin");
    setPaySigChecked("");
    setPaySigCheckedRole("AR Function Lead");
  }, [selectedPaymentClId, createdSscBillings, confirmationLetters]);

  // Filter CLs that are approved by vendor, not yet processed into SSC Billing, and not closed/paid
  const availableClsForBilling = sscBillingRows.filter((cl: any) => {
    const isVendorApproved = cl.status === "FULLY_APPROVED" || cl.status === "APPROVED" || cl.status === "APPROVED_BY_VENDOR" || cl.vendorApproved;
    const isAlreadyBilled = createdSscBillings.some((b: any) => b.clId === cl.id || b.clNumber === cl.clNumber);
    const isClosed = cl.status === "CLOSED_PAID" || cl.closedPaid;
    return isVendorApproved && !isAlreadyBilled && !isClosed;
  });

  // Filter SSC Billings that are created, not yet processed into SSC Payment, and not closed/paid
  const availableBillingsForPayment = createdSscBillings.filter((billing: any) => {
    const isAlreadyPaid = createdSscPayments.some((p: any) =>
      (p.clId && billing.id && String(p.clId) === String(billing.id)) ||
      (p.clId && billing.clId && String(p.clId) === String(billing.clId)) ||
      (p.clNumber && billing.clNumber && String(p.clNumber) === String(billing.clNumber)) ||
      (p.id && billing.id && String(p.id) === String(billing.id))
    );
    const isClosed = billing.status === "CLOSED_PAID" || billing.closedPaid || billing.status === "SUCCESS";
    return !isAlreadyPaid && !isClosed;
  });


  const handlePrint = () => {
    const clNumVal = sscBillingRows.find((r: any) => r.id === selectedBillingClId)?.clNumber || `CL-${Date.now()}`;
    const parsedAmount = parseFloat(memoAmount || "0");

    const payload = {
      clId: selectedBillingClId,
      billingNo: `INV/${clNumVal.replace("CL/", "")}`,
      billingDate: new Date().toISOString(),
      totalAmount: parsedAmount,
      status: "UNPAID",
      memoCompany,
      memoBusinessArea,
      memoRequestDate,
      memoBillingType,
      memoPeriod,
      memoTitle,
      memoRequestTo,
      memoDescription,
      memoCustomerType,
      memoNpwp,
      memoSupportingDoc,
      memoBillingAddressedTo,
      memoCustomerName,
      memoCurrency,
      memoAmount: String(parsedAmount),
      memoSays,
      acctCustomerCode,
      acctCustomerType,
      acctTradingPartner: acctTradingPartner || "",
      acctExchangeRate: acctExchangeRate || "",
      acctJournal: acctJournal || "",
      glRows: JSON.stringify(glRows),
      sigPrepared,
      sigPreparedRole: sigPreparedRole || "Purchasing",
      sigApproved1,
      sigApproved1Role: sigApproved1Role || "Accounting Section Head",
      sigApproved2,
      sigApproved2Role: sigApproved2Role || "Accounting Dept Head",
      sigEntry: sigEntry || "",
      sigEntryRole: sigEntryRole || "",
      sigChecked: sigChecked || "",
      sigCheckedRole: sigCheckedRole || ""
    };

    sscService.createBilling(payload)
      .then(() => {
        sscService.getAllBillings().then(data => {
          if (Array.isArray(data) && setCreatedSscBillings) {
            setCreatedSscBillings(data.map(mapBillingFromDb));
          }
        });
      })
      .catch((err) => {
        console.error("Failed to save SSC Billing in DB:", err);
      });

    // Pastikan sheet preview ter-mount sebelum print
    setShowSscBillingPreview(true);
    setTimeout(() => {
      const sheetId = "manual-billing-sheet";
      document.documentElement.setAttribute("data-printing-memo", sheetId);
      window.print();
      setTimeout(() => {
        document.documentElement.removeAttribute("data-printing-memo");
      }, 1000);
    }, 150);
  };

  const handlePrintPayment = () => {
    const selectedBilling = createdSscBillings.find((r: any) => r.id === selectedPaymentClId);
    const targetCl = confirmationLetters.find(cl => cl.id === selectedPaymentClId || cl.clNumber === selectedBilling?.clNumber);
    const clId = targetCl?.id || selectedBilling?.clId || selectedPaymentClId;
    const clNumVal = selectedBilling?.clNumber || targetCl?.clNumber || `CL-${Date.now()}`;
    const rawAmt = selectedBilling?.memoAmount || selectedBilling?.amount?.replace(/[^0-9]/g, "") || "0";
    const parsedAmount = parseFloat(rawAmt);

    const paymentPayload = {
      clId,
      paymentNo: `PAY/${clNumVal.replace("CL/", "")}`,
      paymentDate: new Date().toISOString(),
      amountPaid: parsedAmount,
      status: "PENDING",
      payCompany,
      payBusinessArea,
      payTitle,
      payTo,
      payInstruction,
      payRequestDate,
      paySigPrepared,
      paySigApproved1,
      paySigApproved2,
      paySigEntry
    };

    if (clId && clId.length > 10) {
      sscService.createPayment(paymentPayload)
        .catch((err) => {
          console.warn("Notice: SscPayment persisted or already exists:", err?.message || err);
        });

      // Trigger vendor sent & lead time progress update in CL
      clService.update(clId, {
        purchasingSentCl: true,
        purchasingSentDate: new Date().toISOString()
      }).catch(err => console.warn("Notice: CL sent status update:", err));
    }

    // Trigger local state synchronization for Dashboard and Lead Time
    setConfirmationLetters(prev => prev.map(cl => {
      if (cl.id === clId || cl.clNumber === clNumVal) {
        return {
          ...cl,
          purchasingSentCl: true,
          purchasingSentDate: cl.purchasingSentDate || new Date().toISOString(),
          status: cl.status === "CLOSED_PAID" ? "CLOSED_PAID" : "APPROVED_BY_VENDOR"
        };
      }
      return cl;
    }));

    // Pastikan sheet preview ter-mount sebelum print
    setShowSscPaymentPreview(true);
    setTimeout(() => {
      const sheetId = "internal-memo-sheet";
      document.documentElement.setAttribute("data-printing-memo", sheetId);
      window.print();
      setTimeout(() => {
        document.documentElement.removeAttribute("data-printing-memo");
      }, 1000);
    }, 150);
  };

  const handleConfirmToPayment = () => {
    const clNumVal = sscBillingRows.find((r: any) => r.id === selectedBillingClId)?.clNumber || `CL-${Date.now()}`;
    const parsedAmount = parseFloat(memoAmount || "0");

    const payload = {
      clId: selectedBillingClId,
      billingNo: `INV/${clNumVal.replace("CL/", "")}`,
      billingDate: new Date().toISOString(),
      totalAmount: parsedAmount,
      status: "UNPAID",
      memoCompany,
      memoBusinessArea,
      memoRequestDate,
      memoBillingType,
      memoPeriod,
      memoTitle,
      memoRequestTo,
      memoDescription,
      memoCustomerType,
      memoNpwp,
      memoSupportingDoc,
      memoBillingAddressedTo,
      memoCustomerName,
      memoCurrency,
      memoAmount: String(parsedAmount),
      memoSays,
      acctCustomerCode,
      acctCustomerType,
      acctTradingPartner: acctTradingPartner || "",
      acctExchangeRate: acctExchangeRate || "",
      acctJournal: acctJournal || "",
      glRows: JSON.stringify(glRows),
      sigPrepared,
      sigPreparedRole: sigPreparedRole || "Purchasing",
      sigApproved1,
      sigApproved1Role: sigApproved1Role || "Accounting Section Head",
      sigApproved2,
      sigApproved2Role: sigApproved2Role || "Accounting Dept Head",
      sigEntry: sigEntry || "",
      sigEntryRole: sigEntryRole || "",
      sigChecked: sigChecked || "",
      sigCheckedRole: sigCheckedRole || ""
    };

    // Optimistic billing state update for instant zero-delay UI transition
    const optimisticBilling = {
      id: selectedBillingClId,
      clId: selectedBillingClId,
      clNumber: clNumVal,
      billingNo: `INV/${clNumVal.replace("CL/", "")}`,
      supplierName: memoCustomerName || "PT TEMARU ENGINEERING INDONESIA",
      billingDate: new Date().toISOString(),
      amount: `Rp ${parsedAmount.toLocaleString("id-ID")}`,
      memoAmount: String(parsedAmount),
      status: "UNPAID",
      ...payload
    };
    if (setCreatedSscBillings) {
      setCreatedSscBillings(prev => [optimisticBilling, ...prev.filter(b => b.clId !== selectedBillingClId && b.clNumber !== clNumVal)]);
    }

    sscService.createBilling(payload)
      .then(() => {
        sscService.getAllBillings().then(data => {
          if (Array.isArray(data) && setCreatedSscBillings) {
            setCreatedSscBillings(data.map(mapBillingFromDb));
          }
        });
      })
      .catch((err) => {
        console.error("Failed to save SSC Billing in DB:", err);
      });

    // 2. Load fields to pay form state
    setPayCompany(memoCompany);
    setPayBusinessArea(memoBusinessArea);
    setPayRequestDate(memoRequestDate);
    setPayTitle("Permohonan Pemotongan Invoice Vendor");
    setPayTo("SSC Invoicing & Payment");
    const formattedAmt = memoAmount ? parseInt(memoAmount).toLocaleString("id-ID") : "0";
    setPayInstruction(
      `Sehubungan dengan ditemukannya komponen NG yang bukan disebabkan oleh proses internal kami, mohon dapat dilakukan pemotongan pembayaran terhadap vendor ${memoCustomerName} sebesar Rp ${formattedAmt} atas CL ${clNumVal}.`
    );
    setPaySigPrepared(sigPrepared);
    setPaySigPreparedRole(sigPreparedRole);
    setPaySigApproved1(sigApproved1);
    setPaySigApproved1Role(sigApproved1Role);
    setPaySigApproved2(sigApproved2);
    setPaySigApproved2Role(sigApproved2Role);
    setPaySigEntry(sigEntry);
    setPaySigEntryRole(sigEntryRole);
    setPaySigChecked(sigChecked);
    setPaySigCheckedRole(sigCheckedRole);

    // 3. Switch active payment tab selection
    setSelectedBillingClId("");
    setSelectedPaymentClId(selectedBillingClId);
    setActiveSubTab("buat_ssc_payment");
    alert(`Sukses: Data SSC Billing untuk ${clNumVal} berhasil dikonfirmasi (Confirm) tanpa ada perubahan data. Dialihkan ke tab SSC Payment.`);
  };

  // Load created SSC Payments on mount
  useEffect(() => {
    sscService.getAllPayments()
      .then((data) => {
        if (Array.isArray(data)) {
          setCreatedSscPayments(data.map(mapPaymentFromDb));
        }
      })
      .catch((err) => {
        console.warn("Could not fetch payments on mount:", err);
      });
  }, []);

  const handleConfirmPaymentFinish = () => {
    const selectedBilling = createdSscBillings.find((r: any) => r.id === selectedPaymentClId);
    const targetCl = confirmationLetters.find(cl => cl.id === selectedPaymentClId || cl.clNumber === selectedBilling?.clNumber);
    const clId = targetCl?.id || selectedBilling?.clId || selectedPaymentClId;
    const clNumVal = selectedBilling?.clNumber || targetCl?.clNumber || `CL-${Date.now()}`;
    const rawAmt = selectedBilling?.memoAmount || selectedBilling?.amount?.replace(/[^0-9]/g, "") || "0";
    const parsedAmount = parseFloat(rawAmt);

    const paymentPayload = {
      clId,
      paymentNo: `PAY/${clNumVal.replace("CL/", "")}`,
      paymentDate: new Date().toISOString(),
      amountPaid: parsedAmount,
      status: "SUCCESS",
      payCompany,
      payBusinessArea,
      payTitle,
      payTo,
      payInstruction,
      payRequestDate,
      paySigPrepared,
      paySigApproved1,
      paySigApproved2,
      paySigEntry
    };

    if (clId && clId.length > 10) {
      sscService.createPayment(paymentPayload)
        .then(() => {
          sscService.getAllPayments().then(data => {
            if (Array.isArray(data)) {
              setCreatedSscPayments(data.map(mapPaymentFromDb));
            }
          });
        })
        .catch((err) => {
          console.warn("Notice: SscPayment persisted or already exists:", err?.message || err);
        });

      // Update ConfirmationLetter to CLOSED_PAID in DB
      clService.update(clId, {
        closedPaid: true,
        status: "CLOSED_PAID",
        vendorApproved: true
      }).catch(err => console.warn("Notice: CL status update:", err));
    }

    // Trigger local state synchronization for Dashboard and Lead Time
    setConfirmationLetters(prev => prev.map(cl => {
      if (cl.id === clId || cl.clNumber === clNumVal) {
        return {
          ...cl,
          closedPaid: true,
          status: "CLOSED_PAID",
          vendorApproved: true,
          purchasingSentCl: true
        };
      }
      return cl;
    }));

    // Update local createdSscPayments state
    const newPaymentRecord = {
      id: `pay-${Date.now()}`,
      clId,
      clNumber: clNumVal,
      paymentNo: `PAY/${clNumVal.replace("CL/", "")}`,
      supplierName: targetCl?.supplierName || selectedBilling?.supplierName || "PT TEMARU ENGINEERING INDONESIA",
      paymentDate: new Date().toISOString().split("T")[0],
      amountPaid: `Rp ${parsedAmount.toLocaleString("id-ID")}`,
      status: "CLOSED_PAID",
      payCompany,
      payBusinessArea,
      payTitle,
      payTo,
      payInstruction,
      payRequestDate,
      paySigPrepared,
      paySigApproved1,
      paySigApproved2,
      paySigEntry
    };
    setCreatedSscPayments(prev => [newPaymentRecord, ...prev.filter(p => p.clNumber !== clNumVal)]);

    // Update createdSscBillings so this billing is marked as CLOSED_PAID and removed from pending selector
    if (setCreatedSscBillings) {
      setCreatedSscBillings(prev => prev.map(b => {
        if (b.id === selectedPaymentClId || b.id === selectedBilling?.id || b.clId === clId || b.clNumber === clNumVal) {
          return { ...b, status: "CLOSED_PAID", closedPaid: true };
        }
        return b;
      }));
    }

    // Update local sscBillingRows
    setSscBillingRows(prev => prev.map(b => {
      if (b.id === selectedPaymentClId || b.id === selectedBilling?.id || b.clId === clId || b.clNumber === clNumVal) {
        return { ...b, status: "CLOSED_PAID", closedPaid: true };
      }
      return b;
    }));

    // Clear selection from SSC Payment queue
    setSelectedPaymentClId("");

    alert(`Sukses: SSC Payment untuk ${clNumVal} berhasil dikonfirmasi (CLOSED_PAID)! Data telah terlempar dan tersimpan ke Daftar QPR dan Daftar CL.`);

    // Automatically throw/redirect to List QPR & CL
    if (setActiveTab) {
      setActiveTab("list-qpr");
    }
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

  const handleSendToVendor = (id: string, clNumber?: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    clService.update(id, {
      purchasingSentCl: true,
      purchasingSentDate: todayStr
    }).catch(err => console.warn("Notice: CL sent status update:", err));

    setConfirmationLetters(prev =>
      prev.map(cl => {
        if (cl.id === id || cl.clNumber === clNumber) {
          return {
            ...cl,
            purchasingSentCl: true,
            purchasingSentDate: todayStr,
            sentToVendor: true
          };
        }
        return cl;
      })
    );
    alert(`Sukses: Confirmation Letter ${clNumber || id} berhasil dikirim ke vendor!`);
  };

  const getClaimText = (cl: any) => {
    const partName = cl?.items?.[0]?.partName || cl?.partName;
    if (partName) return `CLAIM PART NG ${partName.toUpperCase()}`;
    return "CLAIM PART MATERIAL NG";
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
  const [paySigPrepared, setPaySigPrepared] = useState("Bagas Nur Pratama");
  const [paySigPreparedRole, setPaySigPreparedRole] = useState("Accounting BU");
  const [paySigApproved1, setPaySigApproved1] = useState("Anindita Irnilaningtyas");
  const [paySigApproved1Role, setPaySigApproved1Role] = useState("Accounting Dept Head");
  const [paySigApproved2, setPaySigApproved2] = useState("Evi Sulistyorini");
  const [paySigApproved2Role, setPaySigApproved2Role] = useState("Admin Div/BOD");
  const [paySigEntry, setPaySigEntry] = useState("");
  const [paySigEntryRole, setPaySigEntryRole] = useState("SSC Billing Admin");
  const [paySigChecked, setPaySigChecked] = useState("");
  const [paySigCheckedRole, setPaySigCheckedRole] = useState("AR Function Lead");

  // Auto-populate payment form when user selects a created SSC Billing from the left panel
  useEffect(() => {
    if (!selectedPaymentClId) return;
    const billing = createdSscBillings.find((r: any) => r.id === selectedPaymentClId);
    if (!billing) return;

    // Fill all editable payment fields from the SSC Billing data
    setPayCompany(billing.memoCompany || "PT MENARA TERUS MAKMUR");
    setPayBusinessArea(billing.memoBusinessArea || "MT");
    setPayRequestDate(billing.memoRequestDate || "");
    setPayTitle("Permohonan Pemotongan Invoice Vendor");
    setPayTo("SSC Invoicing & Payment");
    setPaySigPrepared(billing.sigPrepared || "Bagas Nur Pratama");
    setPaySigPreparedRole(billing.sigPreparedRole || "Accounting BU");
    setPaySigApproved1(billing.sigApproved1 || "Anindita Irnilaningtyas");
    setPaySigApproved1Role(billing.sigApproved1Role || "Accounting Dept Head");
    setPaySigApproved2(billing.sigApproved2 || "Evi Sulistyorini");
    setPaySigApproved2Role(billing.sigApproved2Role || "Admin Div/BOD");
    setPaySigEntry(billing.sigEntry || "");
    setPaySigEntryRole(billing.sigEntryRole || "SSC Billing Admin");
    setPaySigChecked(billing.sigChecked || "");
    setPaySigCheckedRole(billing.sigCheckedRole || "AR Function Lead");
    
    const formattedAmt = billing.memoAmount
      ? parseInt(billing.memoAmount).toLocaleString("id-ID")
      : (billing.amount ? billing.amount.replace("Rp ", "") : "0");

    setPayInstruction(
      `Sehubungan dengan ditemukannya komponen NG yang bukan disebabkan oleh proses internal kami, mohon dapat dilakukan pemotongan pembayaran terhadap vendor ${billing.supplierName || billing.memoCustomerName} sebesar Rp ${formattedAmt} atas CL ${billing.clNumber}.`
    );

    // Auto-inject the selected billing as a payment row if not already present
    const rawAmt = billing.memoAmount || billing.amount?.replace(/[^0-9]/g, "") || "0";
    const numAmt = parseInt(rawAmt, 10) || 0;
    const existingRow = sscBillingRows.find((r: any) => r.id === selectedPaymentClId);
    if (!existingRow) {
      setSscBillingRows(prev => [{
        id: billing.id,
        clNumber: billing.clNumber,
        qprNumber: billing.qprNumber || "",
        supplierName: billing.supplierName || billing.memoCustomerName,
        dateSent: billing.dateSent || billing.memoRequestDate,
        amount: billing.amount || (numAmt ? `Rp ${numAmt.toLocaleString("id-ID")}` : "Rp 0"),
        status: "PENDING",
        memoStatus: "DRAFT_MEMO",
        reminderSentCount: 0,
        customText: `POTONG TAGIH CLAIM PART NG`,
        paymentDate: "",
        customerCode: billing.acctCustomerCode || "OTC08002",
        documentNo: billing.clNumber?.replace(/[^0-9]/g, "").slice(-11) || ""
      }, ...prev.filter((r: any) => r.id !== billing.id)]);
    }

    setSelectedClId(selectedPaymentClId);
  }, [selectedPaymentClId, createdSscBillings]);


  const selectedCl = sscBillingRows.find(cl => cl.id === selectedClId) || confirmationLetters.find(cl => cl.id === selectedClId) || confirmationLetters[0] || sscBillingRows[0] || null;

  const sscEmail = "ssc-billing@astraoparts.co.id";
  const handleEmailSSC = async () => {
    const subject = `[SSC BILLING] ${selectedCl?.clNumber || ""} - ${selectedCl?.supplierName || ""}`;
    const body = `Kepada Tim SSC Billing,\n\nMohon diproses SSC Billing untuk:\nNo CL: ${selectedCl?.clNumber || ""}\nVendor: ${selectedCl?.supplierName || ""}\nJumlah: ${selectedCl?.amount || ""}\n\nTerima kasih.\n\nPT Menara Terus Makmur`;
    try {
      await clService.sendEmail({
        to: sscEmail,
        subject,
        body,
        clId: selectedCl?.id,
      });
      alert(`✅ Email permohonan SSC Billing berhasil dikirim ke ${sscEmail}!`);
    } catch (err: any) {
      console.warn("Notice: Failed to auto-send SSC email:", err);
      window.open(`mailto:${sscEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }
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
        const rowId = `cl-auto-${Date.now()}-${randSuffix}`;
        const row = {
          id: rowId,
          clNumber: `CL/2026/06/${Math.floor(Math.random() * 900 + 100)}`,
          qprNumber: `QPR/2026/06/${Math.floor(Math.random() * 900 + 100)}`,
          supplierName: "PT TEMARU ENGINEERING INDONESIA",
          dateSent: new Date().toISOString().split("T")[0],
          amount: "Rp 18.200.000",
          status: "PENDING",
          memoStatus: "DRAFT_MEMO",
          reminderSentCount: 0,
          customText: "POTONG TAGIH CLAIM PART NG",
          paymentDate: "10/08/2026",
          customerCode: "OTC08002",
          documentNo: "202606001",
          items: [{ no: 1, partName: "PART MATERIAL NG", totalQty: 1000, qtyNG: 10, ngActual: 1.0, stdAllowance: 5, qtyClaim: 5, qty: 5, claimCost: 1500000, unitPrice: 1500000, amount: 7500000, subtotal: 7500000 }]
        };
        setSscFiles(prev => [...prev, { file, rowId }]);
        setSscBillingRows(prev => [...prev, row]);
        setSelectedClId(rowId);
        alert(`File PDF berhasil di-upload: ${file.name}.`);
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
            <h3 className="text-base font-black uppercase tracking-wider">
              {isPurchasing ? "Kirim Confirmation Letter (CL)" : isFinance ? "SSC Billing & SSC Payment (I-Memo)" : "Kirim CL, SSC Billing & SSC Payment"}
            </h3>
          </div>
        </div>
      </div>

      {/* Editor & Templates Preview */}
      <>
          {/* Centered Horizontal Navigation Subtabs */}
          <div className="flex justify-center print:hidden">
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1.5 overflow-x-auto shadow-sm max-w-5xl w-full">
            {/* 1. KIRIM CL (HANYA PURCHASING / CICIK ANDRIA & ADMIN) */}
            {canAccessKirimCl && (
              <button
                onClick={() => setActiveSubTab("kirim_cl")}
                className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeSubTab === "kirim_cl" || activeSubTab === "reminder"
                    ? "bg-white text-blue-750 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                }`}
              >
                <Send size={13} />
                KIRIM CL
              </button>
            )}

            {/* 2. SSC BILLING (HANYA FINANCE & ADMIN) */}
            {canAccessSscBilling && (
              <button
                onClick={() => setActiveSubTab("ssc_purchasing")}
                className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeSubTab === "ssc_purchasing"
                    ? "bg-white text-blue-750 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                }`}
              >
                <FileCheck2 size={13} />
                SSC BILLING
              </button>
            )}

            {/* 3. SSC PAYMENT (HANYA FINANCE & ADMIN) */}
            {canAccessSscPayment && (
              <button
                onClick={() => setActiveSubTab("buat_ssc_payment")}
                className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeSubTab === "buat_ssc_payment"
                    ? "bg-white text-blue-750 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                }`}
              >
                <FileCheck2 size={13} />
                SSC PAYMENTS
              </button>
            )}

            {/* 4. PARTS VENDOR */}
            {canAccessParts && (
              <button
                onClick={() => setActiveSubTab("parts_per_vendor")}
                className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeSubTab === "parts_per_vendor"
                    ? "bg-white text-blue-750 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                }`}
              >
                <Building size={13} />
                PARTS VENDOR
              </button>
            )}
          </div>
        </div>

        <div className="w-full space-y-4">


                {activeSubTab === "parts_per_vendor" && canAccessParts && (
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

                {activeSubTab === "ssc_purchasing" && canAccessSscBilling && (
                  <div className="flex flex-col gap-6 w-full items-center text-left font-sans">
                    {/* Top Section: CL Selector + Form Editor */}
                    <div className="w-full max-w-4xl space-y-4 print:hidden">
                      {/* CL Selector Panel */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-slate-100 bg-slate-50/70">
                          <h5 className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider">
                            📋 Pilih CL untuk Diproses SSC Billing
                          </h5>
                          <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">
                            {availableClsForBilling.length} Confirmation Letter disetujui · Klik untuk auto-isi form billing
                          </p>
                        </div>
                        <div className="max-h-[180px] overflow-y-auto divide-y divide-slate-100">
                          {availableClsForBilling.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 italic text-[11px] font-semibold">
                              Tidak ada Confirmation Letter yang menunggu proses SSC Billing.
                            </div>
                          ) : (
                            availableClsForBilling
                              .map((cl: any) => {
                                const isSelected = selectedBillingClId === cl.id;
                                const statusColor = cl.status === "FULLY_APPROVED" || cl.status === "APPROVED" || cl.status === "APPROVED_BY_VENDOR" || cl.vendorApproved
                                  ? "bg-emerald-100 text-emerald-700"
                                  : cl.status === "CLOSED_PAID"
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-amber-100 text-amber-700";
                                const statusLabel = cl.status === "FULLY_APPROVED" || cl.status === "APPROVED" || cl.status === "APPROVED_BY_VENDOR" || cl.vendorApproved
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
                                    onClick={() => setSelectedBillingClId(cl.id)}
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

                      {/* Manual Billing Editor Form */}
                      <div className="w-full bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-800 font-sans">Manual Billing Editor</h4>
                            <p className="text-[10.5px] text-slate-500 font-bold font-sans mt-0.5">
                              {selectedBillingClId
                                ? <>✅ CL terpilih: <strong className="text-blue-700">{sscBillingRows.find((r: any) => r.id === selectedBillingClId)?.clNumber || "—"}</strong></>
                                : "Pilih CL di atas atau isi data manual untuk memperbarui draf dokumen."}
                            </p>
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
                              setPayCompany("PT Menara Terus Makmur");
                              setPayBusinessArea("");
                              setPayRequestDate("");
                              setPayTitle("");
                              setPayTo("");
                              setPayInstruction("");
                              setPaySigPrepared("");
                              setPaySigPreparedRole("Accounting BU");
                              setPaySigApproved1("");
                              setPaySigApproved1Role("Accounting Dept Head");
                              setPaySigApproved2("");
                              setPaySigApproved2Role("Admin Div/BOD");
                              setPaySigEntry("");
                              setPaySigEntryRole("SSC Billing Admin");
                              setPaySigChecked("");
                              setPaySigCheckedRole("AR Function Lead");
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
                              setSigPrepared("Bagas Nur Pratama");
                              setSigApproved1("Anindita Irnilaningtyas");
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
                  </div>

                    {/* Bottom Section: Live A4 Printable Sheet */}
                    {showSscBillingPreview && (
                      <div className="flex flex-col items-center w-full space-y-4">
                      {/* Control Panel */}
                      <div className="w-full bg-white border border-slate-200 rounded-lg p-2 flex justify-between items-center print:hidden shadow-sm font-sans gap-2">
                        <span className="text-[11px] text-slate-500 font-bold font-sans">
                          Pratinjau Live: <strong>A4 Portrait Sheet</strong>
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={handleConfirmToPayment}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 font-sans"
                          >
                            <CheckCircle2 size={13} />
                            Confirm (Lanjutkan ke SSC Payment)
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
                      <div className="w-full overflow-x-auto p-1 bg-slate-200 border border-slate-300 rounded-xl flex justify-center shadow-inner">
                        <div
                          id="manual-billing-sheet"
                          className="bg-white text-black p-[12mm] shadow-lg border border-slate-450 w-[210mm] min-h-[297mm] text-left mx-auto relative flex flex-col"
                          style={{
                            fontFamily: '"Times New Roman", Times, serif',
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
                                <div className="flex items-center p-1.5 gap-2">
                                  <span className="font-bold w-[120px] shrink-0 font-sans">Customer Code</span>
                                  <span className="mr-1.5 font-sans">:</span>
                                  {renderCustomerCodeBoxes(acctCustomerCode)}
                                </div>
                                <div className="flex items-center p-1.5 font-sans gap-2">
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
                                <div className="flex items-center p-1.5 font-sans gap-2">
                                  <span className="font-bold w-[120px] shrink-0 font-sans">Trading Partner</span>
                                  <span className="mr-1.5 font-sans">:</span>
                                  {renderTradingPartnerBoxes(acctTradingPartner)}
                                </div>
                              </div>
                              <div className="flex flex-col divide-y divide-black font-sans">
                                <div className="flex items-center p-2 min-h-[32px] font-sans gap-2">
                                  <span className="font-bold w-[120px] shrink-0 font-sans">Exchange Rate*</span>
                                  <span className="mr-1.5 font-sans">:</span>
                                  <span className="font-semibold">{acctExchangeRate || "—"}</span>
                                </div>
                                <div className="flex items-center p-2 min-h-[32px] font-sans gap-2">
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
                                  <th className="border-r border-black p-1.5 w-[110px]" style={{ backgroundColor: '#f08a00', color: '#ffffff' }}>GL Account Code</th>
                                  <th className="border-r border-black p-1.5" style={{ backgroundColor: '#f08a00', color: '#ffffff' }}>GL Account Name</th>
                                  <th className="border-r border-black p-1.5 w-[90px]" style={{ backgroundColor: '#f08a00', color: '#ffffff' }}>Cost Center</th>
                                  <th className="border-r border-black p-1.5 w-[95px]" style={{ backgroundColor: '#f08a00', color: '#ffffff' }}>Amount (Dr.)</th>
                                  <th className="border-r border-black p-1.5 w-[95px]" style={{ backgroundColor: '#f08a00', color: '#ffffff' }}>Amount (Cr.)</th>
                                  <th className="p-1.5 w-[130px]" style={{ backgroundColor: '#f08a00', color: '#ffffff' }}>Text</th>
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
                          <div className="border border-black overflow-hidden mb-6 text-[11px] mt-auto font-sans print-signatures-panel">
                            <div className="grid grid-cols-5 text-center divide-x divide-black font-bold font-sans">
                              <div className="p-1.5 border-b border-black bg-slate-50/50">Prepared by <sup>1)</sup></div>
                              <div className="p-1.5 border-b border-black bg-slate-50/50 col-span-2">Approved by <sup>1)</sup></div>
                              <div className="p-1.5 border-b border-black bg-slate-50/50">Entry by <sup>1)</sup></div>
                              <div className="p-1.5 border-b border-black bg-slate-50/50">Checked by <sup>1)</sup></div>
                            </div>
                            <div className="grid grid-cols-5 text-center divide-x divide-black h-[75px]">
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-1 min-h-[18px] w-full inline-block text-center font-sans text-[11.5px]" title={sigPrepared}>{sigPrepared}</span>
                              </div>
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-1 min-h-[18px] w-full inline-block text-center font-sans text-[11.5px]" title={sigApproved1}>{sigApproved1}</span>
                              </div>
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-1 min-h-[18px] w-full inline-block text-center font-sans text-[11.5px]" title={sigApproved2}>{sigApproved2}</span>
                              </div>
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-1 min-h-[18px] w-full inline-block text-center font-sans text-[11.5px]" title={sigEntry}>{sigEntry}</span>
                              </div>
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-1 min-h-[18px] w-full inline-block text-center font-sans text-[11.5px]" title={sigChecked}>{sigChecked}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-5 text-center divide-x divide-black text-[10px] font-bold text-white bg-blue-600/95 border-t border-black font-sans print-roles-row">
                              <div className="p-1 py-2 text-center flex items-center justify-center min-h-[22px]" title={sigPreparedRole}>{sigPreparedRole}</div>
                              <div className="p-1 py-2 text-center flex items-center justify-center min-h-[22px]" title={sigApproved1Role}>{sigApproved1Role}</div>
                              <div className="p-1 py-2 text-center flex items-center justify-center min-h-[22px]" title={sigApproved2Role}>{sigApproved2Role}</div>
                              <div className="p-1 py-2 text-center flex items-center justify-center min-h-[22px]" title={sigEntryRole}>{sigEntryRole}</div>
                              <div className="p-1 py-2 text-center flex items-center justify-center min-h-[22px]" title={sigCheckedRole}>{sigCheckedRole}</div>
                            </div>
                          </div>

                          {/* Footer / Remark */}
                          <div className="text-[8px] text-slate-500 leading-tight space-y-0.5 font-sans">
                            <div><strong>Remark:</strong></div>
                            <div>*) Only filled if billing type is recurring</div>
                            <div>1) Every signing person must write down his / her full name in the grey box and his/her function in the blue box</div>
                            <div className="flex justify-between pt-2 border-t border-slate-200 mt-2 text-[7.5px] font-mono text-slate-450 font-sans">
                              <span>Approved By System {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} 17:02</span>
                              <span>Internal Memo - {memoBillingType === "One Time" ? "Onetime" : "Recurring"} Billing {acctCustomerCode || "TEIN1"} of 1</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                )}
                {activeSubTab === "buat_ssc_payment" && canAccessSscPayment && (
                  <div className="flex flex-col gap-6 w-full items-center text-left font-sans">
                    {/* Top Section: CL Selector + Form Editor */}
                    <div className="w-full max-w-4xl space-y-4 print:hidden">

                      {/* CL Selector Panel */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-slate-100 bg-slate-50/70">
                          <h5 className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider">
                            📋 Pilih SSC Billing untuk Diproses SSC Payment
                          </h5>
                          <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">
                            {availableBillingsForPayment.length} SSC Billing tersedia · Klik untuk auto-isi form payment
                          </p>
                        </div>
                        <div className="max-h-[230px] overflow-y-auto divide-y divide-slate-100">
                          {availableBillingsForPayment.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 italic text-[11px] font-semibold">
                              Tidak ada SSC Billing yang menunggu proses SSC Payment.
                            </div>
                          ) : (
                            availableBillingsForPayment.map((billing: any) => {
                              const isSelected = selectedPaymentClId === billing.id;
                              return (
                                <button
                                  key={billing.id}
                                  type="button"
                                  onClick={() => setSelectedPaymentClId(billing.id)}
                                  className={`w-full text-left p-3 flex items-start gap-3 transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-blue-50 border-l-2 border-blue-500"
                                      : "hover:bg-slate-50/70 border-l-2 border-transparent"
                                  }`}
                                >
                                  <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-blue-500" : "bg-slate-300"}`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10.5px] font-black text-slate-800 font-mono truncate">{billing.clNumber}</span>
                                      <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded shrink-0 bg-emerald-100 text-emerald-700">Billing Created</span>
                                    </div>
                                    <div className="text-[9.5px] text-slate-500 font-semibold mt-0.5 truncate">{billing.supplierName}</div>
                                    <div className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-2">
                                      <span>{billing.memoRequestDate || billing.dateSent}</span>
                                      <span className="text-slate-300">·</span>
                                      <span className="font-black text-slate-600">{billing.amount}</span>
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
                                ? <>✅ SSC Billing terpilih: <strong className="text-blue-700">{createdSscBillings.find((r: any) => r.id === selectedPaymentClId)?.clNumber || "—"}</strong></>
                                : "Pilih SSC Billing di atas atau isi data manual."}
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
                                setPaySigPreparedRole("Accounting BU");
                                setPaySigApproved1("");
                                setPaySigApproved1Role("Accounting Dept Head");
                                setPaySigApproved2("");
                                setPaySigApproved2Role("Admin Div/BOD");
                                setPaySigEntry("");
                                setPaySigEntryRole("SSC Billing Admin");
                                setPaySigChecked("");
                                setPaySigCheckedRole("AR Function Lead");
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
                                setPaySigPrepared("Bagas Nur Pratama");
                                setPaySigPreparedRole("Accounting BU");
                                setPaySigApproved1("Anindita Irnilaningtyas");
                                setPaySigApproved1Role("Accounting Dept Head");
                                setPaySigApproved2("Evi Sulistyorini");
                                setPaySigApproved2Role("Admin Div/BOD");
                                setPaySigEntry("");
                                setPaySigEntryRole("SSC Billing Admin");
                                setPaySigChecked("");
                                setPaySigCheckedRole("AR Function Lead");
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200 transition-all cursor-pointer active:scale-95"
                              title="Isi dengan Data Header Standar"
                            >
                              Isi Header Standar
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
                        {(selectedPaymentClId ? sscBillingRows.filter(cl => cl.id === selectedPaymentClId) : sscBillingRows).map((cl, idx) => (
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
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500">Approved By 2</label>
                            <input type="text" value={paySigApproved2} onChange={e => setPaySigApproved2(e.target.value)} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500">Entry By</label>
                            <input type="text" value={paySigEntry} onChange={e => setPaySigEntry(e.target.value)} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-bold text-slate-800 bg-white" />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500">Checked By</label>
                            <input type="text" value={paySigChecked} onChange={e => setPaySigChecked(e.target.value)} className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-800 bg-white" />
                          </div>
                        </div>
                        <div className="pt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={handleConfirmPaymentFinish}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 font-sans"
                          >
                            <CheckCircle2 size={13} />
                            Confirm (Selesaikan &amp; Terlempar ke List QPR/CL)
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>

                    {/* Bottom Section: Live A4 Printable Sheet */}
                    {showSscPaymentPreview && (
                      <div className="flex flex-col items-center w-full space-y-4">
                      {/* Control Panel */}
                      <div className="w-full bg-white border border-slate-200 rounded-lg p-2 flex justify-between items-center print:hidden shadow-sm font-sans gap-2">
                        <span className="text-[11px] text-slate-500 font-bold font-sans">
                          Pratinjau Live: <strong>A4 Portrait Sheet</strong>
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={handleConfirmPaymentFinish}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 font-sans"
                          >
                            <CheckCircle2 size={13} />
                            Confirm (Selesaikan &amp; Terlempar ke List QPR/CL)
                          </button>
                          <button
                            onClick={() => handleExportExcel("buat_ssc_payment")}
                            className="px-3 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 font-extrabold text-xs rounded-lg transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                          >
                            <FileText size={12} />
                            Export Excel
                          </button>
                          <button
                            onClick={handlePrintPayment}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg shadow-md hover:shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 font-sans"
                          >
                            <Printer size={13} />
                            Cetak Memo Internal
                          </button>
                        </div>
                      </div>

                      {/* Actual Document Sheet Container */}
                      <div className="w-full overflow-x-auto p-1 bg-slate-200 border border-slate-300 rounded-xl flex justify-center shadow-inner">
                        <div
                          id="internal-memo-sheet"
                          className="bg-white text-black p-[12mm] shadow-lg border border-slate-450 w-[210mm] min-h-[297mm] text-left mx-auto relative flex flex-col"
                          style={{
                            fontFamily: '"Times New Roman", Times, serif',
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
                              <div className="flex-1 p-2 bg-white leading-relaxed font-sans leading-relaxed text-[11.5px] pr-4">
                                <p className="mb-3">{payInstruction}</p>
                                <table className="w-full text-[9.5px] border-collapse border border-black font-sans table-fixed">
                                  <thead>
                                    <tr className="text-black border border-black text-[9px] text-center font-bold">
                                      <th className="border border-black px-1.5 py-1 font-bold w-[13%]" style={{ backgroundColor: '#f2c811' }}>Customer</th>
                                      <th className="border border-black px-1.5 py-1 font-bold w-[17%]" style={{ backgroundColor: '#f2c811' }}>DocumentNo</th>
                                      <th className="border border-black px-1.5 py-1 font-bold w-[18%]" style={{ backgroundColor: '#f2c811' }}>Text</th>
                                      <th className="border border-black px-1.5 py-1 font-bold w-[15%]" style={{ backgroundColor: '#f2c811' }}>Vendor</th>
                                      <th className="border border-black px-1.5 py-1 font-bold w-[10%]" style={{ backgroundColor: '#f2c811' }}>Doc. Date</th>
                                      <th className="border border-black px-1.5 py-1 text-right font-bold w-[12%]" style={{ backgroundColor: '#f2c811' }}>Amount</th>
                                      <th className="border border-black px-1.5 py-1 font-bold w-[15%]" style={{ backgroundColor: '#f2c811' }}>Pay Date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(selectedPaymentClId ? sscBillingRows.filter(cl => cl.id === selectedPaymentClId) : sscBillingRows).map((cl, idx) => {
                                      const rawAmt = cl.amount ? cl.amount.replace(/[^0-9]/g, "") : "0";
                                      const numAmt = parseInt(rawAmt, 10);
                                      const formattedAmt = isNaN(numAmt) ? cl.amount : numAmt.toLocaleString("id-ID");
                                      return (
                                        <tr key={cl.id} className="bg-white border border-black text-black">
                                          <td className="border border-black px-1.5 py-1 text-center font-mono font-bold truncate">
                                            {cl.customerCode !== undefined ? cl.customerCode : "OTC08002"}
                                          </td>
                                          <td className="border border-black px-1.5 py-1 text-center font-mono font-bold truncate">
                                            {cl.documentNo !== undefined ? cl.documentNo : (cl.clNumber.replace(/[^0-9]/g, "").slice(-11) || `180000000${53 + idx}`)}
                                          </td>
                                          <td className="border border-black px-1.5 py-1 text-left font-mono font-bold text-[9px] uppercase">
                                            {cl.customText !== undefined ? cl.customText : `POTONG TAGIH ${getClaimText(cl)}`}
                                          </td>
                                          <td className="border border-black px-1.5 py-1 text-left font-sans font-bold text-[9px]">
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
                              </div>
                            </div>
                            
                            {/* Demikian Terimakasih */}
                            <div className="w-full p-2 bg-white flex flex-col">
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

                          {/* Signatures Panel */}
                          <div className="border border-black overflow-hidden mb-6 text-[11px] mt-auto font-sans print-signatures-panel">
                            <div className="grid grid-cols-5 text-center divide-x divide-black font-bold font-sans">
                              <div className="p-1.5 border-b border-black bg-slate-50/50">Prepared by <sup>1)</sup></div>
                              <div className="p-1.5 border-b border-black bg-slate-50/50 col-span-2">Approved by <sup>1)</sup></div>
                              <div className="p-1.5 border-b border-black bg-slate-50/50">Entry by <sup>1)</sup></div>
                              <div className="p-1.5 border-b border-black bg-slate-50/50">Checked by <sup>1)</sup></div>
                            </div>
                            <div className="grid grid-cols-5 text-center divide-x divide-black h-[75px]">
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-1 min-h-[18px] w-full inline-block text-center font-sans text-[11.5px]" title={paySigPrepared}>{paySigPrepared}</span>
                              </div>
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-1 min-h-[18px] w-full inline-block text-center font-sans text-[11.5px]" title={paySigApproved1}>{paySigApproved1}</span>
                              </div>
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-1 min-h-[18px] w-full inline-block text-center font-sans text-[11.5px]" title={paySigApproved2}>{paySigApproved2}</span>
                              </div>
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-1 min-h-[18px] w-full inline-block text-center font-sans text-[11.5px]" title={paySigEntry}>{paySigEntry}</span>
                              </div>
                              <div className="flex items-end justify-center pb-2 bg-white px-1">
                                <span className="font-bold border-b border-dashed border-slate-400 pb-1 min-h-[18px] w-full inline-block text-center font-sans text-[11.5px]" title={paySigChecked}>{paySigChecked}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-5 text-center divide-x divide-black text-[10px] font-bold text-white bg-blue-600/95 border-t border-black font-sans print-roles-row">
                              <div className="p-1 py-2 text-center flex items-center justify-center min-h-[22px]" title={paySigPreparedRole}>{paySigPreparedRole}</div>
                              <div className="p-1 py-2 text-center flex items-center justify-center min-h-[22px]" title={paySigApproved1Role}>{paySigApproved1Role}</div>
                              <div className="p-1 py-2 text-center flex items-center justify-center min-h-[22px]" title={paySigApproved2Role}>{paySigApproved2Role}</div>
                              <div className="p-1 py-2 text-center flex items-center justify-center min-h-[22px]" title={paySigEntryRole}>{paySigEntryRole}</div>
                              <div className="p-1 py-2 text-center flex items-center justify-center min-h-[22px]" title={paySigCheckedRole}>{paySigCheckedRole}</div>
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



                {(activeSubTab === "kirim_cl" || activeSubTab === "reminder") && canAccessKirimCl && (
                  <div className="w-full space-y-6 text-left">
                    {/* Main Grid: Left (Vendor Selector & CL List) | Right (Live Email Simulator) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Column: Vendor Selector & CL Documents */}
                      <div className="lg:col-span-6 space-y-5">
                        {/* 1. Vendor Selection & Email Input Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                              <Building size={14} className="text-blue-600" />
                              1. Pilih Vendor & Email Tujuan
                            </h4>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {allAvailableVendors.length} Vendor Terdaftar
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Pilih Vendor / Supplier:
                              </label>
                              <select
                                value={selectedVendorName}
                                onChange={(e) => handleVendorChange(e.target.value)}
                                className="w-full px-3 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                              >
                                {allAvailableVendors.map((v, i) => (
                                  <option key={i} value={v.name}>
                                    {v.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Alamat Email Vendor:
                                </label>
                                <input
                                  type="email"
                                  value={vendorEmailInput}
                                  onChange={(e) => setVendorEmailInput(e.target.value)}
                                  placeholder="marketing@adiku.co.id"
                                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Subject Email:
                                </label>
                                <input
                                  type="text"
                                  value={emailSubject}
                                  onChange={(e) => setEmailSubject(e.target.value)}
                                  placeholder="Confirmation Letter – Part NG"
                                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Tgl Dokumen Dikirim / Dibuat:
                                </label>
                                <input
                                  type="date"
                                  value={sendDateIso}
                                  onChange={(e) => setSendDateIso(e.target.value)}
                                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all cursor-pointer font-sans"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Upload Confirmation Letter Approved by Vendor */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                <FileText size={14} className="text-emerald-600" />
                                2. Upload Confirmation Letter Approved by Vendor ({vendorCls.length})
                              </h4>
                              <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">
                                Upload file Confirmation Letter yang sudah disetujui vendor <strong className="text-slate-700">{selectedVendorName || "Vendor"}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                            {vendorCls.length === 0 ? (
                              <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 text-xs space-y-3">
                                <FileText size={26} className="mx-auto text-slate-400" />
                                <div className="space-y-1">
                                  <p className="font-bold text-slate-700">Belum ada Confirmation Letter terdaftar untuk vendor ini.</p>
                                  <p className="text-[11px] text-slate-500">Anda dapat langsung mengunggah file CL Approval Vendor secara manual untuk langsung men-trigger antrian SSC.</p>
                                </div>
                                {(isPurchasing || isAdmin) && (
                                  <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-black shadow-sm cursor-pointer transition-all active:scale-95">
                                    <Upload size={13} />
                                    <span>Upload CL Approval Vendor (Manual)</span>
                                    <input
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleManualCreateAndUploadCl(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            ) : (
                              vendorCls.map((cl: any, idx: number) => {
                                const isSelected = selectedClForEmailId === cl.id;

                                return (
                                  <div
                                    key={cl.id || idx}
                                    onClick={() => setSelectedClForEmailId(cl.id)}
                                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                                      isSelected
                                        ? "bg-slate-50/80 border-emerald-400 ring-2 ring-emerald-400/20 shadow-sm"
                                        : "bg-white hover:bg-slate-50 border-slate-200"
                                    }`}
                                  >
                                    {/* Upload Dokumen CL Approval Vendor */}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Status Vendor:</span>
                                          {cl.vendorApproved ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-850 border border-emerald-300 rounded-full text-[9.5px] font-black shadow-2xs">
                                              <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                                              APPROVED BY VENDOR
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-[9.5px] font-bold">
                                              <Clock size={11} className="text-amber-500 shrink-0" />
                                              Belum Upload Approval Vendor
                                            </span>
                                          )}
                                        </div>

                                        {cl.vendorApprovedDate && (
                                          <span className="text-[9px] font-mono text-slate-500 font-bold">
                                            Tgl: {cl.vendorApprovedDate}
                                          </span>
                                        )}
                                      </div>

                                      {/* File Dokumen Terupload */}
                                      {(cl.vendorApprovedDocName || cl.signedClFileName) && (
                                        <div className="flex items-center justify-between bg-white border border-emerald-300 rounded-lg p-2 text-xs shadow-2xs">
                                          <div className="flex items-center gap-2 truncate pr-2">
                                            <Paperclip size={13} className="text-emerald-600 shrink-0" />
                                            <span className="font-mono text-[11px] font-bold text-slate-800 truncate" title={cl.vendorApprovedDocName || cl.signedClFileName}>
                                              {cl.vendorApprovedDocName || cl.signedClFileName}
                                            </span>
                                          </div>
                                          <span className="text-[8.5px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                                            ✓ Dokumen Terverifikasi
                                          </span>
                                        </div>
                                      )}

                                      {/* Upload File Input / Action Button (Purchasing / Cicik Andria & Admin) */}
                                      {(isPurchasing || isAdmin) && (
                                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                                          <label className="flex-1 min-w-[200px] flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-black shadow-sm cursor-pointer transition-all active:scale-95 text-center">
                                            <Upload size={13} />
                                            <span>
                                              {cl.vendorApproved ? "Ganti / Upload Ulang CL Signed" : "Upload CL Approval Vendor"}
                                            </span>
                                            <input
                                              type="file"
                                              accept=".pdf,.png,.jpg,.jpeg"
                                              className="hidden"
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  handleUploadVendorApprovedCl(cl, file);
                                                }
                                              }}
                                            />
                                          </label>

                                          {cl.vendorApproved && (
                                            <button
                                              type="button"
                                              onClick={(e) => handleToggleVendorApproval(cl, e)}
                                              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
                                              title="Batalkan status approval vendor"
                                            >
                                              Batal Setujui
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Live Email Simulator */}
                      <div className="lg:col-span-6 space-y-4">
                        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                          {/* Email Window Top Bar */}
                          <div className="bg-slate-850 text-white px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1.5 mr-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 inline-block" />
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
                              </div>
                              <Mail size={15} className="text-blue-400" />
                              <span className="text-xs font-black tracking-wide uppercase">
                                Preview Email Konfirmasi Vendor
                              </span>
                            </div>
                            <span className="text-[9px] font-bold bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30 font-mono">
                              DUE DATE: 10 HARI KERJA
                            </span>
                          </div>

                          {/* Email Header Meta */}
                          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2 text-xs">
                            <div className="grid grid-cols-[75px_1fr] items-center gap-2">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">To:</span>
                              <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200 truncate">
                                {emailToHeader}
                              </span>
                            </div>
                            <div className="grid grid-cols-[75px_1fr] items-center gap-2">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">Subject:</span>
                              <span className="font-semibold text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200 truncate">
                                {emailSubject}
                              </span>
                            </div>
                            <div className="grid grid-cols-[75px_1fr] items-center gap-2">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">Tgl Kirim:</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={sendDateIso}
                                  onChange={(e) => setSendDateIso(e.target.value)}
                                  className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer shadow-2xs hover:border-blue-500 transition-colors"
                                />
                                <span className="text-xs font-semibold text-slate-600">({formattedSendDate})</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-[75px_1fr] items-center gap-2">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">Due Date:</span>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 shrink-0">
                                  <Clock size={12} className="text-blue-600 shrink-0" />
                                  <span>{calculatedDueDate}</span>
                                  <span className="text-[10px] font-semibold text-slate-500">(10 Hari Kerja)</span>
                                </span>
                              </div>
                            </div>
                            {/* Attached Document Summary */}
                            <div className="pt-2 border-t border-slate-200">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1">
                                  <Paperclip size={12} className="text-blue-600" />
                                  Berkas Terlampir (Paket Siap Kirim):
                                </span>
                                <span className="text-[9px] text-slate-400 font-semibold italic">
                                  Klik berkas untuk pratinjau
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                                <button
                                  type="button"
                                  onClick={() => setPreviewCl(activeClForEmail)}
                                  className="p-2.5 bg-white hover:bg-blue-50 hover:border-blue-400 rounded-lg border border-slate-250 font-bold text-slate-800 flex items-center justify-between transition-all cursor-pointer shadow-2xs group text-left active:scale-95"
                                  title="Klik untuk membuka Pratinjau Surat CL"
                                >
                                  <div className="flex items-center gap-1.5 truncate pr-1">
                                    <FileText size={13} className="text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                                    <span className="truncate">1. Surat CL ({activeClForEmail.clNumber?.split("/").slice(-1)[0] || "Draft"})</span>
                                  </div>
                                  <span className="text-[9px] bg-blue-100 text-blue-700 font-black px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5">
                                    <Eye size={10} /> LIHAT
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setPreviewQpr(activeQprForEmail)}
                                  className="p-2.5 bg-white hover:bg-green-50 hover:border-green-400 rounded-lg border border-green-250 font-bold text-green-850 flex items-center justify-between transition-all cursor-pointer shadow-2xs group text-left active:scale-95"
                                  title="Klik untuk membuka Pratinjau Dokumen QPR Full Approval"
                                >
                                  <div className="flex items-center gap-1.5 truncate pr-1">
                                    <FileCheck2 size={13} className="text-green-600 shrink-0 group-hover:scale-110 transition-transform" />
                                    <span className="truncate">2. Dokumen QPR ({activeQprForEmail.qprNumber || "Full Approval"})</span>
                                  </div>
                                  <span className="text-[9px] bg-green-100 text-green-800 font-black px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5">
                                    <Eye size={10} /> LIHAT
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Email Body Preview */}
                          <div className="p-5 bg-white text-slate-800 text-xs leading-relaxed font-sans whitespace-pre-wrap selection:bg-blue-100 min-h-[220px]">
                            {generatedEmailBody}
                          </div>

                          {/* Notice Box */}
                          <div className="px-5 py-3 bg-amber-50/80 border-t border-b border-amber-200/80 text-amber-800 text-[11px] font-semibold flex items-start gap-2">
                            <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              Perhitungan batas waktu <strong>10 hari kerja</strong> dihitung sejak tanggal kirim dokumen (<strong>{formattedSendDate}</strong>). Batas waktu konfirmasi jatuh tempo pada: <strong>{calculatedDueDate}</strong>.
                            </div>
                          </div>

                          {/* Email Footer Actions */}
                          <div className="p-4 bg-slate-50 flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={handleCopyEmailText}
                              className="px-3.5 py-2 bg-white hover:bg-slate-100 active:scale-95 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              {emailCopied ? (
                                <>
                                  <Check size={14} className="text-emerald-600" />
                                  <span className="text-emerald-700">Tersalin ke Clipboard!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  <span>Salin Teks Email</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={isSendingEmail}
                              onClick={() => handleSendVendorEmail()}
                              className={`px-5 py-2 text-white text-xs font-extrabold rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                                isSendingEmail
                                  ? "bg-blue-400 cursor-not-allowed opacity-80"
                                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                              }`}
                            >
                              {isSendingEmail ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  <span>Mengirim Email...</span>
                                </>
                              ) : (
                                <>
                                  <Send size={13} />
                                  <span>Kirim Email Otomatis ke Vendor</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
        </div>
      </>
      <style>{`
        @media print {
          /* ===== MODE CETAK MEMO SSC BILLING / PAYMENT ===== */
          /* Sembunyikan elemen UI non-cetak */
          aside,
          nav,
          header,
          footer,
          .print\:hidden,
          button,
          input[type="button"],
          input[type="submit"] {
            display: none !important;
          }

          /* Reset layout parent agar sheet bisa diposisikan dengan benar */
          html, body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }

          /* Konfigurasi lembar sheet utama */
          html[data-printing-memo] #manual-billing-sheet,
          html[data-printing-memo] #internal-memo-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
            max-height: 100% !important;
            margin: 0 !important;
            padding: 5mm !important;
            border: none !important;
            box-shadow: none !important;
            background-color: #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            z-index: 99999 !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Shrink spacing when printing to prevent page overflow */
          html[data-printing-memo] #manual-billing-sheet .mb-6,
          html[data-printing-memo] #manual-billing-sheet .mb-4,
          html[data-printing-memo] #internal-memo-sheet .mb-6,
          html[data-printing-memo] #internal-memo-sheet .mb-4 {
            margin-bottom: 8px !important;
          }

          /* Force solid black borders for all tables and their cells */
          html[data-printing-memo] #manual-billing-sheet table,
          html[data-printing-memo] #internal-memo-sheet table {
            border-collapse: collapse !important;
            border: 1px solid #000000 !important;
          }
          html[data-printing-memo] #manual-billing-sheet table th,
          html[data-printing-memo] #manual-billing-sheet table td,
          html[data-printing-memo] #internal-memo-sheet table th,
          html[data-printing-memo] #internal-memo-sheet table td {
            border: 1px solid #000000 !important;
          }

          /* Force Tailwind divide-x, divide-y and border borders to render in print */
          html[data-printing-memo] .divide-x > * + * {
            border-left: 1px solid #000000 !important;
          }
          html[data-printing-memo] .divide-y > * + * {
            border-top: 1px solid #000000 !important;
          }
          html[data-printing-memo] #manual-billing-sheet .border,
          html[data-printing-memo] #internal-memo-sheet .border {
            border: 1px solid #000000 !important;
          }
          html[data-printing-memo] #manual-billing-sheet .border-t,
          html[data-printing-memo] #internal-memo-sheet .border-t {
            border-top: 1px solid #000000 !important;
          }
          html[data-printing-memo] #manual-billing-sheet .border-b,
          html[data-printing-memo] #internal-memo-sheet .border-b {
            border-bottom: 1px solid #000000 !important;
          }
          html[data-printing-memo] #manual-billing-sheet .border-l,
          html[data-printing-memo] #internal-memo-sheet .border-l {
            border-left: 1px solid #000000 !important;
          }
          html[data-printing-memo] #manual-billing-sheet .border-r,
          html[data-printing-memo] #internal-memo-sheet .border-r {
            border-right: 1px solid #000000 !important;
          }

           /* Style GL Table Header cells directly to force solid orange background and white text */
          html[data-printing-memo] #manual-billing-sheet table thead tr th {
            background-color: #f08a00 !important; /* solid orange background */
            color: #ffffff !important; /* white text */
            border-bottom: 1px solid #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Style Internal Memo Header to match yellow preview styling */
          html[data-printing-memo] #internal-memo-sheet table thead tr th {
            background-color: #f2c811 !important; /* solid yellow background */
            color: #000000 !important; /* black text */
            border-bottom: 1px solid #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Ensure high contrast print compatibility for colored boxes */
          html[data-printing-memo] .print-roles-row,
          html[data-printing-memo] .print-roles-row > div {
            background-color: #2563eb !important; /* solid blue background */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html[data-printing-memo] .print-roles-row > div {
            color: #ffffff; /* white text by default, auto-corrected to black by browser if background graphics is off */
            border-right: 1px solid #000000 !important;
            background-clip: padding-box !important;
            box-sizing: border-box !important;
          }
          html[data-printing-memo] .print-roles-row > div:last-child {
            border-right: none !important;
          }
          
          /* Set background-clip on all signature panel cells to prevent background bleed from hiding borders */
          html[data-printing-memo] .print-signatures-panel * {
            background-clip: padding-box !important;
          }

          /* Force solid black borders for all signature panels and their grid cells */
          html[data-printing-memo] .print-signatures-panel {
            border: 1px solid #000000 !important;
            display: flex !important;
            flex-direction: column !important;
          }
          html[data-printing-memo] .print-signatures-panel .divide-x > * + * {
            border-left: none !important;
          }
          html[data-printing-memo] .print-signatures-panel > div {
            border-bottom: 1px solid #000000 !important;
            display: grid !important;
          }
          html[data-printing-memo] .print-signatures-panel > div:last-child {
            border-bottom: none !important;
          }
          html[data-printing-memo] .print-signatures-panel > div > div {
            border-right: 1px solid #000000 !important;
          }
          html[data-printing-memo] .print-signatures-panel > div > div:last-child {
            border-right: none !important;
          }

          html[data-printing-memo] * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
      {previewCl && (
        <ConfirmationLetterPrintPreview
          cl={previewCl}
          onClose={() => setPreviewCl(null)}
        />
      )}
      {previewQpr && (
        <QprPrintPreview
          qpr={previewQpr}
          onClose={() => setPreviewQpr(null)}
        />
      )}
      {viewPartsCl && (() => {
        const viewCl = viewPartsCl;
        let partItems: any[] = viewCl.items || [];
        if (partItems.length === 0) {
          partItems = [
            { no: 1, partName: viewCl.partName || "PART MATERIAL NG", totalQty: viewCl.totalQty || 1000, qtyNG: viewCl.qtyNG || 10, ngActual: 1.0, stdAllowance: 5, qtyClaim: viewCl.qtyClaim || 5 }
          ];
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
