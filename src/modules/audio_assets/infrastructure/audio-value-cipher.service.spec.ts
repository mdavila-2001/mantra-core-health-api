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
    const encrypted = cipher.encrypt('Hola').replace(/.$/u, 'A');
    expect(() => cipher.decrypt(encrypted)).toThrow();
  });
});
