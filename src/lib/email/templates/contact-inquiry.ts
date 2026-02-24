interface ContactInquiryProps {
  name: string;
  email: string;
  message: string;
}

export function contactInquiryHtml({ name, email, message }: ContactInquiryProps): string {
  const escapedMessage = message.replaceAll("\n", "<br />");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Inquiry</title>
</head>
<body style="margin:0;padding:0;background-color:#faf5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0891b2, #0e7490);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">EventTara</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">New Contact Inquiry</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#2D5A3D;margin:0 0 8px;font-size:20px;">New Message Received</h2>
              <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.5;">
                Someone reached out through the contact form.
              </p>
              <!-- Sender details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4ef;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;color:#666;font-size:14px;">
                      <span style="color:#0891b2;font-weight:600;">From:</span> ${name}
                    </p>
                    <p style="margin:0;color:#666;font-size:14px;">
                      <span style="color:#0891b2;font-weight:600;">Email:</span> ${email}
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4ef;border-radius:8px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;color:#0891b2;font-size:14px;font-weight:600;">Message:</p>
                    <p style="margin:0;color:#333;font-size:15px;line-height:1.6;">${escapedMessage}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f4ef;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:12px;margin:0;">
                This email was sent from the EventTara contact form. Reply directly to respond to the sender.
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
