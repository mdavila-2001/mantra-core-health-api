import { jest } from '@jest/globals';
import { warnIfRlsRoleFallbackIsUnsafe } from './rls-role-resolution';

describe('warnIfRlsRoleFallbackIsUnsafe (MCH-013)', () => {
  it('no advierte cuando DB_APP_USER está definido, aunque RLS_ENFORCE sea true', () => {
    const warn = jest.fn();
    warnIfRlsRoleFallbackIsUnsafe(
      { DB_APP_USER: 'mantra_app', RLS_ENFORCE: 'true' },
      warn as never,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('no advierte cuando RLS_ENFORCE no está en true (el fallback es irrelevante hoy)', () => {
    const warn = jest.fn();
    warnIfRlsRoleFallbackIsUnsafe({ RLS_ENFORCE: undefined }, warn as never);
    warnIfRlsRoleFallbackIsUnsafe({ RLS_ENFORCE: 'false' }, warn as never);
    expect(warn).not.toHaveBeenCalled();
  });

  it('advierte cuando RLS_ENFORCE=true y no hay DB_APP_USER: va a correr con el rol propietario', () => {
    const warn = jest.fn();
    warnIfRlsRoleFallbackIsUnsafe({ RLS_ENFORCE: 'true' }, warn as never);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('DB_APP_USER');
  });
});
