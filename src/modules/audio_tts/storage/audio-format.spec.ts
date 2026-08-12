import {
  acceptFor,
  extensionFor,
  looksLikeAudio,
  mimeTypeFor,
} from './audio-format';

describe('audio-format', () => {
  it('deriva extensión, mime y accept del prefijo del formato', () => {
    expect(extensionFor('mp3_44100_128')).toBe('mp3');
    expect(mimeTypeFor('mp3_44100_128')).toBe('audio/mpeg');
    expect(acceptFor('mp3_44100_128')).toBe('audio/mpeg');
    expect(extensionFor('wav_44100')).toBe('wav');
    expect(mimeTypeFor('opus_48000_64')).toBe('audio/opus');
  });

  it('cae a un valor genérico con un formato desconocido', () => {
    expect(extensionFor('formato_raro')).toBe('bin');
    expect(mimeTypeFor('formato_raro')).toBe('application/octet-stream');
  });

  describe('looksLikeAudio', () => {
    it('acepta un mp3 con etiqueta ID3 o cabecera de trama', () => {
      const id3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(8)]);
      const frame = Buffer.from([0xff, 0xfb, 0x90, 0x64, 0x00]);
      expect(looksLikeAudio(id3, 'mp3_44100_128')).toBe(true);
      expect(looksLikeAudio(frame, 'mp3_44100_128')).toBe(true);
    });

    it('rechaza una página de error servida con 200 como si fuera audio', () => {
      // Sin esta comprobación esos bytes quedarían cacheados para siempre: un
      // asset READY no se regenera nunca.
      const html = Buffer.from('<!DOCTYPE html><html>error</html>');
      const json = Buffer.from('{"detail":"quota exceeded"}');
      expect(looksLikeAudio(html, 'mp3_44100_128')).toBe(false);
      expect(looksLikeAudio(json, 'mp3_44100_128')).toBe(false);
    });

    it('exige la firma RIFF en wav y OggS en opus', () => {
      expect(looksLikeAudio(Buffer.from('RIFF....'), 'wav_44100')).toBe(true);
      expect(looksLikeAudio(Buffer.from('OggS....'), 'opus_48000_64')).toBe(
        true,
      );
      expect(looksLikeAudio(Buffer.from('RIFF....'), 'opus_48000_64')).toBe(
        false,
      );
    });

    it('en pcm y ulaw solo puede exigir que no sea texto estructurado', () => {
      // Son flujos crudos sin cabecera: no hay firma que comprobar.
      expect(
        looksLikeAudio(Buffer.from([0x01, 0x02, 0x03, 0x04]), 'pcm_44100'),
      ).toBe(true);
      expect(looksLikeAudio(Buffer.from('{"error":1}'), 'pcm_44100')).toBe(
        false,
      );
      expect(looksLikeAudio(Buffer.from('  <html>'), 'ulaw_8000')).toBe(false);
    });

    it('rechaza un cuerpo demasiado corto para tener firma', () => {
      expect(looksLikeAudio(Buffer.from([0xff]), 'mp3_44100_128')).toBe(false);
    });
  });
});
