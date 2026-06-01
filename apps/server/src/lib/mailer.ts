import { SendMailClient } from "zeptomail";

type AuthEmailType = "verifyEmail" | "resetPassword";

interface EmailContent {
  subject: string;
  heading: string;
  intro: string;
  action: string;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required email environment variable: ${name}`);
  }
  return value;
}

function getZeptoMailToken() {
  const token =  process.env.SMTP_PASSWORD;
  if (!token) {
    throw new Error(
      "Missing required email environment variable: ZEPTOMAIL_TOKEN or SMTP_PASSWORD",
    );
  }
  return token;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function contentFor(type: AuthEmailType): EmailContent {
  if (type === "verifyEmail") {
    return {
      subject: "Verify your QuickVoice email",
      heading: "Verify your email",
      intro: "Confirm your email address to finish setting up your QuickVoice account.",
      action: "Verify email",
    };
  }

  return {
    subject: "Reset your QuickVoice password",
    heading: "Reset your password",
    intro: "Use this secure link to reset your QuickVoice password.",
    action: "Reset password",
  };
}

function buildText(content: EmailContent, url: string, fullName: string) {
  return [
    `Hi ${fullName || "there"},`,
    "",
    content.intro,
    "",
    `${content.action}: ${url}`,
  ].join("\n");
}

function buildHtml(content: EmailContent, url: string, fullName: string) {
  const safeName = escapeHtml(fullName || "there");
  const safeUrl = escapeHtml(url);

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <h1 style="margin:0 0 16px;font-size:24px;line-height:32px;">${escapeHtml(content.heading)}</h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:24px;">Hi ${safeName},</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:24px;">${escapeHtml(content.intro)}</p>
                <p style="margin:0 0 24px;">
                  <a href="${safeUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-size:14px;font-weight:700;">${escapeHtml(content.action)}</a>
                </p>
                <p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#4b5563;">If the button does not work, paste this link into your browser:</p>
                <p style="margin:0;font-size:14px;line-height:22px;word-break:break-all;color:#4b5563;">${safeUrl}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function createClient() {
  return new SendMailClient({
    url: process.env.ZEPTOMAIL_URL ?? "zeptomail.zoho.com/",
    token: getZeptoMailToken(),
  });
}

export async function sendEmail(
  type: AuthEmailType,
  email: string,
  url: string,
  fullName: string,
) {
  const content = contentFor(type);
  const fromEmail = requireEnv("FROM_EMAIL");
  const fromName = process.env.FROM_NAME ;

  await createClient().sendMail({
    from: {
      address: fromEmail,
      name: fromName,
    },
    to: [
      {
        email_address: {
          address: email,
          name: fullName,
        },
      },
    ],
    subject: content.subject,
    textbody: buildText(content, url, fullName),
    htmlbody: buildHtml(content, url, fullName),
  });
}
