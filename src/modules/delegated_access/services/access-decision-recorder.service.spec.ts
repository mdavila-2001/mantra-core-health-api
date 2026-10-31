import { jest } from '@jest/globals';
import {
  AccessDecisionRecorder,
  DECISION_DEDUP_WINDOW_MS,
  requiredSensitivity,
} from './access-decision-recorder.service';
import { AccessUsageRecorder, isOffHours } from './access-usage-recorder';
import { DELEG } from '../delegated_access.concepts';
import { SupportAccessReason, type SupportAccessDecision } from '../domain';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const NOW = new Date('2026-11-03T14:30:00Z');
const T0 = NOW.getTime();
const logger = {
  setContext: mockFn(),
  error: mockFn(),
  warn: mockFn(),
  info: mockFn(),
};

function build(appendNow = mockFn().mockResolvedValue('row-id')) {
  const tx = {
    isInTransaction: () => true,
    transactional: (fn: any) => fn(tx),
  };
  const repo = { appendNow };
  const recorder = new AccessDecisionRecorder(
    {} as any,
    repo as any,
    logger as any,
  );
  return { recorder, repo, tx };
}

const deny: SupportAccessDecision = {
  allowed: false,
  effect: 'DENY',
  reason: SupportAccessReason.TIME_WINDOW,
  atom: 'agenda.appointment.cancel',
  unmet: [
    {
      key: 'time',
      code: SupportAccessReason.TIME_WINDOW,
      status: 'F',
      details: { from: '08:00', paciente: 'María Pérez Rojas' },
    },
  ],
};
const input = (
  decision: SupportAccessDecision,
  at = NOW,
  extra: Record<string, unknown> = {},
) => ({
  tenantId: 't1',
  userId: 'u1',
  action: 'schedule.cancel',
  decision,
  target: { practitionerRoleAssignmentId: 'pra-1' },
  context: {
    patientProfileId: 'pac-1',
    ip: '198.51.100.7',
    sessionId: '0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b',
  } as any,
  now: at,
  ...extra,
});

describe('AccessDecisionRecorder.plan', () => {
  const { recorder } = build();
  it('todo DENY y CHALLENGE se anota; no es obligatorio', () => {
    expect(recorder.plan('schedule.cancel', deny)).toEqual({
      write: true,
      required: false,
    });
    expect(
      recorder.plan('schedule.cancel', { ...deny, effect: 'CHALLENGE' }),
    ).toEqual({ write: true, required: false });
  });
  it('un PERMIT de sensibilidad ALTA es obligatorio, también por alias heredado (billing.collect)', () => {
    const permit: SupportAccessDecision = {
      allowed: true,
      effect: 'PERMIT',
      reason: SupportAccessReason.ALLOWED,
    };
    expect(recorder.plan('billing.collect', permit)).toEqual({
      write: true,
      required: true,
    });
    expect(recorder.plan('billing.receipt.void', permit)).toEqual({
      write: true,
      required: true,
    });
  });
  it('un PERMIT rutinario no deja fila, salvo que una obligación se haya cumplido (mejor esfuerzo)', () => {
    const permit: SupportAccessDecision = {
      allowed: true,
      effect: 'PERMIT',
      reason: SupportAccessReason.ALLOWED,
    };
    expect(recorder.plan('schedule.view', permit)).toEqual({
      write: false,
      required: false,
    });
    expect(
      recorder.plan('schedule.view', permit, { reason: { minLength: 5 } }),
    ).toEqual({ write: true, required: false });
  });
  it('el umbral se puede subir a CRÍTICA por ajuste; un valor inválido deja el de siempre', () => {
    expect(
      requiredSensitivity({
        SUPPORT_DECISION_LOG_REQUIRED_SENSITIVITY: 'CRITICA',
      }),
    ).toBe('CRITICAL');
    expect(
      requiredSensitivity({
        SUPPORT_DECISION_LOG_REQUIRED_SENSITIVITY: 'basura',
      }),
    ).toBe('HIGH');
    expect(requiredSensitivity({})).toBe('HIGH');
  });
});

describe('AccessDecisionRecorder.write', () => {
  it('escribe el asiento con identificadores, motivo y números; sin texto libre ni PHI', async () => {
    const { recorder, repo, tx } = build();
    await expect(
      recorder.write(tx as any, input(deny), { write: true, required: false }),
    ).resolves.toBe(true);
    const row = repo.appendNow.mock.calls[0][1];
    expect(row).toMatchObject({
      tenantId: 't1',
      userId: 'u1',
      permissionCode: 'agenda.appointment.cancel',
      effectConceptId: DELEG.DECISION_EFFECT_DENY,
      reasonCode: 'TIME_WINDOW',
      patientProfileId: 'pac-1',
      ip: '198.51.100.7',
      recordedAt: NOW,
    });
    expect(row.detail.asked).toBe('schedule.cancel');
    expect(JSON.stringify(row.detail)).not.toContain('María');
    expect(row.detail.unmet[0]).toEqual({
      key: 'time',
      code: 'TIME_WINDOW',
      status: 'F',
      details: { from: '08:00' },
    });
  });

  it('descarta ip inválida y session que no es uuid (la columna es inet/uuid y no debe romper la evidencia)', async () => {
    const { recorder, repo, tx } = build();
    await recorder.write(
      tx as any,
      input(deny, NOW, {
        context: { ip: 'no-es-ip', sessionId: 'token-opaco' },
      }),
      { write: true, required: false },
    );
    const row = repo.appendNow.mock.calls[0][1];
    expect(row.ip).toBeUndefined();
    expect(row.sessionId).toBeUndefined();
  });

  it('deduplica sin UPDATE: las repeticiones en 60 s se cuentan y se anotan en el asiento SIGUIENTE', async () => {
    const { recorder, repo, tx } = build();
    const plan = { write: true, required: false };
    expect(
      await recorder.write(tx as any, input(deny, new Date(T0)), plan),
    ).toBe(true);
    expect(
      await recorder.write(tx as any, input(deny, new Date(T0 + 5_000)), plan),
    ).toBe(false);
    expect(
      await recorder.write(tx as any, input(deny, new Date(T0 + 30_000)), plan),
    ).toBe(false);
    expect(repo.appendNow).toHaveBeenCalledTimes(1);
    expect(
      await recorder.write(
        tx as any,
        input(deny, new Date(T0 + DECISION_DEDUP_WINDOW_MS + 1)),
        plan,
      ),
    ).toBe(true);
    expect(repo.appendNow).toHaveBeenCalledTimes(2);
    expect(repo.appendNow.mock.calls[1][1].detail.repeat).toBe(2);
    // El asiento ya escrito no se toca: el repositorio solo ANEXA.
    expect(Object.getOwnPropertyNames(Object.getPrototypeOf(repo))).not.toEqual(
      expect.arrayContaining(['update']),
    );
  });

  it('otro motivo, otra persona u otro objetivo NO se deduplica', async () => {
    const { recorder, repo, tx } = build();
    const plan = { write: true, required: false };
    await recorder.write(tx as any, input(deny), plan);
    await recorder.write(
      tx as any,
      input({ ...deny, reason: SupportAccessReason.LEAD_TIME }),
      plan,
    );
    await recorder.write(tx as any, input(deny, NOW, { userId: 'u2' }), plan);
    await recorder.write(
      tx as any,
      input(deny, NOW, { target: { practitionerRoleAssignmentId: 'pra-2' } }),
      plan,
    );
    expect(repo.appendNow).toHaveBeenCalledTimes(4);
  });

  it('N-7: otro PACIENTE no se deduplica (sondear pacientes distintos deja un asiento por paciente)', async () => {
    const { recorder, repo, tx } = build();
    const plan = { write: true, required: false };
    for (let i = 0; i < 100; i += 1) {
      const written = await recorder.write(
        tx as any,
        input(deny, new Date(T0 + i * 100), {
          context: { patientProfileId: `pac-${i}` },
        }),
        plan,
      );
      expect(written).toBe(true);
    }
    expect(repo.appendNow).toHaveBeenCalledTimes(100);
    const patients = new Set(
      repo.appendNow.mock.calls.map((call: any[]) => call[1].patientProfileId),
    );
    expect(patients.size).toBe(100);
    // El mismo paciente sondeado dos veces sí se sigue deduplicando.
    expect(
      await recorder.write(
        tx as any,
        input(deny, new Date(T0 + 10_000), {
          context: { patientProfileId: 'pac-3' },
        }),
        plan,
      ),
    ).toBe(false);
  });

  it('un PERMIT nunca se deduplica: cada uno es evidencia', async () => {
    const { recorder, repo, tx } = build();
    const permit: SupportAccessDecision = {
      allowed: true,
      effect: 'PERMIT',
      reason: SupportAccessReason.ALLOWED,
      grantId: 'g1',
    };
    const plan = { write: true, required: true };
    await recorder.write(
      tx as any,
      input(permit, new Date(T0), { action: 'billing.receipt.void' }),
      plan,
    );
    await recorder.write(
      tx as any,
      input(permit, new Date(T0 + 1), { action: 'billing.receipt.void' }),
      plan,
    );
    expect(repo.appendNow).toHaveBeenCalledTimes(2);
  });

  it('si la base rechaza el asiento, la excepción sale (el llamador decide: obligatorio ⇒ DENY) y las repeticiones no se pierden', async () => {
    const appendNow = mockFn().mockRejectedValue(new Error('db caída'));
    const { recorder, tx } = build(appendNow);
    await expect(
      recorder.write(tx as any, input(deny), { write: true, required: true }),
    ).rejects.toThrow('db caída');
    expect(logger.error).toHaveBeenCalled();
  });

  it('con una transacción en curso escribe dentro de un punto de guardado (no envenena la del llamador)', async () => {
    const savepoint = mockFn((fn: any) => fn({ isInTransaction: () => true }));
    const em = { isInTransaction: () => true, transactional: savepoint };
    const { recorder } = build();
    await recorder.write(em as any, input(deny), {
      write: true,
      required: false,
    });
    expect(savepoint).toHaveBeenCalledTimes(1);
  });
});

describe('AccessUsageRecorder', () => {
  it('acumula por permiso y hora y vuelca con UPSERT; nunca lanza', async () => {
    const upsertBuckets = mockFn().mockResolvedValue(undefined);
    const em = { fork: () => ({}) };
    const recorder = new AccessUsageRecorder(
      em as any,
      { upsertBuckets } as any,
      logger as any,
    );
    const base = {
      tenantId: 't1',
      userId: 'u1',
      grantId: 'g1',
      permissionCode: 'patients.search.exact',
      at: NOW,
    };
    recorder.note({ ...base, effect: 'PERMIT', patientProfileId: 'p1' });
    recorder.note({ ...base, effect: 'PERMIT', patientProfileId: 'p2' });
    recorder.note({ ...base, effect: 'PERMIT', patientProfileId: 'p1' });
    recorder.note({ ...base, effect: 'DENY' });
    await recorder.flush();
    expect(upsertBuckets).toHaveBeenCalledTimes(1);
    const [, deltas] = upsertBuckets.mock.calls[0];
    expect(deltas).toHaveLength(1);
    expect(deltas[0]).toMatchObject({
      permit: 3,
      deny: 1,
      challenge: 0,
      distinctPatients: 2,
      bucketStart: new Date('2026-11-03T14:00:00Z'),
    });
    await recorder.onModuleDestroy();
  });

  it('si el volcado falla no pierde los contadores: vuelven al buffer y salen en el siguiente', async () => {
    const upsertBuckets = mockFn()
      .mockRejectedValueOnce(new Error('caída'))
      .mockResolvedValue(undefined);
    const recorder = new AccessUsageRecorder(
      { fork: () => ({}) } as any,
      { upsertBuckets } as any,
      logger as any,
    );
    const base = {
      tenantId: 't1',
      userId: 'u1',
      grantId: 'g1',
      permissionCode: 'schedule.view',
      at: NOW,
    };
    recorder.note({ ...base, effect: 'PERMIT' });
    recorder.note({ ...base, effect: 'PERMIT' });
    await recorder.flush();
    await recorder.flush();
    expect(upsertBuckets).toHaveBeenCalledTimes(2);
    expect(upsertBuckets.mock.calls[1][1][0]).toMatchObject({ permit: 2 });
    await recorder.onModuleDestroy();
  });

  it('fuera de horario: antes de las 07:00 o desde las 20:00 en la zona de la organización', () => {
    expect(isOffHours(new Date('2026-11-03T10:59:00Z'), 'America/La_Paz')).toBe(
      true,
    ); // 06:59
    expect(isOffHours(new Date('2026-11-03T11:00:00Z'), 'America/La_Paz')).toBe(
      false,
    ); // 07:00
    expect(isOffHours(new Date('2026-11-04T00:00:00Z'), 'America/La_Paz')).toBe(
      true,
    ); // 20:00
  });
});
