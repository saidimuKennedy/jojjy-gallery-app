import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_FORM_RECIPIENT_EMAIL,
      replyTo: email,
      subject: `New Contact Message from ${name}: ${subject}`,
      html: `
        <p>You have received a new message from your contact form.</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
        <hr/>
        <p>This message was sent from your website's contact form.</p>
      `,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
    };


    await transporter.sendMail(mailOptions);

    console.log('Contact email sent successfully!');
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error: any) {
    console.error('Error sending contact email:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again later.', error: error.message });
  }
}
