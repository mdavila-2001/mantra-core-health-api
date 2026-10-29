import {
  isOwnBlock,
  median,
  mergeIntervals,
  minutesOf,
  overlaps,
  reservedWindow,
  totalMinutes,
} from './or-window';

const t = (hhmm: string) => new Date(`2026-11-02T${hhmm}:00.000Z`);

describe('reservedWindow · INV-38', () => {
  it('caso 08:00–10:00 con preparación 15 y limpieza 20 reserva 07:45–10:20', () => {
    const w = reservedWindow(t('08:00'), t('10:00'), 15, 20);
    expect(w.start).toEqual(t('07:45'));
    expect(w.end).toEqual(t('10:20'));
  });

  it('preparación o limpieza ausentes valen cero', () => {
    const w = reservedWindow(t('08:00'), t('10:00'), undefined, null);
    expect(w).toEqual({ start: t('08:00'), end: t('10:00') });
  });

  it('un caso a las 10:10 se solapa con la ventana del anterior; a las 10:35 no (contrato F4.5-2)', () => {
    const a = reservedWindow(t('08:00'), t('10:00'), 15, 20);
    const b1010 = reservedWindow(t('10:10'), t('11:00'), 15, 20);
    const b1035 = reservedWindow(t('10:35'), t('11:30'), 15, 20);
    expect(overlaps(a, b1010)).toBe(true);
    // La ventana de B empieza 10:20, justo donde termina la de A: el extremo común no es solape.
    expect(b1035.start).toEqual(t('10:20'));
    expect(overlaps(a, b1035)).toBe(false);
  });

  it('el ejemplo del proceso 06: prep 20 y limpieza 30, caso 09:00–10:00 → 08:40–10:30; otro a las 10:15 choca', () => {
    const a = reservedWindow(t('09:00'), t('10:00'), 20, 30);
    expect(a.start).toEqual(t('08:40'));
    expect(a.end).toEqual(t('10:30'));
    expect(overlaps(a, reservedWindow(t('10:15'), t('11:00'), 20, 30))).toBe(
      true,
    );
  });
});

describe('isOwnBlock', () => {
  it('bloque de cirujano: sólo su cirujano principal', () => {
    const block = { kind: 'SURGEON', surgeonProfileId: 's1' } as const;
    expect(isOwnBlock(block, { primarySurgeonProfileId: 's1' })).toBe(true);
    expect(isOwnBlock(block, { primarySurgeonProfileId: 's2' })).toBe(false);
    expect(isOwnBlock(block, {})).toBe(false);
  });

  it('bloque de servicio: la especialidad del caso es la del bloque o la de su unidad', () => {
    const porEspecialidad = {
      kind: 'SERVICE',
      surgicalSpecialtyConceptId: 'trauma',
    } as const;
    const porUnidad = {
      kind: 'SERVICE',
      clinicalUnitId: 'u1',
      unitSpecialtyConceptId: 'trauma',
    } as const;
    expect(
      isOwnBlock(porEspecialidad, { surgicalSpecialtyConceptId: 'trauma' }),
    ).toBe(true);
    expect(
      isOwnBlock(porUnidad, { surgicalSpecialtyConceptId: 'trauma' }),
    ).toBe(true);
    expect(
      isOwnBlock(porUnidad, { surgicalSpecialtyConceptId: 'cardio' }),
    ).toBe(false);
  });

  it('un caso sin especialidad nunca es propio de un bloque de servicio (fail-closed)', () => {
    expect(
      isOwnBlock(
        { kind: 'SERVICE', surgicalSpecialtyConceptId: 'trauma' },
        { primarySurgeonProfileId: 's1' },
      ),
    ).toBe(false);
    expect(isOwnBlock({ kind: 'SERVICE', clinicalUnitId: 'u1' }, {})).toBe(
      false,
    );
  });
});

describe('intervalos', () => {
  it('une los solapados y contiguos y ordena', () => {
    const merged = mergeIntervals([
      { start: t('12:00'), end: t('13:00') },
      { start: t('08:00'), end: t('10:00') },
      { start: t('09:00'), end: t('11:00') },
      { start: t('11:00'), end: t('11:30') },
    ]);
    expect(merged).toEqual([
      { start: t('08:00'), end: t('11:30') },
      { start: t('12:00'), end: t('13:00') },
    ]);
    expect(totalMinutes(merged)).toBe(210 + 60);
  });

  it('minutesOf acota a la ventana', () => {
    expect(minutesOf({ start: t('08:00'), end: t('12:00') })).toBe(240);
    expect(
      minutesOf(
        { start: t('08:00'), end: t('12:00') },
        { start: t('10:00'), end: t('11:00') },
      ),
    ).toBe(60);
    expect(
      minutesOf(
        { start: t('08:00'), end: t('09:00') },
        { start: t('10:00'), end: t('11:00') },
      ),
    ).toBe(0);
  });

  it('mediana', () => {
    expect(median([])).toBeNull();
    expect(median([5])).toBe(5);
    expect(median([30, 10, 20])).toBe(20);
    expect(median([10, 20, 30, 40])).toBe(25);
  });
});
