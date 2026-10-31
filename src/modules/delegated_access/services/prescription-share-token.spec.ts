import {
  hashShareToken,
  isWellFormedShareToken,
  issueShareToken,
} from './prescription-share-token';

/**
 * El token del enlace compartido (S-6): 32 bytes aleatorios en base64url, y en
 * la base solo su SHA-256.
 */
describe('prescription-share-token', () => {
  it('emite 43 caracteres base64url', () => {
    const { token } = issueShareToken();
    expect(token).toHaveLength(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(isWellFormedShareToken(token)).toBe(true);
  });

  it('dos emisiones dan tokens y hashes distintos', () => {
    const a = issueShareToken();
    const b = issueShareToken();
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it('el hash es el SHA-256 en hex del token y no lo contiene', () => {
    const { token, tokenHash } = issueShareToken();
    expect(hashShareToken(token)).toBe(tokenHash);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).not.toContain(token);
  });

  it('el hash es determinista', () => {
    expect(hashShareToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('rechaza lo que no tiene la forma de un token', () => {
    expect(isWellFormedShareToken('')).toBe(false);
    expect(isWellFormedShareToken('a'.repeat(42))).toBe(false);
    expect(isWellFormedShareToken('a'.repeat(44))).toBe(false);
    expect(isWellFormedShareToken(`${'a'.repeat(42)}=`)).toBe(false);
    expect(isWellFormedShareToken(`${'a'.repeat(42)}/`)).toBe(false);
  });
});
