import { ACTIVITY_TYPE_LABELS } from "@/lib/constants/activity-types";

import { emailButton, emailInfoCard, emailLayout } from "./layout";

interface EventPublishedProps {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventType: string;
  clubName: string;
  eventId: string;
}

export function eventPublishedHtml({
  userName,
  eventTitle,
  eventDate,
  eventLocation,
  eventType,
  clubName,
  eventId,
}: EventPublishedProps): string {
  const typeLabel =
    ACTIVITY_TYPE_LABELS[eventType as keyof typeof ACTIVITY_TYPE_LABELS] || eventType;

  const eventUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com"}/events/${eventId}`;

  const content = `
    <h1 style="color:#f1f5f9;font-size:24px;font-weight:700;margin:0 0 16px;">
      New Event from ${clubName}!
    </h1>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 24px;">
      Hey ${userName}, <strong style="color:#f1f5f9">${clubName}</strong> just published a new event. Check it out!
    </p>
    ${emailInfoCard(`
      <p style="color:#f1f5f9;font-size:18px;font-weight:600;margin:0 0 12px;">${eventTitle}</p>
      <p style="margin:0 0 8px;">
        <span style="color:#a3e635;font-weight:600;">Type:</span>
        <span style="color:#94a3b8;"> ${typeLabel}</span>
      </p>
      <p style="margin:0 0 8px;">
        <span style="color:#a3e635;font-weight:600;">Date:</span>
        <span style="color:#94a3b8;"> ${eventDate}</span>
      </p>
      <p style="margin:0;">
        <span style="color:#a3e635;font-weight:600;">Location:</span>
        <span style="color:#94a3b8;"> ${eventLocation}</span>
      </p>
    `)}
    <div style="text-align:center;margin:32px 0 0;">
      ${emailButton("View Event", eventUrl)}
    </div>
  `;

  return emailLayout({
    title: `New Event from ${clubName}!`,
    content,
    footerText: `You received this email because you are a member of ${clubName} on EventTara.`,
  });
}
