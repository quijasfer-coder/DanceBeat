/**
 * Envío de correo transaccional vía la API REST de Brevo (antes Sendinblue).
 * No usamos su SDK — un solo endpoint con fetch es suficiente.
 *
 * Requiere BREVO_API_KEY y EMAIL_FROM_ADDRESS en el entorno. Si faltan,
 * `sendEmail` no lanza — solo loguea y regresa un error, para que un
 * correo no configurado nunca tumbe el flujo (ej. dar de alta un
 * coreógrafo) que lo dispara.
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

type EmailRecipient = { email: string; name?: string };

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: EmailRecipient;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM_ADDRESS;
  const fromName = process.env.EMAIL_FROM_NAME || "Dance Beat Academy";

  if (!apiKey || !fromEmail) {
    console.warn(
      `[email] BREVO_API_KEY o EMAIL_FROM_ADDRESS no configurados — no se envió "${subject}" a ${to.email}.`,
    );
    return { error: "email_not_configured" };
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [to],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Brevo respondió ${res.status} al enviar "${subject}":`, body);
      return { error: `brevo_error_${res.status}` };
    }

    return {};
  } catch (err) {
    console.error(`[email] Error de red al enviar "${subject}":`, err);
    return { error: "network_error" };
  }
}

const brandHtmlWrapper = (bodyHtml: string) => `
<div style="background:#000000;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#0a0a0a;border:1px solid #3a3737;border-radius:16px;padding:36px 32px;">
    <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#a8a8a8;margin:0 0 24px;">
      Dance Beat Academy
    </p>
    ${bodyHtml}
  </div>
</div>
`;

/**
 * Correo que le llega a alguien cuando queda vinculado como profesor/a
 * (rol `teacher`) — ya sea al darlo de alta con un email que ya tenía
 * cuenta, o al vincular su cuenta después.
 */
export async function sendTeacherWelcomeEmail(to: {
  email: string;
  name: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dancebeatacademy.com";
  const loginUrl = `${siteUrl}/profesor`;
  const subject = "Ya eres profesor/a en Dance Beat Academy";

  const html = brandHtmlWrapper(`
    <h1 style="font-size:24px;color:#ffffff;margin:0 0 16px;font-weight:600;">
      ¡Hola, ${to.name}!
    </h1>
    <p style="font-size:15px;line-height:1.6;color:#e5e5e5;margin:0 0 16px;">
      Te acabamos de dar de alta como profesor/a en <strong>Dance Beat Academy</strong>.
      Ya puedes entrar a tu panel para ver tus clases, generar tus sesiones y tomar
      lista de tus alumnas.
    </p>
    <a href="${loginUrl}" style="display:inline-block;background:#b8a4ff;color:#000000;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:100px;margin:8px 0 20px;">
      Entrar a mi panel
    </a>
    <p style="font-size:13px;line-height:1.6;color:#a8a8a8;margin:0;">
      Si no reconoces esta cuenta o crees que es un error, contáctanos.
    </p>
  `);

  const text = `¡Hola, ${to.name}!

Te acabamos de dar de alta como profesor/a en Dance Beat Academy. Ya puedes entrar a tu panel: ${loginUrl}

Si no reconoces esta cuenta o crees que es un error, contáctanos.`;

  return sendEmail({ to: { email: to.email, name: to.name }, subject, html, text });
}
