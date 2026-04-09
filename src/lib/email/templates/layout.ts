interface EmailLayoutProps {
  title: string;
  content: string;
  footerText: string;
}

/**
 * Shared dark-theme email layout wrapper.
 *
 * Design tokens (inline for email client compatibility):
 *  - Outer bg: #0b1120
 *  - Card bg: #111827
 *  - Card border: #1e293b
 *  - Brand green: #a3e635
 *  - Primary text: #f1f5f9
 *  - Secondary text: #94a3b8
 *  - Muted text: #64748b
 *  - Info card bg: #1e293b
 *  - CTA bg: #a3e635, CTA text: #0b1120
 */
export function emailLayout({ title, content, footerText }: EmailLayoutProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b1120;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111827;border-radius:16px;overflow:hidden;border:1px solid #1e293b;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;">
              <h1 style="color:#a3e635;margin:0;font-size:28px;font-weight:700;font-style:italic;">EventTara</h1>
            </td>
          </tr>
          <!-- Separator -->
          <tr>
            <td style="padding:0 32px;">
              <div style="border-top:1px solid #1e293b;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer separator -->
          <tr>
            <td style="padding:0 32px;">
              <div style="border-top:1px solid #1e293b;"></div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="color:#64748b;font-size:12px;margin:0;">
                ${footerText}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Dark-themed CTA button */
export function emailButton(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" align="center"><tr>
  <td style="background-color:#a3e635;border-radius:8px;">
    <a href="${href}" style="display:inline-block;padding:14px 32px;color:#0b1120;text-decoration:none;font-size:15px;font-weight:600;">
      ${text}
    </a>
  </td>
</tr></table>`;
}

/** Dark-themed info card (replaces the old #f8f4ef cards) */
export function emailInfoCard(innerHtml: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:24px;">
  <tr>
    <td style="padding:20px;">
      ${innerHtml}
    </td>
  </tr>
</table>`;
}
