export type TemplateKey = "OTP" | "FORGOT_PASSWORD" | "INVITE_USER";

export interface OTPData {
  name: string;
  otp: string;
  expiresIn: string;
}

export interface ForgotPasswordData {
  name: string;
  resetLink: string;
  expiresIn: string;
}

export interface InviteUserData {
  inviterName: string;
  workspaceName: string;
  inviteLink: string;
  expiresIn: string;
}

export interface TemplateDataMap {
  OTP: OTPData;
  FORGOT_PASSWORD: ForgotPasswordData;
  INVITE_USER: InviteUserData;
}

export interface SendEmailOptions<T extends TemplateKey = TemplateKey> {
  to: string;
  template: T;
  data: TemplateDataMap[T];
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface TemplateResult {
  subject: string;
  html: string;
}

export type TemplateBuilder<T> = (data: T) => TemplateResult;
