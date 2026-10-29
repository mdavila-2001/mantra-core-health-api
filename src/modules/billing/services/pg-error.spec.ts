import { postgresViolation } from './pg-error';

describe('postgresViolation', () => {
  it('lee el SQLSTATE y la restricción, también cuando vienen en la causa', () => {
    expect(
      postgresViolation({
        code: '23505',
        constraint: 'ux_x',
        message: 'dato secreto',
      }),
    ).toEqual({ sqlstate: '23505', constraint: 'ux_x' });
    expect(
      postgresViolation(new Error('envuelto', { cause: { code: '23001' } })),
    ).toEqual({ sqlstate: '23001', constraint: undefined });
  });

  it('nunca devuelve el texto del servidor y no confunde códigos de Node con SQLSTATE', () => {
    expect(
      JSON.stringify(
        postgresViolation({ code: '23505', message: 'dato secreto' }),
      ),
    ).not.toContain('secreto');
    expect(postgresViolation({ code: 'ECONNRESET' })).toBeUndefined();
    expect(postgresViolation(undefined)).toBeUndefined();
  });
});
