import { IEmailProvider } from "./base.provider.js";
import { ResendProvider } from "./resend.provider.js";
import { SmtpProvider } from "./smtp.provider.js";
import { env } from "../../../../config/env.js";

let instance: IEmailProvider | null = null;

export const getEmailProvider = (): IEmailProvider => {
  if (instance) return instance;

  switch (env.EMAIL_PROVIDER) {
    case "resend":
      if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
      instance = new ResendProvider();
      return instance;
    case "smtp":
      if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
        throw new Error("SMTP_HOST, SMTP_USER and SMTP_PASS are required when EMAIL_PROVIDER=smtp");
      }
      instance = new SmtpProvider();
      return instance;
    default:
      throw new Error(`Unsupported email provider: ${env.EMAIL_PROVIDER}`);
  }
};
