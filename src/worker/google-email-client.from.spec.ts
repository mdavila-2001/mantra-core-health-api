import { formatFrom } from './google-email-client.service';

describe('formatFrom', () => {
  it('sin nombre usa la dirección sola', () => {
    expect(formatFrom('plataforma@example.com')).toBe('plataforma@example.com');
    expect(formatFrom('plataforma@example.com', '  ')).toBe(
      'plataforma@example.com',
    );
  });

  it('con nombre lo codifica RFC 2047 y conserva la dirección de la plataforma', () => {
    const from = formatFrom('plataforma@example.com', 'Dr. Andrés Pérez');
    const encoded = Buffer.from('Dr. Andrés Pérez', 'utf8').toString('base64');
    expect(from).toBe(`=?UTF-8?B?${encoded}?= <plataforma@example.com>`);
  });

  it('un nombre con saltos de línea o ángulos no abre otra cabecera', () => {
    const from = formatFrom(
      'plataforma@example.com',
      'Dr. X\r\nBcc: otro@example.com <z>',
    );
    expect(from).not.toMatch(/[\r\n]/);
    expect(from.match(/</g)).toHaveLength(1);
  });
});
