import {
  buildWebLink,
  escapeHtml,
  passwordResetEmail,
  verificationEmail,
} from './access-email.templates';

describe('access-email.templates', () => {
  const WEB = 'https://dev.alovida.arauzsoftware.com';

  describe('buildWebLink', () => {
    it('arma el enlace con el token codificado', () => {
      expect(buildWebLink('/auth/verify-email', 'a+b/c=', `${WEB}/`)).toBe(
        `${WEB}/auth/verify-email?token=a%2Bb%2Fc%3D`,
      );
    });

    it.each([
      undefined,
      '',
      'no-es-url',
      'http://localhost:4200',
      'http://127.0.0.1:4200',
    ])('no arma enlace con la base %p', (base) => {
      expect(buildWebLink('/auth/verify-email', 't', base)).toBeUndefined();
    });
  });

  describe('verificationEmail', () => {
    it('trae asunto, texto y HTML con el código y el botón', () => {
      const mail = verificationEmail({ token: 'tok-123', webBaseUrl: WEB });

      expect(mail.subject).toBe('Verifique su correo en AloVida');
      expect(mail.bodyText).toContain(
        'Para verificar su correo, use este código: tok-123',
      );
      expect(mail.bodyText).toContain(
        `${WEB}/auth/verify-email?token=tok-123`,
      );
      expect(mail.bodyHtml).toContain('<!DOCTYPE html>');
      expect(mail.bodyHtml).toContain('Verificar mi correo');
      expect(mail.bodyHtml).toContain(
        `href="${WEB}/auth/verify-email?token=tok-123"`,
      );
      expect(mail.bodyHtml).toContain('tok-123');
    });

    it('sin base pública omite el botón pero conserva el código', () => {
      const mail = verificationEmail({ token: 'tok-123', webBaseUrl: '' });

      expect(mail.bodyHtml).not.toContain('Verificar mi correo');
      expect(mail.bodyHtml).not.toContain('href=');
      expect(mail.bodyHtml).toContain('tok-123');
      expect(mail.bodyText).toContain('use este código: tok-123');
    });

    it.each([
      ['account', 'Verifique su correo en AloVida'],
      ['practitioner', 'Verifique su correo profesional en AloVida'],
      ['organization', 'Verifique el correo de su organización en AloVida'],
      ['resend', 'Su nuevo enlace para verificar el correo en AloVida'],
    ] as const)('variante %s', (variant, subject) => {
      expect(verificationEmail({ token: 't', variant }).subject).toBe(subject);
    });

    it('escapa el HTML de todo lo que inserta', () => {
      const mail = verificationEmail({
        token: '<script>"x"</script>',
        webBaseUrl: WEB,
      });

      expect(mail.bodyHtml).not.toContain('<script>');
      expect(mail.bodyHtml).toContain('&lt;script&gt;');
    });
  });

  describe('passwordResetEmail', () => {
    it('trae el enlace de contraseña nueva y la vigencia de una hora', () => {
      const mail = passwordResetEmail({ token: 'rst-9', webBaseUrl: WEB });

      expect(mail.subject).toBe('Restablezca su contraseña de AloVida');
      expect(mail.bodyText).toContain(
        'Para elegir una contraseña nueva, use este código: rst-9',
      );
      expect(mail.bodyText).toContain(`${WEB}/auth/reset-password?token=rst-9`);
      expect(mail.bodyHtml).toContain('Elegir contraseña nueva');
      expect(mail.bodyHtml).toContain('vencen en una hora');
    });
  });

  it('escapeHtml neutraliza los cinco caracteres peligrosos', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});
