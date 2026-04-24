import { Resend } from "resend";
import { IEmailProvider } from "./base.provider.js";
import { SendEmailPayload } from "../email.types.js";
import { env } from "../../../../config/env.js";
import { logger } from "../../../../utils/logger.js";

export class ResendProvider implements IEmailProvider {
  private client: Resend;

  constructor() {
    this.client = new Resend(env.RESEND_API_KEY);
  }

  async send(payload: SendEmailPayload): Promise<void> {
    const { data, error } = await this.client.emails.send({
      from: env.EMAIL_FROM,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    });

    if (error) {
      logger.error("email.resend.failed", {
        to: payload.to,
        subject: payload.subject,
        error: error.message,
      });
      throw new Error(`Resend error: ${error.message}`);
    }

    logger.info("email.resend.sent", {
      to: payload.to,
      subject: payload.subject,
      messageId: data?.id,
    });
  }
}
