"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Activity,
  UserCheck,
  Search,
  Sparkles,
  ShieldAlert,
  Layers,
  FileCheck,
  CheckCircle2,
  Clock,
  X,
  Eye,
  Banknote,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  AlertCircle,
  FileText,
  DollarSign,
  Filter,
  Check
} from "lucide-react";

import ConfirmationLetterPrintPreview from "../role-views/ConfirmationLetterPrintPreview";
import QprPrintPreview from "../role-views/QprPrintPreview";
import { formatLeadTime } from "../../../services/qprService";

interface PipelineStage {
  name: string;
  status: "APPROVED" | "PENDING" | "UPCOMING";
  hours: number;
}

const parseDocDate = (docOrDate?: any): Date => {
  const now = new Date();
  if (!docOrDate) return now;
  if (docOrDate instanceof Date) {
    return isNaN(docOrDate.getTime()) ? now : docOrDate;
  }

  let raw: any = docOrDate;
  if (typeof docOrDate === "object") {
    raw = docOrDate.createdAt || docOrDate.refObject?.createdAt || docOrDate.date || docOrDate.refObject?.date || docOrDate.dateSent;
  }
  if (!raw) return now;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? now : raw;

  const str = String(raw).trim();
  const isDateOnly = !str.includes("T") || str.includes("T00:00:00");
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return now;

  if (isDateOnly) {
    const isToday = 
      parsed.getUTCFullYear() === now.getUTCFullYear() &&
      parsed.getUTCMonth() === now.getUTCMonth() &&
      parsed.getUTCDate() === now.getUTCDate();
    if (isToday) {
      return now;
    }
  }

  return parsed;
};

const getDocPipelineStages = (
  type: string,
  requiredRole?: string,
  status?: string,
  clApprovalProgress?: { sectAccounting: boolean; deptAccounting: boolean },
  linkedCl?: any,
  refObject?: any,
  docDateVal?: string | Date
): PipelineStage[] => {
  const now = new Date();
  const createdAt = parseDocDate(refObject?.createdAt ? refObject : (docDateVal || refObject));
  const isApproved = status === "APPROVED" || status === "CLOSED" || status === "CLOSED_PAID" || status === "FULLY_APPROVED" || requiredRole === "Closed";

  if (type === "NCR") {
    const chain = ["Foreman", "Sec. Head", "Dept. Head"];
    const progress = refObject?.ncrApprovalProgress;
    const secApprovedAt = progress?.approvedAtSectionHead ? new Date(progress.approvedAtSectionHead) : null;
    const deptApprovedAt = progress?.approvedAtDeptHead ? new Date(progress.approvedAtDeptHead) : null;

    let currentIndex = 0;
    if (requiredRole === "Section Head") currentIndex = 1;
    if (requiredRole === "Dept Head") currentIndex = 2;
    if (requiredRole === "Closed" || isApproved) currentIndex = 3;

    return chain.map((name, idx) => {
      let stageStatus: "APPROVED" | "PENDING" | "UPCOMING" = "UPCOMING";
      let hours = 0;

      if (idx < currentIndex) {
        stageStatus = "APPROVED";
      } else if (idx === currentIndex && !isApproved) {
        stageStatus = "PENDING";
      } else if (isApproved) {
        stageStatus = "APPROVED";
      }

      if (idx === 0) {
        // Foreman (Creation)
        hours = 0;
      } else if (idx === 1) {
        // Section Head
        if (stageStatus === "APPROVED") {
          hours = secApprovedAt ? Math.max(0, (secApprovedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)) : 0;
        } else if (stageStatus === "PENDING") {
          hours = Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        }
      } else if (idx === 2) {
        // Dept Head
        const start = secApprovedAt || createdAt;
        if (stageStatus === "APPROVED") {
          hours = deptApprovedAt ? Math.max(0, (deptApprovedAt.getTime() - start.getTime()) / (1000 * 60 * 60)) : 0;
        } else if (stageStatus === "PENDING") {
          hours = Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60));
        }
      }

      return { name, status: stageStatus, hours };
    });
  } else {
    // QPR or merged QPR/CL pipeline (11 stages)
    const stages: { name: string; status: "APPROVED" | "PENDING" | "UPCOMING"; hours: number }[] = [
      { name: "CREATE QPR", status: "UPCOMING", hours: 0 },
      { name: "SECTION HEAD QA", status: "UPCOMING", hours: 0 },
      { name: "DEPT. HEAD QA", status: "UPCOMING", hours: 0 },
      { name: "DIV. HEAD", status: "UPCOMING", hours: 0 },
      { name: "APPROVAL PURCHASING", status: "UPCOMING", hours: 0 },
      { name: "CREATE CL", status: "UPCOMING", hours: 0 },
      { name: "APPROVAL CL DEPT ACCOUNTING", status: "UPCOMING", hours: 0 },
      { name: "KIRIM VENDOR", status: "UPCOMING", hours: 0 },
      { name: "VENDOR APPROVAL", status: "UPCOMING", hours: 0 },
      { name: "CREATE SSC BILLING", status: "UPCOMING", hours: 0 },
      { name: "PAID", status: "UPCOMING", hours: 0 }
    ];

    const qprProgress = refObject?.approvalProgress;
    const secApprovedAt = qprProgress?.approvedAtSectionHead ? new Date(qprProgress.approvedAtSectionHead) : null;
    const deptApprovedAt = qprProgress?.approvedAtDeptHead ? new Date(qprProgress.approvedAtDeptHead) : null;
    const divApprovedAt = qprProgress?.approvedAtDivHead ? new Date(qprProgress.approvedAtDivHead) : null;
    const purchasingApprovedAt = qprProgress?.approvedAtPurchasing ? new Date(qprProgress.approvedAtPurchasing) : null;

    const clObj = linkedCl || (type === "CL" ? refObject : null);
    const clCreatedAt = clObj?.createdAt ? new Date(clObj.createdAt) : null;
    const clProg = clObj?.clApprovalProgress || clApprovalProgress || { sectAccounting: false, deptAccounting: false };
    const deptAccountingApprovedAt = clProg?.deptAccountingApprovedAt ? new Date(clProg.deptAccountingApprovedAt) : (clObj?.approvedAtDept ? new Date(clObj.approvedAtDept) : null);
    const purchasingSentDate = clObj?.purchasingSentDate ? new Date(clObj.purchasingSentDate) : null;
    const vendorApprovedDate = clObj?.vendorApprovedDate ? new Date(clObj.vendorApprovedDate) : null;
    const sscBillingDate = clObj?.sscBillingDate ? new Date(clObj.sscBillingDate) : null;
    const closedPaidDate = clObj?.closedPaidDate ? new Date(clObj.closedPaidDate) : (clObj?.closedPaid && clObj?.updatedAt ? new Date(clObj.updatedAt) : null);

    if (type === "CL" && !linkedCl) {
      // Pure CL document (no separate QPR predecessor)
      for (let i = 0; i <= 5; i++) {
        stages[i].status = "APPROVED";
        stages[i].hours = 0;
      }

      const isDeptApproved = !!(clProg?.deptAccounting || status === "FULLY_APPROVED" || status === "CLOSED_PAID");
      if (!isDeptApproved) {
        stages[6].status = "PENDING";
        stages[6].hours = Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        return stages;
      }
      stages[6].status = "APPROVED";
      stages[6].hours = deptAccountingApprovedAt ? Math.max(0, (deptAccountingApprovedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)) : 0;

      const isSent = !!(clObj?.purchasingSentCl || clObj?.sentToVendor || status === "APPROVED_BY_VENDOR" || status === "FULLY_APPROVED" || status === "CLOSED_PAID");
      const startSent = deptAccountingApprovedAt || createdAt;
      if (!isSent) {
        stages[7].status = "PENDING";
        stages[7].hours = Math.max(0, (now.getTime() - startSent.getTime()) / (1000 * 60 * 60));
        return stages;
      }
      stages[7].status = "APPROVED";
      stages[7].hours = purchasingSentDate ? Math.max(0, (purchasingSentDate.getTime() - startSent.getTime()) / (1000 * 60 * 60)) : 0;

      const isVendorAppr = !!(clObj?.vendorApproved || status === "APPROVED_BY_VENDOR" || status === "FULLY_APPROVED" || status === "CLOSED_PAID");
      const startVendor = purchasingSentDate || startSent;
      if (!isVendorAppr) {
        stages[8].status = "PENDING";
        stages[8].hours = Math.max(0, (now.getTime() - startVendor.getTime()) / (1000 * 60 * 60));
        return stages;
      }
      stages[8].status = "APPROVED";
      stages[8].hours = vendorApprovedDate ? Math.max(0, (vendorApprovedDate.getTime() - startVendor.getTime()) / (1000 * 60 * 60)) : 0;

      const isSsc = !!(clObj?.sscBilling || sscBillingDate || status === "CLOSED_PAID" || clObj?.closedPaid);
      const startSsc = vendorApprovedDate || startVendor;
      if (!isSsc) {
        stages[9].status = "PENDING";
        stages[9].hours = Math.max(0, (now.getTime() - startSsc.getTime()) / (1000 * 60 * 60));
        return stages;
      }
      stages[9].status = "APPROVED";
      stages[9].hours = sscBillingDate ? Math.max(0, (sscBillingDate.getTime() - startSsc.getTime()) / (1000 * 60 * 60)) : 0;

      const isPaid = status === "CLOSED_PAID" || clObj?.closedPaid;
      const startPaid = sscBillingDate || startSsc;
      if (!isPaid) {
        stages[10].status = "PENDING";
        stages[10].hours = Math.max(0, (now.getTime() - startPaid.getTime()) / (1000 * 60 * 60));
        return stages;
      }
      stages[10].status = "APPROVED";
      stages[10].hours = closedPaidDate ? Math.max(0, (closedPaidDate.getTime() - startPaid.getTime()) / (1000 * 60 * 60)) : 0;
      return stages;
    }

    // 0. CREATE QPR
    stages[0].status = status === "DRAFT" ? "PENDING" : "APPROVED";
    stages[0].hours = status === "DRAFT" ? Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)) : 0;
    if (status === "DRAFT") return stages;

    // 1. SECTION HEAD QA
    const isSecAppr = !!secApprovedAt || !!qprProgress?.checksumSectionHead || (requiredRole !== "Section Head" && requiredRole !== "Foreman") || isApproved;
    if (!isSecAppr && requiredRole === "Section Head") {
      stages[1].status = "PENDING";
      stages[1].hours = Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
      return stages;
    } else {
      stages[1].status = "APPROVED";
      stages[1].hours = secApprovedAt ? Math.max(0, (secApprovedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)) : 0;
    }

    // 2. DEPT. HEAD QA
    const isDeptAppr = !!deptApprovedAt || !!qprProgress?.checksumDeptHead || (requiredRole !== "Dept Head" && requiredRole !== "Section Head" && requiredRole !== "Foreman") || isApproved;
    const startDept = secApprovedAt || createdAt;
    if (!isDeptAppr && requiredRole === "Dept Head") {
      stages[2].status = "PENDING";
      stages[2].hours = Math.max(0, (now.getTime() - startDept.getTime()) / (1000 * 60 * 60));
      return stages;
    } else {
      stages[2].status = "APPROVED";
      stages[2].hours = deptApprovedAt ? Math.max(0, (deptApprovedAt.getTime() - startDept.getTime()) / (1000 * 60 * 60)) : 0;
    }

    // 3. DIV. HEAD
    const isDivAppr = !!divApprovedAt || !!qprProgress?.checksumDivHead || (requiredRole !== "Div Head" && requiredRole !== "Dept Head" && requiredRole !== "Section Head" && requiredRole !== "Foreman") || isApproved;
    const startDiv = deptApprovedAt || startDept;
    if (!isDivAppr && requiredRole === "Div Head") {
      stages[3].status = "PENDING";
      stages[3].hours = Math.max(0, (now.getTime() - startDiv.getTime()) / (1000 * 60 * 60));
      return stages;
    } else {
      stages[3].status = "APPROVED";
      stages[3].hours = divApprovedAt ? Math.max(0, (divApprovedAt.getTime() - startDiv.getTime()) / (1000 * 60 * 60)) : 0;
    }

    // 4. APPROVAL PURCHASING
    const isPurchAppr = !!purchasingApprovedAt || !!qprProgress?.checksumPurchasing || requiredRole === "Closed" || isApproved || !!linkedCl;
    const startPurch = divApprovedAt || startDiv;
    if (!isPurchAppr && requiredRole === "Purchasing") {
      stages[4].status = "PENDING";
      stages[4].hours = Math.max(0, (now.getTime() - startPurch.getTime()) / (1000 * 60 * 60));
      return stages;
    } else {
      stages[4].status = "APPROVED";
      stages[4].hours = purchasingApprovedAt ? Math.max(0, (purchasingApprovedAt.getTime() - startPurch.getTime()) / (1000 * 60 * 60)) : 0;
    }

    // 5. CREATE CL
    const startClCreate = purchasingApprovedAt || startPurch;
    if (!linkedCl) {
      stages[5].status = "PENDING";
      stages[5].hours = Math.max(0, (now.getTime() - startClCreate.getTime()) / (1000 * 60 * 60));
      return stages;
    } else {
      stages[5].status = "APPROVED";
      stages[5].hours = clCreatedAt ? Math.max(0, (clCreatedAt.getTime() - startClCreate.getTime()) / (1000 * 60 * 60)) : 0;
    }

    // 6. APPROVAL CL DEPT ACCOUNTING
    const isDeptAccAppr = !!(clProg.deptAccounting || linkedCl.status === "APPROVED_DEPT" || linkedCl.status === "FULLY_APPROVED" || linkedCl.status === "CLOSED_PAID" || linkedCl.closedPaid);
    const startClDept = clCreatedAt || startClCreate;
    if (!isDeptAccAppr) {
      stages[6].status = "PENDING";
      stages[6].hours = Math.max(0, (now.getTime() - startClDept.getTime()) / (1000 * 60 * 60));
      return stages;
    } else {
      stages[6].status = "APPROVED";
      stages[6].hours = deptAccountingApprovedAt ? Math.max(0, (deptAccountingApprovedAt.getTime() - startClDept.getTime()) / (1000 * 60 * 60)) : 0;
    }

    // 7. KIRIM VENDOR
    const isSentVendor = !!(linkedCl.purchasingSentCl || linkedCl.sentToVendor || linkedCl.status === "APPROVED_BY_VENDOR" || linkedCl.status === "FULLY_APPROVED" || linkedCl.status === "CLOSED_PAID" || linkedCl.closedPaid);
    const startKirim = deptAccountingApprovedAt || startClDept;
    if (!isSentVendor) {
      stages[7].status = "PENDING";
      stages[7].hours = Math.max(0, (now.getTime() - startKirim.getTime()) / (1000 * 60 * 60));
      return stages;
    } else {
      stages[7].status = "APPROVED";
      stages[7].hours = purchasingSentDate ? Math.max(0, (purchasingSentDate.getTime() - startKirim.getTime()) / (1000 * 60 * 60)) : 0;
    }

    // 8. VENDOR APPROVAL
    const isVendorAppr = !!(linkedCl.vendorApproved || linkedCl.status === "APPROVED_BY_VENDOR" || linkedCl.status === "FULLY_APPROVED" || linkedCl.status === "CLOSED_PAID" || linkedCl.closedPaid);
    const startVendor = purchasingSentDate || startKirim;
    if (!isVendorAppr) {
      stages[8].status = "PENDING";
      stages[8].hours = Math.max(0, (now.getTime() - startVendor.getTime()) / (1000 * 60 * 60));
      return stages;
    } else {
      stages[8].status = "APPROVED";
      stages[8].hours = vendorApprovedDate ? Math.max(0, (vendorApprovedDate.getTime() - startVendor.getTime()) / (1000 * 60 * 60)) : 0;
    }

    // 9. CREATE SSC BILLING
    const isSsc = !!(linkedCl.sscBilling || linkedCl.sscBillingDate || linkedCl.status === "CLOSED_PAID" || linkedCl.closedPaid);
    const startSsc = vendorApprovedDate || startVendor;
    if (!isSsc) {
      stages[9].status = "PENDING";
      stages[9].hours = Math.max(0, (now.getTime() - startSsc.getTime()) / (1000 * 60 * 60));
      return stages;
    } else {
      stages[9].status = "APPROVED";
      stages[9].hours = sscBillingDate ? Math.max(0, (sscBillingDate.getTime() - startSsc.getTime()) / (1000 * 60 * 60)) : 0;
    }

    // 10. PAID
    const isPaid = linkedCl.status === "CLOSED_PAID" || linkedCl.closedPaid;
    const startPaid = sscBillingDate || startSsc;
    if (!isPaid) {
      stages[10].status = "PENDING";
      stages[10].hours = Math.max(0, (now.getTime() - startPaid.getTime()) / (1000 * 60 * 60));
      return stages;
    } else {
      stages[10].status = "APPROVED";
      stages[10].hours = closedPaidDate ? Math.max(0, (closedPaidDate.getTime() - startPaid.getTime()) / (1000 * 60 * 60)) : 0;
      return stages;
    }
  }
};

interface DashboardProps {
  pendingNcrs: any[];
  pendingQprs: any[];
  parts: any[];
  setActiveTab: (tab: string) => void;
  confirmationLetters?: any[];
  setConfirmationLetters?: React.Dispatch<React.SetStateAction<any[]>>;
  createdSscBillings?: any[];
  setCreatedSscBillings?: React.Dispatch<React.SetStateAction<any[]>>;
  username?: string;
  handleMarkClosedPaid?: (clId: string) => void;
}

export default function Dashboard({
  pendingNcrs,
  pendingQprs,
  parts,
  setActiveTab,
  confirmationLetters = [],
  setConfirmationLetters,
  createdSscBillings = [],
  setCreatedSscBillings,
  username = "admin",
  handleMarkClosedPaid
}: DashboardProps) {
  const [previewClDoc, setPreviewClDoc] = useState<any | null>(null);
  const [previewQprDoc, setPreviewQprDoc] = useState<any | null>(null);
  const [selectedRoleCard, setSelectedRoleCard] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedPipelineDoc, setSelectedPipelineDoc] = useState<any | null>(null);
  const [showPipeline, setShowPipeline] = useState(false);

  const [roleDetailFilter, setRoleDetailFilter] = useState<"all" | "stuck" | "running" | "completed">("all");
  const [potongTagihFilter, setPotongTagihFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [potongTagihSearch, setPotongTagihSearch] = useState("");

  // Live real-time interval ticker (updates every second so seconds increment dynamically)
  const [, setLiveTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTick(t => (t + 1) % 100000);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const months = React.useMemo(() => [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ], []);

  const currentYear = new Date().getFullYear();
  
  // Dynamic list of periods derived from actual data + standard months
  const periods = React.useMemo(() => {
    const list = new Set<string>();
    list.add("Semua Periode");
    
    [...pendingQprs, ...confirmationLetters, ...pendingNcrs, ...createdSscBillings].forEach((item: any) => {
      const d = item.date || item.dateSent || item.billingDate || (item.memoRequestDate ? item.memoRequestDate.split('/').reverse().join('-') : null);
      if (item.period || item.memoPeriod) {
        list.add(item.period || item.memoPeriod);
      } else if (d) {
        const dateObj = new Date(d);
        if (!isNaN(dateObj.getTime())) {
          list.add(`${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`);
        }
      }
    });

    months.forEach(m => list.add(`${m} ${currentYear}`));
    return Array.from(list);
  }, [pendingQprs, confirmationLetters, pendingNcrs, createdSscBillings, months, currentYear]);
  
  // Set default period: "Semua Periode" (index 0) so user immediately sees live data
  const [periodIndex, setPeriodIndex] = useState(0);
  
  const activePeriod = periods[periodIndex] || "Semua Periode";

  const getDynamicPeriodConfig = (periodName: string) => {
    const getPeriodFromDate = (dateStr?: string) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const isAll = periodName === "Semua Periode";

    const activePeriodQprs = isAll
      ? pendingQprs
      : pendingQprs.filter(q => {
          const p = q.period || getPeriodFromDate(q.date);
          return p === periodName;
        });

    const activePeriodConfirmationLetters = isAll
      ? confirmationLetters
      : confirmationLetters.filter(cl => {
          const p = cl.period || getPeriodFromDate(cl.dateSent || cl.date);
          return p === periodName;
        });

    const activePeriodNcrs = isAll
      ? pendingNcrs
      : pendingNcrs.filter(n => {
          const p = n.period || getPeriodFromDate(n.date);
          return p === periodName;
        });

    const base = { baselineClosedNcrs: 0, baselineClosedQprs: 0, aprilClaims: 0, mayClaimsClosed: 0, mayClaimsPending: 0, claimClosedPaidCount: 0, claimRejectedCount: 0 };
    
    const pendingActiveQprs = activePeriodQprs.filter(q => 
      q.status !== "APPROVED" &&
      q.status !== "CLOSED" && 
      q.status !== "CLOSED_PAID" && 
      q.status !== "REJECTED" &&
      q.requiredRole !== "Closed" &&
      !activePeriodConfirmationLetters.some(cl => cl.qprNumber === q.qprNumber)
    );
    
    return {
      ...base,
      activeNcrs: activePeriodNcrs,
      activeQprs: activePeriodQprs,
      activeConfirmationLetters: activePeriodConfirmationLetters,
      claimPendingCount: pendingActiveQprs.length + activePeriodConfirmationLetters.filter(c => !c.closedPaid && c.status !== "CLOSED_PAID").length,
      dynamicClaimsValue: pendingActiveQprs.reduce((acc, q) => acc + parseInt(String(q.claimAmount || "0").replace(/[^0-9]/g, "") || "0", 10), 0) + activePeriodConfirmationLetters.filter(c => !c.closedPaid && c.status !== "CLOSED_PAID").reduce((acc, cl) => acc + parseInt(String(cl.amount || "0").replace(/[^0-9]/g, "") || "0", 10), 0)
    };
  };

  const currentConfig = getDynamicPeriodConfig(activePeriod);
  const baselineClosedNcrs = currentConfig.baselineClosedNcrs;
  const baselineClosedQprs = currentConfig.baselineClosedQprs;
  
  const currentActiveNcrs = currentConfig.activeNcrs;
  const totalActiveNcrs = currentActiveNcrs.length;
  const ncrInProgress = currentActiveNcrs.filter((n: any) => n.status === "WAITING_APPROVAL" || n.status === "DRAFT").length;
  const ncrClosed = baselineClosedNcrs + currentActiveNcrs.filter((n: any) => n.status === "APPROVED" || n.status === "CLOSED").length;
  const totalNcrs = ncrClosed + ncrInProgress;

  const currentActiveQprs = currentConfig.activeQprs;
  const currentActiveConfirmationLetters = currentConfig.activeConfirmationLetters;
  const totalActiveQprs = currentActiveQprs.length;
  
  // QPR: WAITING_APPROVAL / DRAFT / UNDER_REVISION is in progress, while APPROVED / CLOSED / CLOSED_PAID is completed (Selesai)
  const qprInProgress = currentActiveQprs.filter((q: any) => 
    q.status === "WAITING_APPROVAL" || 
    q.status === "DRAFT" || 
    q.status === "UNDER_REVISION" || 
    q.status === "REVISE" ||
    (q.status !== "APPROVED" && q.status !== "CLOSED" && q.status !== "CLOSED_PAID" && q.status !== "REJECTED" && q.requiredRole !== "Closed")
  ).length;

  const qprClosed = baselineClosedQprs + currentActiveQprs.filter((q: any) => 
    q.status === "APPROVED" || 
    q.status === "CLOSED" || 
    q.status === "CLOSED_PAID" || 
    q.status === "APPROVED_BY_VENDOR" || 
    q.status === "FULLY_APPROVED" ||
    q.requiredRole === "Closed"
  ).length;

  const totalQprs = qprClosed + qprInProgress;

  const aprilClaims = currentConfig.aprilClaims;
  const mayClaimsClosed = currentConfig.mayClaimsClosed;
  const mayClaimsPending = currentConfig.mayClaimsPending;
  const dynamicClaimsValue = currentConfig.dynamicClaimsValue;
  const totalClaimsVal = aprilClaims + mayClaimsClosed + mayClaimsPending + dynamicClaimsValue;

  // Helper: Working days calculation excluding Saturdays (6) and Sundays (0)
  const getWorkingDaysElapsed = (startDateStr?: string | Date, endDateStr?: string | Date): number => {
    if (!startDateStr) return 0;
    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    if (start > end) return 0;

    let workingDays = 0;
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const finish = new Date(end);
    finish.setHours(0, 0, 0, 0);

    while (cur < finish) {
      cur.setDate(cur.getDate() + 1);
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        workingDays++;
      }
    }
    return workingDays;
  };

  // Helper: Format date after 10 working days
  const getTarget10WorkingDaysDate = (startDateStr?: string | Date): string => {
    if (!startDateStr) return "-";
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return "-";
    
    let added = 0;
    const cur = new Date(start);
    while (added < 10) {
      cur.setDate(cur.getDate() + 1);
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        added++;
      }
    }
    return cur.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  const parseAmountValue = (amt: any): number => {
    if (typeof amt === "number") return amt;
    if (!amt) return 0;
    const cleaned = String(amt).replace(/[^0-9]/g, "");
    return parseInt(cleaned, 10) || 0;
  };

  // CL Progress and Closed Paid dynamic calculations
  const clLunas = currentConfig.claimClosedPaidCount + currentActiveConfirmationLetters.filter((cl: any) => {
    const isSent = !!(cl.purchasingSentCl || cl.purchasingSentDate || cl.dateSent);
    const d = cl.purchasingSentDate || cl.dateSent;
    const workingDays = isSent && d ? getWorkingDaysElapsed(d) : 0;
    return cl.closedPaid || cl.status === "CLOSED_PAID" || (isSent && workingDays >= 10);
  }).length;
  const clProgress = currentActiveConfirmationLetters.filter((cl: any) => {
    const isSent = !!(cl.purchasingSentCl || cl.purchasingSentDate || cl.dateSent);
    const d = cl.purchasingSentDate || cl.dateSent;
    const workingDays = isSent && d ? getWorkingDaysElapsed(d) : 0;
    return !cl.closedPaid && cl.status !== "CLOSED_PAID" && (!isSent || workingDays < 10);
  }).length;
  const totalCl = clLunas + clProgress;

  const claimClosedPaidCount = clLunas;
  const claimPendingCount = clProgress + qprInProgress;
  const claimRejectedCount = currentConfig.claimRejectedCount + currentActiveQprs.filter((q: any) => q.status === "REJECTED").length;
  const totalClaimsCount = claimClosedPaidCount + claimPendingCount + claimRejectedCount;

  // Consolidated Potong Tagih data triggered by SSC Billing
  const potongTagihItems = React.useMemo(() => {
    const isAll = activePeriod === "Semua Periode";
    const itemsMap = new Map<string, any>();

    const getPeriodFromDate = (dateStr?: string) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    // 1. Process from createdSscBillings (SSC Billing direct records)
    createdSscBillings.forEach((b: any) => {
      const d = b.dateSent || b.billingDate || (b.memoRequestDate ? b.memoRequestDate.split('/').reverse().join('-') : null) || b.createdAt;
      const p = b.period || getPeriodFromDate(d);
      if (!isAll && p && p !== activePeriod) return;

      const amtNum = parseAmountValue(b.totalAmount || b.amount || b.memoAmount);
      const workingDays = getWorkingDaysElapsed(d);
      const isDue10Days = workingDays >= 10;
      const isPaid = b.status === "CLOSED_PAID" || b.status === "PAID" || b.closedPaid === true || isDue10Days;
      const isTriggered10Days = workingDays >= 10;
      const key = b.clNumber || b.billingNo || b.id;

      itemsMap.set(key, {
        id: b.id,
        clId: b.clId || b.id,
        docNumber: b.billingNo || b.clNumber || "SSC-BILLING",
        clNumber: b.clNumber || "",
        vendor: b.supplierName || b.memoCustomerName || b.cl?.vendor?.vendorName || "Vendor",
        date: d ? (typeof d === "string" ? d.split("T")[0] : new Date(d).toISOString().split("T")[0]) : new Date().toISOString().split("T")[0],
        workingDays,
        target10DaysDate: getTarget10WorkingDaysDate(d),
        amount: amtNum,
        formattedAmount: `Rp ${amtNum.toLocaleString("id-ID")}`,
        isPaid,
        isTriggered10Days,
        isDue10Days,
        status: isPaid ? "PAID" : "WAITING_DAYS",
        sourceType: "SSC_BILLING",
        rawObject: b
      });
    });

    // 2. Process from activePeriodConfirmationLetters that are in Potong Tagih / SSC Billing flow
    currentActiveConfirmationLetters.forEach((cl: any) => {
      const key = cl.clNumber || cl.id;
      if (!itemsMap.has(key)) {
        const d = cl.purchasingSentDate || cl.dateSent || cl.date || cl.createdAt;
        const amtNum = parseAmountValue(cl.amount);
        const workingDays = getWorkingDaysElapsed(d);
        const isDue10Days = workingDays >= 10;
        const isPaid = cl.status === "CLOSED_PAID" || cl.closedPaid === true || isDue10Days;
        const isTriggered10Days = workingDays >= 10;

        itemsMap.set(key, {
          id: cl.id,
          clId: cl.id,
          docNumber: cl.clNumber,
          clNumber: cl.clNumber,
          vendor: cl.supplierName || cl.vendor?.vendorName || "Vendor",
          date: d ? (typeof d === "string" ? d.split("T")[0] : new Date(d).toISOString().split("T")[0]) : new Date().toISOString().split("T")[0],
          workingDays,
          target10DaysDate: getTarget10WorkingDaysDate(d),
          amount: amtNum,
          formattedAmount: `Rp ${amtNum.toLocaleString("id-ID")}`,
          isPaid,
          isTriggered10Days,
          isDue10Days,
          status: isPaid ? "PAID" : "WAITING_DAYS",
          sourceType: "CL_POTONG_TAGIH",
          rawObject: cl
        });
      }
    });

    return Array.from(itemsMap.values());
  }, [createdSscBillings, currentActiveConfirmationLetters, activePeriod, months]);

  // Aggregate Metrics for Potong Tagih (Triggered by SSC Billing)
  const totalPotongTagihAmount = potongTagihItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPotongTagihCount = potongTagihItems.length;

  const unpaidPotongTagihItems = potongTagihItems.filter(item => !item.isPaid);
  const unpaidPotongTagihAmount = unpaidPotongTagihItems.reduce((sum, item) => sum + item.amount, 0);
  const unpaidPotongTagihCount = unpaidPotongTagihItems.length;

  // Breakdown Sebelum Paid: Trigger 10 Hari Kerja
  const maturedUnpaidItems = unpaidPotongTagihItems.filter(item => item.isTriggered10Days);
  const maturedUnpaidAmount = maturedUnpaidItems.reduce((sum, item) => sum + item.amount, 0);
  const maturedUnpaidCount = maturedUnpaidItems.length;

  const waitingUnpaidItems = unpaidPotongTagihItems.filter(item => !item.isTriggered10Days);
  const waitingUnpaidAmount = waitingUnpaidItems.reduce((sum, item) => sum + item.amount, 0);
  const waitingUnpaidCount = waitingUnpaidItems.length;

  // Amount Sudah Paid (Lunas)
  const paidPotongTagihItems = potongTagihItems.filter(item => item.isPaid);
  const paidPotongTagihAmount = paidPotongTagihItems.reduce((sum, item) => sum + item.amount, 0);
  const paidPotongTagihCount = paidPotongTagihItems.length;

  const paidRealizationPct = totalPotongTagihAmount > 0 
    ? Math.min(100, Math.round((paidPotongTagihAmount / totalPotongTagihAmount) * 100)) 
    : (totalPotongTagihCount > 0 ? Math.round((paidPotongTagihCount / totalPotongTagihCount) * 100) : 0);

  // Filtered list for display table
  const displayedPotongTagihDocs = potongTagihItems.filter(item => {
    if (potongTagihFilter === "unpaid" && item.isPaid) return false;
    if (potongTagihFilter === "paid" && !item.isPaid) return false;
    if (potongTagihSearch) {
      const q = potongTagihSearch.toLowerCase();
      return (
        item.docNumber.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q) ||
        item.formattedAmount.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Helper to calculate elapsed hours dynamically
  const getDocLeadTimes = (doc: any) => {
    const docDate = parseDocDate(doc);
    const now = new Date();
    
    // Determine if document is closed/completed
    const isClosed = 
      doc.status === "APPROVED" || 
      doc.status === "CLOSED" || 
      doc.status === "CLOSED_PAID" || 
      doc.status === "FULLY_APPROVED" || 
      doc.closedPaid === true;

    // Use updatedAt as closure date if closed, otherwise use current live system time
    const endDate = isClosed && doc.updatedAt ? new Date(doc.updatedAt) : now;
    
    // Calculate difference in hours (with a minimum of 0 to prevent negative values)
    const diffTime = Math.max(0, endDate.getTime() - docDate.getTime());
    const diffHours = Math.max(0, diffTime / (1000 * 60 * 60));

    if (doc.clNumber || doc.type === "CL" || doc.type === "Confirmation Letter") {
      const isClApproved = doc.closedPaid || doc.status === "CLOSED_PAID" || doc.status === "FULLY_APPROVED" || doc.vendorApproved;
      return {
        roles: ["Accounting"],
        leadTimes: {
          "Accounting": { 
            hours: diffHours, 
            days: diffHours, 
            status: isClApproved ? "APPROVED" as const : "PENDING" as const 
          }
        },
        totalLeadTime: diffHours
      };
    }

    if (doc.qprNumber || doc.type === "QPR") {
      const roles = ["Section Head", "Dept Head", "Div Head", "Purchasing"];
      const currentRole = doc.requiredRole;
      const progress = doc.approvalProgress || doc.refObject?.approvalProgress;
      
      const secApprovedAt = progress?.approvedAtSectionHead ? new Date(progress.approvedAtSectionHead) : null;
      const deptApprovedAt = progress?.approvedAtDeptHead ? new Date(progress.approvedAtDeptHead) : null;
      const divApprovedAt = progress?.approvedAtDivHead ? new Date(progress.approvedAtDivHead) : null;
      const purchasingApprovedAt = progress?.approvedAtPurchasing ? new Date(progress.approvedAtPurchasing) : null;

      const isDocClosed = doc.status === "APPROVED" || doc.status === "CLOSED" || doc.status === "CLOSED_PAID" || doc.status === "FULLY_APPROVED" || !!purchasingApprovedAt;
      const leadTimes: Record<string, { hours: number; days: number; status: "APPROVED" | "PENDING" | "UPCOMING" }> = {};
      
      // 1. Section Head
      const isSecApproved = !!secApprovedAt || !!progress?.checksumSectionHead || (currentRole !== "Section Head" && currentRole !== "Foreman") || isDocClosed;
      let secHours = 0;
      if (secApprovedAt) {
        secHours = Math.max(0, (secApprovedAt.getTime() - docDate.getTime()) / (1000 * 60 * 60));
      } else if (currentRole === "Section Head" && !isDocClosed) {
        secHours = Math.max(0, (now.getTime() - docDate.getTime()) / (1000 * 60 * 60));
      } else if (isSecApproved) {
        secHours = Math.max(0, diffHours * 0.25);
      }
      leadTimes["Section Head"] = {
        hours: isSecApproved ? secHours : (currentRole === "Section Head" ? secHours : 0),
        days: isSecApproved ? secHours : (currentRole === "Section Head" ? secHours : 0),
        status: isSecApproved ? "APPROVED" : (currentRole === "Section Head" ? "PENDING" : "UPCOMING")
      };

      // 2. Dept Head
      const isDeptApproved = !!deptApprovedAt || !!progress?.checksumDeptHead || (currentRole === "Div Head" || currentRole === "Purchasing" || currentRole === "Closed") || isDocClosed;
      const deptStart = secApprovedAt || docDate;
      let deptHours = 0;
      if (deptApprovedAt) {
        deptHours = Math.max(0, (deptApprovedAt.getTime() - deptStart.getTime()) / (1000 * 60 * 60));
      } else if (currentRole === "Dept Head" && !isDocClosed) {
        deptHours = Math.max(0, (now.getTime() - deptStart.getTime()) / (1000 * 60 * 60));
      } else if (isDeptApproved) {
        deptHours = Math.max(0, diffHours * 0.25);
      }
      leadTimes["Dept Head"] = {
        hours: isDeptApproved ? deptHours : (currentRole === "Dept Head" ? deptHours : 0),
        days: isDeptApproved ? deptHours : (currentRole === "Dept Head" ? deptHours : 0),
        status: isDeptApproved ? "APPROVED" : (currentRole === "Dept Head" ? "PENDING" : "UPCOMING")
      };

      // 3. Div Head
      const isDivApproved = !!divApprovedAt || !!progress?.checksumDivHead || (currentRole === "Purchasing" || currentRole === "Closed") || isDocClosed;
      const divStart = deptApprovedAt || deptStart;
      let divHours = 0;
      if (divApprovedAt) {
        divHours = Math.max(0, (divApprovedAt.getTime() - divStart.getTime()) / (1000 * 60 * 60));
      } else if (currentRole === "Div Head" && !isDocClosed) {
        divHours = Math.max(0, (now.getTime() - divStart.getTime()) / (1000 * 60 * 60));
      } else if (isDivApproved) {
        divHours = Math.max(0, diffHours * 0.25);
      }
      leadTimes["Div Head"] = {
        hours: isDivApproved ? divHours : (currentRole === "Div Head" ? divHours : 0),
        days: isDivApproved ? divHours : (currentRole === "Div Head" ? divHours : 0),
        status: isDivApproved ? "APPROVED" : (currentRole === "Div Head" ? "PENDING" : "UPCOMING")
      };

      // 4. Purchasing
      const isPurchasingApproved = !!purchasingApprovedAt || !!progress?.checksumPurchasing || currentRole === "Closed" || isDocClosed;
      const purchStart = divApprovedAt || divStart;
      let purchHours = 0;
      if (purchasingApprovedAt) {
        purchHours = Math.max(0, (purchasingApprovedAt.getTime() - purchStart.getTime()) / (1000 * 60 * 60));
      } else if (currentRole === "Purchasing" && !isDocClosed) {
        purchHours = Math.max(0, (now.getTime() - purchStart.getTime()) / (1000 * 60 * 60));
      } else if (isPurchasingApproved) {
        purchHours = Math.max(0, diffHours * 0.25);
      }
      leadTimes["Purchasing"] = {
        hours: isPurchasingApproved ? purchHours : (currentRole === "Purchasing" ? purchHours : 0),
        days: isPurchasingApproved ? purchHours : (currentRole === "Purchasing" ? purchHours : 0),
        status: isPurchasingApproved ? "APPROVED" : (currentRole === "Purchasing" ? "PENDING" : "UPCOMING")
      };

      const totalLeadTime = Object.values(leadTimes).reduce((sum, item) => sum + item.hours, 0) || diffHours;
      return { roles, leadTimes, totalLeadTime };
    } else {
      // NCR document!
      const roles = ["Foreman", "Section Head", "Dept Head"];
      const currentRole = doc.requiredRole || "Section Head";
      const progress = doc.ncrApprovalProgress || doc.refObject?.ncrApprovalProgress;
      
      const secApprovedAt = progress?.approvedAtSectionHead ? new Date(progress.approvedAtSectionHead) : null;
      const deptApprovedAt = progress?.approvedAtDeptHead ? new Date(progress.approvedAtDeptHead) : null;
      const isDocClosed = doc.status === "APPROVED" || doc.status === "CLOSED" || !!deptApprovedAt;

      const leadTimes: Record<string, { hours: number; days: number; status: "APPROVED" | "PENDING" | "UPCOMING" }> = {};
      
      leadTimes["Foreman"] = { hours: 0, days: 0, status: "APPROVED" };

      const isSecApproved = !!secApprovedAt || !!progress?.checksumApprovalSectionHead || currentRole === "Dept Head" || isDocClosed;
      let secHours = secApprovedAt 
        ? Math.max(0, (secApprovedAt.getTime() - docDate.getTime()) / (1000 * 60 * 60))
        : (currentRole === "Section Head" ? Math.max(0, (now.getTime() - docDate.getTime()) / (1000 * 60 * 60)) : 0);
      leadTimes["Section Head"] = {
        hours: isSecApproved ? secHours : (currentRole === "Section Head" ? secHours : 0),
        days: isSecApproved ? secHours : (currentRole === "Section Head" ? secHours : 0),
        status: isSecApproved ? "APPROVED" : (currentRole === "Section Head" ? "PENDING" : "UPCOMING")
      };

      const isDeptApproved = !!deptApprovedAt || !!progress?.checksumApprovalDeptHead || isDocClosed;
      const deptStart = secApprovedAt || docDate;
      let deptHours = deptApprovedAt
        ? Math.max(0, (deptApprovedAt.getTime() - deptStart.getTime()) / (1000 * 60 * 60))
        : (currentRole === "Dept Head" ? Math.max(0, (now.getTime() - deptStart.getTime()) / (1000 * 60 * 60)) : 0);
      leadTimes["Dept Head"] = {
        hours: isDeptApproved ? deptHours : (currentRole === "Dept Head" ? deptHours : 0),
        days: isDeptApproved ? deptHours : (currentRole === "Dept Head" ? deptHours : 0),
        status: isDeptApproved ? "APPROVED" : (currentRole === "Dept Head" ? "PENDING" : "UPCOMING")
      };

      const totalLeadTime = Object.values(leadTimes).reduce((sum, item) => sum + item.hours, 0) || diffHours;
      return { roles, leadTimes, totalLeadTime };
    }
  };

  // Define authorization roles for lead time cards (Section Head QA, Dept. Head QA, Div. Head, Purchasing, Accounting, Vendor, Finance)
  const authRoles = [
    {
      key: "Section Head QA",
      title: "Section Head QA",
      fullTitle: "Section Head QA",
      roles: ["Section Head"],
      titleColor: "text-blue-700",
      labelColor: "text-blue-700",
      borderColor: "border-blue-200 hover:border-blue-400",
      activeBg: "bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20",
      type: "QA"
    },
    {
      key: "Dept. Head QA",
      title: "Dept. Head QA",
      fullTitle: "Dept. Head QA",
      roles: ["Dept Head"],
      titleColor: "text-indigo-700",
      labelColor: "text-indigo-700",
      borderColor: "border-indigo-200 hover:border-indigo-400",
      activeBg: "bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-500/20",
      type: "QA"
    },
    {
      key: "Div. Head",
      title: "Div. Head",
      fullTitle: "Div. Head",
      roles: ["Div Head"],
      titleColor: "text-purple-700",
      labelColor: "text-purple-700",
      borderColor: "border-purple-200 hover:border-purple-400",
      activeBg: "bg-purple-50/60 border-purple-500 ring-2 ring-purple-500/20",
      type: "DIV"
    },
    {
      key: "Purchasing",
      title: "Purchasing",
      fullTitle: "Purchasing",
      roles: ["Purchasing"],
      titleColor: "text-amber-800",
      labelColor: "text-amber-800",
      borderColor: "border-amber-200 hover:border-amber-400",
      activeBg: "bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/20",
      type: "PURCHASING"
    },
    {
      key: "Dept Accounting",
      title: "Dept Accounting",
      fullTitle: "Dept Accounting",
      roles: ["Dept Accounting", "Sect Accounting", "Accounting Approval", "Accounting"],
      titleColor: "text-emerald-800",
      labelColor: "text-emerald-800",
      borderColor: "border-emerald-200 hover:border-emerald-400",
      activeBg: "bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20",
      type: "ACCOUNTING"
    },
    {
      key: "Vendor",
      title: "Vendor",
      fullTitle: "Vendor",
      roles: ["Vendor"],
      titleColor: "text-rose-800",
      labelColor: "text-rose-800",
      borderColor: "border-rose-200 hover:border-rose-400",
      activeBg: "bg-rose-50/60 border-rose-500 ring-2 ring-rose-500/20",
      type: "VENDOR"
    },
    {
      key: "Finance Accounting",
      title: "Finance Accoun...",
      fullTitle: "Finance Accounting (SSC)",
      roles: ["Finance", "Finance Accounting"],
      titleColor: "text-teal-800",
      labelColor: "text-teal-800",
      borderColor: "border-teal-200 hover:border-teal-400",
      activeBg: "bg-teal-50/60 border-teal-500 ring-2 ring-teal-500/20",
      type: "FINANCE"
    }
  ];

  // Helper to extract active (berjalan), stuck (mengendap), and completed (selesai) docs for each authorization role
  const getRoleDocsData = (role: typeof authRoles[0]) => {
    const runningDocs: any[] = [];
    const completedDocs: any[] = [];
    
    // 1. QA Section Head
    if (role.key === "Section Head QA") {
      currentActiveNcrs.forEach(ncr => {
        const lt = getDocLeadTimes(ncr);
        const days = lt.leadTimes["Section Head"]?.days || lt.totalLeadTime;
        const item = {
          id: `ncr-${ncr.id}`,
          docNumber: ncr.ncrNumber,
          type: "NCR",
          vendor: ncr.supplierName,
          date: ncr.date,
          requiredRole: ncr.requiredRole,
          daysStuck: days,
          isStuck: days >= 24,
          amount: `${ncr.reject || ncr.qty || 0} Reject`,
          activeTab: "approve-ncr"
        };
        if (ncr.status !== "APPROVED" && ncr.status !== "CLOSED" && ncr.requiredRole === "Section Head") {
          runningDocs.push(item);
        } else if (ncr.status === "APPROVED" || ncr.status === "CLOSED" || ncr.requiredRole === "Dept Head" || ncr.requiredRole === "Closed") {
          completedDocs.push(item);
        }
      });
      currentActiveQprs.forEach(qpr => {
        const lt = getDocLeadTimes(qpr);
        const days = lt.leadTimes["Section Head"]?.days || lt.totalLeadTime;
        const item = {
          id: `qpr-${qpr.id}`,
          docNumber: qpr.qprNumber,
          type: "QPR",
          vendor: qpr.supplierName,
          date: qpr.date,
          requiredRole: qpr.requiredRole,
          daysStuck: days,
          isStuck: days >= 24,
          amount: qpr.claimAmount || "-",
          activeTab: "approve-qpr"
        };
        if (qpr.status !== "APPROVED" && qpr.status !== "CLOSED" && qpr.requiredRole === "Section Head") {
          runningDocs.push(item);
        } else if (qpr.status === "APPROVED" || qpr.status === "CLOSED" || qpr.requiredRole === "Dept Head" || qpr.requiredRole === "Div Head" || qpr.requiredRole === "Purchasing" || qpr.requiredRole === "Closed") {
          completedDocs.push(item);
        }
      });
    }

    // 2. QA Dept Head
    if (role.key === "Dept. Head QA") {
      currentActiveNcrs.forEach(ncr => {
        const lt = getDocLeadTimes(ncr);
        const days = lt.leadTimes["Dept Head"]?.days || lt.totalLeadTime;
        const item = {
          id: `ncr-${ncr.id}`,
          docNumber: ncr.ncrNumber,
          type: "NCR",
          vendor: ncr.supplierName,
          date: ncr.date,
          requiredRole: ncr.requiredRole,
          daysStuck: days,
          isStuck: days >= 24,
          amount: `${ncr.reject || ncr.qty || 0} Reject`,
          activeTab: "approve-ncr"
        };
        if (ncr.status !== "APPROVED" && ncr.status !== "CLOSED" && ncr.requiredRole === "Dept Head") {
          runningDocs.push(item);
        } else if (ncr.status === "APPROVED" || ncr.status === "CLOSED" || ncr.requiredRole === "Closed") {
          completedDocs.push(item);
        }
      });
      currentActiveQprs.forEach(qpr => {
        const lt = getDocLeadTimes(qpr);
        const days = lt.leadTimes["Dept Head"]?.days || lt.totalLeadTime;
        const item = {
          id: `qpr-${qpr.id}`,
          docNumber: qpr.qprNumber,
          type: "QPR",
          vendor: qpr.supplierName,
          date: qpr.date,
          requiredRole: qpr.requiredRole,
          daysStuck: days,
          isStuck: days >= 24,
          amount: qpr.claimAmount || "-",
          activeTab: "approve-qpr"
        };
        if (qpr.status !== "APPROVED" && qpr.status !== "CLOSED" && qpr.requiredRole === "Dept Head") {
          runningDocs.push(item);
        } else if (qpr.status === "APPROVED" || qpr.status === "CLOSED" || qpr.requiredRole === "Div Head" || qpr.requiredRole === "Purchasing" || qpr.requiredRole === "Closed") {
          completedDocs.push(item);
        }
      });
    }

    // 3. Div Head
    if (role.key === "Div. Head") {
      currentActiveQprs.forEach(qpr => {
        const lt = getDocLeadTimes(qpr);
        const days = lt.leadTimes["Div Head"]?.days || lt.totalLeadTime;
        const item = {
          id: `qpr-${qpr.id}`,
          docNumber: qpr.qprNumber,
          type: "QPR",
          vendor: qpr.supplierName,
          date: qpr.date,
          requiredRole: qpr.requiredRole,
          daysStuck: days,
          isStuck: days >= 24,
          amount: qpr.claimAmount || "-",
          activeTab: "approve-qpr"
        };
        if (qpr.status !== "APPROVED" && qpr.status !== "CLOSED" && qpr.requiredRole === "Div Head") {
          runningDocs.push(item);
        } else if (qpr.status === "APPROVED" || qpr.status === "CLOSED" || qpr.requiredRole === "Purchasing" || qpr.requiredRole === "Closed") {
          completedDocs.push(item);
        }
      });
    }

    // 4. Purchasing
    if (role.key === "Purchasing") {
      currentActiveQprs.forEach(qpr => {
        const hasCl = currentActiveConfirmationLetters.some(cl => cl.qprNumber === qpr.qprNumber);
        const lt = getDocLeadTimes(qpr);
        const days = lt.leadTimes["Purchasing"]?.days || lt.totalLeadTime;
        const item = {
          id: `qpr-${qpr.id}`,
          docNumber: qpr.qprNumber,
          type: "QPR",
          vendor: qpr.supplierName,
          date: qpr.date,
          requiredRole: qpr.requiredRole || "Purchasing",
          daysStuck: days,
          isStuck: days >= 24,
          amount: qpr.claimAmount || "-",
          activeTab: qpr.status === "WAITING_APPROVAL" ? "approve-qpr" : "confirmation-letter"
        };
        if (!hasCl && (qpr.requiredRole === "Purchasing" || (qpr.status === "APPROVED" && qpr.requiredRole !== "Closed"))) {
          runningDocs.push(item);
        } else if (hasCl || qpr.status === "CLOSED" || qpr.status === "CLOSED_PAID") {
          completedDocs.push(item);
        }
      });
      currentActiveConfirmationLetters.forEach(cl => {
        const isDeptApproved = !!(cl.clApprovalProgress?.deptAccounting || cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID");
        const isSent = !!(cl.purchasingSentCl || cl.sentToVendor);
        const lt = getDocLeadTimes(cl);
        const item = {
          id: `cl-${cl.id}`,
          docNumber: cl.clNumber,
          type: "CL",
          vendor: cl.supplierName,
          date: cl.dateSent || cl.date,
          requiredRole: "Kirim ke Vendor",
          daysStuck: lt.totalLeadTime,
          isStuck: lt.totalLeadTime >= 24,
          amount: cl.amount,
          activeTab: "approve-cl"
        };
        if (isDeptApproved && !isSent && !cl.closedPaid && cl.status !== "CLOSED_PAID") {
          runningDocs.push(item);
        } else if (isSent) {
          completedDocs.push(item);
        }
      });
    }

    // 5. Dept Accounting
    if (role.key === "Dept Accounting") {
      currentActiveConfirmationLetters.forEach(cl => {
        const isDeptApproved = !!(cl.clApprovalProgress?.deptAccounting || cl.status === "FULLY_APPROVED" || cl.status === "CLOSED_PAID");
        const lt = getDocLeadTimes(cl);
        const item = {
          id: `cl-${cl.id}`,
          docNumber: cl.clNumber,
          type: "CL",
          vendor: cl.supplierName,
          date: cl.dateSent || cl.date,
          requiredRole: "Dept Accounting Approval",
          daysStuck: lt.totalLeadTime,
          isStuck: lt.totalLeadTime >= 24,
          amount: cl.amount,
          activeTab: "approve-cl"
        };
        if (!isDeptApproved && !cl.closedPaid && cl.status !== "CLOSED_PAID") {
          runningDocs.push(item);
        } else if (isDeptApproved) {
          completedDocs.push(item);
        }
      });
    }

    // 6. Vendor
    if (role.key === "Vendor") {
      currentActiveConfirmationLetters.forEach(cl => {
        const isSent = !!(cl.purchasingSentCl || cl.sentToVendor);
        const isVendorApproved = !!(cl.vendorApproved || cl.status === "APPROVED_BY_VENDOR" || cl.status === "FULLY_APPROVED");
        const lt = getDocLeadTimes(cl);
        const item = {
          id: `cl-${cl.id}`,
          docNumber: cl.clNumber,
          type: "CL",
          vendor: cl.supplierName,
          date: cl.dateSent || cl.date,
          requiredRole: "Vendor Confirmation",
          daysStuck: lt.totalLeadTime,
          isStuck: lt.totalLeadTime >= 48,
          amount: cl.amount,
          activeTab: "approve-cl"
        };
        if (isSent && !isVendorApproved && cl.status !== "REJECTED" && !cl.closedPaid && cl.status !== "CLOSED_PAID") {
          runningDocs.push(item);
        } else if (isVendorApproved) {
          completedDocs.push(item);
        }
      });
    }

    // 7. Finance Accounting
    if (role.key === "Finance Accounting") {
      currentActiveConfirmationLetters.forEach(cl => {
        const isVendorApproved = !!(cl.vendorApproved || cl.status === "APPROVED_BY_VENDOR" || cl.status === "FULLY_APPROVED" || cl.status === "APPROVED");
        const lt = getDocLeadTimes(cl);
        const isClosed = cl.closedPaid || cl.status === "CLOSED_PAID";
        const item = {
          id: `cl-${cl.id}`,
          docNumber: cl.clNumber,
          type: "CL",
          vendor: cl.supplierName,
          date: cl.dateSent || cl.date,
          requiredRole: "Finance SSC Billing / Payment",
          daysStuck: lt.totalLeadTime,
          isStuck: lt.totalLeadTime >= 48,
          amount: cl.amount,
          activeTab: "i-memo"
        };
        if (isVendorApproved && !isClosed) {
          runningDocs.push(item);
        } else if (isClosed) {
          completedDocs.push(item);
        }
      });
    }

    const stuckDocs = runningDocs.filter(d => d.isStuck);
    const totalStuckDays = stuckDocs.reduce((sum, d) => sum + d.daysStuck, 0);

    return {
      runningDocs,
      stuckDocs,
      completedDocs,
      totalRunning: runningDocs.length,
      totalStuck: stuckDocs.length,
      totalCompleted: completedDocs.length,
      totalStuckDays
    };
  };

  // Combined list of all documents with their pipeline stages and lead time status (merged QPR & CL)
  const documentPipelineList: any[] = [
    ...currentActiveNcrs.map(n => {
      const lt = getDocLeadTimes(n);
      return {
        id: `ncr-${n.id}`,
        docNumber: n.ncrNumber,
        type: "NCR",
        vendor: n.supplierName,
        date: n.date,
        createdAt: n.createdAt || n.date,
        updatedAt: n.updatedAt,
        requiredRole: n.requiredRole,
        status: n.status,
        leadTime: lt.totalLeadTime,
        isClosed: n.status === "APPROVED" || n.status === "CLOSED",
        closedPaid: false,
        refObject: n,
        linkedCl: null,
        debitNoteCount: 0,
        clApprovalProgress: { sectAccounting: false, deptAccounting: false }
      };
    }),
    ...currentActiveQprs.map(q => {
      const lt = getDocLeadTimes(q);
      const linkedCl = currentActiveConfirmationLetters.find(cl => cl.qprNumber === q.qprNumber);
      return {
        id: `qpr-${q.id}`,
        docNumber: q.qprNumber,
        type: "QPR",
        vendor: q.supplierName,
        date: q.date,
        createdAt: q.createdAt || q.date,
        updatedAt: q.updatedAt,
        requiredRole: q.requiredRole,
        status: q.status,
        leadTime: lt.totalLeadTime,
        isClosed: q.status === "APPROVED" || q.status === "CLOSED" || q.status === "CLOSED_PAID" || (linkedCl && (linkedCl.status === "CLOSED_PAID" || linkedCl.closedPaid)),
        closedPaid: linkedCl?.closedPaid || q.status === "CLOSED_PAID",
        refObject: q,
        linkedCl: linkedCl,
        debitNoteCount: linkedCl?.debitNoteCount || 0,
        clApprovalProgress: linkedCl?.clApprovalProgress || { sectAccounting: false, deptAccounting: false }
      };
    }),
    ...currentActiveConfirmationLetters.filter(cl => !currentActiveQprs.some(q => q.qprNumber === cl.qprNumber)).map(cl => {
      const lt = getDocLeadTimes(cl);
      return {
        id: `cl-${cl.id}`,
        docNumber: cl.clNumber,
        type: "CL",
        vendor: cl.supplierName,
        date: cl.dateSent || cl.date,
        createdAt: cl.createdAt || cl.dateSent || cl.date,
        updatedAt: cl.updatedAt,
        requiredRole: cl.requiredRole || (cl.closedPaid ? "Closed" : "Dept Accounting"),
        status: cl.status,
        leadTime: lt.totalLeadTime,
        isClosed: cl.status === "CLOSED_PAID" || cl.closedPaid === true,
        closedPaid: cl.closedPaid,
        refObject: cl,
        linkedCl: cl,
        debitNoteCount: cl.debitNoteCount || 0,
        clApprovalProgress: cl.clApprovalProgress || { sectAccounting: false, deptAccounting: false }
      };
    })
  ];

  const allDocPipelines = documentPipelineList;

  const foremanDays = currentActiveNcrs.filter(n => n.requiredRole === "Foreman" || n.status === "DRAFT").reduce((sum, doc) => {
    const lt = getDocLeadTimes(doc);
    return sum + lt.totalLeadTime;
  }, 0);

  const secHeadDays = currentActiveNcrs.filter(n => n.requiredRole === "Section Head" && n.status !== "APPROVED").reduce((sum, doc) => sum + getDocLeadTimes(doc).totalLeadTime, 0) +
    currentActiveQprs.filter(q => q.requiredRole === "Section Head").reduce((sum, doc) => sum + (getDocLeadTimes(doc).leadTimes["Section Head"]?.days || getDocLeadTimes(doc).totalLeadTime), 0);

  const deptHeadDays = currentActiveNcrs.filter(n => n.requiredRole === "Dept Head" && n.status !== "APPROVED").reduce((sum, doc) => sum + getDocLeadTimes(doc).totalLeadTime, 0) +
    currentActiveQprs.filter(q => q.requiredRole === "Dept Head").reduce((sum, doc) => sum + (getDocLeadTimes(doc).leadTimes["Dept Head"]?.days || getDocLeadTimes(doc).totalLeadTime), 0);

  const divHeadDays = currentActiveQprs.filter(q => q.requiredRole === "Div Head" || q.requiredRole === "Purchasing").reduce((sum, doc) => {
    const lt = getDocLeadTimes(doc);
    return sum + (lt.leadTimes["Div Head"]?.days || lt.totalLeadTime);
  }, 0);

  const accountingDays = [
    ...currentActiveQprs.filter(q => q.requiredRole === "Accounting" || q.status === "WAITING_VENDOR" || q.status === "APPROVED_BY_VENDOR"),
    ...currentActiveConfirmationLetters.filter(cl => cl.status === "PENDING")
  ].reduce((sum, doc) => {
    const lt = getDocLeadTimes(doc);
    return sum + lt.totalLeadTime;
  }, 0);

  const handleDownloadTemplate = (type: "qpr" | "cl") => {
    try {
      import("xlsx").then((XLSX) => {
        let headers: string[] = [];
        let sampleData: any[] = [];
        let fileName = "";
        
        if (type === "qpr") {
          headers = ["PartNumber", "PartName", "TotalQty", "QtyNG", "AllowanceRatio"];
          sampleData = [
            { PartNumber: "MB-001", PartName: "Motherboard X1", TotalQty: 1000, QtyNG: 15, AllowanceRatio: "0.5%" },
            { PartNumber: "HD-002", PartName: "Harddisk 1TB", TotalQty: 500, QtyNG: 8, AllowanceRatio: "0.5%" }
          ];
          fileName = "Template_Upload_QPR.xlsx";
        } else {
          headers = ["Customer", "DocumentNo", "Text", "Vendor", "Doc. Date", "Local Crcy Amt", "Potong tagih payment date"];
          sampleData = [
            { Customer: "OTC08002", DocumentNo: "18000000053", Text: "POTONG TAGIH CLAIM VENDOR", Vendor: "PT TEMARU ENGINEERING INDONESIA", "Doc. Date": "6/10/2026", "Local Crcy Amt": 18200000, "Potong tagih payment date": "8/10/2026" }
          ];
          fileName = "Template_Upload_Confirmation_Letter.xlsx";
        }
        
        const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, fileName);
        alert(`Sukses mengunduh template: ${fileName}`);
      });
    } catch (e) {
      alert("Gagal mengunduh template: " + e);
    }
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-300">

      {/* ── TOP HEADER: Period Filter + Download Buttons ─────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        {/* Period Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Periode:</span>
          <button
            type="button"
            onClick={() => setPeriodIndex(prev => Math.max(0, prev - 1))}
            disabled={periodIndex === 0}
            className="p-1.5 bg-slate-100 hover:bg-blue-50/80 hover:border-blue-400 hover:text-blue-600 hover:ring-2 hover:ring-blue-400/40 hover:shadow-md hover:shadow-blue-500/20 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 cursor-pointer transition-all active:scale-90 flex items-center justify-center group"
          >
            <ChevronLeft size={13} className="stroke-[2.5] text-slate-500 group-hover:text-blue-600 transition-colors" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 hover:border-blue-400 hover:ring-2 hover:ring-blue-400/40 hover:shadow-md hover:shadow-blue-500/20 rounded-lg text-xs font-bold text-blue-800 select-none transition-all cursor-pointer">
            <Calendar size={13} className="text-blue-600" />
            <span>{activePeriod}</span>
          </div>
          <button
            type="button"
            onClick={() => setPeriodIndex(prev => Math.min(periods.length - 1, prev + 1))}
            disabled={periodIndex === periods.length - 1}
            className="p-1.5 bg-slate-100 hover:bg-blue-50/80 hover:border-blue-400 hover:text-blue-600 hover:ring-2 hover:ring-blue-400/40 hover:shadow-md hover:shadow-blue-500/20 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 cursor-pointer transition-all active:scale-90 flex items-center justify-center group"
          >
            <ChevronRight size={13} className="stroke-[2.5] text-slate-500 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>

      </div>

      {/* ── 4 SYNCHRONIZED SUMMARY CARDS: NCR / QPR / CL ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* QPR Card */}
        {(() => {
          const qprStageProgressSum = currentActiveQprs.reduce((acc: number, q: any) => {
            if (q.status === "APPROVED" || q.status === "CLOSED" || q.status === "CLOSED_PAID" || q.requiredRole === "Closed") return acc + 100;
            if (q.requiredRole === "Purchasing") return acc + 75;
            if (q.requiredRole === "Div Head") return acc + 50;
            if (q.requiredRole === "Dept Head") return acc + 35;
            if (q.requiredRole === "Section Head") return acc + 20;
            return acc + 15;
          }, 0) + (baselineClosedQprs * 100);
          const qprPct = totalQprs > 0 ? Math.min(100, Math.max(0, Math.round(qprStageProgressSum / totalQprs))) : 0;
          return (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quality Problem Report</span>
                <h4 className="text-2xl font-black text-slate-900 mt-1 leading-none">{totalQprs}</h4>
                <span className="text-xs text-slate-600 font-bold mt-1 block">Total QPR</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="text-indigo-600 font-extrabold">{qprInProgress} Proses</span>
                  <span className="text-emerald-600 font-extrabold">{qprClosed} Selesai</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      qprClosed >= totalQprs && totalQprs > 0 ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-xs"
                    }`} 
                    style={{ width: `${Math.max(qprPct > 0 ? 8 : 0, qprPct)}%` }} 
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* CL Card */}
        {(() => {
          const clStageProgressSum = currentActiveConfirmationLetters.reduce((acc: number, cl: any) => {
            if (cl.status === "CLOSED_PAID" || cl.closedPaid) return acc + 100;
            if (cl.status === "APPROVED_BY_VENDOR" || cl.vendorApproved || cl.status === "FULLY_APPROVED") return acc + 80;
            if (cl.purchasingSentCl || cl.status === "SENT_TO_VENDOR" || cl.status === "WAITING_VENDOR") return acc + 60;
            if (cl.status === "APPROVED" || cl.status === "APPROVED_DEPT" || cl.clApprovalProgress?.deptAccounting || (Array.isArray(cl.approvedBy) && cl.approvedBy.includes("Accounting"))) return acc + 40;
            return acc + 20;
          }, 0) + (currentConfig.claimClosedPaidCount * 100);
          const clPct = totalCl > 0 ? Math.min(100, Math.max(0, Math.round(clStageProgressSum / totalCl))) : 0;
          return (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Confirmation Letter</span>
                <h4 className="text-2xl font-black text-slate-900 mt-1 leading-none">{totalCl}</h4>
                <span className="text-xs text-slate-600 font-bold mt-1 block">Total CL</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="text-blue-600 font-extrabold">{clProgress} Proses</span>
                  <span className="text-emerald-600 font-extrabold">{clLunas} Lunas</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      clLunas >= totalCl && totalCl > 0 ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-xs"
                    }`} 
                    style={{ width: `${Math.max(clPct > 0 ? 8 : 0, clPct)}%` }} 
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── 💰 SECTION: AMOUNT MONITORING POTONG TAGIH (TRIGGERED BY SSC BILLING - 10 HARI KERJA) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 transition-all">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20 shrink-0">
              <Banknote size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                Monitoring Amount Potong Tagih
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-2xs">
              <Calendar size={13} className="text-blue-600" />
              <span>{activePeriod}</span>
            </span>
          </div>
        </div>

        {/* 2 KPI Summary Cards: Total Collection & Total Outstanding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Total Collection (Sudah Paid / Lunas) */}
          <div className="bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 border border-emerald-200/90 rounded-xl p-5 shadow-2xs space-y-2 hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider">Total Collection</span>
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 shadow-2xs">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div>
              <h4 className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight font-mono leading-none">
                Rp {paidPotongTagihAmount.toLocaleString("id-ID")}
              </h4>
              <span className="text-xs text-emerald-800/80 font-bold mt-2 block">
                {paidPotongTagihCount} Dokumen Selesai Lunas
              </span>
            </div>
          </div>

          {/* 2. Total Outstanding (Sebelum Paid / Belum Lunas) */}
          <div className="bg-gradient-to-br from-amber-50/40 via-white to-rose-50/30 border border-amber-200/90 rounded-xl p-5 shadow-2xs space-y-2 hover:border-amber-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">Total Outstanding</span>
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg border border-amber-200 shadow-2xs">
                <Clock size={16} />
              </div>
            </div>
            <div>
              <h4 className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight font-mono leading-none">
                Rp {unpaidPotongTagihAmount.toLocaleString("id-ID")}
              </h4>
              <span className="text-xs text-amber-800/80 font-bold mt-2 block">
                {unpaidPotongTagihCount} Dokumen Belum Lunas
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setPotongTagihFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                potongTagihFilter === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua ({totalPotongTagihCount})
            </button>
            <button
              type="button"
              onClick={() => setPotongTagihFilter("unpaid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                potongTagihFilter === "unpaid"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              Belum Paid ({unpaidPotongTagihCount})
            </button>
            <button
              type="button"
              onClick={() => setPotongTagihFilter("paid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                potongTagihFilter === "paid"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              Sudah Paid / Lunas ({paidPotongTagihCount})
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Dokumen / Vendor..."
              value={potongTagihSearch}
              onChange={(e) => setPotongTagihSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Detailed Table for Potong Tagih Documents */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="text-[10.5px] text-slate-600 bg-slate-50 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3">No. Dokumen</th>
                <th className="px-4 py-3">Vendor / Supplier</th>
                <th className="px-4 py-3">Tgl SSC Billing</th>
                <th className="px-4 py-3 text-center">Target Jatuh Tempo</th>
                <th className="px-4 py-3 text-right">Nominal Potong Tagih</th>
                <th className="px-4 py-3 text-center">Status Pembayaran</th>
                <th className="px-4 py-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedPotongTagihDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400 italic font-medium">
                    Tidak ada dokumen potong tagih pada filter ini.
                  </td>
                </tr>
              ) : (
                displayedPotongTagihDocs.map((doc, idx) => (
                  <tr key={doc.id || idx} className="hover:bg-slate-50/80 transition-colors font-medium">
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900 text-xs">{doc.docNumber}</span>
                        {doc.clNumber && doc.clNumber !== doc.docNumber && (
                          <span className="text-[10px] font-mono text-slate-400">Ref: {doc.clNumber}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{doc.vendor}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{doc.date}</td>

                    {/* Target Date */}
                    <td className="px-4 py-3 text-center font-mono text-slate-600 font-semibold text-[11px]">
                      {doc.target10DaysDate}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-xs">
                      {doc.formattedAmount}
                    </td>

                    {/* Status Pembayaran */}
                    <td className="px-4 py-3 text-center">
                      {doc.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-extrabold text-[10px] shadow-2xs">
                          <CheckCircle2 size={10} className="text-emerald-600" />
                          Sudah Paid (Lunas)
                        </span>
                      ) : doc.isTriggered10Days ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded font-black text-[10px] shadow-2xs">
                          <AlertTriangle size={10} className="text-rose-600" />
                          Belum Paid (Jatuh Tempo)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold text-[10px] shadow-2xs">
                          <Clock size={10} className="text-amber-600" />
                          Belum Paid (Masa Tunggu)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const targetCl = confirmationLetters.find(c => c.clNumber === doc.clNumber || c.id === doc.clId || c.id === doc.id);
                            setPreviewClDoc(targetCl || {
                              id: doc.id,
                              clNumber: doc.clNumber || doc.docNumber,
                              supplierName: doc.vendor,
                              dateSent: doc.date,
                              amount: doc.formattedAmount,
                              status: doc.isPaid ? "CLOSED_PAID" : "PENDING",
                              closedPaid: doc.isPaid
                            });
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-transparent rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95 inline-flex items-center gap-1"
                          title="Lihat Pratinjau Dokumen"
                        >
                          <Eye size={11} />
                          Preview
                        </button>

                        {!doc.isPaid && (username === "purchasing" || username === "admin") && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Konfirmasi pelunasan (Paid) untuk dokumen ${doc.docNumber} senilai ${doc.formattedAmount}?`)) {
                                if (handleMarkClosedPaid) {
                                  handleMarkClosedPaid(doc.clId || doc.id);
                                }
                              }
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95 inline-flex items-center gap-1"
                            title="Tandai Dokumen Ini Sebagai Lunas (Paid)"
                          >
                            <Check size={11} className="stroke-[3]" />
                            Lunas
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: 7 Authorization Role Cards (Status Lead Time & Dokumen Mengendap Berdasarkan Peran Otorisasi) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-[12px] sm:text-xs font-extrabold uppercase tracking-wider text-[#7b92a5]">
              STATUS LEAD TIME &amp; DOKUMEN MENGENDAP BERDASARKAN PERAN OTORISASI
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {authRoles.map((role) => {
            const roleData = getRoleDocsData(role);
            const isSelected = selectedRoleCard === role.key;
            const count = roleData.totalRunning || 0;
            const accumulatedDays = roleData.runningDocs.reduce((sum: number, d: any) => sum + (d.daysStuck || 0), 0);

            return (
              <button
                key={role.key}
                type="button"
                onClick={() => {
                  setSelectedRoleCard(isSelected ? null : role.key);
                  setRoleDetailFilter("all");
                }}
                className={`border rounded-2xl p-3 sm:p-3.5 transition-all duration-200 flex flex-col justify-between text-left cursor-pointer shadow-sm relative group ${
                  isSelected 
                    ? role.activeBg
                    : `bg-[#f8fafc]/60 hover:bg-white border-slate-200/90 ${role.borderColor} hover:shadow-md active:scale-[0.98]`
                }`}
              >
                <div>
                  <h5 
                    className={`text-xs font-black tracking-tight leading-tight truncate mb-1.5 ${role.titleColor}`}
                    title={role.fullTitle || role.title}
                  >
                    {role.title}
                  </h5>

                  <div className="flex items-start gap-1.5 my-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                      {count}
                    </span>
                    <span 
                      className={`text-[11px] sm:text-xs font-bold leading-tight ${role.labelColor}`}
                    >
                      Dokumen<br />Mengendap
                    </span>
                  </div>
                </div>

                <div className="pt-2 mt-1 border-t border-slate-100/90">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500">
                    Akumulasi: <span className="font-bold text-slate-700">{formatLeadTime(accumulatedDays)}</span>
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600 rounded-r-2xl" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Role Card Details Area */}
        {selectedRoleCard && (() => {
          const activeRole = authRoles.find(r => r.key === selectedRoleCard)!;
          const roleData = getRoleDocsData(activeRole);
          
          let displayDocs = roleData.runningDocs;
          if (roleDetailFilter === "stuck") {
            displayDocs = roleData.stuckDocs;
          } else if (roleDetailFilter === "completed") {
            displayDocs = roleData.completedDocs;
          }

          return (
            <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-md animate-in slide-in-from-top-2 duration-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h5 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                    <UserCheck size={16} className="text-blue-600" />
                    Rincian Monitoring Otorisasi: {activeRole.title}
                  </h5>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Data Berjalan: <strong className="text-blue-700">{roleData.totalRunning} Dokumen</strong> | Mengendap: <strong className="text-rose-700">{roleData.totalStuck} Dokumen ({formatLeadTime(roleData.totalStuckDays)})</strong> | Selesai: <strong className="text-emerald-700">{roleData.totalCompleted} Dokumen</strong>
                  </p>
                </div>

                {/* Filter Tabs inside Modal */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setRoleDetailFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      roleDetailFilter === "all"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Semua Berjalan ({roleData.totalRunning})
                  </button>
                  <button
                    onClick={() => setRoleDetailFilter("stuck")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      roleDetailFilter === "stuck"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    }`}
                  >
                    Mengendap ({roleData.totalStuck})
                  </button>
                  <button
                    onClick={() => setRoleDetailFilter("completed")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      roleDetailFilter === "completed"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    Riwayat Selesai ({roleData.totalCompleted})
                  </button>
                  <button
                    onClick={() => setSelectedRoleCard(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors border border-slate-200 ml-1"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="text-[10px] text-slate-500 bg-slate-50 uppercase tracking-wider font-extrabold border-y border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">No. Dokumen</th>
                      <th className="px-4 py-2.5">Tipe</th>
                      <th className="px-4 py-2.5">Supplier / Vendor</th>
                      <th className="px-4 py-2.5">Tgl Pembuatan</th>
                      <th className="px-4 py-2.5 text-center">Status Lead Time</th>
                      <th className="px-4 py-2.5">Nilai Klaim</th>
                      <th className="px-4 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayDocs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                          Tidak ada dokumen pada kategori filter ini.
                        </td>
                      </tr>
                    ) : (
                      displayDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors font-semibold">
                          <td className="px-4 py-3 text-slate-900 font-bold font-mono">{doc.docNumber}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              doc.type === "NCR" 
                                ? "bg-blue-50 text-blue-700 border border-blue-200" 
                                : doc.type === "QPR"
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}>
                              {doc.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-800 font-bold">{doc.vendor}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{doc.date}</td>
                          <td className="px-4 py-3 text-center">
                            {doc.isStuck ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-bold text-[10px]">
                                <Clock size={10} className="text-rose-500 shrink-0" />
                                Mengendap {formatLeadTime(doc.daysStuck)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold text-[10px]">
                                <Activity size={10} className="text-blue-500 shrink-0" />
                                Berjalan ({formatLeadTime(doc.daysStuck)})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700">{doc.amount}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                if (doc.type === "CL" || doc.type === "Confirmation Letter") {
                                  const targetCl = confirmationLetters.find(c => c.clNumber === doc.docNumber || c.id === doc.id.replace("cl-", ""));
                                  setPreviewClDoc(targetCl || {
                                    id: doc.id,
                                    clNumber: doc.docNumber,
                                    supplierName: doc.vendor,
                                    dateSent: doc.date,
                                    amount: doc.amount,
                                    status: "PENDING"
                                  });
                                } else if (doc.type === "QPR") {
                                  const targetQpr = pendingQprs.find(q => q.qprNumber === doc.docNumber || q.id === doc.id.replace("qpr-", ""));
                                  setPreviewQprDoc(targetQpr || {
                                    id: doc.id,
                                    qprNumber: doc.docNumber,
                                    supplierName: doc.vendor,
                                    date: doc.date,
                                    claimAmount: doc.amount,
                                    status: "WAITING_APPROVAL"
                                  });
                                } else {
                                  setActiveTab(doc.activeTab);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-transparent rounded-lg text-[11px] font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                              title="Lihat Pratinjau Dokumen"
                            >
                              <Eye size={12} />
                              Preview
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Visual Pipeline & Lead Time tracking per document */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="p-5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Pelacakan Pipeline &amp; Lead Time Alur Dokumen Berjalan
              </h4>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">No</th>
                  <th className="px-4 py-3">No. Dokumen</th>
                  <th className="px-4 py-3">Vendor / Supplier</th>
                  <th className="px-4 py-3 text-left">Status / Tracking Alur Pipeline</th>
                  <th className="px-4 py-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                {allDocPipelines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">
                      Tidak ada data pipeline pada periode ini.
                    </td>
                  </tr>
                ) : (
                  allDocPipelines.map((doc, idx) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors font-semibold">
                      <td className="px-4 py-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{doc.docNumber}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{doc.vendor}</td>
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Overall Status Badge */}
                          {doc.isClosed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold shadow-sm select-none">
                              <CheckCircle2 size={10} className="text-green-600" />
                              Disetujui
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold shadow-sm select-none">
                              <Clock size={10} className="text-amber-500" />
                              Proses
                            </span>
                          )}

                          <span className="text-slate-300">|</span>

                          {/* Approval Stages Chain */}
                          <div className="flex items-center gap-1.5 py-1">
                            {getDocPipelineStages(doc.type, doc.requiredRole, doc.status, doc.clApprovalProgress, doc.linkedCl, doc.refObject, doc.date).map((stage, idx, arr) => {
                              const nextStage = arr[idx + 1];
                              const stepHours = nextStage 
                                ? (nextStage.status === "APPROVED" || nextStage.status === "PENDING" ? formatLeadTime(nextStage.hours) : "-")
                                : "-";
                              return (
                                <React.Fragment key={idx}>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                                    stage.status === "APPROVED"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : stage.status === "PENDING"
                                      ? "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-100 font-extrabold"
                                      : "bg-slate-50 text-slate-400 border-slate-200 opacity-60"
                                  }`}>
                                    {stage.status === "APPROVED" && <CheckCircle2 size={10} className="text-green-600 shrink-0" />}
                                    {stage.status === "PENDING" && <Clock size={10} className="text-amber-500 shrink-0" />}
                                    {stage.name}
                                  </span>
                                  {idx < arr.length - 1 && (
                                    <div className="flex flex-col items-center justify-center shrink-0 px-1 select-none">
                                      <span className="text-slate-400 text-xs font-black leading-none">→</span>
                                      <span className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded mt-0.5 leading-none">
                                        {stepHours}
                                      </span>
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>

                          <span className="text-slate-300">|</span>

                          {/* CL-specific: Close Paid badge & Debit Note count */}
                          {doc.type === "CL" && (
                            <>
                              {doc.closedPaid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[9px] font-bold shadow-sm">
                                  <CheckCircle2 size={8} className="text-green-600" />
                                  Close Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-bold shadow-sm">
                                  <Clock size={8} className="text-amber-500" />
                                  Belum Lunas
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold border ${
                                (doc.debitNoteCount || 0) > 0
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-slate-100 text-slate-400 border-slate-200"
                              }`}>
                                <Banknote size={8} />
                                {doc.debitNoteCount || 0}× Potong Tagih
                              </span>
                            </>
                          )}

                          <span className="text-slate-300">|</span>

                          {/* Lead Time Info at the end */}
                          {doc.isClosed ? (
                            <span className="text-[10px] font-bold text-green-700 bg-green-50/50 border border-green-150 px-2 py-0.5 rounded font-mono shadow-sm">
                              ✅ Selesai: {formatLeadTime(doc.leadTime)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50/50 border border-amber-150 px-2 py-0.5 rounded font-mono shadow-sm">
                              ⏳ Aktif: {formatLeadTime(doc.leadTime)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <button
                            onClick={() => setSelectedPipelineDoc(doc)}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Eye size={12} />
                            Detail
                          </button>
                          {doc.type === "CL" && !doc.closedPaid && (username === "purchasing" || username === "admin") && (
                            <button
                              onClick={() => {
                                const clId = doc.refObject?.id || doc.id?.replace("cl-", "");
                                if (clId && handleMarkClosedPaid) {
                                  handleMarkClosedPaid(clId);
                                }
                              }}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-sm transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Purchasing: Tandai Dokumen CL ini Lunas (Paid)"
                            >
                              <CheckCircle2 size={10} />
                              Tandai Lunas
                            </button>
                          )}
                          {doc.linkedCl && (
                            <span className="text-[9px] font-mono font-black text-slate-500 bg-slate-100 border border-slate-200 px-1 py-0.5 rounded shadow-2xs">
                              {doc.linkedCl.clNumber}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedPipelineDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-zoom-in text-left">
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-150">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200/50">
                  {selectedPipelineDoc.type} Pipeline
                </span>
                <h4 className="text-sm font-black text-slate-805 mt-1.5 font-mono">
                  {selectedPipelineDoc.docNumber}
                </h4>
              </div>
              <button
                onClick={() => setSelectedPipelineDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-205 rounded-lg transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Document Summary Row */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/55 p-4 border border-slate-150 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Vendor / Supplier</span>
                  <strong className="text-sm font-bold text-slate-800 mt-0.5 block">{selectedPipelineDoc.vendor}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Lead Time / Durasi</span>
                  <div className="mt-1">
                    {selectedPipelineDoc.isClosed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-bold">
                        <CheckCircle2 size={11} className="text-green-600" />
                        Close Paid: {formatLeadTime(selectedPipelineDoc.leadTime)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold animate-pulse">
                        <Clock size={11} className="text-amber-500" />
                        Aktif: {formatLeadTime(selectedPipelineDoc.leadTime)}
                      </span>
                    )}
                  </div>
                </div>
                {selectedPipelineDoc.type === "CL" && (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Status Pembayaran</span>
                      <div className="mt-1">
                        {selectedPipelineDoc.closedPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-bold">
                            <CheckCircle2 size={11} className="text-green-600" />
                            Close Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold">
                            <Clock size={11} className="text-amber-500" />
                            Belum Lunas
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Tarik / Potong Tagih</span>
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${
                          (selectedPipelineDoc.debitNoteCount || 0) > 0
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}>
                          <Banknote size={11} />
                          {selectedPipelineDoc.debitNoteCount || 0}× Potong Tagih
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Approval Stages Visualization */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">Alur Persetujuan Dokumen</span>
                
                <div className="flex flex-col md:flex-row md:items-center gap-2 p-4 bg-white border border-slate-150 rounded-xl overflow-x-auto">
                  {getDocPipelineStages(selectedPipelineDoc.type, selectedPipelineDoc.requiredRole, selectedPipelineDoc.status, selectedPipelineDoc.clApprovalProgress, selectedPipelineDoc.linkedCl, selectedPipelineDoc.refObject, selectedPipelineDoc.date).map((stage, i, arr) => (
                    <React.Fragment key={i}>
                      <div
                        className={`flex flex-col p-3 rounded-lg border flex-1 min-w-[120px] transition-all ${
                          stage.status === "APPROVED"
                            ? "bg-green-50/40 text-green-800 border-green-200 shadow-sm"
                            : stage.status === "PENDING"
                            ? "bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-100 shadow-sm"
                            : "bg-slate-50 text-slate-400 border-slate-200 border-dashed"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] font-black uppercase tracking-wider">Stage {i + 1}</span>
                          {stage.status === "APPROVED" && <CheckCircle2 size={12} className="text-green-600" />}
                          {stage.status === "PENDING" && <Clock size={12} className="text-amber-500" />}
                        </div>
                        <strong className="text-xs font-bold mt-1.5 leading-tight truncate">{stage.name}</strong>
                        <div className="flex items-center justify-between mt-1 text-[9px]">
                          <span className="text-slate-400 font-semibold uppercase">
                            {stage.status === "APPROVED" ? "Selesai" : stage.status === "PENDING" ? "Sedang Diproses" : "Belum Mulai"}
                          </span>
                          {(stage.status === "APPROVED" || stage.status === "PENDING") && (
                            <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
                              {formatLeadTime(stage.hours)}
                            </span>
                          )}
                        </div>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="hidden md:flex text-slate-300 font-black text-lg select-none shrink-0 mx-1">→</div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex justify-end gap-3">
              <button
                onClick={() => setSelectedPipelineDoc(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-750 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {previewClDoc && (
        <ConfirmationLetterPrintPreview
          cl={previewClDoc}
          onClose={() => setPreviewClDoc(null)}
        />
      )}

      {previewQprDoc && (
        <QprPrintPreview
          qpr={previewQprDoc}
          onClose={() => setPreviewQprDoc(null)}
        />
      )}

    </div>
  );
}
