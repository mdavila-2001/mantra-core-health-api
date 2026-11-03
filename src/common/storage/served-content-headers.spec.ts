import {
  OPAQUE_MIME_TYPE,
  servedContentHeaders,
} from './served-content-headers';

describe('servedContentHeaders', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])(
    'sirve %s en línea con su tipo real y nosniff',
    (mimeType) => {
      expect(servedContentHeaders(mimeType, 'foto.jpg')).toEqual({
        'Content-Type': mimeType,
        'Content-Disposition': "inline; filename*=UTF-8''foto.jpg",
        'X-Content-Type-Options': 'nosniff',
      });
    },
  );

  it('sirve un PDF con su tipo pero como descarga, no en línea', () => {
    expect(servedContentHeaders('application/pdf', 'receta.pdf')).toEqual({
      'Content-Type': 'application/pdf',
      'Content-Disposition': "attachment; filename*=UTF-8''receta.pdf",
      'X-Content-Type-Options': 'nosniff',
    });
  });

  it.each([
    'image/svg+xml',
    'text/html',
    'application/xhtml+xml',
    'text/xml',
    'application/javascript',
    'image/heic',
  ])('nunca sirve %s con su tipo: sale opaco y como descarga', (mimeType) => {
    const headers = servedContentHeaders(mimeType, 'x');
    expect(headers['Content-Type']).toBe(OPAQUE_MIME_TYPE);
    expect(headers['Content-Disposition']).toMatch(/^attachment/);
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('normaliza parámetros y mayúsculas sin dejar pasar un tipo activo', () => {
    expect(
      servedContentHeaders('IMAGE/PNG; charset=binary')['Content-Type'],
    ).toBe('image/png');
    expect(
      servedContentHeaders('text/html; charset=utf-8')['Content-Type'],
    ).toBe(OPAQUE_MIME_TYPE);
  });

  it('sin nombre original igual declara la disposición', () => {
    expect(servedContentHeaders('text/plain')['Content-Disposition']).toBe(
      'attachment',
    );
    expect(
      servedContentHeaders('image/webp', null)['Content-Disposition'],
    ).toBe('inline');
  });

  it('codifica el nombre para que no pueda inyectar cabeceras', () => {
    const headers = servedContentHeaders(
      'image/png',
      'a"b\r\nSet-Cookie: x=1.png',
    );
    expect(headers['Content-Disposition']).not.toMatch(/[\r\n"]/);
    expect(headers['Content-Disposition']).toContain('%0D%0A');
  });

  it('un nombre con un surrogate suelto omite el filename en vez de lanzar', () => {
    const headers = servedContentHeaders(
      'application/pdf',
      'informe\uD800.pdf',
    );
    expect(headers['Content-Disposition']).toBe('attachment');
    expect(headers['Content-Type']).toBe('application/pdf');
  });
});
