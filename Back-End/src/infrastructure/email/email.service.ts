import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.isConfigured = true;
      this.logger.log(`SMTP transporter configured for host: ${host}:${port}`);
    } else {
      this.isConfigured = false;
      this.logger.warn(
        'SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not fully provided in .env. Emails will be logged to console in simulated mode.',
      );
    }
  }

  async sendMail(options: EmailOptions): Promise<boolean> {
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const fromAddress = process.env.MAIL_FROM || process.env.SMTP_FROM || '"QPR System MTM" <ahmad.hapizhudin@mtm.astra.co.id>';

    this.logger.log(`\n================== [EMAIL DISPATCH TRIGGERED] ==================`);
    this.logger.log(`TO      : ${recipients}`);
    this.logger.log(`FROM    : ${fromAddress}`);
    this.logger.log(`SUBJECT : ${options.subject}`);
    this.logger.log(`================================================================`);

    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: recipients,
          subject: options.subject,
          text: options.text || options.subject,
          html: options.html,
        });
        this.logger.log(`Email successfully sent via SMTP! MessageId: ${info.messageId}`);
        return true;
      } catch (error: any) {
        this.logger.error(`Failed to send email via SMTP: ${error.message}`, error.stack);
        return false;
      }
    } else {
      this.logger.log(`[SIMULATED EMAIL DISPATCH] Email to ${recipients} logged successfully.`);
      return true;
    }
  }

  private getEmailTemplate(title: string, subtitle: string, details: Array<{ label: string; value: string }>, actionUrl?: string, actionText?: string): string {
    const rowsHtml = details
      .map(
        (d) => `
        <tr>
          <td style="padding: 8px 12px; font-weight: 600; color: #475569; width: 35%; border-bottom: 1px solid #f1f5f9;">${d.label}</td>
          <td style="padding: 8px 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${d.value}</td>
        </tr>`,
      )
      .join('');

    const actionButtonHtml = actionUrl
      ? `
      <div style="margin-top: 24px; text-align: center;">
        <a href="${actionUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
          ${actionText || 'Buka Dokumen di Sistem QPR'}
        </a>
      </div>`
      : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #1e3a8a; padding: 20px 24px; color: #ffffff; }
        .header h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 4px 0 0; font-size: 12px; color: #bfdbfe; }
        .content { padding: 24px; }
        .title { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 8px; }
        .subtitle { font-size: 13px; color: #64748b; margin-top: 0; margin-bottom: 20px; line-height: 1.5; }
        .table { width: 100%; border-collapse: collapse; font-size: 13px; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
        .footer { padding: 16px 24px; background: #f1f5f9; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>PT. MENARA TERUS MAKMUR</h1>
          <p>Quality Problem Report (QPR) System Notification</p>
        </div>
        <div class="content">
          <h2 class="title">${title}</h2>
          <p class="subtitle">${subtitle}</p>
          <table class="table">
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          ${actionButtonHtml}
        </div>
        <div class="footer">
          Email otomatis dikirim oleh Sistem QPR PT. Menara Terus Makmur (Astra Otoparts Group).<br/>
          Harap tidak membalas langsung ke email ini.
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Step 1: Create QPR -> Section Head
  async notifyQprCreated(qpr: any, recipients: string[]) {
    const qprNum = qpr?.qprNumber || 'Draft QPR';
    const vendorName = qpr?.vendor?.vendorName || qpr?.vendorId || '-';
    const problem = qpr?.problem || 'Claim Part NG';

    const html = this.getEmailTemplate(
      'Notifikasi Approval QPR Baru (Section Head)',
      'Foreman telah berhasil membuat dokumen QPR baru. Dokumen ini membutuhkan verifikasi & persetujuan dari Section Head QA.',
      [
        { label: 'Nomor QPR', value: qprNum },
        { label: 'Supplier / Vendor', value: vendorName },
        { label: 'Problem Description', value: problem },
        { label: 'Total Qty NG', value: `${qpr?.totalQtyNg || 0} Pcs` },
        { label: 'Status Saat Ini', value: 'Menunggu Approval Section Head' },
      ],
      'http://localhost:3000/approve-qpr',
      'Review & Setujui QPR',
    );

    await this.sendMail({
      to: recipients,
      subject: `[QPR Approval] Pengajuan QPR Baru: ${qprNum} - Memerlukan Approval Section Head`,
      html,
    });
  }

  // Step 2: Section Approval -> Dept Head
  async notifySectionApproved(qpr: any, recipients: string[]) {
    const qprNum = qpr?.qprNumber || '-';
    const vendorName = qpr?.vendor?.vendorName || '-';

    const html = this.getEmailTemplate(
      'Notifikasi Approval QPR (Dept Head QA)',
      'Dokumen QPR telah disetujui oleh Section Head QA dan sekarang diteruskan untuk approval Dept Head QA.',
      [
        { label: 'Nomor QPR', value: qprNum },
        { label: 'Supplier / Vendor', value: vendorName },
        { label: 'Disetujui Oleh', value: 'Section Head QA' },
        { label: 'Tahap Berikutnya', value: 'Approval Dept Head QA' },
      ],
      'http://localhost:3000/approve-qpr',
      'Review & Setujui QPR (Dept Head)',
    );

    await this.sendMail({
      to: recipients,
      subject: `[QPR Approval] QPR ${qprNum} Disetujui Section Head - Memerlukan Approval Dept Head`,
      html,
    });
  }

  // Step 3: Dept Head Approval -> Div Head
  async notifyDeptApproved(qpr: any, recipients: string[]) {
    const qprNum = qpr?.qprNumber || '-';
    const vendorName = qpr?.vendor?.vendorName || '-';

    const html = this.getEmailTemplate(
      'Notifikasi Approval QPR (Division Head QA)',
      'Dokumen QPR telah disetujui oleh Dept Head QA dan kini menunggu persetujuan dari Division Head QA.',
      [
        { label: 'Nomor QPR', value: qprNum },
        { label: 'Supplier / Vendor', value: vendorName },
        { label: 'Disetujui Oleh', value: 'Dept Head QA' },
        { label: 'Tahap Berikutnya', value: 'Approval Division Head QA' },
      ],
      'http://localhost:3000/approve-qpr',
      'Review & Setujui QPR (Div Head)',
    );

    await this.sendMail({
      to: recipients,
      subject: `[QPR Approval] QPR ${qprNum} Disetujui Dept Head - Memerlukan Approval Division Head`,
      html,
    });
  }

  // Step 4: Div Head Approval -> Purchasing
  async notifyDivApproved(qpr: any, recipients: string[]) {
    const qprNum = qpr?.qprNumber || '-';
    const vendorName = qpr?.vendor?.vendorName || '-';

    const html = this.getEmailTemplate(
      'Notifikasi Approval QPR (Purchasing)',
      'Dokumen QPR telah disetujui oleh Division Head QA dan diteruskan ke Purchasing untuk verifikasi dan persetujuan klaim supplier.',
      [
        { label: 'Nomor QPR', value: qprNum },
        { label: 'Supplier / Vendor', value: vendorName },
        { label: 'Disetujui Oleh', value: 'Division Head QA' },
        { label: 'Tahap Berikutnya', value: 'Approval Purchasing' },
      ],
      'http://localhost:3000/approve-qpr',
      'Review & Setujui QPR (Purchasing)',
    );

    await this.sendMail({
      to: recipients,
      subject: `[QPR Approval] QPR ${qprNum} Disetujui Div Head - Memerlukan Approval Purchasing`,
      html,
    });
  }

  // Step 5: Purchasing Approval -> Accounting (Buat CL)
  async notifyPurchasingApproved(qpr: any, recipients: string[]) {
    const qprNum = qpr?.qprNumber || '-';
    const vendorName = qpr?.vendor?.vendorName || '-';

    const html = this.getEmailTemplate(
      'QPR Disetujui Penuh - Segera Buat Confirmation Letter (CL)',
      'Dokumen QPR telah disetujui sepenuhnya oleh QA dan Purchasing. Tim Accounting diharapkan untuk segera menerbitkan Confirmation Letter (CL).',
      [
        { label: 'Nomor QPR', value: qprNum },
        { label: 'Supplier / Vendor', value: vendorName },
        { label: 'Status QPR', value: 'APPROVED (FULL)' },
        { label: 'Instruksi Tindakan', value: 'Segera terbitkan draf Confirmation Letter (CL)' },
      ],
      'http://localhost:3000/confirmation-letter',
      'Buat Confirmation Letter (CL)',
    );

    await this.sendMail({
      to: recipients,
      subject: `[QPR Action Required] QPR ${qprNum} Disetujui Penuh - Segera Buat Confirmation Letter`,
      html,
    });
  }

  // Step 6: CL dibuat -> Dept Accounting (Approval CL)
  async notifyClCreated(cl: any, recipients: string[]) {
    const clNum = cl?.clNumber || '-';
    const qprNum = cl?.qpr?.qprNumber || '-';
    const vendorName = cl?.vendor?.vendorName || '-';

    const html = this.getEmailTemplate(
      'Notifikasi Approval Confirmation Letter (Dept Accounting)',
      'Draf Confirmation Letter (CL) telah dibuat dan menunggu review & approval dari Dept Head Accounting.',
      [
        { label: 'Nomor CL', value: clNum },
        { label: 'Referensi QPR', value: qprNum },
        { label: 'Supplier / Vendor', value: vendorName },
        { label: 'Tahap Berikutnya', value: 'Approval Dept Head Accounting' },
      ],
      'http://localhost:3000/approve-cl',
      'Review & Setujui Confirmation Letter',
    );

    await this.sendMail({
      to: recipients,
      subject: `[CL Approval] Draf CL ${clNum} Telah Dibuat - Memerlukan Approval Dept Accounting`,
      html,
    });
  }

  // Step 7: Dept Accounting Approval -> Accounting (Kirimkan CL ke Vendor)
  async notifyClDeptApproved(cl: any, recipients: string[]) {
    const clNum = cl?.clNumber || '-';
    const qprNum = cl?.qpr?.qprNumber || '-';
    const vendorName = cl?.vendor?.vendorName || '-';

    const html = this.getEmailTemplate(
      'Confirmation Letter Disetujui - Segera Kirimkan CL ke Vendor',
      'Confirmation Letter (CL) telah disetujui oleh Dept Head Accounting. Tim terkait dapat segera mengirimkan dokumen CL ke Vendor.',
      [
        { label: 'Nomor CL', value: clNum },
        { label: 'Referensi QPR', value: qprNum },
        { label: 'Supplier / Vendor', value: vendorName },
        { label: 'Status CL', value: 'APPROVED BY DEPT ACCOUNTING' },
        { label: 'Instruksi Tindakan', value: 'Kirimkan CL ke Vendor dan pantau konfirmasi' },
      ],
      'http://localhost:3000/approve-cl',
      'Kirimkan CL ke Vendor',
    );

    await this.sendMail({
      to: recipients,
      subject: `[CL Action Required] CL ${clNum} Disetujui Dept Accounting - Segera Kirimkan ke Vendor`,
      html,
    });
  }

  // Step 8: CL Terkirim & (Vendor Approved ATAU Due Date 10 Hari Kerja) -> Finance (Bagas Pratama)
  async notifyFinanceForSsc(cl: any, reason: 'vendor_approved' | 'due_date', recipients: string[]) {
    const clNum = cl?.clNumber || '-';
    const qprNum = cl?.qpr?.qprNumber || '-';
    const vendorName = cl?.vendor?.vendorName || '-';

    const reasonDesc =
      reason === 'vendor_approved'
        ? 'Vendor telah menyetujui dokumen Confirmation Letter (CL).'
        : 'Masa tunggu konfirmasi vendor telah mencapai batas due date 10 hari kerja tanpa sanggahan (potong otomatis).';

    const html = this.getEmailTemplate(
      'Segera Buat SSC Billing & SSC Payment',
      `Dokumen Confirmation Letter (CL) telah siap diproses ke modul keuangan. ${reasonDesc}`,
      [
        { label: 'Nomor CL', value: clNum },
        { label: 'Referensi QPR', value: qprNum },
        { label: 'Supplier / Vendor', value: vendorName },
        { label: 'Kondisi Pemicu', value: reason === 'vendor_approved' ? 'Persetujuan Vendor Diterima' : 'Due Date 10 Hari Kerja Tercapai' },
        { label: 'Instruksi Tindakan', value: 'Segera buatkan SSC Billing & SSC Payment' },
      ],
      'http://localhost:3000/i-memo',
      'Buka Modul SSC Billing & Payment',
    );

    await this.sendMail({
      to: recipients,
      subject: `[Finance Action Required] CL ${clNum} (${vendorName}) Siap Dibuatkan SSC Billing & Payment`,
      html,
    });
  }
}
