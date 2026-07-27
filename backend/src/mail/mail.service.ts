import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');

    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: this.configService.get<string>('MAIL_FROM') ?? 'GastosApp <onboarding@resend.dev>',
            to: [email],
            subject: 'Restablecer contraseña — GastosApp',
            html: `
              <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="color: #059669; font-size: 24px; font-weight: 700; margin: 0;">GastosApp</h1>
                  <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Control de Finanzas Personales</p>
                </div>
                <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 12px;">Solicitud de restablecimiento de contraseña</h2>
                <p style="color: #374151; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
                  Hemos recibido una solicitud para cambiar la contraseña asociada a tu cuenta. Haz clic en el botón a continuación para ingresar una nueva contraseña:
                </p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${resetUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">
                    Restablecer Contraseña
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 13px; line-height: 1.4;">
                  Este enlace expira en <strong>15 minutos</strong> y sólo puede ser utilizado una vez. Si no solicitaste este cambio, puedes ignorar este mensaje.
                </p>
                <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
                <p style="color: #9ca3af; font-size: 11px; word-break: break-all;">
                  Si el botón no funciona, copia y pega esta URL en tu navegador:<br />
                  <a href="${resetUrl}" style="color: #059669;">${resetUrl}</a>
                </p>
              </div>
            `,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          this.logger.error(`Error sending email via Resend API: ${errText}`);
        } else {
          this.logger.log(`Password reset email successfully sent to ${email} via Resend.`);
          return;
        }
      } catch (error) {
        this.logger.error('Failed to send email via Resend', error);
      }
    }

    // Fallback log in dev
    this.logger.warn(`
══════════════════════════════════════════════════════════════════════════════════════════
 📧 [MAIL DEV SIMULATION] Password Reset Link
 To: ${email}
 Link: ${resetUrl}
 (Configura RESEND_API_KEY en tu .env para enviar correos reales)
══════════════════════════════════════════════════════════════════════════════════════════
    `);
  }
}
