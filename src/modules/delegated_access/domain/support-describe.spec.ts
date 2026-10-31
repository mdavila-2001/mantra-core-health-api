import { SupportAccessReason } from './support-access.types';
import {
  describeCondition,
  describeFieldFloorNotice,
  describeGrant,
  describeReason,
  describeTraceStep,
} from './support-describe';

describe('support-describe · motivos en lenguaje simple (Anexo C)', () => {
  it('cada motivo nuevo tiene texto cuando niega o desafía', () => {
    const reasons = Object.values(SupportAccessReason).filter(
      (r) => r !== SupportAccessReason.ALLOWED,
    );
    for (const reason of reasons) {
      const text = describeReason(reason, {});
      expect(text.length).toBeGreaterThan(15);
      expect(text).not.toMatch(/\{[^}]+\}/);
    }
  });

  it('rellena los huecos y habla de usted', () => {
    expect(
      describeReason(SupportAccessReason.LEAD_TIME, {
        horasRestantes: 6,
        minHoras: 24,
        aprobador: 'el doctor',
      }),
    ).toBe(
      'Faltan 6 horas para la cita; el permiso pide al menos 24 horas de anticipación y, si no, la aprobación del doctor.',
    );
    expect(
      describeReason(SupportAccessReason.LEAD_TIME, {
        horasRestantes: 6,
        minHoras: 24,
      }),
    ).toBe(
      'Faltan 6 horas para la cita; el permiso pide al menos 24 horas de anticipación.',
    );
    expect(
      describeReason(SupportAccessReason.LEAD_TIME, {
        horasRestantes: 1,
        minHoras: 24,
      }),
    ).toContain('Falta 1 hora para la cita');
    expect(describeReason(SupportAccessReason.REASON_REQUIRED, { n: 10 })).toBe(
      'Escriba el motivo (al menos 10 caracteres).',
    );
    expect(describeReason(SupportAccessReason.NOT_DELEGABLE, {})).toBe(
      'Esto solo lo puede hacer el administrador de seguridad; no se puede delegar.',
    );
    expect(
      describeReason(SupportAccessReason.TIME_WINDOW, {
        ventanas: 'de lunes a viernes de 07:30 a 18:30',
      }),
    ).toContain('07:30');
  });

  it('los pasos que pasan tienen su texto (reasons[])', () => {
    expect(
      describeTraceStep('ENGAGEMENT_ACTIVE', true, { persona: 'Marcos' }),
    ).toBe('El vínculo de Marcos está vigente y recertificado.');
    expect(describeTraceStep('NO_ORG_RULE_DENY', true, {})).toBe(
      'Ninguna regla de la organización lo prohíbe.',
    );
    expect(
      describeTraceStep('LIMIT_OK', true, {
        métrica: 'Cancelaciones',
        usado: 3,
        max: 20,
      }),
    ).toBe('Cancelaciones de hoy: 3 de 20.');
    expect(describeTraceStep('DELEGABLE', true, {})).toBe(
      'Esto se puede dar al personal de apoyo.',
    );
  });

  it('el aviso del piso de visibilidad (G-05)', () => {
    expect(describeFieldFloorNotice('PARTIAL')).toBe(
      'Su organización limita este dato a la vista parcial.',
    );
    expect(describeFieldFloorNotice('REDACT')).toContain('oculto');
    expect(describeFieldFloorNotice('NULLIFY')).toContain('no se muestra');
  });
});

describe('support-describe · condiciones y permisos en lenguaje simple', () => {
  it('describeCondition une las frases con «, » y « y » y empieza por «Puede …»', () => {
    const text = describeCondition({
      schemaVersion: 1,
      time: {
        timeZone: 'America/La_Paz',
        windows: [{ days: [1, 2, 3, 4, 5], from: '07:30', to: '18:30' }],
      },
      network: { require: 'ORG_RULES' },
    });
    expect(text).toBe(
      'Puede solo de lunes a viernes de 07:30 a 18:30 y solo desde la red de la organización.',
    );
  });

  it('describe cada clave del contrato', () => {
    const t = (cond: object) =>
      describeCondition({ schemaVersion: 1, ...cond });
    expect(
      t({
        limits: [{ metric: 'ACTIONS', per: 'DAY', max: 20, onExceed: 'DENY' }],
      }),
    ).toContain('hasta 20');
    expect(
      t({
        limits: [
          {
            metric: 'DISTINCT_PATIENTS',
            per: 'HOUR',
            max: 15,
            onExceed: 'DENY',
          },
        ],
      }),
    ).toContain('no más de 15 pacientes distintos por hora');
    expect(
      t({
        appointment: {
          leadTime: { minHours: 24, onViolation: 'REQUIRE_APPROVAL' },
        },
      }),
    ).toBe(
      'Puede con al menos 24 horas de anticipación; si no, necesita la aprobación del doctor.',
    );
    expect(
      t({ appointment: { window: { daysBefore: 1, daysAfter: 14 } } }),
    ).toContain('entre ayer y los próximos 14 días');
    expect(t({ appointment: { horizon: { maxDaysAhead: 90 } } })).toContain(
      'hasta 90 días hacia adelante',
    );
    expect(t({ patients: { isMinor: false } })).toContain('adultos');
    expect(t({ patients: { coverage: { mode: 'INSURED_ONLY' } } })).toContain(
      'asegurados',
    );
    expect(
      t({ patients: { exclude: { minors: true, flags: ['VIP'] } } }),
    ).toContain('no con menores');
    expect(t({ channels: { allow: ['CHAT'] } })).toContain('solo por chat');
    expect(
      t({
        amount: {
          currency: 'BOB',
          perTransactionMax: 2000,
          perDayMax: 20000,
          onExceed: 'DENY',
        },
      }),
    ).toContain('hasta Bs 2000 por operación y Bs 20000 por día');
    expect(t({ session: { maxSessionMinutes: 240 } })).toContain(
      'sesiones de hasta 4 horas',
    );
    expect(t({ device: { knownOnly: true } })).toContain('equipo de confianza');
    expect(t({ presence: { doctor: 'ONLINE' } })).toContain(
      'mientras el doctor esté conectado',
    );
    expect(
      t({ fields: { 'agenda.appointment.view.reason': { mask: 'PARTIAL' } } }),
    ).toContain('el motivo de consulta solo parcial');
    expect(
      t({
        obligations: {
          requireReason: { minLength: 10 },
          stepUp: { maxAgeMinutes: 5 },
        },
      }),
    ).toContain('pidiendo motivo');
  });

  it('una condición vacía no dice nada y es determinista', () => {
    expect(describeCondition({ schemaVersion: 1 })).toBe('');
    const cond = {
      schemaVersion: 1,
      network: { require: 'ORG_RULES' as const },
      device: { knownOnly: true },
    };
    expect(describeCondition(cond)).toBe(describeCondition(cond));
  });

  it('describeGrant nombra los átomos por su texto simple y reúne las condiciones', () => {
    const text = describeGrant({
      atoms: ['agenda.appointment.view', 'agenda.appointment.cancel'],
      condition: { schemaVersion: 1, network: { require: 'ORG_RULES' } },
    });
    expect(text).toContain('Ver la agenda');
    expect(text).toContain('Cancelar citas');
    expect(text).toContain('solo desde la red de la organización');
  });
});
