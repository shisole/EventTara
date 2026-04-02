import { emailInfoCard, emailLayout } from "./layout";

interface ContactInquiryProps {
  name: string;
  email: string;
  message: string;
}

export function contactInquiryHtml({ name, email, message }: ContactInquiryProps): string {
  const escapedMessage = message.replaceAll("\n", "<br />");

  const content = `
    <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:20px;">New Message Received</h2>
    <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.5;">
      Someone reached out through the contact form.
    </p>
    ${emailInfoCard(`
      <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;">
        <span style="color:#a3e635;font-weight:600;">From:</span> ${name}
      </p>
      <p style="margin:0;color:#94a3b8;font-size:14px;">
        <span style="color:#a3e635;font-weight:600;">Email:</span> ${email}
      </p>
    `)}
    ${emailInfoCard(`
      <p style="margin:0 0 8px;color:#a3e635;font-size:14px;font-weight:600;">Message:</p>
      <p style="margin:0;color:#f1f5f9;font-size:15px;line-height:1.6;">${escapedMessage}</p>
    `)}`;

  return emailLayout({
    title: "New Contact Inquiry",
    content,
    footerText:
      "This email was sent from the EventTara contact form. Reply directly to respond to the sender.",
  });
}
