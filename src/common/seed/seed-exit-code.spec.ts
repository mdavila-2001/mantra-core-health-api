import { seedExitCode } from './seed-exit-code';

describe('seedExitCode', () => {
  it('sale en 0 si la siembra y el esquema quedaron íntegros', () => {
    expect(seedExitCode(0, true)).toBe(0);
  });

  it('sale en 1 si un paso de la siembra falló', () => {
    expect(seedExitCode(1, true)).toBe(1);
  });

  it('sale en 1 si el esquema quedó con incidencias bloqueantes', () => {
    expect(seedExitCode(0, false)).toBe(1);
  });

  it('sale en 1 si fallan ambos', () => {
    expect(seedExitCode(3, false)).toBe(1);
  });
});
