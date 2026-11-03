/**
 * Correos transaccionales del acceso: verificación de correo y restablecimiento
 * de contraseña.
 *
 * Funciones puras (texto → texto), sin dependencias de Nest, para que cada alta
 * y la recuperación hablen con la misma voz y el mismo diseño. El HTML usa
 * tablas y estilos en línea porque los clientes de correo (Gmail, Outlook,
 * Apple Mail) no respetan hojas de estilo ni `flex`/`grid`; los colores son los
 * de la marca (petróleo y aqua). Siempre acompaña una versión de texto plano.
 */

/** Un correo listo para encolar. */
export interface AccessEmail {
  readonly subject: string;
  readonly bodyText: string;
  readonly bodyHtml: string;
}

/** Quién se está dando de alta: cambia el asunto y el párrafo final. */
export type VerificationVariant =
  | 'account'
  | 'practitioner'
  | 'organization'
  | 'resend';

interface VerificationCopy {
  readonly subject: string;
  readonly title: string;
  readonly intro: string;
  /** Párrafo de cierre (qué pasa después / si no fue usted). */
  readonly outro: string;
}

const VERIFICATION_COPY: Readonly<Record<VerificationVariant, VerificationCopy>> =
  {
    account: {
      subject: 'Verifique su correo en AloVida',
      title: 'Confirme su correo',
      intro:
        'Gracias por crear su cuenta en AloVida. Confirme que esta dirección es suya para proteger su información de salud y recibir avisos importantes.',
      outro: 'Si usted no creó esta cuenta, ignore este mensaje.',
    },
    practitioner: {
      subject: 'Verifique su correo profesional en AloVida',
      title: 'Confirme su correo profesional',
      intro:
        'Su matrícula quedó registrada y está pendiente de verificación por parte de la plataforma. Confirme esta dirección para que podamos contactarle durante el proceso.',
      outro: 'Si usted no inició este registro, ignore este mensaje.',
    },
    organization: {
      subject: 'Verifique el correo de su organización en AloVida',
      title: 'Confirme el correo de su organización',
      intro:
        'Su organización quedó registrada y está pendiente de verificación por parte de la plataforma. Confirme esta dirección para continuar con el alta.',
      outro: 'Si usted no inició este registro, ignore este mensaje.',
    },
    resend: {
      subject: 'Su nuevo enlace para verificar el correo en AloVida',
      title: 'Aquí está su nuevo enlace',
      intro:
        'Pidió un enlace nuevo para confirmar su correo. El anterior ya no sirve.',
      outro: 'Si usted no lo pidió, ignore este mensaje.',
    },
  };

const BRAND = {
  petrol900: '#0A1C27',
  petrol700: '#0B3953',
  petrol500: '#0B557E',
  petrol50: '#D9E5EB',
  aqua400: '#70C1B9',
  ink: '#1B2A33',
  muted: '#5B6B75',
  paper: '#F3F6F8',
  card: '#FFFFFF',
} as const;

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Escapa texto que se inserta dentro de HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Enlace al frontend con el token por query string (`/auth/verify-email?token=`
 * y `/auth/reset-password?token=` son las rutas que ya pinta la web).
 *
 * Devuelve `undefined` sin base pública configurada o si apunta a la máquina
 * local: un botón que lleva a `localhost` en el teléfono de otra persona sólo
 * confunde, y el código del correo sigue sirviendo.
 */
export function buildWebLink(
  path: string,
  token: string,
  baseUrl: string | undefined = process.env.WEB_APP_BASE_URL,
): string | undefined {
  const base = baseUrl?.trim().replace(/\/+$/, '');
  if (!base || !/^https?:\/\//i.test(base)) return undefined;
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(base)) {
    return undefined;
  }
  return `${base}${path}?token=${encodeURIComponent(token)}`;
}

interface LayoutInput {
  readonly preheader: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly buttonLabel?: string;
  readonly buttonUrl?: string;
  readonly codeLabel: string;
  readonly code: string;
  readonly footnote: string;
  readonly validity: string;
}

function renderLayout(input: LayoutInput): string {
  const paragraphs = input.paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 16px 0;font-family:${FONT};font-size:16px;line-height:24px;color:${BRAND.ink};">${escapeHtml(text)}</p>`,
    )
    .join('');

  const button =
    input.buttonUrl && input.buttonLabel
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 28px auto;">
          <tr>
            <td align="center" bgcolor="${BRAND.petrol500}" style="border-radius:12px;">
              <a href="${escapeHtml(input.buttonUrl)}" target="_blank" rel="noopener" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:16px;font-weight:700;line-height:20px;color:#FFFFFF;text-decoration:none;border-radius:12px;background-color:${BRAND.petrol500};">${escapeHtml(input.buttonLabel)}</a>
            </td>
          </tr>
        </table>`
      : '';

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(input.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.paper}" style="background-color:${BRAND.paper};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
        <tr>
          <td bgcolor="${BRAND.petrol900}" style="background-color:${BRAND.petrol900};border-radius:20px 20px 0 0;padding:28px 36px 24px 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-family:${FONT};font-size:26px;line-height:30px;font-weight:800;letter-spacing:-0.4px;color:#FFFFFF;">Alo<span style="color:${BRAND.aqua400};">Vida</span></td>
              </tr>
              <tr>
                <td style="padding-top:14px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr><td height="3" bgcolor="${BRAND.aqua400}" style="height:3px;line-height:3px;font-size:0;width:56px;background-color:${BRAND.aqua400};border-radius:2px;">&nbsp;</td><td>&nbsp;</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td bgcolor="${BRAND.card}" style="background-color:${BRAND.card};padding:36px 36px 8px 36px;">
            <h1 style="margin:0 0 18px 0;font-family:${FONT};font-size:26px;line-height:32px;font-weight:800;letter-spacing:-0.4px;color:${BRAND.petrol700};">${escapeHtml(input.title)}</h1>
            ${paragraphs}
            ${button}
          </td>
        </tr>
        <tr>
          <td bgcolor="${BRAND.card}" style="background-color:${BRAND.card};padding:0 36px 8px 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BRAND.petrol50}" style="background-color:${BRAND.petrol50};border-radius:14px;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0 0 8px 0;font-family:${FONT};font-size:12px;line-height:16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BRAND.petrol500};">${escapeHtml(input.codeLabel)}</p>
                  <p style="margin:0;font-family:'SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace;font-size:15px;line-height:22px;color:${BRAND.petrol900};word-break:break-all;word-wrap:break-word;">${escapeHtml(input.code)}</p>
                </td>
              </tr>
            </table>
            <p style="margin:14px 0 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${BRAND.muted};">${escapeHtml(input.validity)}</p>
          </td>
        </tr>
        <tr>
          <td bgcolor="${BRAND.card}" style="background-color:${BRAND.card};padding:20px 36px 36px 36px;border-radius:0 0 20px 20px;">
            <p style="margin:0;font-family:${FONT};font-size:14px;line-height:22px;color:${BRAND.muted};">${escapeHtml(input.footnote)}</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 12px 0 12px;font-family:${FONT};font-size:12px;line-height:18px;color:${BRAND.muted};">
            Este mensaje se envió automáticamente desde AloVida. Por favor no responda a este correo.<br>
            Nunca le pediremos su contraseña por correo.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * Correo de verificación de correo electrónico (vigencia: 24 horas).
 *
 * @param input.token - Token en claro; sólo viaja dentro del correo.
 * @param input.variant - Quién se registró (cambia asunto y textos).
 * @param input.webBaseUrl - Base pública del frontend (por defecto, `WEB_APP_BASE_URL`).
 */
export function verificationEmail(input: {
  readonly token: string;
  readonly variant?: VerificationVariant;
  readonly webBaseUrl?: string;
}): AccessEmail {
  const copy = VERIFICATION_COPY[input.variant ?? 'account'];
  const link = buildWebLink('/auth/verify-email', input.token, input.webBaseUrl);
  const validity = 'El código y el enlace caducan en 24 horas.';

  const bodyText = [
    copy.title,
    '',
    copy.intro,
    '',
    link ? `Verifique su correo aquí: ${link}` : undefined,
    link ? '' : undefined,
    'Para verificar su correo, use este código: ' + input.token,
    '',
    validity,
    copy.outro,
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n');

  return {
    subject: copy.subject,
    bodyText,
    bodyHtml: renderLayout({
      preheader: 'Confirme su correo para activar su cuenta de AloVida.',
      title: copy.title,
      paragraphs: [
        copy.intro,
        link
          ? 'Toque el botón para verificarlo. Si prefiere hacerlo desde la app, copie el código de abajo y péguelo en «Verificar correo».'
          : 'Copie el código de abajo y péguelo en «Verificar correo», dentro de la app.',
      ],
      buttonLabel: link ? 'Verificar mi correo' : undefined,
      buttonUrl: link,
      codeLabel: 'Su código de verificación',
      code: input.token,
      validity,
      footnote: copy.outro,
    }),
  };
}

/**
 * Correo de restablecimiento de contraseña (vigencia: 1 hora).
 *
 * @param input.token - Token en claro; sólo viaja dentro del correo.
 * @param input.webBaseUrl - Base pública del frontend (por defecto, `WEB_APP_BASE_URL`).
 */
export function passwordResetEmail(input: {
  readonly token: string;
  readonly webBaseUrl?: string;
}): AccessEmail {
  const link = buildWebLink(
    '/auth/reset-password',
    input.token,
    input.webBaseUrl,
  );
  const title = 'Elija una contraseña nueva';
  const intro =
    'Recibimos una solicitud para restablecer la contraseña de su cuenta de AloVida.';
  const validity = 'El código y el enlace vencen en una hora.';
  const outro =
    'Si usted no pidió este cambio, ignore este mensaje: su contraseña actual sigue funcionando.';

  const bodyText = [
    title,
    '',
    intro,
    '',
    link ? `Elija su contraseña nueva aquí: ${link}` : undefined,
    link ? '' : undefined,
    'Para elegir una contraseña nueva, use este código: ' + input.token,
    '',
    validity,
    outro,
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n');

  return {
    subject: 'Restablezca su contraseña de AloVida',
    bodyText,
    bodyHtml: renderLayout({
      preheader: 'Elija una contraseña nueva para su cuenta de AloVida.',
      title,
      paragraphs: [
        intro,
        link
          ? 'Toque el botón para elegir una contraseña nueva. Si prefiere hacerlo desde la app, copie el código de abajo.'
          : 'Copie el código de abajo y péguelo en la pantalla de contraseña nueva, dentro de la app.',
      ],
      buttonLabel: link ? 'Elegir contraseña nueva' : undefined,
      buttonUrl: link,
      codeLabel: 'Su código de restablecimiento',
      code: input.token,
      validity,
      footnote: outro,
    }),
  };
}
