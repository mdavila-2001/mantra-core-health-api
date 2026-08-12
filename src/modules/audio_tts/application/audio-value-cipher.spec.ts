import { AudioValueCipher, parsePreviousAudioKeys } from './audio-value-cipher';
import { AUDIO_ERROR } from '../domain/audio.errors';

const SECRET_A = 'a'.repeat(32);
const SECRET_B = 'b'.repeat(32);
const AAD = 'asset-key-1';

function cipher(): AudioValueCipher {
  return new AudioValueCipher({ id: 'k1', secret: SECRET_A });
}

describe('AudioValueCipher', () => {
  it('cifra y descifra ligando el texto a su asset', () => {
    const c = cipher();
    const sealed = c.encrypt('Bienvenido, María.', AAD);
    expect(sealed).not.toContain('María');
    expect(c.decrypt(sealed, AAD)).toBe('Bienvenido, María.');
  });

  it('produce criptogramas distintos para el mismo texto', () => {
    // IV aleatorio por operación: si dos cifrados del mismo texto coincidieran,
    // la tabla revelaría qué filas comparten contenido.
    const c = cipher();
    expect(c.encrypt('x', AAD)).not.toBe(c.encrypt('x', AAD));
  });

  it('falla al descifrar con otro asset como dato autenticado', () => {
    // Es la protección real del AAD: mover el criptograma de un asset a otro no
    // entrega el texto de otra persona, falla.
    const c = cipher();
    const sealed = c.encrypt('secreto', AAD);
    expect(() => c.decrypt(sealed, 'otro-asset')).toThrow(
      expect.objectContaining({ audioCode: AUDIO_ERROR.cipherAuthFailed }),
    );
  });

  it('falla al descifrar si el criptograma fue manipulado', () => {
    const c = cipher();
    const sealed = c.encrypt('secreto', AAD);
    const tampered = `${sealed.slice(0, -2)}xx`;
    expect(() => c.decrypt(tampered, AAD)).toThrow(
      expect.objectContaining({ audioCode: AUDIO_ERROR.cipherAuthFailed }),
    );
  });

  it('descifra con una clave anterior durante una rotación', () => {
    const old = new AudioValueCipher({ id: 'k1', secret: SECRET_A });
    const sealed = old.encrypt('hola', AAD);

    const rotated = new AudioValueCipher({ id: 'k2', secret: SECRET_B }, [
      { id: 'k1', secret: SECRET_A },
    ]);
    expect(rotated.decrypt(sealed, AAD)).toBe('hola');
    // Y sabe que ese valor conviene re-cifrar con la clave activa.
    expect(rotated.needsRewrap(sealed)).toBe(true);
    expect(rotated.needsRewrap(rotated.encrypt('hola', AAD))).toBe(false);
  });

  it('rechaza un valor cifrado con una clave que no está en el anillo', () => {
    const rotated = new AudioValueCipher({ id: 'k2', secret: SECRET_B });
    const sealed = new AudioValueCipher({ id: 'k1', secret: SECRET_A }).encrypt(
      'hola',
      AAD,
    );
    expect(() => rotated.decrypt(sealed, AAD)).toThrow(
      expect.objectContaining({ audioCode: AUDIO_ERROR.cipherKeyUnknown }),
    );
  });

  it('rechaza un formato desconocido en vez de intentar interpretarlo', () => {
    expect(() => cipher().decrypt('texto-en-claro', AAD)).toThrow(
      expect.objectContaining({ audioCode: AUDIO_ERROR.cipherFormat }),
    );
  });

  it('exige una clave de al menos 32 caracteres', () => {
    expect(() => new AudioValueCipher({ id: 'k1', secret: 'corta' })).toThrow(
      expect.objectContaining({ audioCode: AUDIO_ERROR.cipherKeyTooShort }),
    );
  });

  it('admite una clave corta solo cuando se declara el modo de pruebas', () => {
    expect(
      () =>
        new AudioValueCipher({ id: 'k1', secret: 'x'.repeat(16) }, [], true),
    ).not.toThrow();
  });

  it('parsea el anillo de claves anteriores', () => {
    expect(parsePreviousAudioKeys(` k1:${SECRET_A}, k2:${SECRET_B} `)).toEqual([
      { id: 'k1', secret: SECRET_A },
      { id: 'k2', secret: SECRET_B },
    ]);
    expect(parsePreviousAudioKeys('')).toEqual([]);
  });

  it('rechaza un anillo mal formado', () => {
    expect(() => parsePreviousAudioKeys('sin-separador')).toThrow(
      expect.objectContaining({ audioCode: AUDIO_ERROR.cipherKeyringInvalid }),
    );
  });

  it('conserva un secreto con dos puntos dentro', () => {
    // El separador es el PRIMER `:`; partir por todos rompería cualquier secreto
    // que contenga uno.
    const secret = `pre:${SECRET_A}`;
    expect(parsePreviousAudioKeys(`k1:${secret}`)).toEqual([
      { id: 'k1', secret },
    ]);
  });
});
