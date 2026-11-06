import { renderLayout, type AccessEmail } from './access-email.templates';

/** Mail carrying the 8-digit code that verifies a device (valid 10 minutes). */
export function deviceCodeEmail(input: {
  readonly code: string;
  readonly deviceName: string;
}): AccessEmail {
  const title = 'Verifique su dispositivo';
  const intro = `Pidió verificar «${input.deviceName}» en su cuenta de AloVida.`;
  const validity = 'El código vence en 10 minutos y sirve una sola vez.';
  const outro =
    'Si usted no lo pidió, no comparta este código y cierre las sesiones que no reconozca desde Ajustes › Dispositivos.';
  return {
    subject: 'Su código para verificar el dispositivo en AloVida',
    bodyText: [
      title,
      '',
      intro,
      '',
      `Código: ${input.code}`,
      '',
      validity,
      outro,
    ].join('\n'),
    bodyHtml: renderLayout({
      preheader: 'Código para verificar su dispositivo en AloVida.',
      title,
      paragraphs: [intro, 'Escriba este código en Ajustes › Dispositivos.'],
      codeLabel: 'Su código de verificación',
      code: input.code,
      validity,
      footnote: outro,
    }),
  };
}
