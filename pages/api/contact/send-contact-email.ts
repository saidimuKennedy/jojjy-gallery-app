import type { NextApiRequest, NextApiResponse } from "next";
import { escapeHtml, sendEmail } from "@/lib/email/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { name, email, subject, message } = req.body ?? {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const recipient = process.env.CONTACT_FORM_RECIPIENT_EMAIL;
  if (!recipient) {
    console.error("CONTACT_FORM_RECIPIENT_EMAIL is not set");
    return res.status(500).json({
      message: "Failed to send message. Please try again later.",
    });
  }

  const safeName = escapeHtml(String(name));
  const safeEmail = escapeHtml(String(email));
  const safeSubject = escapeHtml(String(subject));
  const safeMessage = escapeHtml(String(message));

  try {
    const result = await sendEmail({
      to: recipient,
      replyTo: String(email),
      subject: `New Contact Message from ${String(name)}: ${String(subject)}`,
      html: `
        <p>You have received a new message from your contact form.</p>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${safeMessage}</p>
        <hr/>
        <p>This message was sent from your website's contact form.</p>
      `,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
    });

    if (result.skipped) {
      return res.status(500).json({
        message: "Email is not configured. Please try again later.",
      });
    }

    if (!result.ok) {
      return res.status(500).json({
        message: "Failed to send message. Please try again later.",
      });
    }

    return res.status(200).json({ message: "Message sent successfully!" });
  } catch (error: unknown) {
    console.error("Error sending contact email:", error);
    return res.status(500).json({
      message: "Failed to send message. Please try again later.",
    });
  }
}
