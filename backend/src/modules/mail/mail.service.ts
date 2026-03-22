import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

interface PasswordResetEmailInput {
  to: string;
  userName: string;
  resetUrl: string;
  otpCode: string;
  expiresInMinutes: number;
}

interface PasswordChangedNotificationInput {
  to: string;
  userName: string;
  changedAt: Date;
  ipAddress: string | null;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(
    data: PasswordResetEmailInput,
  ): Promise<boolean> {
    return this.sendMail({
      html: this.renderPasswordResetEmail(data),
      subject: 'Dat lai mat khau - Inkline',
      text: this.renderPasswordResetText(data),
      to: data.to,
    });
  }

  async sendPasswordChangedNotification(
    data: PasswordChangedNotificationInput,
  ): Promise<boolean> {
    return this.sendMail({
      html: this.renderPasswordChangedEmail(data),
      subject: 'Thong bao doi mat khau - Inkline',
      text: this.renderPasswordChangedText(data),
      to: data.to,
    });
  }

  private async sendMail(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.warn(
        `SMTP is not configured. Skipping email with subject "${input.subject}".`,
      );
      return false;
    }

    try {
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: this.getFromAddress(),
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown SMTP error';

      this.logger.error(
        `Failed to send email "${input.subject}" to ${input.to}: ${message}`,
      );

      return false;
    }
  }

  private isConfigured(): boolean {
    const host = this.configService.get<string>('mail.host') ?? '';
    const fromEmail = this.configService.get<string>('mail.fromEmail') ?? '';

    return host.length > 0 && fromEmail.length > 0;
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('mail.host') ?? '';
    const port = this.configService.get<number>('mail.port') ?? 587;
    const secure = this.configService.get<boolean>('mail.secure') ?? false;
    const user = this.configService.get<string>('mail.user') ?? '';
    const pass = this.configService.get<string>('mail.pass') ?? '';
    const requireTls =
      this.configService.get<boolean>('mail.requireTls') ?? false;
    const ignoreTls =
      this.configService.get<boolean>('mail.ignoreTls') ?? false;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
      requireTLS: requireTls,
      ignoreTLS: ignoreTls,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      dnsTimeout: 5000,
    });

    return this.transporter;
  }

  private getFromAddress(): string {
    const fromName = this.configService.get<string>('mail.fromName') ?? 'Inkline';
    const fromEmail = this.configService.get<string>('mail.fromEmail') ?? '';
    const safeFromName = fromName.replaceAll('"', '');

    return safeFromName ? `"${safeFromName}" <${fromEmail}>` : fromEmail;
  }

  private renderPasswordResetEmail(data: PasswordResetEmailInput): string {
    const userName = this.escapeHtml(data.userName);
    const resetUrl = this.escapeHtml(data.resetUrl);
    const otpCode = this.escapeHtml(data.otpCode);
    const year = new Date().getFullYear();

    return `
      <div style="margin:0;padding:24px;background:#f4f1ea;font-family:Arial,sans-serif;color:#1d2a2f;">
        <div style="max-width:640px;margin:0 auto;background:#fffaf2;border:1px solid #e8dcc8;border-radius:20px;overflow:hidden;">
          <div style="padding:28px 32px;background:linear-gradient(135deg,#143642 0%,#1f6f8b 100%);color:#fff;">
            <p style="margin:0;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.85;">Inkline Security</p>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.3;">Dat lai mat khau cua ban</h1>
          </div>

          <div style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Xin chao <strong>${userName}</strong>,</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.7;">
              He thong vua nhan duoc yeu cau khoi phuc mat khau cho tai khoan Inkline cua ban.
              Neu do la ban, hay su dung nut ben duoi hoac nhap ma OTP de tiep tuc.
            </p>

            <div style="margin:28px 0;text-align:center;">
              <a href="${resetUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#143642;color:#ffffff;text-decoration:none;font-weight:700;">
                Mo trang dat lai mat khau
              </a>
            </div>

            <div style="margin:24px 0;padding:20px;border:1px dashed #1f6f8b;border-radius:16px;background:#eff8fb;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#1f6f8b;">Ma OTP</p>
              <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:8px;color:#143642;">${otpCode}</p>
            </div>

            <div style="padding:16px;border-radius:14px;background:#fff1d8;color:#76520e;font-size:14px;line-height:1.7;">
              Link va OTP se het han sau <strong>${data.expiresInMinutes} phut</strong>.
              Neu ban khong yeu cau thao tac nay, vui long bo qua email nay.
            </div>

            <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#5c6b70;">
              Neu nut bam khong hoat dong, hay copy duong link sau vao trinh duyet:<br />
              <span style="word-break:break-all;color:#1f6f8b;">${resetUrl}</span>
            </p>
          </div>

          <div style="padding:18px 32px;background:#f3ece1;font-size:12px;color:#6c7477;">
            © ${year} Inkline. Day la email tu dong ve bao mat tai khoan.
          </div>
        </div>
      </div>
    `;
  }

  private renderPasswordChangedEmail(
    data: PasswordChangedNotificationInput,
  ): string {
    const userName = this.escapeHtml(data.userName);
    const changedAt = this.escapeHtml(this.formatDateTime(data.changedAt));
    const ipAddress = this.escapeHtml(data.ipAddress ?? 'Khong xac dinh');
    const year = new Date().getFullYear();

    return `
      <div style="margin:0;padding:24px;background:#f4f1ea;font-family:Arial,sans-serif;color:#1d2a2f;">
        <div style="max-width:640px;margin:0 auto;background:#fffaf2;border:1px solid #e8dcc8;border-radius:20px;overflow:hidden;">
          <div style="padding:28px 32px;background:linear-gradient(135deg,#6b1f1f 0%,#c44900 100%);color:#fff;">
            <p style="margin:0;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.85;">Inkline Security</p>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.3;">Mat khau da duoc thay doi</h1>
          </div>

          <div style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Xin chao <strong>${userName}</strong>,</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.7;">
              Mat khau tai khoan Inkline cua ban vua duoc thay doi thanh cong.
            </p>

            <div style="padding:18px;border-radius:16px;background:#fff1e8;color:#7b3a16;font-size:14px;line-height:1.8;">
              <strong>Thoi gian:</strong> ${changedAt}<br />
              <strong>IP:</strong> ${ipAddress}
            </div>

            <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#5c6b70;">
              Neu ban khong thuc hien thao tac nay, vui long dat lai mat khau ngay va kiem tra lai bao mat email cua ban.
            </p>
          </div>

          <div style="padding:18px 32px;background:#f3ece1;font-size:12px;color:#6c7477;">
            © ${year} Inkline. Email nay duoc gui de bao ve tai khoan cua ban.
          </div>
        </div>
      </div>
    `;
  }

  private renderPasswordResetText(data: PasswordResetEmailInput): string {
    return [
      `Xin chao ${data.userName},`,
      '',
      'He thong vua nhan duoc yeu cau khoi phuc mat khau cho tai khoan Inkline cua ban.',
      `Link dat lai mat khau: ${data.resetUrl}`,
      `OTP: ${data.otpCode}`,
      `Thong tin nay se het han sau ${data.expiresInMinutes} phut.`,
      '',
      'Neu ban khong yeu cau thao tac nay, vui long bo qua email nay.',
    ].join('\n');
  }

  private renderPasswordChangedText(
    data: PasswordChangedNotificationInput,
  ): string {
    return [
      `Xin chao ${data.userName},`,
      '',
      'Mat khau tai khoan Inkline cua ban vua duoc thay doi thanh cong.',
      `Thoi gian: ${this.formatDateTime(data.changedAt)}`,
      `IP: ${data.ipAddress ?? 'Khong xac dinh'}`,
      '',
      'Neu ban khong thuc hien thao tac nay, vui long dat lai mat khau ngay.',
    ].join('\n');
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
