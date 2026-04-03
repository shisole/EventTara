import { emailButton, emailLayout } from "./layout";

export function waitlistConfirmationHtml(): string {
  const content = `
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">&#127881;</div>
      <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:22px;">You're on the list!</h2>
      <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.6;">
        Thanks for signing up for early access! We're building the ultimate platform for outdoor adventure events in the Philippines.
      </p>
      <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.6;">
        We'll notify you as soon as EventTara is ready. In the meantime, feel free to explore what's coming.
      </p>
      ${emailButton("Explore Events", "https://eventtara.com/events")}
    </div>`;

  return emailLayout({
    title: "You're on the Waitlist!",
    content,
    footerText: "You received this email because you joined the EventTara early access waitlist.",
  });
}
