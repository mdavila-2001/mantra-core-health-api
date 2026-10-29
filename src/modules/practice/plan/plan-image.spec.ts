import { readImageSize } from './plan-image';

/** PNG mínimo con la cabecera IHDR de `width × height` (sin datos: sólo se lee la cabecera). */
function png(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'latin1');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

/** JPEG con un segmento APP0 y un SOF0 de `width × height`. */
function jpeg(width: number, height: number): Buffer {
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x10, ...Array(14).fill(0)]);
  const sof = Buffer.alloc(19);
  sof[0] = 0xff;
  sof[1] = 0xc0;
  sof.writeUInt16BE(17, 2);
  sof[4] = 8;
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof]);
}

function webpLossy(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(30);
  buffer.write('RIFF', 0, 'latin1');
  buffer.write('WEBP', 8, 'latin1');
  buffer.write('VP8 ', 12, 'latin1');
  buffer.writeUInt16LE(width, 26);
  buffer.writeUInt16LE(height, 28);
  return buffer;
}

function webpLossless(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(30);
  buffer.write('RIFF', 0, 'latin1');
  buffer.write('WEBP', 8, 'latin1');
  buffer.write('VP8L', 12, 'latin1');
  buffer.writeUInt32LE(((height - 1) << 14) | (width - 1), 21);
  return buffer;
}

function webpExtended(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(30);
  buffer.write('RIFF', 0, 'latin1');
  buffer.write('WEBP', 8, 'latin1');
  buffer.write('VP8X', 12, 'latin1');
  buffer.writeUIntLE(width - 1, 24, 3);
  buffer.writeUIntLE(height - 1, 27, 3);
  return buffer;
}

describe('readImageSize', () => {
  it('PNG', () => {
    expect(readImageSize(png(1200, 800), 'image/png')).toEqual({
      width: 1200,
      height: 800,
    });
  });

  it('JPEG, saltando segmentos previos al SOF', () => {
    expect(readImageSize(jpeg(640, 480), 'image/jpeg')).toEqual({
      width: 640,
      height: 480,
    });
  });

  it('WebP con compresión, sin pérdida y extendido', () => {
    expect(readImageSize(webpLossy(300, 200), 'image/webp')).toEqual({
      width: 300,
      height: 200,
    });
    expect(readImageSize(webpLossless(321, 123), 'image/webp')).toEqual({
      width: 321,
      height: 123,
    });
    expect(readImageSize(webpExtended(8000, 6000), 'image/webp')).toEqual({
      width: 8000,
      height: 6000,
    });
  });

  it('un tipo que no es de esos tres, o una cabecera que no coincide, da null', () => {
    expect(readImageSize(png(10, 10), 'image/svg+xml')).toBeNull();
    expect(readImageSize(png(10, 10), 'image/jpeg')).toBeNull();
    expect(readImageSize(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), 'image/png')).toBeNull();
    expect(readImageSize(Buffer.alloc(4), 'image/png')).toBeNull();
  });

  it('dimensiones cero dan null', () => {
    expect(readImageSize(png(0, 10), 'image/png')).toBeNull();
  });
});
