import { emailButton, emailInfoCard, emailLayout } from "./layout";

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
    : `<div style="width:120px;height:120px;border-radius:16px;background:linear-gradient(135deg,${color},#a3e635);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;border:4px solid ${color};">
        <span style="font-size:48px;">&#127942;</span>
      </div>`;

  const content = `
    <div style="text-align:center;">
      <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:20px;">Welcome, ${userName}!</h2>
      <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.5;">
        Your EventTara account has been created and you just claimed your first badge!
      </p>
      ${badgeImage}
      <h3 style="color:#f1f5f9;margin:0 0 4px;font-size:18px;">${badgeTitle}</h3>
      <p style="color:${color};font-size:12px;font-weight:600;text-transform:uppercase;margin:0 0 4px;">${badgeRarity}</p>
      <p style="color:#64748b;font-size:13px;margin:0 0 8px;">#${serialNumber} of ${batchQuantity}</p>
      ${badgeDescription ? `<p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.5;">${badgeDescription}</p>` : '<div style="margin-bottom:24px;"></div>'}
      ${emailInfoCard(`
        <p style="margin:0 0 4px;color:#f1f5f9;font-size:14px;font-weight:600;">Your Account</p>
        <p style="margin:0;color:#94a3b8;font-size:14px;">Email: <strong style="color:#f1f5f9">${email}</strong></p>
        <p style="margin:4px 0 0;color:#64748b;font-size:12px;">Use this email to log in at eventtara.com</p>
      `)}
      ${emailButton("View Your Achievements", "https://eventtara.com/achievements")}
    </div>`;

  return emailLayout({
    title: "Welcome to EventTara",
    content,
    footerText: "You received this email because an account was created for you on EventTara.",
  });
}
