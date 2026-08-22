import {
  isMimeTypeAllowedForCategory,
  sniffMimeType,
} from './upload-content-type';

/** Cabeceras auténticas de cada formato reconocido. */
const HEADERS = {
  jpeg: Buffer.from([0xff, 0xd8, 0xff, 0xdb]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  gif: Buffer.from('GIF89a'),
  pdf: Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3'),
  webp: Buffer.concat([
    Buffer.from('RIFF'),
    Buffer.from([0x24, 0x00, 0x00, 0x00]),
    Buffer.from('WEBPVP8 '),
  ]),
  /** RIFF que no es WEBP: un WAV. La firma inicial coincide, el formato no. */
  wav: Buffer.concat([
    Buffer.from('RIFF'),
    Buffer.from([0x24, 0x00, 0x00, 0x00]),
    Buffer.from('WAVEfmt '),
  ]),
};

describe('sniffMimeType', () => {
  it.each([
    ['jpeg', HEADERS.jpeg, 'image/jpeg'],
    ['png', HEADERS.png, 'image/png'],
    ['gif', HEADERS.gif, 'image/gif'],
    ['pdf', HEADERS.pdf, 'application/pdf'],
    ['webp', HEADERS.webp, 'image/webp'],
  ])('reconoce %s por su firma', (_name, buffer, expected) => {
    expect(sniffMimeType(buffer as Buffer)).toBe(expected);
  });

  it('no confunde un RIFF cualquiera con WEBP', () => {
    expect(sniffMimeType(HEADERS.wav)).toBeUndefined();
  });

  it('no reconoce texto plano ni HTML', () => {
    expect(sniffMimeType(Buffer.from('<html><body>hola</body></html>'))).toBe(
      undefined,
    );
    expect(sniffMimeType(Buffer.from('no soy una imagen'))).toBeUndefined();
  });

  it('no desborda con un contenido más corto que la firma', () => {
    expect(sniffMimeType(Buffer.from([0xff]))).toBeUndefined();
    expect(sniffMimeType(Buffer.alloc(0))).toBeUndefined();
  });
});

describe('isMimeTypeAllowedForCategory', () => {
  it('acepta imágenes en IMAGE', () => {
    expect(isMimeTypeAllowedForCategory('IMAGE', 'image/jpeg')).toBe(true);
    expect(isMimeTypeAllowedForCategory('IMAGE', 'image/webp')).toBe(true);
  });

  it('rechaza un PDF en IMAGE', () => {
    expect(isMimeTypeAllowedForCategory('IMAGE', 'application/pdf')).toBe(
      false,
    );
  });

  it('acepta en DOCUMENT tanto el PDF como el documento fotografiado', () => {
    expect(isMimeTypeAllowedForCategory('DOCUMENT', 'application/pdf')).toBe(
      true,
    );
    expect(isMimeTypeAllowedForCategory('DOCUMENT', 'image/jpeg')).toBe(true);
  });
});
