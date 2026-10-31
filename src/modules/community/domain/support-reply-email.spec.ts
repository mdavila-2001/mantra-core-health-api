import {
  ADMINISTRATIVE_FOOTER,
  TEAM_REPLY_LEGEND,
  composeSupportReplyEmail,
} from './support-reply-email';

describe('composeSupportReplyEmail', () => {
  it('el remitente visible y el asunto son el doctor', () => {
    const email = composeSupportReplyEmail({
      doctorName: 'Dr. Andrés Pérez',
      bodyText: 'Le confirmamos el jueves a las 15:30.',
      disclosureShown: false,
    });
    expect(email.fromName).toBe('Dr. Andrés Pérez');
    expect(email.subject).toBe('Mensaje de Dr. Andrés Pérez');
    expect(email.bodyText).toContain('Le confirmamos el jueves a las 15:30.');
    expect(email.bodyText).toContain(ADMINISTRATIVE_FOOTER);
  });

  it('la leyenda de equipo aparece solo si el doctor la dejó visible', () => {
    const shown = composeSupportReplyEmail({
      doctorName: 'Dr. X',
      bodyText: 'Hola',
      disclosureShown: true,
    });
    const hidden = composeSupportReplyEmail({
      doctorName: 'Dr. X',
      bodyText: 'Hola',
      disclosureShown: false,
    });
    expect(shown.bodyText).toContain(TEAM_REPLY_LEGEND);
    expect(shown.bodyHtml).toContain(TEAM_REPLY_LEGEND);
    expect(hidden.bodyText).not.toContain(TEAM_REPLY_LEGEND);
    expect(hidden.bodyHtml).not.toContain(TEAM_REPLY_LEGEND);
  });

  it('el correo no nombra a la autora real', () => {
    const email = composeSupportReplyEmail({
      doctorName: 'Dr. X',
      bodyText: 'Hola',
      disclosureShown: true,
    });
    expect(JSON.stringify(email)).not.toMatch(/Ana|authored|autora/i);
  });

  it('el nombre del doctor no puede inyectar cabeceras ni comillas', () => {
    const email = composeSupportReplyEmail({
      doctorName: 'Dr. X"\r\nBcc: otro@example.com <a>',
      bodyText: 'Hola',
      disclosureShown: false,
    });
    expect(email.fromName).not.toMatch(/[\r\n"<>]/);
    expect(email.subject).not.toMatch(/[\r\n]/);
  });

  it('escapa el HTML del texto de la respuesta', () => {
    const email = composeSupportReplyEmail({
      doctorName: 'Dr. X',
      bodyText: '<script>alert(1)</script> & más',
      disclosureShown: false,
    });
    expect(email.bodyHtml).not.toContain('<script>');
    expect(email.bodyHtml).toContain('&lt;script&gt;');
    expect(email.bodyHtml).toContain('&amp; más');
  });

  it('sin nombre de doctor usa un remitente genérico y agrega la organización al pie', () => {
    const email = composeSupportReplyEmail({
      doctorName: '   ',
      organizationName: 'Hospital Piloto Mantra',
      bodyText: 'Hola',
      disclosureShown: false,
    });
    expect(email.fromName).toBe('Su médico');
    expect(email.bodyText).toContain('Hospital Piloto Mantra');
  });
});
