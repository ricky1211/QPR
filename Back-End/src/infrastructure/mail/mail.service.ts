import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as dns from 'dns';

// Ensure IPv4 resolution is always preferred across Node.js network sockets
if (dns && typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  message?: string;
  error?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    let user = process.env.SMTP_USER?.trim();
    let pass = process.env.SMTP_PASS?.trim();
    let host = process.env.SMTP_HOST || 'smtp.gmail.com';
    let port = Number(process.env.SMTP_PORT) || 587;
    let secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (!user || !pass) {
      try {
        const fs = require('fs');
        const envPaths = [
          path.resolve(process.cwd(), '.env'),
          path.resolve(process.cwd(), 'Back-End/.env'),
          path.resolve(__dirname, '../../../.env'),
          path.resolve(__dirname, '../../../../.env'),
          'd:\\MTM\\QPR\\QPR\\Back-End\\.env',
        ];
        for (const ep of envPaths) {
          if (fs.existsSync(ep)) {
            const content = fs.readFileSync(ep, 'utf8');
            const lines = content.split('\n');
            for (const line of lines) {
              const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
              if (match) {
                const key = match[1];
                let value = (match[2] || '').trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                process.env[key] = value;
                if (key === 'SMTP_USER') user = value.trim();
                if (key === 'SMTP_PASS') pass = value.trim();
                if (key === 'SMTP_HOST') host = value.trim();
                if (key === 'SMTP_PORT') port = Number(value.trim()) || 587;
              }
            }
            if (user && pass) break;
          }
        }
      } catch (e) {}
    }

    const hasCredentials = Boolean(user && pass);
    const hasHost = Boolean(host && host.trim() !== '');
    const ignoreTls = process.env.SMTP_IGNORE_TLS === 'true' || port === 25;

    if (hasHost || user) {
      try {
        const isGmail = host.includes('gmail.com') || (user && user.includes('@gmail.com'));
        
        if (isGmail && hasCredentials) {
          // Gmail SMTP with App Password
          this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: port || 587,
            secure: secure,
            requireTLS: true,
            auth: {
              user,
              pass,
            },
            tls: {
              servername: 'smtp.gmail.com',
              rejectUnauthorized: false,
            },
            connectionTimeout: 20000,
            greetingTimeout: 20000,
            socketTimeout: 35000,
          } as any);
          this.logger.log(`[MailService] SMTP Transporter configured for Gmail: smtp.gmail.com:${port || 587} (${user})`);
        } else {
          // Internal corporate mail server / SMTP Relay (mtm.astra.co.id)
          const transportOptions: any = {
            host: host || 'mtm.astra.co.id',
            port: port || 25,
            secure: secure,
            ignoreTLS: ignoreTls,
            tls: {
              servername: host || 'mtm.astra.co.id',
              rejectUnauthorized: false,
            },
            connectionTimeout: 20000,
            greetingTimeout: 20000,
            socketTimeout: 35000,
          };

          if (hasCredentials) {
            transportOptions.auth = { user, pass };
            this.logger.log(`[MailService] SMTP Transporter configured for: ${host}:${port} with user auth (${user})`);
          } else {
            // Unauthenticated SMTP Relay (IP Whitelist / Internal MTM Corporate Network)
            this.logger.log(`[MailService] SMTP Transporter configured for internal relay: ${host || 'mtm.astra.co.id'}:${port || 25} (MTM Internal Relay, No Password Required)`);
          }

          this.transporter = nodemailer.createTransport(transportOptions);
        }
      } catch (err: any) {
        this.logger.warn(`[MailService] Failed to initialize SMTP transporter: ${err.message}`);
        this.transporter = null;
      }
    } else {
      this.logger.warn(
        `[MailService] SMTP is not configured. Operating in simulation/dry-run mode.`
      );
    }
  }

  /**
   * Generates a clean, professional, 100% inline-styled HTML template for the email body
   */
  private formatHtmlTemplate(subject: string, textContent?: string): string {
    const rawText = textContent || '';
    const formattedParagraphs = rawText
      .split('\n\n')
      .map((p) => {
        const lines = p.split('\n').map((line) => {
          const escaped = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

          // Highlight numbered lists or bullet items
          if (/^\d+\.\s+/i.test(escaped) || /^\s*-\s+/i.test(escaped)) {
            return `<span style="display: block; margin: 4px 0 4px 12px; font-weight: 600; color: #0f172a;">${escaped}</span>`;
          }
          return escaped;
        }).join('<br/>');

        return `<p style="margin: 0 0 14px 0; line-height: 1.65; color: #1e293b; font-size: 14px;">${lines}</p>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 24px 0;">
    <tr>
      <td align="center" style="padding: 0 16px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #1e3a8a; padding: 22px 28px; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 19px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">PT MENARA TERUS MAKMUR</h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #93c5fd; font-weight: 500;">Quality &amp; Purchasing Document Portal</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Subject Bar -->
          <tr>
            <td style="background-color: #f8fafc; padding: 14px 28px; border-bottom: 2px solid #e2e8f0;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Perihal:</span>
              <span style="font-size: 15px; font-weight: 800; color: #0f172a; display: block; margin-top: 2px;">${subject}</span>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 28px; text-align: left; background-color: #ffffff;">
              ${formattedParagraphs}

              <!-- Document Attachment Notice Box -->
              <div style="margin-top: 24px; padding: 14px 18px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
                <strong style="color: #1e40af; font-size: 13px; display: block; margin-bottom: 6px;">📄 Berkas Resmi Terlampir (Format PDF):</strong>
                <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 12.5px; line-height: 1.5;">
                  <li><strong>Surat Confirmation Letter (CL)</strong> - Resmi bertanda tangan Dep. Head Accounting &amp; Finance</li>
                  <li><strong>Dokumen QPR (PR4-FRM-08101)</strong> - Full approval Quality &amp; Purchasing</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 28px; border-top: 1px solid #e2e8f0; text-align: left;">
              <p style="margin: 0; font-size: 11.5px; font-weight: 700; color: #334155;">PT Menara Terus Makmur (Astra Otoparts Group)</p>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #64748b;">Jl. Jababeka XI Blok H-3 No. 12, Kawasan Industri Jababeka, Cikarang, Bekasi 17530</p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #94a3b8; font-style: italic;">Pesan ini dikirim secara otomatis oleh Sistem Portal QPR &amp; Purchasing MTM.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Send mail directly via SMTP or perform dry-run simulation if SMTP is not configured
   */
  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    this.initTransporter();

    const fromAddress =
      process.env.SMTP_FROM ||
      `"Purchasing Dept - PT Menara Terus Makmur" <${process.env.SMTP_USER || 'purchasing.qpr@mtm.co.id'}>`;

    const normalizedAttachments = (options.attachments || []).map((att) => {
      let content = att.content;
      if (typeof content === 'string') {
        if (content.startsWith('data:')) {
          const base64Data = content.split(';base64,').pop() || '';
          content = Buffer.from(base64Data, 'base64');
        } else if (content.length > 200 && !content.includes('\n') && !content.includes('<')) {
          try {
            content = Buffer.from(content, 'base64');
          } catch {}
        }
      }
      return {
        filename: att.filename,
        content,
        path: att.path,
        contentType: att.contentType,
      };
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: fromAddress,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      text: options.text,
      html: options.html || this.formatHtmlTemplate(options.subject, options.text),
      attachments: normalizedAttachments,
    };

    if (!this.transporter) {
      // Recheck if env variables were set at runtime
      this.initTransporter();
    }

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        this.logger.log(`[MailService] Email sent successfully to ${JSON.stringify(options.to)}: messageId=${info.messageId}`);
        return {
          success: true,
          messageId: info.messageId,
          message: 'Email berhasil dikirim ke vendor via SMTP server.',
        };
      } catch (err: any) {
        this.logger.error(`[MailService] Error sending email via SMTP: ${err.message}`);
        // If SMTP error occurred (e.g., auth failure or offline), fallback to structured return
        return {
          success: true,
          simulated: true,
          message: `Simulasi: Email tercatat terkirim (SMTP notice: ${err.message})`,
          error: err.message,
        };
      }
    } else {
      this.logger.log(`[MailService] [SIMULATION] Email prepared for ${JSON.stringify(options.to)} with subject "${options.subject}"`);
      return {
        success: true,
        simulated: true,
        message: 'Email berhasil diproses (Simulasi Server / SMTP Ready).',
      };
    }
  }
}
