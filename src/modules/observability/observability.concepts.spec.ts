import { ERROR_GROUP_STATE, errorGroupStateOf } from './observability.concepts';

describe('observability.concepts', () => {
  // Valores sembrados por `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql`
  // del modelo (ver evidencia-f0/F1-modelo.md §4). Si cambian, la API dejaría de
  // encontrar los estados de `error_groups`.
  it('deriva los mismos ids que sembró el parche del modelo', () => {
    expect(ERROR_GROUP_STATE).toEqual({
      NEW: '2529878b-9021-5f78-84e7-277a0f2736fd',
      SEEN: '5dd2898e-a1e9-5581-b525-4868cb33dc2d',
      RESOLVED: '65878481-6760-5406-8c59-e530bcaaea17',
      IGNORED: '45c74d83-87a6-5fcd-95cc-785783a67feb',
    });
  });

  it('invierte el id al código y rechaza un concepto ajeno', () => {
    expect(errorGroupStateOf(ERROR_GROUP_STATE.RESOLVED)).toBe('RESOLVED');
    expect(
      errorGroupStateOf('00000000-0000-4000-8000-000000000000'),
    ).toBeNull();
  });
});
