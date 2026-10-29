import {
  IfMatchRequiredException,
  RowVersionMismatchException,
  parseIfMatch,
} from './row-version';

describe('If-Match / rowVersion de las ubicaciones de stock', () => {
  it('lee 3, "3" y W/"3"', () => {
    expect(parseIfMatch('3')).toBe(3);
    expect(parseIfMatch('"3"')).toBe(3);
    expect(parseIfMatch('W/"12"')).toBe(12);
    expect(parseIfMatch([' "7" '])).toBe(7);
  });

  it('sin cabecera es 428; con basura es 400; * no sirve; el reason es el de la estructura', () => {
    expect(() => parseIfMatch(undefined)).toThrow(IfMatchRequiredException);
    expect(() => parseIfMatch('  ')).toThrow(IfMatchRequiredException);
    for (const malo of ['*', 'abc', '-1', '1.5', '"x"']) {
      try {
        parseIfMatch(malo);
        throw new Error(`debió fallar con ${malo}`);
      } catch (error) {
        const e = error as { getStatus(): number; reason?: string };
        expect(e.getStatus()).toBe(400);
        expect(e.reason).toBe('IF_MATCH_REQUIRED');
      }
    }
    const missing = new IfMatchRequiredException();
    expect(missing.getStatus()).toBe(428);
    expect(missing.reason).toBe('IF_MATCH_REQUIRED');
  });

  it('el desajuste es 412 con la versión vigente en details y reason estable', () => {
    const e = new RowVersionMismatchException(4);
    expect(e.getStatus()).toBe(412);
    expect(e.reason).toBe('ROW_VERSION_MISMATCH');
    expect(e.code).toBe('CONCURRENCY_CONFLICT');
    expect(e.details).toEqual({ currentRowVersion: 4 });
    expect(new RowVersionMismatchException().details).toBeUndefined();
  });
});
