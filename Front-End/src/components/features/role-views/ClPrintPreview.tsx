"use client";

import React from "react";
import ConfirmationLetterPrintPreview from "./ConfirmationLetterPrintPreview";

interface ClPreviewProps {
  cl: {
    docNumber?: string;
    clNumber?: string;
    date?: string;
    dateSent?: string;
    vendorName?: string;
    supplierName?: string;
    qprNumber?: string;
    partNumber?: string;
    partName?: string;
    qty?: number;
    reject?: string | number;
    claimAmount?: string;
    amount?: string;
    defectType?: string;
    status?: string;
    items?: any[];
    [key: string]: any;
  };
  onClose?: () => void;
  inline?: boolean;
}

export default function ClPrintPreview({ cl, onClose, inline = false }: ClPreviewProps) {
  const formattedCl = {
    ...cl,
    clNumber: cl.clNumber || cl.docNumber || "CL/2026/06/001",
    qprNumber: cl.qprNumber || "004/QI/QPR/SUB/11/25, 009/QI/QPR/SUB/11/25, 014/QI/QPR/SUB/11/25",
    supplierName: cl.supplierName || cl.vendorName || "Anugerah Daya Industri Komponen Utama, PT.",
    dateSent: cl.dateSent || cl.date || "2025-12-02",
    amount: cl.amount || cl.claimAmount || "Rp 1.144.283",
    status: cl.status || "PENDING",
    requiredRole: cl.requiredRole || cl.refObject?.requiredRole,
    clApprovalProgress: cl.clApprovalProgress || cl.refObject?.clApprovalProgress,
    vendorApproved: cl.vendorApproved ?? cl.refObject?.vendorApproved ?? (cl.status === "APPROVED_BY_VENDOR" || cl.status === "CLOSED_PAID"),
    approvedBy: cl.approvedBy || cl.refObject?.approvedBy || [],
    reject: typeof cl.reject === "number" ? cl.reject : parseInt(String(cl.reject || cl.qty || 20), 10),
    items: cl.items || [
      { id: 1, partName: cl.partName || "HUB CLUTCH, IMV 683N", billableQty: 14, unitPrice: 49516, amount: 693224 },
      { id: 2, partName: "HUB CLUTCH, RZN", billableQty: 6, unitPrice: 56277, amount: 337662 }
    ]
  };

  return (
    <ConfirmationLetterPrintPreview
      cl={formattedCl}
      onClose={onClose}
      inline={inline}
    />
  );
}
