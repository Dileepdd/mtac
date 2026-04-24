import { baseLayout } from "./layouts/base.layout.js";
import { ForgotPasswordData, TemplateBuilder, TemplateResult } from "../email.types.js";

export const forgotPasswordTemplate: TemplateBuilder<ForgotPasswordData> = ({
  name,
  resetLink,
  expiresIn,
}): TemplateResult => {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
      Hi ${name}, we received a request to reset your MTAC password.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${resetLink}"
            style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 32px;border-radius:8px;">
            Reset password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 6px;font-size:13px;color:#71717a;">Or paste this link in your browser:</p>
    <p style="margin:0;font-size:12px;color:#71717a;word-break:break-all;">${resetLink}</p>
    <hr style="border:none;border-top:1px solid #f4f4f5;margin:24px 0;" />
    <p style="margin:0;font-size:13px;color:#71717a;">
      This link expires in <strong>${expiresIn}</strong>. If you did not request a reset, ignore this email.
    </p>
  `;

  return {
    subject: "Reset your MTAC password",
    html: baseLayout({
      title: "Reset your password — MTAC",
      preheader: `Reset your MTAC password. Link expires in ${expiresIn}.`,
      content,
    }),
  };
};
