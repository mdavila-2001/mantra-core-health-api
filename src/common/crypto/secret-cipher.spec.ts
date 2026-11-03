import { createCipheriv, randomBytes, scryptSync } from 'node:crypto';
import { decryptSecret, encryptSecret } from './secret-cipher';
import { SecretCipherError } from '../errors/secret-cipher.error';

/**
 * Lo que fija esta prueba: el cifrado MFA usa sal propia por secreto, y los
 * secretos que ya estaban guardados (formato de tres partes, sal fija) se
 * siguen pudiendo descifrar. Romper lo segundo dejaría a quien ya activó MFA
 * sin poder entrar.
 */
describe('secret-cipher', () => {
  const clave = 'una-passphrase-de-prueba-de-al-menos-32-caracteres';

  beforeEach(() => {
    process.env.MFA_ENCRYPTION_KEY = clave;
    delete process.env.NODE_ENV;
  });

  it('cifra y descifra con el formato nuevo (4 partes)', () => {
    const enc = encryptSecret('JBSWY3DPEHPK3PXP');
    expect(enc.split('.')).toHaveLength(4);
    expect(decryptSecret(enc)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('cada cifrado lleva una sal distinta', () => {
    const a = encryptSecret('mismo-secreto').split('.')[0];
    const b = encryptSecret('mismo-secreto').split('.')[0];
    expect(a).not.toBe(b);
  });

  it('sigue descifrando el formato anterior de tres partes (sal fija)', () => {
    // Reconstruye a mano lo que producía la versión anterior de `encryptSecret`.
    const key = scryptSync(clave, 'alovida.mfa.totp.v1', 32);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([
      cipher.update('SECRETO-ANTIGUO', 'utf8'),
      cipher.final(),
    ]);
    const legado = [
      iv.toString('base64'),
      cipher.getAuthTag().toString('base64'),
      data.toString('base64'),
    ].join('.');

    expect(decryptSecret(legado)).toBe('SECRETO-ANTIGUO');
  });

  it('rechaza un formato que no es ninguno de los dos', () => {
    expect(() => decryptSecret('a.b')).toThrow(
      'Formato de secreto cifrado inválido',
    );
    expect(() => decryptSecret('a.b.c.d.e')).toThrow(
      'Formato de secreto cifrado inválido',
    );
  });

  it('detecta un secreto manipulado', () => {
    const partes = encryptSecret('x').split('.');
    partes[3] = Buffer.from('otra-cosa').toString('base64');
    expect(() => decryptSecret(partes.join('.'))).toThrow();
  });

  // CEH-02: un valor dañado no llega a las primitivas de `node:crypto` y el
  // error que sale es tipado, con mensaje fijo y sin el secreto.
  describe('valor cifrado inválido (CEH-02)', () => {
    const b64 = (bytes: number) => Buffer.alloc(bytes, 7).toString('base64');

    it('Límite: sal 16 B, IV 12 B y tag 16 B es el formato mínimo aceptado (llega a la verificación GCM)', () => {
      // Con esas longitudes el formato es válido; falla recién la etiqueta.
      const minimo = [b64(16), b64(12), b64(16), ''].join('.');
      expect(() => decryptSecret(minimo)).toThrow(SecretCipherError);
      // Y un cifrado real de cadena vacía sí descifra.
      expect(decryptSecret(encryptSecret(''))).toBe('');
    });

    it.each([
      ['a.b.c', 'tres partes que no son base64 de las longitudes del formato'],
      ['a.b.c.d', 'cuatro partes sin longitudes válidas'],
      ['', 'cadena vacía'],
    ])('rechaza %j (%s) con SecretCipherError', (valor) => {
      expect(() => decryptSecret(valor)).toThrow(SecretCipherError);
      try {
        decryptSecret(valor);
      } catch (error) {
        expect((error as SecretCipherError).reason).toBe(
          'SECRET_CIPHER_INVALID',
        );
        expect((error as Error).message).toBe(
          'Formato de secreto cifrado inválido',
        );
      }
    });

    it('rechaza un tag GCM truncado', () => {
      const partes = encryptSecret('secreto-claro').split('.');
      partes[2] = partes[2].slice(0, 8);
      expect(() => decryptSecret(partes.join('.'))).toThrow(SecretCipherError);
    });

    it('rechaza base64 no canónico (caracteres ajenos que Buffer ignoraría)', () => {
      const partes = encryptSecret('secreto-claro').split('.');
      partes[3] = `${partes[3]}!!`;
      expect(() => decryptSecret(partes.join('.'))).toThrow(SecretCipherError);
    });

    it('rechaza IV y sal de longitud incorrecta', () => {
      const partes = encryptSecret('secreto-claro').split('.');
      expect(() =>
        decryptSecret([partes[0], b64(8), partes[2], partes[3]].join('.')),
      ).toThrow(SecretCipherError);
      expect(() =>
        decryptSecret([b64(4), partes[1], partes[2], partes[3]].join('.')),
      ).toThrow(SecretCipherError);
    });

    it('una clave distinta falla con el mismo error tipado y sin el secreto ni la causa', () => {
      const enc = encryptSecret('secreto-claro-9876');
      process.env.MFA_ENCRYPTION_KEY =
        'otra-passphrase-distinta-de-al-menos-32-caracteres';
      let capturado: Error | undefined;
      try {
        decryptSecret(enc);
      } catch (error) {
        capturado = error as Error;
      }
      expect(capturado).toBeInstanceOf(SecretCipherError);
      expect(capturado?.message).not.toContain('secreto-claro-9876');
      expect(capturado?.message).not.toMatch(/auth|unsupported|gcm/i);
      expect(capturado).not.toHaveProperty('cause');
    });

    it('no disfraza de secreto corrupto un error de configuración (clave ausente en producción)', () => {
      const enc = encryptSecret('x');
      delete process.env.MFA_ENCRYPTION_KEY;
      process.env.NODE_ENV = 'production';
      expect(() => decryptSecret(enc)).toThrow(/MFA_ENCRYPTION_KEY/);
      expect(() => decryptSecret(enc)).not.toThrow(SecretCipherError);
    });
  });
});
