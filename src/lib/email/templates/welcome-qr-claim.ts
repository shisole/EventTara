interface WelcomeQrClaimProps {
  userName: string;
  email: string;
  badgeTitle: string;
  badgeDescription: string | null;
  badgeImageUrl: string | null;
  badgeRarity: string;
  serialNumber: number;
  batchQuantity: number;
}

export function welcomeQrClaimHtml({
  userName,
  email,
  badgeTitle,
  badgeDescription,
  badgeImageUrl,
  badgeRarity,
  serialNumber,
  batchQuantity,
}: WelcomeQrClaimProps): string {
  const rarityColor: Record<string, string> = {
    common: "#6B7280",
    rare: "#3B82F6",
    epic: "#8B5CF6",
    legendary: "#F59E0B",
  };

  const color = rarityColor[badgeRarity] ?? rarityColor.common;

  const badgeImage = badgeImageUrl
    ? `<img src="${badgeImageUrl}" alt="${badgeTitle}" width="120" height="120" style="border-radius:16px;border:4px solid ${color};margin-bottom:16px;" />`
    : `<div style="width:120px;height:120px;border-radius:16px;background:linear-gradient(135deg,${color},#0891b2);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;border:4px solid ${color};">
        <span style="font-size:48px;">&#127942;</span>
      </div>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to EventTara</title>
</head>
<body style="margin:0;padding:0;background-color:#faf5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0891b2,#2D5A3D);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">EventTara</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Welcome Aboard!</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;text-align:center;">
              <h2 style="color:#2D5A3D;margin:0 0 8px;font-size:20px;">Welcome, ${userName}!</h2>
              <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.5;">
                Your EventTara account has been created and you just claimed your first badge!
              </p>
              <!-- Badge display -->
              ${badgeImage}
              <h3 style="color:#333;margin:0 0 4px;font-size:18px;">${badgeTitle}</h3>
              <p style="color:${color};font-size:12px;font-weight:600;text-transform:uppercase;margin:0 0 4px;">${badgeRarity}</p>
              <p style="color:#888;font-size:13px;margin:0 0 8px;">#${serialNumber} of ${batchQuantity}</p>
              ${badgeDescription ? `<p style="color:#666;font-size:14px;margin:0 0 24px;line-height:1.5;">${badgeDescription}</p>` : '<div style="margin-bottom:24px;"></div>'}
              <!-- Account info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4ef;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 4px;color:#333;font-size:14px;font-weight:600;">Your Account</p>
                    <p style="margin:0;color:#666;font-size:14px;">Email: <strong>${email}</strong></p>
                    <p style="margin:4px 0 0;color:#888;font-size:12px;">Use this email to log in at eventtara.com</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <a href="https://eventtara.com/achievements" style="display:inline-block;background-color:#2D5A3D;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                View Your Achievements
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f4ef;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:12px;margin:0;">
                You received this email because an account was created for you on EventTara.
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
