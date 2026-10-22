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
  /** Un `.docx` real es un ZIP con `word/document.xml` adentro. */
  docx: Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from('word/document.xml'),
  ]),
  /** Un `.xlsx` real es un ZIP con `xl/workbook.xml` adentro. */
  xlsx: Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from('xl/workbook.xml'),
  ]),
  /** Un ZIP genérico, sin marca de Word ni de Excel adentro. */
  zip: Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from('cualquier-otra-cosa.bin'),
  ]),
};

describe('sniffMimeType', () => {
  it.each([
    ['jpeg', HEADERS.jpeg, 'image/jpeg'],
    ['png', HEADERS.png, 'image/png'],
    ['gif', HEADERS.gif, 'image/gif'],
    ['pdf', HEADERS.pdf, 'application/pdf'],
    ['webp', HEADERS.webp, 'image/webp'],
    [
      'docx',
      HEADERS.docx,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    [
      'xlsx',
      HEADERS.xlsx,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  ])('reconoce %s por su firma', (_name, buffer, expected) => {
    expect(sniffMimeType(buffer as Buffer)).toBe(expected);
  });

  it('no confunde un RIFF cualquiera con WEBP', () => {
    expect(sniffMimeType(HEADERS.wav)).toBeUndefined();
  });

  it('no confunde un ZIP cualquiera con un .docx o .xlsx', () => {
    expect(sniffMimeType(HEADERS.zip)).toBeUndefined();
  });

  it('reconoce texto plano y CSV, pero siempre como text/plain', () => {
    expect(sniffMimeType(Buffer.from('nombre,apellido\nAna,Pérez'))).toBe(
      'text/plain',
    );
    expect(sniffMimeType(Buffer.from('notas de la consulta'))).toBe(
      'text/plain',
    );
  });

  it('el HTML se reconoce como texto, nunca como text/html', () => {
    expect(sniffMimeType(Buffer.from('<html><body>hola</body></html>'))).toBe(
      'text/plain',
    );
  });

  it('rechaza contenido binario que no calza con ningún formato reconocido', () => {
    expect(
      sniffMimeType(Buffer.from([0x00, 0x01, 0x02, 0x7f, 0xff])),
    ).toBeUndefined();
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

  it('acepta en DOCUMENT los formatos de oficina', () => {
    expect(
      isMimeTypeAllowedForCategory(
        'DOCUMENT',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toBe(true);
    expect(
      isMimeTypeAllowedForCategory(
        'DOCUMENT',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ),
    ).toBe(true);
    expect(isMimeTypeAllowedForCategory('DOCUMENT', 'text/plain')).toBe(true);
  });

  it('rechaza los formatos de oficina en IMAGE', () => {
    expect(isMimeTypeAllowedForCategory('IMAGE', 'text/plain')).toBe(false);
  });
});
