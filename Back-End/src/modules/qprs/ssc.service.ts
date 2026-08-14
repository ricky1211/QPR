import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { SscBilling, SscPayment, BillingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class SscService {
  constructor(private prisma: PrismaService) {}

  // ==================== SSC BILLING ====================

  async findAllBillings(): Promise<SscBilling[]> {
    return this.prisma.sscBilling.findMany({
      include: {
        cl: {
          include: {
            vendor: true,
            qpr: true,
          },
        },
      },
    });
  }

  async findBillingById(id: string): Promise<SscBilling | null> {
    return this.prisma.sscBilling.findUnique({
      where: { id },
      include: {
        cl: {
          include: {
            vendor: true,
            qpr: true,
          },
        },
      },
    });
  }

  async createBilling(data: any): Promise<SscBilling> {
    return this.prisma.sscBilling.create({
      data: {
        clId: data.clId,
        billingNo: data.billingNo,
        billingDate: data.billingDate ? new Date(data.billingDate) : new Date(),
        totalAmount: parseFloat(data.totalAmount || '0'),
        status: data.status || BillingStatus.UNPAID,
        memoCompany: data.memoCompany,
        memoBusinessArea: data.memoBusinessArea,
        memoRequestDate: data.memoRequestDate,
        memoBillingType: data.memoBillingType,
        memoPeriod: data.memoPeriod,
        memoTitle: data.memoTitle,
        memoRequestTo: data.memoRequestTo,
        memoDescription: data.memoDescription,
        memoCustomerType: data.memoCustomerType,
        memoNpwp: data.memoNpwp,
        memoSupportingDoc: data.memoSupportingDoc,
        memoBillingAddressedTo: data.memoBillingAddressedTo,
        memoCustomerName: data.memoCustomerName,
        memoCurrency: data.memoCurrency,
        memoAmount: data.memoAmount,
        memoSays: data.memoSays,
        acctCustomerCode: data.acctCustomerCode,
        acctCustomerType: data.acctCustomerType,
        acctTradingPartner: data.acctTradingPartner,
        acctExchangeRate: data.acctExchangeRate,
        acctJournal: data.acctJournal,
        glRows: data.glRows, // JSON
        sigPrepared: data.sigPrepared,
        sigPreparedRole: data.sigPreparedRole,
        sigApproved1: data.sigApproved1,
        sigApproved1Role: data.sigApproved1Role,
        sigApproved2: data.sigApproved2,
        sigApproved2Role: data.sigApproved2Role,
        sigEntry: data.sigEntry,
        sigEntryRole: data.sigEntryRole,
        sigChecked: data.sigChecked,
        sigCheckedRole: data.sigCheckedRole,
      },
    });
  }

  async updateBilling(id: string, data: any): Promise<SscBilling> {
    return this.prisma.sscBilling.update({
      where: { id },
      data: {
        billingNo: data.billingNo,
        billingDate: data.billingDate ? new Date(data.billingDate) : undefined,
        totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
        status: data.status,
        memoCompany: data.memoCompany,
        memoBusinessArea: data.memoBusinessArea,
        memoRequestDate: data.memoRequestDate,
        memoBillingType: data.memoBillingType,
        memoPeriod: data.memoPeriod,
        memoTitle: data.memoTitle,
        memoRequestTo: data.memoRequestTo,
        memoDescription: data.memoDescription,
        memoCustomerType: data.memoCustomerType,
        memoNpwp: data.memoNpwp,
        memoSupportingDoc: data.memoSupportingDoc,
        memoBillingAddressedTo: data.memoBillingAddressedTo,
        memoCustomerName: data.memoCustomerName,
        memoCurrency: data.memoCurrency,
        memoAmount: data.memoAmount,
        memoSays: data.memoSays,
        acctCustomerCode: data.acctCustomerCode,
        acctCustomerType: data.acctCustomerType,
        acctTradingPartner: data.acctTradingPartner,
        acctExchangeRate: data.acctExchangeRate,
        acctJournal: data.acctJournal,
        glRows: data.glRows,
        sigPrepared: data.sigPrepared,
        sigApproved1: data.sigApproved1,
        sigApproved2: data.sigApproved2,
        sigEntry: data.sigEntry,
        sigChecked: data.sigChecked,
      },
    });
  }

  // ==================== SSC PAYMENT ====================

  async findAllPayments(): Promise<SscPayment[]> {
    return this.prisma.sscPayment.findMany({
      include: {
        cl: {
          include: {
            vendor: true,
            qpr: true,
          },
        },
      },
    });
  }

  async findPaymentById(id: string): Promise<SscPayment | null> {
    return this.prisma.sscPayment.findUnique({
      where: { id },
      include: {
        cl: {
          include: {
            vendor: true,
            qpr: true,
          },
        },
      },
    });
  }

  async createPayment(data: any): Promise<SscPayment> {
    return this.prisma.sscPayment.create({
      data: {
        clId: data.clId,
        paymentNo: data.paymentNo,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        amountPaid: parseFloat(data.amountPaid || '0'),
        bankName: data.bankName,
        accountNo: data.accountNo,
        status: data.status || PaymentStatus.PENDING,
        payCompany: data.payCompany,
        payBusinessArea: data.payBusinessArea,
        payTitle: data.payTitle,
        payTo: data.payTo,
        payInstruction: data.payInstruction,
        payRequestDate: data.payRequestDate,
        paySigPrepared: data.paySigPrepared,
        paySigApproved1: data.paySigApproved1,
        paySigApproved2: data.paySigApproved2,
        paySigEntry: data.paySigEntry,
      },
    });
  }

  async updatePayment(id: string, data: any): Promise<SscPayment> {
    return this.prisma.sscPayment.update({
      where: { id },
      data: {
        paymentNo: data.paymentNo,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
        amountPaid: data.amountPaid ? parseFloat(data.amountPaid) : undefined,
        bankName: data.bankName,
        accountNo: data.accountNo,
        status: data.status,
        payCompany: data.payCompany,
        payBusinessArea: data.payBusinessArea,
        payTitle: data.payTitle,
        payTo: data.payTo,
        payInstruction: data.payInstruction,
        payRequestDate: data.payRequestDate,
        paySigPrepared: data.paySigPrepared,
        paySigApproved1: data.paySigApproved1,
        paySigApproved2: data.paySigApproved2,
        paySigEntry: data.paySigEntry,
      },
    });
  }
}
