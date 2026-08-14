import { AudioValueCipherService } from './audio-value-cipher.service';

describe('AudioValueCipherService', () => {
  it('cifra sin conservar texto plano y puede descifrarlo', () => {
    process.env.AUDIO_TTS_DATA_KEY =
      'test-audio-data-key-012345678901234567890123';
    const cipher = new AudioValueCipherService();
    const encrypted = cipher.encrypt('Hola Pablo');
    expect(encrypted).not.toContain('Hola Pablo');
    expect(cipher.decrypt(encrypted)).toBe('Hola Pablo');
  });

  it('rechaza payloads manipulados', () => {
    process.env.AUDIO_TTS_DATA_KEY =
      'test-audio-data-key-012345678901234567890123';
    const cipher = new AudioValueCipherService();
    const encrypted = manipular(cipher.encrypt('Hola'));
    expect(() => cipher.decrypt(encrypted)).toThrow();
  });
});

/**
 * Devuelve el mismo payload con **un byte del texto cifrado alterado de verdad**.
 *
 * ## Por qué no basta con cambiar el último carácter
 *
 * Era lo que hacía la prueba (`.replace(/.$/u, 'A')`) y fallaba al azar, por dos
 * razones que se suman:
 *
 * 1. El nonce es aleatorio, así que el último carácter cambia en cada corrida:
 *    cuando ya era una `A`, la «manipulación» dejaba el payload **idéntico**.
 * 2. Y aunque sea otro: `'Hola'` son 4 bytes, que en base64url ocupan 6
 *    caracteres — pero **los últimos 4 bits del sexto carácter no codifican
 *    nada**. Dieciséis caracteres distintos decodifican a los mismos 4 bytes,
 *    así que cambiarlo a menudo no altera ni un byte del texto cifrado.
 *
 * El resultado era una prueba de integridad intermitente: no fallaba el
 * cifrador —que hace exactamente lo que debe— sino la forma de manipularlo.
 *
 * Acá se decodifica, se invierte un bit de un byte real y se vuelve a codificar.
 * Eso sí cambia el texto cifrado siempre, y es lo que la etiqueta GCM tiene que
 * rechazar.
 */
function manipular(payload: string): string {
  const [version, iv, tag, data] = payload.split('.');
  const bytes = Buffer.from(data ?? '', 'base64url');
  bytes[0] ^= 0xff;
  return [version, iv, tag, bytes.toString('base64url')].join('.');
}
