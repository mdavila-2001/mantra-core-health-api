import { etagMatches, parseLayoutIfMatch } from './layout-if-match';

const PLAN = '11111111-1111-4111-8111-111111111111';

describe('parseLayoutIfMatch', () => {
  it.each(['12', '"12"', 'W/"12"', ' 12 '])('acepta %s', (header) => {
    expect(parseLayoutIfMatch(header, PLAN)).toBe(12);
  });

  it('acepta el ETag completo del layout del mismo lienzo', () => {
    expect(parseLayoutIfMatch(`W/"fp:${PLAN}:v7:ab12cd"`, PLAN)).toBe(7);
  });

  it('rechaza el ETag de otro lienzo, el asterisco y la basura', () => {
    expect(() =>
      parseLayoutIfMatch(
        'W/"fp:99999999-9999-4999-8999-999999999999:v7:ab"',
        PLAN,
      ),
    ).toThrow();
    expect(() => parseLayoutIfMatch('*', PLAN)).toThrow();
    expect(() => parseLayoutIfMatch('doce', PLAN)).toThrow();
  });

  it('sin cabecera es 428', () => {
    expect(() => parseLayoutIfMatch(undefined, PLAN)).toThrow(
      expect.objectContaining({ status: 428 }),
    );
  });
});

describe('etagMatches', () => {
  const etag = `W/"fp:${PLAN}:v3:abc"`;

  it('coincide de forma débil, con lista y con asterisco', () => {
    expect(etagMatches(etag, etag)).toBe(true);
    expect(etagMatches(`"fp:${PLAN}:v3:abc"`, etag)).toBe(true);
    expect(etagMatches(`W/"otro", ${etag}`, etag)).toBe(true);
    expect(etagMatches('*', etag)).toBe(true);
  });

  it('no coincide si cambió la versión o no hay cabecera', () => {
    expect(etagMatches(`W/"fp:${PLAN}:v4:abc"`, etag)).toBe(false);
    expect(etagMatches(undefined, etag)).toBe(false);
  });
});
