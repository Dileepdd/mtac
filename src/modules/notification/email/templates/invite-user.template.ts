import { baseLayout } from "./layouts/base.layout.js";
import { InviteUserData, TemplateBuilder, TemplateResult } from "../email.types.js";

export const inviteUserTemplate: TemplateBuilder<InviteUserData> = ({
  inviterName,
  workspaceName,
  inviteLink,
  expiresIn,
}): TemplateResult => {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">You've been invited</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
      <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on MTAC.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${inviteLink}"
            style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 32px;border-radius:8px;">
            Accept invitation
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 6px;font-size:13px;color:#71717a;">Or paste this link in your browser:</p>
    <p style="margin:0;font-size:12px;color:#71717a;word-break:break-all;">${inviteLink}</p>
    <hr style="border:none;border-top:1px solid #f4f4f5;margin:24px 0;" />
    <p style="margin:0;font-size:13px;color:#71717a;">
      This invitation expires in <strong>${expiresIn}</strong>. If you do not want to join, simply ignore this email.
    </p>
  `;

  return {
    subject: `${inviterName} invited you to ${workspaceName} on MTAC`,
    html: baseLayout({
      title: `Join ${workspaceName} on MTAC`,
      preheader: `${inviterName} invited you to join ${workspaceName} on MTAC. Accept before the invitation expires.`,
      content,
    }),
  };
};
