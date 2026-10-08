import {
  createCipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';
import { decryptSecret, encryptSecret } from './secret-cipher';

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
    const data = Buffer.concat([cipher.update('SECRETO-ANTIGUO', 'utf8'), cipher.final()]);
    const legado = [
      iv.toString('base64'),
      cipher.getAuthTag().toString('base64'),
      data.toString('base64'),
    ].join('.');

    expect(decryptSecret(legado)).toBe('SECRETO-ANTIGUO');
  });

  it('rechaza un formato que no es ninguno de los dos', () => {
    expect(() => decryptSecret('a.b')).toThrow('Formato de secreto cifrado inválido');
    expect(() => decryptSecret('a.b.c.d.e')).toThrow('Formato de secreto cifrado inválido');
  });

  it('detecta un secreto manipulado', () => {
    const partes = encryptSecret('x').split('.');
    partes[3] = Buffer.from('otra-cosa').toString('base64');
    expect(() => decryptSecret(partes.join('.'))).toThrow();
  });
});
