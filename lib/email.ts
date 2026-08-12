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

/**
 * Envoltura de marca para correos — replica la paleta "Lumen" del sitio
 * (ink negro, acento lila, tipografía editorial) con HTML de tablas para
 * que se vea consistente entre clientes de correo (Gmail, Outlook, Apple
 * Mail), que no soportan CSS moderno de forma confiable.
 */
const brandHtmlWrapper = ({
  eyebrow,
  bodyHtml,
}: {
  eyebrow: string;
  bodyHtml: string;
}) => `
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#000000;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
      <tr>
        <td align="center" style="padding:48px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

            <!-- Wordmark -->
            <tr>
              <td style="padding:0 4px 28px;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#ffffff;">
                  Dance<span style="color:#b8a4ff;font-style:italic;">Beat</span>
                </span>
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td bgcolor="#0a0a0a" style="background-color:#0a0a0a;border:1px solid #3a3737;border-radius:20px;padding:40px 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:18px;">
                      <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#b8a4ff;font-weight:600;">
                        ${eyebrow}
                      </span>
                    </td>
                  </tr>
                  <tr><td>${bodyHtml}</td></tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:24px 4px 0;">
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;line-height:1.6;color:#5c5757;">
                  Dance Beat Academy · Av. Stim &amp; Cumbres International School
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const ctaButton = (href: string, label: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 4px;">
    <tr>
      <td bgcolor="#b8a4ff" style="background-color:#b8a4ff;border-radius:100px;">
        <a href="${href}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:600;color:#000000;text-decoration:none;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dancebeat.studio";
  const loginUrl = `${siteUrl}/profesor`;
  const subject = "Ya eres profesor/a en Dance Beat Academy";
  const firstName = to.name.trim().split(/\s+/)[0] || to.name;

  const html = brandHtmlWrapper({
    eyebrow: "Bienvenida al equipo",
    bodyHtml: `
      <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;color:#ffffff;font-weight:400;">
        ¡Hola, ${firstName}!<br/>Ya eres profesora en Dance&nbsp;Beat.
      </h1>
      <p style="margin:0 0 26px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.65;color:#c9c9c9;">
        Te acabamos de dar de alta como profesora en Dance Beat Academy. Desde tu
        panel puedes ver tus clases asignadas, generar las sesiones de la semana
        y tomar lista de tus alumnas.
      </p>
      ${ctaButton(loginUrl, "Entrar a mi panel →")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px;">
        <tr><td style="border-top:1px solid #2a2727;font-size:1px;line-height:1px;">&nbsp;</td></tr>
      </table>
      <p style="margin:22px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12.5px;line-height:1.6;color:#8a8a8a;">
        Si no reconoces esta cuenta o crees que es un error, contáctanos y lo revisamos.
      </p>
    `,
  });

  const text = `¡Hola, ${firstName}!

Ya eres profesora en Dance Beat Academy. Entra a tu panel: ${loginUrl}

Si no reconoces esta cuenta o crees que es un error, contáctanos.`;

  return sendEmail({ to: { email: to.email, name: to.name }, subject, html, text });
}
