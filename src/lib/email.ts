import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@baspen.kz";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// --- Shared layout ---
function emailLayout(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    ${content}
  </div>
  <p style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">Baspen &copy; ${new Date().getFullYear()}</p>
</body>
</html>`;
}

function buttonHtml(href: string, label: string) {
  return `<div style="margin: 32px 0;">
    <a href="${href}" style="display: inline-block; background: #111; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 15px;">
      ${label}
    </a>
  </div>`;
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
  return data;
}

// ==========================================
// Invite Email
// ==========================================

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

  const isRu = locale === "ru" || locale === "kz";
  const subject = isRu
    ? "Приглашение на платформу Baspen"
    : "You're invited to Baspen";

  const html = emailLayout(`
    <h1 style="font-size: 24px; margin: 0 0 8px; color: #111;">${isRu ? "Добро пожаловать в Baspen!" : "Welcome to Baspen!"}</h1>
    <p style="color: #6b7280; margin: 0 0 24px; font-size: 15px;">
      ${isRu
        ? `Вы приглашены как организатор на платформу Baspen.`
        : `You've been invited as an organizer on Baspen.`}
    </p>
    ${name ? `<p style="color: #374151; font-size: 15px;">${isRu ? "Имя:" : "Name:"} <strong>${name}</strong></p>` : ""}
    <p style="color: #374151; font-size: 15px;">Email: <strong>${to}</strong></p>
    ${buttonHtml(acceptUrl, isRu ? "Принять приглашение" : "Accept Invitation")}
    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
      ${isRu
        ? "Ссылка действительна 48 часов. Если вы не запрашивали приглашение — проигнорируйте это письмо."
        : "This link expires in 48 hours. If you didn't expect this invitation, please ignore this email."}
    </p>
  `);

  return sendEmail({ to, subject, html });
}

// ==========================================
// Password Reset Email
// ==========================================

export async function sendPasswordResetEmail({
  to,
  token,
  locale = "ru",
}: {
  to: string;
  token: string;
  locale?: string;
}) {
  const resetUrl = `${APP_URL}/${locale}/reset-password/confirm?token=${token}`;

  const isRu = locale === "ru" || locale === "kz";
  const subject = isRu ? "Сброс пароля — Baspen" : "Password Reset — Baspen";

  const html = emailLayout(`
    <h1 style="font-size: 24px; margin: 0 0 8px; color: #111;">${isRu ? "Сброс пароля" : "Password Reset"}</h1>
    <p style="color: #6b7280; margin: 0 0 24px; font-size: 15px;">
      ${isRu
        ? "Мы получили запрос на сброс пароля вашей учётной записи. Нажмите кнопку ниже, чтобы установить новый пароль."
        : "We received a request to reset your account password. Click the button below to set a new password."}
    </p>
    ${buttonHtml(resetUrl, isRu ? "Сбросить пароль" : "Reset Password")}
    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
      ${isRu
        ? "Ссылка действительна 1 час. Если вы не запрашивали сброс пароля — проигнорируйте это письмо."
        : "This link expires in 1 hour. If you didn't request a password reset, please ignore this email."}
    </p>
  `);

  return sendEmail({ to, subject, html });
}

// ==========================================
// Order Confirmation Email (after payment)
// ==========================================

export async function sendOrderConfirmationEmail({
  to,
  orderId,
  totalAmount,
  currency,
  photoCount,
  downloadToken,
  eventTitle,
  locale = "ru",
}: {
  to: string;
  orderId: string;
  totalAmount: number;
  currency: string;
  photoCount: number;
  downloadToken: string;
  eventTitle?: string;
  locale?: string;
}) {
  const downloadUrl = `${APP_URL}/download?token=${downloadToken}`;
  const isRu = locale === "ru" || locale === "kz";

  const subject = isRu
    ? `Заказ оплачен — Baspen`
    : `Order Confirmed — Baspen`;

  const formattedAmount = new Intl.NumberFormat(isRu ? "ru-RU" : "en-US").format(totalAmount);

  const html = emailLayout(`
    <h1 style="font-size: 24px; margin: 0 0 8px; color: #111;">${isRu ? "Заказ оплачен!" : "Order Confirmed!"}</h1>
    <p style="color: #6b7280; margin: 0 0 24px; font-size: 15px;">
      ${isRu ? "Спасибо за покупку. Ваши фотографии готовы к скачиванию." : "Thank you for your purchase. Your photos are ready to download."}
    </p>
    ${eventTitle ? `<p style="color: #374151; font-size: 15px;">${isRu ? "Мероприятие:" : "Event:"} <strong>${eventTitle}</strong></p>` : ""}
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${isRu ? "Номер заказа" : "Order ID"}</td>
        <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #111;">${orderId.slice(0, 8).toUpperCase()}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${isRu ? "Фотографий" : "Photos"}</td>
        <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #111;">${photoCount}</td>
      </tr>
      <tr style="border-top: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; color: #111; font-size: 16px; font-weight: 600;">${isRu ? "Итого" : "Total"}</td>
        <td style="padding: 12px 0; text-align: right; font-size: 16px; font-weight: 600; color: #111;">${formattedAmount} ${currency}</td>
      </tr>
    </table>
    ${buttonHtml(downloadUrl, isRu ? "Скачать фотографии" : "Download Photos")}
    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
      ${isRu
        ? "Ссылка для скачивания действительна 7 дней."
        : "The download link is valid for 7 days."}
    </p>
  `);

  return sendEmail({ to, subject, html });
}

// ==========================================
// Payment Failed Email
// ==========================================

export async function sendPaymentFailedEmail({
  to,
  orderId,
  totalAmount,
  currency,
  eventTitle,
  locale = "ru",
}: {
  to: string;
  orderId: string;
  totalAmount: number;
  currency: string;
  eventTitle?: string;
  locale?: string;
}) {
  const isRu = locale === "ru" || locale === "kz";
  const subject = isRu ? "Ошибка оплаты — Baspen" : "Payment Failed — Baspen";

  const formattedAmount = new Intl.NumberFormat(isRu ? "ru-RU" : "en-US").format(totalAmount);

  const html = emailLayout(`
    <h1 style="font-size: 24px; margin: 0 0 8px; color: #111;">${isRu ? "Оплата не прошла" : "Payment Failed"}</h1>
    <p style="color: #6b7280; margin: 0 0 24px; font-size: 15px;">
      ${isRu
        ? "К сожалению, не удалось обработать оплату вашего заказа."
        : "Unfortunately, we were unable to process the payment for your order."}
    </p>
    ${eventTitle ? `<p style="color: #374151; font-size: 15px;">${isRu ? "Мероприятие:" : "Event:"} <strong>${eventTitle}</strong></p>` : ""}
    <p style="color: #374151; font-size: 15px;">
      ${isRu ? "Заказ:" : "Order:"} <strong>${orderId.slice(0, 8).toUpperCase()}</strong> &mdash; ${formattedAmount} ${currency}
    </p>
    <p style="color: #6b7280; font-size: 14px; margin: 24px 0;">
      ${isRu
        ? "Пожалуйста, попробуйте ещё раз или используйте другой способ оплаты."
        : "Please try again or use a different payment method."}
    </p>
  `);

  return sendEmail({ to, subject, html });
}

// ==========================================
// Refund Email
// ==========================================

export async function sendRefundEmail({
  to,
  orderId,
  totalAmount,
  currency,
  locale = "ru",
}: {
  to: string;
  orderId: string;
  totalAmount: number;
  currency: string;
  locale?: string;
}) {
  const isRu = locale === "ru" || locale === "kz";
  const subject = isRu ? "Возврат средств — Baspen" : "Refund Processed — Baspen";

  const formattedAmount = new Intl.NumberFormat(isRu ? "ru-RU" : "en-US").format(totalAmount);

  const html = emailLayout(`
    <h1 style="font-size: 24px; margin: 0 0 8px; color: #111;">${isRu ? "Возврат средств" : "Refund Processed"}</h1>
    <p style="color: #6b7280; margin: 0 0 24px; font-size: 15px;">
      ${isRu
        ? `Средства в размере <strong>${formattedAmount} ${currency}</strong> по заказу <strong>${orderId.slice(0, 8).toUpperCase()}</strong> были возвращены.`
        : `A refund of <strong>${formattedAmount} ${currency}</strong> for order <strong>${orderId.slice(0, 8).toUpperCase()}</strong> has been processed.`}
    </p>
    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
      ${isRu
        ? "Средства поступят на ваш счёт в течение 3–5 рабочих дней."
        : "The funds will be returned to your account within 3-5 business days."}
    </p>
  `);

  return sendEmail({ to, subject, html });
}
