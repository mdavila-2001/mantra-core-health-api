import {
  ANOMALY_DEFAULTS,
  ANOMALY_KINDS,
  anomalyWindow,
  detectBrowsePatients,
  detectCancelSpike,
  detectDeniedBurst,
  detectInactiveAccount,
  detectOffHours,
  detectPrivilegeCreep,
  detectSearchSpike,
  mean,
  percentile,
} from './support-anomaly-rules';
import { assessInactivity } from './support-lifecycle';
import { privilegeCreep } from './support-privilege-score';
import { SUPPORT_TEMPLATE_DEFAULTS_V2 } from './support-template-packages';

const ZONE = 'America/La_Paz';
const NOW = new Date('2026-11-03T10:30:00-04:00');
const at = (iso: string): Date => new Date(`${iso}-04:00`);
const min = (n: number, from = NOW): Date =>
  new Date(from.getTime() + n * 60_000);
const win = {
  windowStart: at('2026-11-03T09:00'),
  windowEnd: at('2026-11-03T10:00'),
};

describe('estadística de apoyo', () => {
  it('percentile (rango más cercano): p95 de 20 valores es el 19.º', () => {
    const values = [...Array(20).keys()].map((i) => i + 1);
    expect(percentile(values, 95)).toBe(19);
    expect(percentile([...values].reverse(), 95)).toBe(19);
    expect(percentile([5], 95)).toBe(5);
    expect(percentile([], 95)).toBe(0);
    expect(percentile([1, 2, 3, 4], 0)).toBe(1);
    expect(percentile([1, 2, 3, 4], 100)).toBe(4);
  });
  it('mean', () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(mean([])).toBe(0);
  });
});

describe('las 7 reglas del contrato', () => {
  it('los 7 tipos, con los nombres del contrato', () => {
    expect([...ANOMALY_KINDS]).toEqual([
      'ANOMALY_SEARCH_SPIKE',
      'ANOMALY_CANCEL_SPIKE',
      'ANOMALY_OFF_HOURS',
      'ANOMALY_DENIED_BURST',
      'ANOMALY_BROWSE_PATIENTS',
      'ANOMALY_INACTIVE_ACCOUNT',
      'ANOMALY_PRIVILEGE_CREEP',
    ]);
  });
  it('umbrales por defecto del contrato', () => {
    expect(ANOMALY_DEFAULTS).toMatchObject({
      searchSpike: { minThreshold: 15, multiplier: 3 },
      cancelSpike: { minThreshold: 10, multiplier: 3 },
      offHours: { minActions: 5, defaultFrom: '07:00', defaultTo: '20:00' },
      deniedBurst: { minDecisions: 10, windowMinutes: 10 },
      browsePatients: { maxDistinctPatients: 40 },
    });
  });
});

describe('ANOMALY_SEARCH_SPIKE · PERMIT en 60 min > max(15, 3 × p95 horario de 28 días)', () => {
  // p95 (rango más cercano) de esta línea base = 4.
  const baseline = [...Array(10).fill(2), ...Array(9).fill(4), 7];
  it('M-01: 18 búsquedas en la última hora de Marcos es un pico; 15 no', () => {
    const spike = detectSearchSpike({
      ...win,
      permitsInWindow: 18,
      hourlyBaseline: baseline,
    });
    expect(spike).toMatchObject({
      kind: 'ANOMALY_SEARCH_SPIKE',
      observed: 18,
      baseline: 4,
      threshold: 15,
      windowStart: win.windowStart,
      windowEnd: win.windowEnd,
    });
    expect(
      detectSearchSpike({
        ...win,
        permitsInWindow: 15,
        hourlyBaseline: baseline,
      }),
    ).toBeUndefined();
  });
  it('con una línea base alta manda 3 × p95', () => {
    const high = Array(20).fill(10);
    expect(
      detectSearchSpike({ ...win, permitsInWindow: 30, hourlyBaseline: high }),
    ).toBeUndefined();
    expect(
      detectSearchSpike({ ...win, permitsInWindow: 31, hourlyBaseline: high }),
    ).toMatchObject({ threshold: 30, baseline: 10 });
  });
  it('sin línea base, el piso de 15', () => {
    expect(
      detectSearchSpike({ ...win, permitsInWindow: 16, hourlyBaseline: [] }),
    ).toMatchObject({ threshold: 15, baseline: null });
    expect(
      detectSearchSpike({ ...win, permitsInWindow: 15, hourlyBaseline: [] }),
    ).toBeUndefined();
  });
  it('la evidencia son solo números (cero PHI)', () => {
    const f = detectSearchSpike({
      ...win,
      permitsInWindow: 18,
      hourlyBaseline: baseline,
    });
    for (const v of Object.values(f?.evidence ?? {}))
      expect(['number', 'string']).toContain(typeof v);
    expect(JSON.stringify(f?.evidence)).toMatch(/permitsInWindow/);
  });
});

describe('ANOMALY_CANCEL_SPIKE · cancelaciones del día > max(10, 3 × promedio diario de 28 días)', () => {
  const day = {
    windowStart: at('2026-11-03T00:00'),
    windowEnd: at('2026-11-04T00:00'),
  };
  it('piso de 10 con promedio bajo', () => {
    expect(
      detectCancelSpike({
        ...day,
        cancelsInWindow: 11,
        dailyBaseline: [1, 2, 3],
      }),
    ).toMatchObject({
      kind: 'ANOMALY_CANCEL_SPIKE',
      observed: 11,
      threshold: 10,
      baseline: 2,
    });
    expect(
      detectCancelSpike({
        ...day,
        cancelsInWindow: 10,
        dailyBaseline: [1, 2, 3],
      }),
    ).toBeUndefined();
  });
  it('con promedio alto manda 3 × promedio', () => {
    const base = Array(28).fill(6);
    expect(
      detectCancelSpike({ ...day, cancelsInWindow: 18, dailyBaseline: base }),
    ).toBeUndefined();
    expect(
      detectCancelSpike({ ...day, cancelsInWindow: 19, dailyBaseline: base }),
    ).toMatchObject({ threshold: 18 });
  });
});

describe('ANOMALY_OFF_HOURS · ≥ 5 acciones de sensibilidad ≥ MEDIA fuera de ventana', () => {
  const day = {
    windowStart: at('2026-11-03T00:00'),
    windowEnd: at('2026-11-04T00:00'),
  };
  const ev = (
    hhmm: string,
    sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
  ) => ({ at: at(`2026-11-03T${hhmm}`), sensitivity });
  it('sin ventanas propias rige 07:00-20:00 de la organización', () => {
    const events = [
      ev('06:59'),
      ev('20:00'),
      ev('21:30'),
      ev('23:00'),
      ev('02:00'),
    ];
    expect(detectOffHours({ ...day, events, timeZone: ZONE })).toMatchObject({
      kind: 'ANOMALY_OFF_HOURS',
      observed: 5,
      threshold: 5,
    });
  });
  it('4 no bastan, y lo de sensibilidad BAJA no cuenta', () => {
    const four = [ev('06:00'), ev('21:00'), ev('22:00'), ev('23:00')];
    expect(
      detectOffHours({ ...day, events: four, timeZone: ZONE }),
    ).toBeUndefined();
    expect(
      detectOffHours({
        ...day,
        events: [...four, ev('05:00', 'LOW')],
        timeZone: ZONE,
      }),
    ).toBeUndefined();
    expect(
      detectOffHours({
        ...day,
        events: [...four, ev('05:00', 'CRITICAL')],
        timeZone: ZONE,
      })?.observed,
    ).toBe(5);
  });
  it('el límite 07:00 es parte de la jornada (semiabierto) y 20:00 ya no', () => {
    const inside = [
      ev('07:00'),
      ev('12:00'),
      ev('19:59'),
      ev('08:00'),
      ev('09:00'),
    ];
    expect(
      detectOffHours({ ...day, events: inside, timeZone: ZONE }),
    ).toBeUndefined();
  });
  it('con ventanas propias manda la ventana de la persona', () => {
    const windows = [{ days: [1, 2, 3, 4, 5], from: '07:30', to: '18:30' }];
    const events = [
      ev('19:00'),
      ev('19:10'),
      ev('19:20'),
      ev('19:30'),
      ev('19:40'),
    ];
    expect(
      detectOffHours({ ...day, events, windows, timeZone: ZONE })?.observed,
    ).toBe(5);
    // Dentro de la ventana de la persona aunque fuera de 07-20 no es posible aquí; el sábado sí es fuera.
    const saturday = {
      windowStart: at('2026-11-07T00:00'),
      windowEnd: at('2026-11-08T00:00'),
    };
    const sat = Array.from({ length: 5 }, (_, i) => ({
      at: at(`2026-11-07T1${i}:00`),
      sensitivity: 'MEDIUM' as const,
    }));
    expect(
      detectOffHours({ ...saturday, events: sat, windows, timeZone: ZONE })
        ?.observed,
    ).toBe(5);
    expect(
      detectOffHours({ ...saturday, events: sat, timeZone: ZONE }),
    ).toBeUndefined();
  });
  it('solo cuenta lo que cae dentro del día evaluado', () => {
    const events = [
      ev('21:00'),
      ev('22:00'),
      ev('23:00'),
      ev('23:30'),
      { at: at('2026-11-04T01:00'), sensitivity: 'HIGH' as const },
    ];
    expect(detectOffHours({ ...day, events, timeZone: ZONE })).toBeUndefined();
  });
  it('una zona inválida cuenta como fuera (falla cerrado hacia el aviso)', () => {
    const events = Array.from({ length: 5 }, (_, i) => ev(`1${i}:00`));
    expect(
      detectOffHours({ ...day, events, timeZone: 'Nada/Zona' })?.observed,
    ).toBe(5);
  });
});

describe('ANOMALY_DENIED_BURST · ≥ 10 DENY o CHALLENGE de la misma persona en 10 min', () => {
  const times = (n: number, startMin = 0, stepSec = 30): Date[] =>
    Array.from(
      { length: n },
      (_, i) => new Date(min(startMin).getTime() + i * stepSec * 1000),
    );
  it('10 en menos de 10 minutos es una ráfaga; 9 no', () => {
    expect(detectDeniedBurst({ decisions: times(10) })).toMatchObject({
      kind: 'ANOMALY_DENIED_BURST',
      observed: 10,
      threshold: 10,
      windowStart: min(0),
      windowEnd: min(10),
    });
    expect(detectDeniedBurst({ decisions: times(9) })).toBeUndefined();
  });
  it('10 repartidas en más de 10 minutos no lo son', () => {
    expect(detectDeniedBurst({ decisions: times(10, 0, 70) })).toBeUndefined();
  });
  it('el límite del intervalo es semiabierto: a exactamente 10 minutos ya no entra', () => {
    const edge = [...times(9, 0, 10), min(10)];
    expect(detectDeniedBurst({ decisions: edge })).toBeUndefined();
  });
  it('la ventana arranca en la primera decisión de la primera ráfaga (idempotente al llegar más eventos)', () => {
    const base = [min(-50), ...times(10, 5)];
    const f1 = detectDeniedBurst({ decisions: base });
    const f2 = detectDeniedBurst({ decisions: [...base, min(14)] });
    expect(f1?.windowStart).toEqual(min(5));
    expect(f2?.windowStart).toEqual(f1?.windowStart);
    expect(f2?.observed).toBeGreaterThanOrEqual(f1?.observed ?? 0);
  });
  it('el orden de entrada no importa', () => {
    const d = times(12);
    expect(detectDeniedBurst({ decisions: [...d].reverse() })).toEqual(
      detectDeniedBurst({ decisions: d }),
    );
  });
  it('los parámetros son ajustables', () => {
    expect(
      detectDeniedBurst({
        decisions: times(5),
        minDecisions: 5,
        windowMinutes: 5,
      })?.observed,
    ).toBe(5);
  });
});

describe('ANOMALY_BROWSE_PATIENTS · > 40 pacientes distintos vistos en un día sin cita', () => {
  const day = {
    windowStart: at('2026-11-03T00:00'),
    windowEnd: at('2026-11-04T00:00'),
  };
  const views = (n: number, hasAppointment: boolean, prefix = 'p') =>
    Array.from({ length: n }, (_, i) => ({
      patientId: `${prefix}${i}`,
      hasAppointment,
    }));
  it('41 sin cita es anomalía; 40 no', () => {
    expect(
      detectBrowsePatients({ ...day, views: views(41, false) }),
    ).toMatchObject({
      kind: 'ANOMALY_BROWSE_PATIENTS',
      observed: 41,
      threshold: 40,
    });
    expect(
      detectBrowsePatients({ ...day, views: views(40, false) }),
    ).toBeUndefined();
  });
  it('los pacientes con cita no cuentan y los repetidos cuentan una vez', () => {
    expect(
      detectBrowsePatients({
        ...day,
        views: [...views(30, false), ...views(100, true, 'c')],
      }),
    ).toBeUndefined();
    expect(
      detectBrowsePatients({
        ...day,
        views: [...views(41, false), ...views(41, false)],
      })?.observed,
    ).toBe(41);
  });
  it('un paciente visto con y sin cita se considera con cita', () => {
    const mixed = [
      ...views(41, false),
      { patientId: 'p0', hasAppointment: true },
    ];
    expect(detectBrowsePatients({ ...day, views: mixed })).toBeUndefined();
  });
  it('la evidencia es solo el conteo: ningún identificador de paciente', () => {
    const f = detectBrowsePatients({ ...day, views: views(45, false) });
    expect(JSON.stringify(f?.evidence)).not.toMatch(/p\d/);
  });
});

describe('ANOMALY_INACTIVE_ACCOUNT y ANOMALY_PRIVILEGE_CREEP', () => {
  const day = {
    windowStart: at('2026-11-03T00:00'),
    windowEnd: at('2026-11-04T00:00'),
  };
  it('cuenta inactiva: usa la medición de inactividad (D-04)', () => {
    const inactive = assessInactivity({
      now: NOW,
      referenceStart: new Date(NOW.getTime() - 400 * 86_400_000),
      lastLoginAt: new Date(NOW.getTime() - 50 * 86_400_000),
    });
    expect(
      detectInactiveAccount({
        ...day,
        assessment: inactive,
        inactivityDays: 45,
      }),
    ).toMatchObject({
      kind: 'ANOMALY_INACTIVE_ACCOUNT',
      observed: 50,
      threshold: 45,
    });
    const active = assessInactivity({
      now: NOW,
      referenceStart: new Date(NOW.getTime() - 400 * 86_400_000),
      lastLoginAt: new Date(NOW.getTime() - 5 * 86_400_000),
    });
    expect(
      detectInactiveAccount({ ...day, assessment: active, inactivityDays: 45 }),
    ).toBeUndefined();
  });
  it('acumulación: usa la deriva (M-01: 30 puntos, línea base 15, deriva 15 ≥ 15)', () => {
    const creep = privilegeCreep({
      atoms: [
        ...SUPPORT_TEMPLATE_DEFAULTS_V2.BILLING_CASHIER,
        'billing.discount.apply',
        'billing.cashbox.close',
        'reports.billing.export',
      ],
      templateCode: 'BILLING_CASHIER',
    });
    expect(detectPrivilegeCreep({ ...day, creep })).toMatchObject({
      kind: 'ANOMALY_PRIVILEGE_CREEP',
      observed: 15,
      baseline: 15,
      threshold: 15,
      evidence: expect.objectContaining({ score: 30 }),
    });
  });
  it('acumulación marcada por concesiones sin revisar también da anomalía', () => {
    const creep = privilegeCreep({
      atoms: ['agenda.appointment.view'],
      templateCode: 'BILLING_CASHIER',
      grantsSinceCertification: 3,
    });
    expect(detectPrivilegeCreep({ ...day, creep })).toMatchObject({
      kind: 'ANOMALY_PRIVILEGE_CREEP',
      evidence: expect.objectContaining({ grantsSinceCertification: 3 }),
    });
  });
  it('sin marca no hay anomalía', () => {
    expect(
      detectPrivilegeCreep({
        ...day,
        creep: privilegeCreep({ atoms: [], templateCode: 'BILLING_CASHIER' }),
      }),
    ).toBeUndefined();
  });
});

describe('anomalyWindow · ventanas idempotentes del barrido', () => {
  it('las reglas por hora miran la última hora completa', () => {
    const w = anomalyWindow(
      'ANOMALY_SEARCH_SPIKE',
      at('2026-11-03T10:17'),
      ZONE,
    );
    expect(w.windowStart).toEqual(at('2026-11-03T09:00'));
    expect(w.windowEnd).toEqual(at('2026-11-03T10:00'));
    // Ejecutar dos veces en la misma hora da la misma ventana.
    expect(
      anomalyWindow('ANOMALY_DENIED_BURST', at('2026-11-03T10:59'), ZONE),
    ).toEqual(
      anomalyWindow('ANOMALY_DENIED_BURST', at('2026-11-03T10:01'), ZONE),
    );
  });
  it('las reglas por día miran el día de la organización', () => {
    for (const kind of [
      'ANOMALY_CANCEL_SPIKE',
      'ANOMALY_OFF_HOURS',
      'ANOMALY_BROWSE_PATIENTS',
      'ANOMALY_INACTIVE_ACCOUNT',
      'ANOMALY_PRIVILEGE_CREEP',
    ] as const) {
      const w = anomalyWindow(kind, at('2026-11-03T22:30'), ZONE);
      expect(w.windowStart).toEqual(at('2026-11-03T00:00'));
      expect(w.windowEnd).toEqual(at('2026-11-04T00:00'));
    }
  });
});
