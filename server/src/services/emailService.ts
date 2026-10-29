import nodemailer, { type Transporter } from 'nodemailer';
import { config, emailConfigured } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      requireTLS: config.smtpPort === 587,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
      tls: { minVersion: 'TLSv1.2' },
    });
  }
  return transporter;
}

/**
 * Sends a password reset link. Without SMTP credentials, development and test
 * mode print the link to the server console. Production fails closed.
 */
export async function sendResetEmail(email: string, resetUrl: string): Promise<boolean> {
  if (!emailConfigured) {
    if (config.isProduction) {
      throw new HttpError(
        503,
        'Password reset email is not configured on this server.',
        'EMAIL_NOT_CONFIGURED',
      );
    }
    console.log(`[reset] Development reset link for ${email}: ${resetUrl}`);
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: config.mailFrom,
      to: email,
      subject: 'Reset your WeatherWise password',
      text: `Use this link to reset your WeatherWise password: ${resetUrl}\n\nThe link expires in one hour. If you did not request it, you can ignore this email.`,
      html: `<p>Use this link to reset your WeatherWise password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>The link expires in one hour. If you did not request it, you can ignore this email.</p>`,
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[reset] Failed to send email: ${message}`);
    if (!config.isProduction) {
      console.log(`[reset] Development reset link for ${email}: ${resetUrl}`);
    }
    throw new HttpError(
      502,
      'The reset email could not be sent. Please try again shortly.',
      'EMAIL_SEND_FAILED',
    );
  }
}
