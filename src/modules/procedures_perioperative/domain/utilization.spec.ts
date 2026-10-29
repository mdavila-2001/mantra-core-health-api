import {
  blockMetrics,
  roomDayMetrics,
  type BlockRow,
  type CaseEpisode,
} from './utilization';

const t = (hhmm: string) => new Date(`2026-11-02T${hhmm}:00.000Z`);
const DAY = { start: t('00:00'), end: new Date('2026-11-03T00:00:00.000Z') };

/**
 * Fixture conocido, calculado a mano:
 *
 * Sala R1, lunes. Bloque B1 de Traumatología 08:00–14:00 (360 min), activo.
 *   Caso A: programado 08:00; entra 08:05; anestesia 08:20; sale 10:00; sala lista 10:30.
 *   Caso B: programado 10:30; entra 10:40 (turnover A→B = 40 min); anestesia 10:50; sale 13:00; limpieza hasta 13:20.
 * Ambos ligados a B1.
 */
const BLOCK: BlockRow = {
  id: 'b1',
  roomId: 'r1',
  ownerKey: 'SERVICE::trauma',
  startsAt: t('08:00'),
  endsAt: t('14:00'),
  status: 'ACTIVE',
  releasedMinutes: 0,
};
const A: CaseEpisode = {
  caseId: 'a',
  roomId: 'r1',
  blockId: 'b1',
  scheduledStart: t('08:00'),
  inRoom: t('08:05'),
  anesthesiaStart: t('08:20'),
  outOfRoom: t('10:00'),
  roomReady: t('10:30'),
};
const B: CaseEpisode = {
  caseId: 'b',
  roomId: 'r1',
  blockId: 'b1',
  scheduledStart: t('10:30'),
  inRoom: t('10:40'),
  anesthesiaStart: t('10:50'),
  outOfRoom: t('13:00'),
  cleanupEnd: t('13:20'),
};

describe('roomDayMetrics · fórmulas al minuto', () => {
  it('sesión, tiempo de toque, utilización, recambio p50 y primer caso', () => {
    const m = roomDayMetrics([BLOCK], [A, B], DAY);
    // Sesión = 360. Toque = (08:20→10:00)=100 + (10:50→13:00)=130 = 230.
    expect(m.sessionMinutes).toBe(360);
    expect(m.touchMinutes).toBe(230);
    expect(m.roomUtilizationPct).toBe(63.89); // 230 / 360
    // Recambio: salida de A 10:00 → entrada de B 10:40 = 40 min (una sola observación).
    expect(m.turnoverMinutesP50).toBe(40);
    // El primer caso (A, 08:00) entró a las 08:05: tarde con gracia 0, a tiempo con gracia 5.
    expect(m.firstCaseOnTimePct).toBe(0);
    expect(roomDayMetrics([BLOCK], [A, B], DAY, 5).firstCaseOnTimePct).toBe(
      100,
    );
    expect(m.casesCount).toBe(2);
  });

  it('el toque se acota a la sesión: lo que cae fuera del bloque no cuenta', () => {
    const tarde: CaseEpisode = {
      ...B,
      caseId: 'c',
      anesthesiaStart: t('13:30'),
      outOfRoom: t('15:00'),
    };
    // Sólo 13:30→14:00 está dentro del bloque.
    expect(roomDayMetrics([BLOCK], [tarde], DAY).touchMinutes).toBe(30);
  });

  it('sin sesión no hay porcentaje; un bloque cancelado no suma sesión', () => {
    const cancelado: BlockRow = { ...BLOCK, status: 'CANCELLED' };
    const m = roomDayMetrics([cancelado], [A], DAY);
    expect(m.sessionMinutes).toBe(0);
    expect(m.roomUtilizationPct).toBeNull();
    expect(m.touchMinutes).toBe(0);
  });

  it('un bloque liberado sigue siendo sesión (el tiempo vuelve a la agenda abierta)', () => {
    const liberado: BlockRow = {
      ...BLOCK,
      status: 'RELEASED',
      releasedMinutes: 360,
    };
    expect(roomDayMetrics([liberado], [], DAY).sessionMinutes).toBe(360);
  });

  it('dos bloques solapados no cuentan dos veces el mismo minuto', () => {
    const otro: BlockRow = {
      ...BLOCK,
      id: 'b2',
      startsAt: t('12:00'),
      endsAt: t('16:00'),
    };
    expect(roomDayMetrics([BLOCK, otro], [], DAY).sessionMinutes).toBe(480);
  });

  it('sin casos no hay recambio ni primer caso', () => {
    const m = roomDayMetrics([BLOCK], [], DAY);
    expect(m.turnoverMinutesP50).toBeNull();
    expect(m.firstCaseOnTimePct).toBeNull();
    expect(m.roomUtilizationPct).toBe(0);
  });
});

describe('blockMetrics · fórmulas al minuto', () => {
  it('(usado + recambio) ÷ (asignado − liberado)', () => {
    const m = blockMetrics(BLOCK, [A, B], [A, B]);
    // Usado en bloque: A 08:05→10:00 = 115; B 10:40→13:00 = 140 → 255.
    expect(m.usedInBlockMinutes).toBe(255);
    // Recambio: A hasta sala lista 10:30 = 30; B hasta fin de limpieza 13:20 = 20 → 50.
    expect(m.turnoverMinutes).toBe(50);
    expect(m.allocatedMinutes).toBe(360);
    expect(m.releasedMinutes).toBe(0);
    expect(m.blockUtilizationPct).toBe(84.72); // (255 + 50) / 360
  });

  it('sin sala lista ni fin de limpieza, el recambio llega hasta la entrada del siguiente', () => {
    const sinListo: CaseEpisode = { ...A, roomReady: undefined };
    const m = blockMetrics(BLOCK, [sinListo], [sinListo, B]);
    // A sale 10:00; el siguiente entra 10:40.
    expect(m.turnoverMinutes).toBe(40);
  });

  it('el recambio también se acota al bloque', () => {
    const ultimo: CaseEpisode = {
      ...B,
      outOfRoom: t('13:50'),
      cleanupEnd: t('14:40'),
    };
    // Sale 13:50 y limpia hasta 14:40, pero el bloque termina 14:00: cuentan 10 min.
    expect(blockMetrics(BLOCK, [ultimo], [ultimo]).turnoverMinutes).toBe(10);
  });

  it('un bloque liberado completo no tiene tiempo disponible: sin porcentaje', () => {
    const liberado: BlockRow = {
      ...BLOCK,
      status: 'RELEASED',
      releasedMinutes: 360,
    };
    const m = blockMetrics(liberado, [], []);
    expect(m.releasedMinutes).toBe(360);
    expect(m.blockUtilizationPct).toBeNull();
  });

  it('liberar parte del bloque reduce el denominador', () => {
    const parcial: BlockRow = {
      ...BLOCK,
      status: 'RELEASED',
      releasedMinutes: 60,
    };
    // (255 + 50) / (360 − 60)
    expect(blockMetrics(parcial, [A, B], [A, B]).blockUtilizationPct).toBe(
      101.67,
    );
  });
});
