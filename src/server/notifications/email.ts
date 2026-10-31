import 'server-only';

interface NotificationInput {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export async function sendNotificationEmail(input: NotificationInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) {
    console.warn('[email] RESEND_API_KEY or MAIL_FROM is not configured; notification was not sent.');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject.slice(0, 200),
        text: input.text.slice(0, 20_000),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error(`[email] Provider responded with status ${response.status}.`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[email] Notification failed:', error instanceof Error ? error.message : 'unknown');
    return false;
  }
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<boolean> {
  return sendNotificationEmail({
    to: input.to,
    subject: 'Reset your OVSRCSC admin password',
    text: [
      `Hello ${input.name},`,
      '',
      'A password reset was requested for your OVSRCSC website admin account.',
      'Open this link within one hour to choose a new password:',
      '',
      input.resetUrl,
      '',
      'If you did not request this, you can ignore this email. Your password will not change.',
    ].join('\n'),
  });
}

export async function notifyNewEnquiry(input: {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  type: string;
  locale: string;
}): Promise<void> {
  const to = process.env.ENQUIRY_NOTIFICATION_EMAIL ?? process.env.MAIL_FROM;
  if (!to) return;
  await sendNotificationEmail({
    to,
    replyTo: input.email,
    subject: `Website enquiry: ${input.subject}`,
    text: [
      'A new enquiry was submitted through the website.',
      '',
      `Type: ${input.type}`,
      `Language: ${input.locale}`,
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Phone: ${input.phone || 'Not provided'}`,
      '',
      'Message:',
      input.message,
      '',
      'Sign in to the website admin to view and manage this enquiry.',
    ].join('\n'),
  });
}

export async function notifyNewRegistration(input: {
  eventTitle: string;
  name: string;
  email: string;
  phone: string;
  participants: number;
  notes?: string | null;
}): Promise<void> {
  const to = process.env.ENQUIRY_NOTIFICATION_EMAIL ?? process.env.MAIL_FROM;
  if (!to) return;
  await sendNotificationEmail({
    to,
    replyTo: input.email,
    subject: `Event registration: ${input.eventTitle}`,
    text: [
      'A new event registration was submitted through the website.',
      '',
      `Event: ${input.eventTitle}`,
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Phone: ${input.phone}`,
      `Participants: ${input.participants}`,
      input.notes ? `Notes: ${input.notes}` : '',
      '',
      'Sign in to the website admin to review and confirm this registration.',
    ]
      .filter(Boolean)
      .join('\n'),
  });
}
