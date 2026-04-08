import { type ActivityType, ACTIVITY_TYPE_LABELS } from "@/lib/constants/activity-types";

import { emailButton, emailInfoCard, emailLayout } from "./layout";

interface UpcomingEventBlastProps {
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventType: string;
  difficulty: number | null;
  price: number;
  coverImageUrl: string | null;
  spotsRemaining: number;
  maxParticipants: number;
  eventId: string;
  userId: string;
  headline?: string;
  subtext?: string;
  customMessage?: string;
}

const HYPE_HEADLINES: Record<string, { headline: string; subtext: string }> = {
  hiking: {
    headline: "The Mountain is Calling!",
    subtext: "Lace up your boots — an epic climb awaits.",
  },
  trail_run: {
    headline: "Hit the Trails!",
    subtext: "The trail is set, the clock is ticking — are you ready?",
  },
  mtb: {
    headline: "Ride the Wild!",
    subtext: "Dust, dirt, and pure adrenaline await you on the trail.",
  },
  road_bike: {
    headline: "Roll Out!",
    subtext: "The road ahead is yours — gear up and ride.",
  },
  running: {
    headline: "Run the Distance!",
    subtext: "The start line is set — all you have to do is show up.",
  },
};

const DEFAULT_HYPE = {
  headline: "Adventure Awaits!",
  subtext: "A new event is coming — don't miss your chance.",
};

function escapeHtml(str: string): string {
  return str
    .replaceAll('&', "&amp;")
    .replaceAll('<', "&lt;")
    .replaceAll('>', "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll('\'', "&#39;");
}

function difficultyStars(level: number | null): string {
  if (!level) return "";
  const clamped = Math.max(0, Math.min(5, level));
  const filled = "&#9733;".repeat(clamped);
  const empty = "&#9734;".repeat(5 - clamped);
  return `
    <p style="margin:0 0 8px;">
      <span style="color:#a3e635;font-weight:600;">Difficulty:</span>
      <span style="color:#facc15;font-size:16px;letter-spacing:2px;"> ${filled}</span><span style="color:#64748b;font-size:16px;letter-spacing:2px;">${empty}</span>
    </p>
  `;
}

export function upcomingEventBlastHtml({
  eventTitle,
  eventDate,
  eventLocation,
  eventType,
  difficulty,
  price,
  coverImageUrl,
  spotsRemaining,
  maxParticipants,
  eventId,
  userId,
  headline,
  subtext,
  customMessage,
}: UpcomingEventBlastProps): string {
  const typeLabel = ACTIVITY_TYPE_LABELS[eventType as ActivityType] || eventType;
  const defaultHype = HYPE_HEADLINES[eventType] || DEFAULT_HYPE;
  const hype = {
    headline: headline?.trim() || defaultHype.headline,
    subtext: subtext?.trim() || defaultHype.subtext,
  };
  const customMessageHtml = customMessage?.trim()
    ? `<p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px;white-space:pre-wrap;">${escapeHtml(customMessage.trim())}</p>`
    : "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com";
  const eventUrl = `${siteUrl}/events/${eventId}`;
  const unsubscribeUrl = `${siteUrl}/unsubscribe?uid=${userId}`;
  const priceText = price > 0 ? `PHP ${price.toLocaleString()}` : "FREE";

  const heroSection = coverImageUrl
    ? `<img src="${coverImageUrl}" alt="${eventTitle}" style="width:100%;max-height:260px;object-fit:cover;display:block;" />`
    : `<div style="width:100%;height:180px;background:linear-gradient(135deg,#065f46,#0d9488,#a3e635);"></div>`;

  const urgencyText =
    spotsRemaining <= 10
      ? `<p style="color:#f87171;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 24px;text-align:center;">
           Only ${spotsRemaining} of ${maxParticipants} spots left — book now!
         </p>`
      : `<p style="color:#facc15;font-size:14px;font-weight:600;margin:0 0 24px;text-align:center;">
           ${spotsRemaining} of ${maxParticipants} spots available
         </p>`;

  const content = `
    ${heroSection}
    <div style="padding:8px 0 0;">
      <h1 style="color:#a3e635;font-size:26px;font-weight:800;margin:24px 0 4px;text-align:center;">
        ${hype.headline}
      </h1>
      <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;text-align:center;">
        ${hype.subtext}
      </p>

      ${customMessageHtml}

      ${emailInfoCard(`
        <p style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 16px;">${eventTitle}</p>
        <p style="margin:0 0 8px;">
          <span style="color:#a3e635;font-weight:600;">Type:</span>
          <span style="color:#94a3b8;"> ${typeLabel}</span>
        </p>
        <p style="margin:0 0 8px;">
          <span style="color:#a3e635;font-weight:600;">Date:</span>
          <span style="color:#f1f5f9;font-weight:600;"> ${eventDate}</span>
        </p>
        <p style="margin:0 0 8px;">
          <span style="color:#a3e635;font-weight:600;">Location:</span>
          <span style="color:#94a3b8;"> ${eventLocation}</span>
        </p>
        ${difficultyStars(difficulty)}
        <p style="margin:0;">
          <span style="color:#a3e635;font-weight:600;">Price:</span>
          <span style="color:#f1f5f9;font-weight:600;"> ${priceText}</span>
        </p>
      `)}

      ${urgencyText}

      <div style="text-align:center;margin:8px 0 0;">
        ${emailButton("Secure Your Spot", eventUrl)}
      </div>
    </div>
  `;

  return emailLayout({
    title: hype.headline,
    content,
    footerText: `You received this email because you have an account on EventTara. <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> from marketing emails.`,
  });
}
