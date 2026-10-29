import {
  IfMatchRequiredException,
  RowVersionMismatchException,
  assertRowVersion,
  parseIfMatch,
  withVersionConflict,
} from './row-version';

describe('If-Match / rowVersion', () => {
  it('lee 3, "3" y W/"3"', () => {
    expect(parseIfMatch('3')).toBe(3);
    expect(parseIfMatch('"3"')).toBe(3);
    expect(parseIfMatch('W/"12"')).toBe(12);
    expect(parseIfMatch([' "7" '])).toBe(7);
  });

  it('sin cabecera es 428; con basura es 400; * no sirve', () => {
    expect(() => parseIfMatch(undefined)).toThrow(IfMatchRequiredException);
    expect(() => parseIfMatch('  ')).toThrow(IfMatchRequiredException);
    for (const malo of ['*', 'abc', '-1', '1.5', '"x"']) {
      try {
        parseIfMatch(malo);
        throw new Error(`debió fallar con ${malo}`);
      } catch (error) {
        expect((error as { getStatus(): number }).getStatus()).toBe(400);
      }
    }
    expect(new IfMatchRequiredException().getStatus()).toBe(428);
  });

  it('el desajuste es 412 con la versión vigente en details y reason estable', () => {
    expect(() => assertRowVersion(3, 3)).not.toThrow();
    try {
      assertRowVersion(4, 3);
      throw new Error('debió fallar');
    } catch (error) {
      const e = error as RowVersionMismatchException;
      expect(e).toBeInstanceOf(RowVersionMismatchException);
      expect(e.getStatus()).toBe(412);
      expect(e.reason).toBe('ROW_VERSION_MISMATCH');
      expect(e.details).toEqual({ currentRowVersion: 4 });
    }
  });

  it('el choque de versión optimista del ORM se traduce al mismo 412', async () => {
    class OptimisticLockError extends Error {}
    await expect(
      withVersionConflict(() => Promise.reject(new OptimisticLockError('x'))),
    ).rejects.toBeInstanceOf(RowVersionMismatchException);
    await expect(
      withVersionConflict(() => Promise.reject(new Error('otro'))),
    ).rejects.toThrow('otro');
    await expect(withVersionConflict(() => Promise.resolve(5))).resolves.toBe(
      5,
    );
  });
});
