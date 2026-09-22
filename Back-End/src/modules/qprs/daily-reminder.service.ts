import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MailService } from '../../infrastructure/mail/mail.service';

@Injectable()
export class DailyReminderService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DailyReminderService.name);
  private timerHandle: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  onApplicationBootstrap() {
    this.scheduleNextDailyRun();
    this.logger.log('[DailyReminderService] Scheduled daily automated reminder job for pending QPRs & CLs (08:00 WIB / 24h interval).');
  }

  onModuleDestroy() {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
  }

  /**
   * Schedules the next run at 08:00 AM WIB (UTC+7) or 24h interval
   */
  private scheduleNextDailyRun() {
    const now = new Date();
    // Target 08:00 AM WIB (01:00 UTC)
    const target = new Date(now);
    target.setUTCHours(1, 0, 0, 0); // 01:00 UTC = 08:00 WIB

    if (target.getTime() <= now.getTime()) {
      // If today's 08:00 WIB has passed, schedule for tomorrow
      target.setDate(target.getDate() + 1);
    }

    const delayMs = target.getTime() - now.getTime();
    this.logger.log(`[DailyReminderService] Next automated daily reminder scheduled in ${Math.round(delayMs / 60000)} minutes (${target.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB).`);

    this.timerHandle = setTimeout(async () => {
      try {
        await this.sendDailyReminderDigest();
      } catch (err: any) {
        this.logger.error('[DailyReminderService] Error executing daily reminder:', err.message);
      } finally {
        this.scheduleNextDailyRun();
      }
    }, delayMs);
  }

  /**
   * Gathers all pending QPRs and Confirmation Letters and sends an executive reminder digest
   */
  async sendDailyReminderDigest(customTargetEmail?: string): Promise<{
    success: boolean;
    totalPendingQprs: number;
    totalPendingCls: number;
    recipients: string[];
    message: string;
  }> {
    this.logger.log('[DailyReminderService] Running daily reminder scan for pending documents...');

    // 1. Fetch pending QPRs
    const pendingQprs: any[] = await this.prisma.qpr.findMany({
      where: {
        status: { in: ['WAITING_APPROVAL', 'WAITING_VENDOR'] },
      },
      include: {
        vendor: true,
        approvalProgress: true,
        qprParts: {
          include: { part: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch pending Confirmation Letters
    const pendingCls: any[] = await this.prisma.confirmationLetter.findMany({
      where: {
        closedPaid: false,
        OR: [
          { status: 'PENDING' },
          { vendorApproved: false },
        ],
      },
      include: {
        vendor: true,
        qpr: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Resolve target recipients (Official designated PICs)
    const envEmails = (
      process.env.NOTIFICATION_EMAIL_TO ||
      process.env.SMTP_USER ||
      'hendrik.firdaus@mtm.astra.co.id, septian.nugraha@mtm.astra.co.id, putu.saputra@mtm.astra.co.id, irvan.hn@mtm.astra.co.id, cicik.andria@mtm.astra.co.id, anindita.irnila@mtm.astra.co.id, bagas.pratama@mtm.astra.co.id'
    )
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    const recipientList = Array.from(
      new Set(
        [
          customTargetEmail,
          ...envEmails,
        ].filter(Boolean) as string[],
      ),
    );

    const todayDateFormatted = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jakarta',
    });

    // Build QPR table rows
    const qprRows = pendingQprs.length > 0
      ? pendingQprs
          .map((q, idx) => {
            const daysPending = Math.max(0, Math.floor((Date.now() - new Date(q.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
            const vendorName = q.vendor?.vendorName || 'Vendor';
            const reqRole = q.requiredRole || 'Section Head';
            const urgencyBadge = daysPending >= 3
              ? `<span style="background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px;">⚠️ ${daysPending} Hari</span>`
              : `<span style="background-color: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 11px;">${daysPending} Hari</span>`;

            return `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12.5px; font-weight: 700; color: #1e40af;">${q.qprNumber}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12.5px; font-weight: 600; color: #0f172a;">${vendorName}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">${q.problem || '-'}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #d97706;">${reqRole}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${urgencyBadge}</td>
              </tr>
            `;
          })
          .join('')
      : `<tr><td colspan="5" style="padding: 16px; text-align: center; color: #059669; font-weight: 700; font-size: 13px;">✅ Tidak ada antrean QPR yang menunggu approval hari ini.</td></tr>`;

    // Build CL table rows
    const clRows = pendingCls.length > 0
      ? pendingCls
          .map((c, idx) => {
            const daysPending = Math.max(0, Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
            const vendorName = c.vendor?.vendorName || 'Vendor';
            const statusText = c.vendorApproved
              ? 'Approved Vendor'
              : c.purchasingSentCl
              ? 'Menunggu Approval Vendor'
              : 'Menunggu Approval Accounting';

            const statusColor = c.purchasingSentCl ? '#2563eb' : '#d97706';

            return `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12.5px; font-weight: 700; color: #1e40af;">${c.clNumber}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12.5px; font-weight: 600; color: #0f172a;">${vendorName}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: ${statusColor};">${statusText}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 11px; font-weight: 600; color: #475569;">${daysPending} Hari</td>
              </tr>
            `;
          })
          .join('')
      : `<tr><td colspan="4" style="padding: 16px; text-align: center; color: #059669; font-weight: 700; font-size: 13px;">✅ Tidak ada antrean Confirmation Letter yang tertunda.</td></tr>`;

    // Compose Rich HTML Digest
    const htmlBody = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Daily Reminder QPR & Confirmation Letter</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 24px 0;">
    <tr>
      <td align="center" style="padding: 0 16px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 780px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e3a8a; padding: 22px 28px; text-align: left;">
              <h1 style="margin: 0; font-size: 19px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">PT MENARA TERUS MAKMUR</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #93c5fd; font-weight: 500;">Quality &amp; Purchasing Automated Daily Reminder System</p>
            </td>
          </tr>

          <!-- Title Bar -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 28px; border-bottom: 2px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="font-size: 11px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; display: block;">⏰ PENGINGAT HARIAN OTOMATIS (DAILY DIGEST)</span>
                  <h2 style="margin: 3px 0 0 0; font-size: 16px; font-weight: 800; color: #0f172a;">Daftar Dokumen QPR &amp; CL Menunggu Tindakan / Approval</h2>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Tanggal: <strong>${todayDateFormatted}</strong></p>
                </div>
              </div>
            </td>
          </tr>

          <!-- Summary Metric Cards -->
          <tr>
            <td style="padding: 20px 28px 10px 28px; background-color: #ffffff;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="32%" style="padding: 14px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; vertical-align: top;">
                    <span style="font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase;">QPR Pending Approval</span>
                    <h3 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 800; color: #1e3a8a;">${pendingQprs.length} Dokumen</h3>
                    <span style="font-size: 11px; color: #3b82f6; font-weight: 600;">Menunggu Review PIC</span>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" style="padding: 14px; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; vertical-align: top;">
                    <span style="font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase;">CL Pending Approval</span>
                    <h3 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 800; color: #b45309;">${pendingCls.length} Dokumen</h3>
                    <span style="font-size: 11px; color: #d97706; font-weight: 600;">Menunggu Tindakan</span>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" style="padding: 14px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; vertical-align: top;">
                    <span style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase;">Total Antrean</span>
                    <h3 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 800; color: #15803d;">${pendingQprs.length + pendingCls.length} Berkas</h3>
                    <span style="font-size: 11px; color: #16a34a; font-weight: 600;">Monitoring Sistem</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 16px 28px 24px 28px; text-align: left; background-color: #ffffff;">
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #334155; line-height: 1.6;">
                Yth. Bapak/Ibu PIC Terkait (QA, Purchasing, Accounting &amp; Finance),<br/>
                Berikut adalah ringkasan dokumen <strong>Quality Problem Report (QPR)</strong> dan <strong>Confirmation Letter (CL)</strong> yang saat ini masih memerlukan tindakan review, persetujuan, atau pengiriman ke vendor:
              </p>

              <!-- Table 1: QPR Pending -->
              <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; font-size: 13.5px; font-weight: 800; color: #1e3a8a; display: flex; align-items: center; gap: 6px;">
                  📋 1. Dokumen QPR Menunggu Approval (${pendingQprs.length} Dokumen)
                </h4>
                <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f8fafc;">
                      <th style="padding: 8px 12px; font-size: 11px; font-weight: 800; color: #475569; text-align: left; border-bottom: 2px solid #e2e8f0;">No. QPR</th>
                      <th style="padding: 8px 12px; font-size: 11px; font-weight: 800; color: #475569; text-align: left; border-bottom: 2px solid #e2e8f0;">Vendor / Subcont</th>
                      <th style="padding: 8px 12px; font-size: 11px; font-weight: 800; color: #475569; text-align: left; border-bottom: 2px solid #e2e8f0;">Problem</th>
                      <th style="padding: 8px 12px; font-size: 11px; font-weight: 800; color: #475569; text-align: left; border-bottom: 2px solid #e2e8f0;">Menunggu Approval</th>
                      <th style="padding: 8px 12px; font-size: 11px; font-weight: 800; color: #475569; text-align: center; border-bottom: 2px solid #e2e8f0;">Antrean</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${qprRows}
                  </tbody>
                </table>
              </div>

              <!-- Table 2: CL Pending -->
              <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; font-size: 13.5px; font-weight: 800; color: #b45309; display: flex; align-items: center; gap: 6px;">
                  📄 2. Surat Confirmation Letter (CL) Menunggu Tindakan (${pendingCls.length} Dokumen)
                </h4>
                <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f8fafc;">
                      <th style="padding: 8px 12px; font-size: 11px; font-weight: 800; color: #475569; text-align: left; border-bottom: 2px solid #e2e8f0;">No. CL</th>
                      <th style="padding: 8px 12px; font-size: 11px; font-weight: 800; color: #475569; text-align: left; border-bottom: 2px solid #e2e8f0;">Vendor</th>
                      <th style="padding: 8px 12px; font-size: 11px; font-weight: 800; color: #475569; text-align: left; border-bottom: 2px solid #e2e8f0;">Status / Tindakan</th>
                      <th style="padding: 8px 12px; font-size: 11px; font-weight: 800; color: #475569; text-align: center; border-bottom: 2px solid #e2e8f0;">Lama</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${clRows}
                  </tbody>
                </table>
              </div>

              <!-- Action Reminder Notice -->
              <div style="padding: 14px 18px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; margin-top: 16px;">
                <strong style="color: #1e40af; font-size: 13px; display: block; margin-bottom: 4px;">🎯 Instruksi Tindak Lanjut:</strong>
                <p style="margin: 0; font-size: 12.5px; color: #1e3a8a; line-height: 1.5;">
                  Mohon Bapak/Ibu penanggung jawab section segera membuka <strong>Portal QPR MTM</strong> untuk memproses dokumen di atas agar alur klaim mutu dan penerbitan SSC dapat terselesaikan tepat waktu.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 28px; border-top: 1px solid #e2e8f0; text-align: left;">
              <p style="margin: 0; font-size: 11.5px; font-weight: 700; color: #334155;">PT Menara Terus Makmur (Astra Otoparts Group)</p>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #64748b;">Quality &amp; Purchasing Automated Workflow Notification Service</p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #94a3b8; font-style: italic;">
                Email reminder harian ini dikirim otomatis setiap hari pukul 08:00 WIB untuk memonitor kecepatan respon klaim.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const sendRes = await this.mailService.sendMail({
      to: recipientList,
      subject: `[DAILY REMINDER] Rekap Antrean QPR & Confirmation Letter (${pendingQprs.length} QPR, ${pendingCls.length} CL Pending) - ${todayDateFormatted}`,
      html: htmlBody,
    });

    this.logger.log(`[DailyReminderService] Daily reminder sent successfully to ${JSON.stringify(recipientList)}: success=${sendRes.success}`);

    return {
      success: sendRes.success,
      totalPendingQprs: pendingQprs.length,
      totalPendingCls: pendingCls.length,
      recipients: recipientList,
      message: `Daily reminder berhasil dikirim ke ${recipientList.join(', ')} (${pendingQprs.length} QPR & ${pendingCls.length} CL pending).`,
    };
  }
}
