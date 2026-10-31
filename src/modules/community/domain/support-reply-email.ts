/** Leyenda que el paciente lee cuando el doctor decidió mostrar que respondió su equipo. */
export const TEAM_REPLY_LEGEND = 'Respondido por su equipo';

/** Pie administrativo de toda respuesta por correo: el correo es un canal que el paciente no controla. */
export const ADMINISTRATIVE_FOOTER =
  'Este mensaje es administrativo y no incluye información clínica. ' +
  'Para consultas de salud, escriba a su médico desde la aplicación.';

/** Lo que hace falta para componer la respuesta por correo. */
export interface SupportReplyEmailInput {
  /** Nombre del doctor en cuyo nombre se responde: es el remitente visible. */
  readonly doctorName: string;
  /** Organización del doctor, para el pie. */
  readonly organizationName?: string;
  /** Texto de la respuesta (ya revisado: administrativo). */
  readonly bodyText: string;
  /** ¿El doctor decidió mostrar «respondido por su equipo»? */
  readonly disclosureShown: boolean;
}

/** Correo listo para entregar al proveedor. */
export interface SupportReplyEmail {
  /** Nombre visible del remitente; la dirección es siempre la de la plataforma. */
  readonly fromName: string;
  /** Asunto. */
  readonly subject: string;
  /** Cuerpo en texto plano. */
  readonly bodyText: string;
  /** Cuerpo en HTML (el texto, escapado). */
  readonly bodyHtml: string;
}

/** Quita saltos de línea, comillas y ángulos: el nombre va a una cabecera de correo. */
function headerSafe(value: string, max: number): string {
  return value
    .replace(/[\r\n"<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Escapa lo que viaja dentro del HTML. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Plantilla administrativa de la respuesta por correo en nombre del doctor. El
 * remitente visible es el doctor (la dirección de envío sigue siendo la de la
 * plataforma: nunca se simula la cuenta de correo de una persona); la leyenda
 * «Respondido por su equipo» aparece solo si el doctor la dejó visible. No lleva
 * nada más que el texto de la respuesta y el pie administrativo.
 *
 * @param input - Doctor, organización, texto y divulgación.
 * @returns Remitente, asunto y cuerpos.
 */
export function composeSupportReplyEmail(
  input: SupportReplyEmailInput,
): SupportReplyEmail {
  const doctorName = headerSafe(input.doctorName, 80) || 'Su médico';
  const organization = headerSafe(input.organizationName ?? '', 80);
  const text = input.bodyText.trim();
  const footer = organization
    ? `${ADMINISTRATIVE_FOOTER}\n${organization}`
    : ADMINISTRATIVE_FOOTER;
  const parts = [text];
  if (input.disclosureShown) parts.push(TEAM_REPLY_LEGEND);
  parts.push(footer);
  const bodyText = parts.join('\n\n');
  const paragraphs = (value: string): string =>
    escapeHtml(value)
      .split('\n')
      .map((line) => `<p style="margin:0 0 12px">${line}</p>`)
      .join('');
  const bodyHtml =
    paragraphs(text) +
    (input.disclosureShown
      ? `<p style="margin:0 0 12px;color:#555555"><em>${escapeHtml(TEAM_REPLY_LEGEND)}</em></p>`
      : '') +
    `<hr style="border:none;border-top:1px solid #dddddd;margin:16px 0">` +
    `<div style="color:#777777;font-size:12px">${paragraphs(footer)}</div>`;
  return {
    fromName: doctorName,
    subject: `Mensaje de ${doctorName}`,
    bodyText,
    bodyHtml,
  };
}
