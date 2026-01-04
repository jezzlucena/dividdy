import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Create a test account for development
    console.warn('SMTP not configured, emails will not be sent');
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const transport = getTransporter();
  const from = process.env.SMTP_FROM || 'Dividdy <noreply@dividdy.local>';

  try {
    await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.info(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const magicLinkUrl = `${frontendUrl}/auth/verify?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Sign in to Dividdy',
    text: `Click the following link to sign in to Dividdy: ${magicLinkUrl}\n\nThis link will expire in 15 minutes.`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; background-color: #f5f5f5;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 24px;">Sign in to Dividdy</h1>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
              Click the button below to sign in to your Dividdy account. This link will expire in 15 minutes.
            </p>
            <a href="${magicLinkUrl}" style="display: inline-block; background-color: #6366f1; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
              Sign in to Dividdy
            </a>
            <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>
        </body>
      </html>
    `,
  });
}

