import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@baspen.kz";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendInviteEmail({
  to,
  name,
  token,
  locale = "ru",
}: {
  to: string;
  name?: string | null;
  token: string;
  locale?: string;
}) {
  const acceptUrl = `${APP_URL}/${locale}/invite/accept?token=${token}`;

  const isRu = locale === "ru";
  const subject = isRu
    ? "Приглашение на платформу Baspen"
    : "You're invited to Baspen";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 8px; color: #111;">${isRu ? "Добро пожаловать в Baspen!" : "Welcome to Baspen!"}</h1>
    <p style="color: #6b7280; margin: 0 0 24px; font-size: 15px;">
      ${isRu
        ? `Вы приглашены как организатор на платформу Baspen.`
        : `You've been invited as an organizer on Baspen.`}
    </p>
    ${name ? `<p style="color: #374151; font-size: 15px;">${isRu ? "Имя:" : "Name:"} <strong>${name}</strong></p>` : ""}
    <p style="color: #374151; font-size: 15px;">Email: <strong>${to}</strong></p>
    <div style="margin: 32px 0;">
      <a href="${acceptUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 15px;">
        ${isRu ? "Принять приглашение" : "Accept Invitation"}
      </a>
    </div>
    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
      ${isRu
        ? "Ссылка действительна 48 часов. Если вы не запрашивали приглашение — проигнорируйте это письмо."
        : "This link expires in 48 hours. If you didn't expect this invitation, please ignore this email."}
    </p>
  </div>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send invite email: ${error.message}`);
  }

  return data;
}
