import { emailService } from "./email/email.service.js";

export const sendVerificationEmail = (to: string, name: string, otp: string): Promise<void> =>
  emailService.send({
    to,
    template: "OTP",
    data: { name, otp, expiresIn: "10 minutes" },
  });

export const sendForgotPasswordEmail = (
  to: string,
  name: string,
  resetLink: string
): Promise<void> =>
  emailService.send({
    to,
    template: "FORGOT_PASSWORD",
    data: { name, resetLink, expiresIn: "1 hour" },
  });

export const sendInviteEmail = (
  to: string,
  data: { inviterName: string; workspaceName: string; inviteLink: string }
): Promise<void> =>
  emailService.send({
    to,
    template: "INVITE_USER",
    data: { ...data, expiresIn: "7 days" },
  });
