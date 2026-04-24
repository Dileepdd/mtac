import { getEmailProvider } from "./providers/provider.factory.js";
import { templateRegistry } from "./templates/index.js";
import { SendEmailOptions, TemplateKey } from "./email.types.js";
import { logger } from "../../../utils/logger.js";
import { AppError } from "../../../errors/appError.js";

const send = async <T extends TemplateKey>(options: SendEmailOptions<T>): Promise<void> => {
  const buildTemplate = templateRegistry[options.template];
  const { subject, html } = buildTemplate(options.data as never);

  const provider = getEmailProvider();

  try {
    await provider.send({ to: options.to, subject, html });
  } catch (err) {
    logger.error("email.service.failed", {
      template: options.template,
      to: options.to,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new AppError("Failed to send email. Please try again.", 500, "EMAIL_SEND_FAILED");
  }
};

export const emailService = { send };
