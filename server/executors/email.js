import nodemailer from 'nodemailer';

export async function executeEmail(config) {
  const { to, subject, body } = config;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return {
      success: false,
      output: null,
      error: 'SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env',
    };
  }

  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text: body,
  });

  return {
    success: true,
    output: `Email sent to ${to} (messageId: ${info.messageId})`,
    error: null,
  };
}
