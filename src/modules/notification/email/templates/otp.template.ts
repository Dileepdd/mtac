import { baseLayout } from "./layouts/base.layout.js";
import { OTPData, TemplateBuilder, TemplateResult } from "../email.types.js";

export const otpTemplate: TemplateBuilder<OTPData> = ({ name, otp, expiresIn }): TemplateResult => {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Verify your email</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">Hi ${name}, use the code below to verify your email address.</p>
    <div style="background:#f4f4f5;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
      <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#18181b;font-family:monospace;">${otp}</span>
    </div>
    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
      This code expires in <strong>${expiresIn}</strong>. Do not share it with anyone.
    </p>
  `;

  return {
    subject: `${otp} is your MTAC verification code`,
    html: baseLayout({
      title: "Verify your email — MTAC",
      preheader: `Your verification code is ${otp}. Expires in ${expiresIn}.`,
      content,
    }),
  };
};
