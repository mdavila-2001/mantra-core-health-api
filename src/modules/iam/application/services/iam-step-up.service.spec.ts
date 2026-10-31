import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../common';
import { IamErrorReason } from '../../iam.error-reasons';
import { StepUpUnavailableError } from '../ports/step-up.port';
import { IamStepUpService } from './iam-step-up.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const NOW = Date.parse('2026-10-30T12:00:00Z');
const actor = { id: 'u1', sessionId: 'sid-1', roles: ['USER'] } as any;

const verifiedFactor = (over: Record<string, unknown> = {}): any => ({
  id: 'f1',
  userId: 'u1',
  stateConceptId: CONCEPTS.STATE_VERIFIED,
  secretEncrypted: 'CIFRADO-NO-SALE',
  ...over,
});

interface Setup {
  factors?: any[];
  consume?: any;
  stamp?: any;
  assertAvailable?: any;
  ageMinutes?: any;
  failedCount?: number;
  lastLoginAt?: Date;
}

function build(opts: Setup = {}) {
  const forked = {
    flush: mockFn().mockResolvedValue(undefined),
    tag: 'fork',
  };
  const em = { fork: mockFn(() => forked) };
  const mfaRepo = {
    findVerifiedByUser: mockFn().mockResolvedValue(
      opts.factors ?? [verifiedFactor()],
    ),
  };
  const totp = {
    consume:
      opts.consume ??
      mockFn().mockResolvedValue({ valid: true, factorId: 'f1' }),
  };
  const eventsRepo = {
    record: mockFn(),
    countFailedMfaSince: mockFn().mockResolvedValue(opts.failedCount ?? 0),
    // B-B10: cerrojo por persona (pg_advisory_xact_lock); en este doble, sin competencia, solo ejecuta.
    withMfaAttemptLock: mockFn(
      async (_em: any, _userId: string, work: () => Promise<unknown>) => work(),
    ),
  };
  const usersRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'u1',
      lastLoginAt: opts.lastLoginAt ?? new Date('2026-10-30T08:00:00Z'),
    }),
  };
  const store = {
    assertAvailable:
      opts.assertAvailable ?? mockFn().mockResolvedValue(undefined),
    stamp:
      opts.stamp ??
      mockFn().mockResolvedValue({ verifiedAt: new Date(NOW), ttlMinutes: 60 }),
    ageMinutes: opts.ageMinutes ?? mockFn().mockResolvedValue(null),
    clear: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IamStepUpService(
    em as any,
    mfaRepo as any,
    totp as any,
    eventsRepo as any,
    usersRepo as any,
    store as any,
    logger as any,
  );
  return {
    service,
    mfaRepo,
    totp,
    eventsRepo,
    usersRepo,
    store,
    logger,
    forked,
  };
}

/** Lo que lanza una promesa rechazada, para inspeccionar status, code y reason. */
async function caught(p: Promise<unknown>): Promise<any> {
  try {
    await p;
  } catch (err) {
    return err;
  }
  throw new Error('no lanzó');
}

describe('IamStepUpService.verify', () => {
  it('con un código válido sella la sesión y responde { verifiedAt, validForMinutes }', async () => {
    const d = build();
    const res = await d.service.verify(actor, { code: '123456' }, '10.0.0.1');
    expect(res).toEqual({ verifiedAt: new Date(NOW), validForMinutes: 60 });
    expect(d.store.stamp).toHaveBeenCalledWith('sid-1');
  });

  it('reutiliza IamTotpService (código de un solo uso) con los factores verificados de quien llama', async () => {
    const d = build();
    await d.service.verify(actor, { code: '123456' });
    expect(d.mfaRepo.findVerifiedByUser).toHaveBeenCalledWith(d.forked, 'u1');
    expect(d.totp.consume).toHaveBeenCalledWith(
      'u1',
      [expect.objectContaining({ id: 'f1' })],
      '123456',
    );
  });

  it('sin factor verificado: 422 MFA_NOT_ENROLLED, sin tocar el código ni sellar', async () => {
    const d = build({ factors: [] });
    const err = await caught(d.service.verify(actor, { code: '123456' }));
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe(IamErrorReason.MFA_NOT_ENROLLED);
    expect(d.totp.consume).not.toHaveBeenCalled();
    expect(d.store.stamp).not.toHaveBeenCalled();
  });

  it('ignora un factor verificado sin secreto (no hay con qué comprobar)', async () => {
    const d = build({ factors: [verifiedFactor({ secretEncrypted: null })] });
    const err = await caught(d.service.verify(actor, { code: '123456' }));
    expect(err.reason).toBe(IamErrorReason.MFA_NOT_ENROLLED);
  });

  it('código inválido: 422 MFA_CODE_INVALID, evento de fallo del segundo factor y NO sella', async () => {
    const d = build({ consume: mockFn().mockResolvedValue({ valid: false }) });
    const err = await caught(
      d.service.verify(actor, { code: '000000' }, '10.0.0.1'),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe(IamErrorReason.MFA_CODE_INVALID);
    expect(d.store.stamp).not.toHaveBeenCalled();
    expect(d.eventsRepo.record).toHaveBeenCalledWith(
      d.forked,
      expect.objectContaining({
        eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
        outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
        userId: 'u1',
        ip: '10.0.0.1',
        detailJson: { reason: 'bad-mfa', flow: 'step-up' },
      }),
    );
    expect(d.forked.flush).toHaveBeenCalled();
  });

  it('el evento de fallo no guarda el código presentado', async () => {
    const d = build({ consume: mockFn().mockResolvedValue({ valid: false }) });
    await caught(d.service.verify(actor, { code: '654321' }));
    expect(JSON.stringify(d.eventsRepo.record.mock.calls)).not.toContain(
      '654321',
    );
    expect(JSON.stringify(d.logger.warn.mock.calls)).not.toContain('654321');
    expect(JSON.stringify(d.logger.info.mock.calls)).not.toContain('654321');
  });

  it('alcanzado el umbral de fallos del segundo factor desde el último login: 429 y no se gasta ni se prueba el código', async () => {
    const d = build({ failedCount: 5 });
    const err = await caught(d.service.verify(actor, { code: '123456' }));
    expect(err.getStatus()).toBe(429);
    expect(err.reason).toBe(IamErrorReason.STEP_UP_ATTEMPTS_EXCEEDED);
    expect(d.totp.consume).not.toHaveBeenCalled();
    expect(d.eventsRepo.countFailedMfaSince).toHaveBeenCalledWith(
      d.forked,
      'u1',
      new Date('2026-10-30T08:00:00Z'),
    );
  });

  it('con 4 fallos todavía deja intentar', async () => {
    const d = build({ failedCount: 4 });
    await expect(
      d.service.verify(actor, { code: '123456' }),
    ).resolves.toBeDefined();
  });

  it('Redis caído ANTES de verificar: 503 STEP_UP_UNAVAILABLE y el código NO se consume', async () => {
    const d = build({
      assertAvailable: mockFn().mockRejectedValue(
        new StepUpUnavailableError('down'),
      ),
    });
    const err = await caught(d.service.verify(actor, { code: '123456' }));
    expect(err.getStatus()).toBe(503);
    expect(err.reason).toBe(IamErrorReason.STEP_UP_UNAVAILABLE);
    expect(err.code).toBe('DEPENDENCY_UNAVAILABLE');
    expect(d.totp.consume).not.toHaveBeenCalled();
  });

  it('Redis cae justo al sellar: 503 STEP_UP_UNAVAILABLE (no finge un sello)', async () => {
    const d = build({
      stamp: mockFn().mockRejectedValue(new StepUpUnavailableError('down')),
    });
    const err = await caught(d.service.verify(actor, { code: '123456' }));
    expect(err.getStatus()).toBe(503);
    expect(err.reason).toBe(IamErrorReason.STEP_UP_UNAVAILABLE);
  });

  it('un error que no es de disponibilidad no se disfraza de STEP_UP_UNAVAILABLE', async () => {
    const d = build({
      stamp: mockFn().mockRejectedValue(new TypeError('bug')),
    });
    await expect(d.service.verify(actor, { code: '123456' })).rejects.toThrow(
      TypeError,
    );
  });

  it('un token sin sesión (sin sid) no puede sellar: 422 STEP_UP_SESSION_REQUIRED, nunca 401', async () => {
    const d = build();
    const err = await caught(
      d.service.verify({ id: 'u1', roles: [] } as any, { code: '123456' }),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe(IamErrorReason.STEP_UP_SESSION_REQUIRED);
    expect(d.totp.consume).not.toHaveBeenCalled();
  });

  it('nunca responde 401: el cliente cierra la sesión ante un 401', async () => {
    const cases = [
      build({ factors: [] }),
      build({ consume: mockFn().mockResolvedValue({ valid: false }) }),
      build({ failedCount: 9 }),
    ];
    for (const d of cases) {
      const err = await caught(d.service.verify(actor, { code: '123456' }));
      expect(err.getStatus()).not.toBe(401);
    }
  });

  it('el log de éxito lleva solo identificadores, no el código', async () => {
    const d = build();
    await d.service.verify(actor, { code: '123456' });
    expect(JSON.stringify(d.logger.info.mock.calls)).not.toContain('123456');
  });
});

describe('IamStepUpService.verify · B-B10 (ráfaga paralela)', () => {
  /** Cerrojo por clave con la semántica de pg_advisory_xact_lock: uno a la vez por persona. */
  function mutexLock() {
    const tails = new Map<string, Promise<unknown>>();
    return async (_em: any, key: string, work: () => Promise<unknown>) => {
      const prev = tails.get(key) ?? Promise.resolve();
      let release!: () => void;
      const mine = new Promise<void>((r) => (release = r));
      tails.set(
        key,
        prev.then(() => mine),
      );
      await prev;
      try {
        return await work();
      } finally {
        release();
      }
    };
  }

  it('20 peticiones paralelas con el mismo token no gastan más códigos que los intentos que quedan antes del bloqueo', async () => {
    const d = build();
    const failures: number[] = [];
    const tick = () => new Promise((r) => setTimeout(r, 1));
    d.eventsRepo.countFailedMfaSince.mockImplementation(
      async () => failures.length,
    );
    d.eventsRepo.record.mockImplementation(() => {
      failures.push(Date.now());
    });
    d.eventsRepo.withMfaAttemptLock.mockImplementation(mutexLock());
    d.totp.consume.mockImplementation(async () => {
      await tick();
      return { valid: false };
    });
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        d.service.verify(actor, { code: '000000' }),
      ),
    );
    const blocked = results.filter(
      (r) =>
        r.status === 'rejected' &&
        (r.reason as any).reason === IamErrorReason.STEP_UP_ATTEMPTS_EXCEEDED,
    ).length;
    const threshold = d.totp.consume.mock.calls.length;
    // El umbral real es el de `loadAuthEnv().lockThreshold` (5 por omisión): ni uno más.
    expect(threshold).toBeLessThanOrEqual(5);
    expect(threshold + blocked).toBe(20);
  });

  it('el cerrojo envuelve la comprobación del contador, el consumo del código y el registro del fallo (en ese orden)', async () => {
    const d = build();
    const order: string[] = [];
    d.eventsRepo.withMfaAttemptLock.mockImplementation(
      async (_em: any, userId: string, work: () => Promise<unknown>) => {
        order.push(`lock:${userId}`);
        const out = await work();
        order.push('unlock');
        return out;
      },
    );
    d.eventsRepo.countFailedMfaSince.mockImplementation(async () => {
      order.push('count');
      return 0;
    });
    d.totp.consume.mockImplementation(async () => {
      order.push('consume');
      return { valid: false };
    });
    d.eventsRepo.record.mockImplementation(() => order.push('record'));
    await caught(d.service.verify(actor, { code: '000000' }));
    expect(order).toEqual(['lock:u1', 'count', 'consume', 'record', 'unlock']);
  });
});

describe('IamStepUpService.status', () => {
  it('sin sello: fresh false y ageMinutes null', async () => {
    const d = build();
    await expect(d.service.status(actor)).resolves.toEqual({
      fresh: false,
      ageMinutes: null,
    });
  });

  it('con sello de 3.456 min: fresh true (límite 10) y edad redondeada a 2 decimales', async () => {
    const d = build({ ageMinutes: mockFn().mockResolvedValue(3.456) });
    await expect(d.service.status(actor)).resolves.toEqual({
      fresh: true,
      ageMinutes: 3.46,
    });
  });

  it('maxAgeMinutes acota fresh: 6 min no es fresco para 5', async () => {
    const d = build({ ageMinutes: mockFn().mockResolvedValue(6) });
    await expect(d.service.status(actor, 5)).resolves.toEqual({
      fresh: false,
      ageMinutes: 6,
    });
    await expect(d.service.status(actor, 6)).resolves.toMatchObject({
      fresh: true,
    });
  });

  it('sin sid: fresh false sin consultar Redis', async () => {
    const d = build();
    await expect(
      d.service.status({ id: 'u1', roles: [] } as any),
    ).resolves.toEqual({ fresh: false, ageMinutes: null });
    expect(d.store.ageMinutes).not.toHaveBeenCalled();
  });

  it('Redis caído: 503 STEP_UP_UNAVAILABLE (no se dice "no fresco" como si se supiera)', async () => {
    const d = build({
      ageMinutes: mockFn().mockRejectedValue(new StepUpUnavailableError('x')),
    });
    const err = await caught(d.service.status(actor));
    expect(err.getStatus()).toBe(503);
    expect(err.reason).toBe(IamErrorReason.STEP_UP_UNAVAILABLE);
  });
});
