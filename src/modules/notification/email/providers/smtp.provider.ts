import nodemailer from "nodemailer";
import { IEmailProvider } from "./base.provider.js";
import { SendEmailPayload } from "../email.types.js";
import { env } from "../../../../config/env.js";
import { logger } from "../../../../utils/logger.js";

export class SmtpProvider implements IEmailProvider {
  async send(payload: SendEmailPayload): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    let info;
    try {
      info = await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
    } catch (err) {
      logger.error("email.smtp.failed", {
        to: payload.to,
        subject: payload.subject,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    logger.info("email.smtp.sent", {
      to: payload.to,
      subject: payload.subject,
      messageId: info.messageId,
    });
  }
}
