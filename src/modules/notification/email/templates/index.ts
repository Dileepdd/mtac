import { TemplateKey, TemplateDataMap, TemplateResult } from "../email.types.js";
import { otpTemplate } from "./otp.template.js";
import { forgotPasswordTemplate } from "./forgot-password.template.js";
import { inviteUserTemplate } from "./invite-user.template.js";

type TemplateRegistry = {
  [K in TemplateKey]: (data: TemplateDataMap[K]) => TemplateResult;
};

export const templateRegistry: TemplateRegistry = {
  OTP: otpTemplate,
  FORGOT_PASSWORD: forgotPasswordTemplate,
  INVITE_USER: inviteUserTemplate,
};
