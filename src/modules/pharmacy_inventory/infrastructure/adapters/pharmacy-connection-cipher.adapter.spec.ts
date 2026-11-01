import { PharmacyConnectionCipher } from './pharmacy-connection-cipher.adapter';

describe('PharmacyConnectionCipher (FAR-C9)', () => {
  const original = process.env.PHARMACY_CONNECTION_SECRET_KEY;
  afterEach(() => {
    if (original === undefined)
      delete process.env.PHARMACY_CONNECTION_SECRET_KEY;
    else process.env.PHARMACY_CONNECTION_SECRET_KEY = original;
  });

  it('cifra y descifra con su propia llave; el texto guardado no contiene la clave', () => {
    process.env.PHARMACY_CONNECTION_SECRET_KEY =
      'llave-de-prueba-solo-para-specs';
    const cipher = new PharmacyConnectionCipher();
    const sealed = cipher.encrypt('clave-de-la-farmacia-9876');

    expect(cipher.isConfigured()).toBe(true);
    expect(sealed.startsWith('enc:v1:')).toBe(true);
    expect(sealed).not.toContain('clave-de-la-farmacia');
    expect(sealed).not.toContain('9876');
    expect(cipher.decrypt(sealed)).toBe('clave-de-la-farmacia-9876');
  });

  it('dos cifrados de la misma clave son distintos (IV aleatorio)', () => {
    process.env.PHARMACY_CONNECTION_SECRET_KEY =
      'llave-de-prueba-solo-para-specs';
    const cipher = new PharmacyConnectionCipher();
    expect(cipher.encrypt('x1234')).not.toBe(cipher.encrypt('x1234'));
  });

  it('otra llave no descifra', () => {
    process.env.PHARMACY_CONNECTION_SECRET_KEY = 'llave-a';
    const sealed = new PharmacyConnectionCipher().encrypt('x1234');
    process.env.PHARMACY_CONNECTION_SECRET_KEY = 'llave-b';
    expect(() => new PharmacyConnectionCipher().decrypt(sealed)).toThrow();
  });

  it('sin llave: no está configurado y no cifra, pero se construye (no rompe el arranque)', () => {
    delete process.env.PHARMACY_CONNECTION_SECRET_KEY;
    const cipher = new PharmacyConnectionCipher();
    expect(cipher.isConfigured()).toBe(false);
    expect(() => cipher.encrypt('x1234')).toThrow();
  });
});
