import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { ContextCollectionService } from './context-collection.service';
import { HealthContextErrorReason } from '../health_context.error-reasons';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['SOURCE_ADMIN'] };
const AGENT = '11111111-1111-1111-1111-111111111111';
const SOURCE = '22222222-2222-2222-2222-222222222222';
const SCHEDULE = '33333333-3333-3333-3333-333333333333';
const RUN = '44444444-4444-4444-4444-444444444444';
const COUNTRY = '55555555-5555-5555-5555-555555555555';
const TYPE = '66666666-6666-6666-6666-666666666666';
const TRUST = '77777777-7777-7777-7777-777777777777';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => em);
  const contextRepo = {
    createAgent: mockFn(() => ({ id: AGENT })),
    findAgentById: mockFn(),
    findAgentByCode: mockFn(() => Promise.resolve(null)),
    createSource: mockFn(() => ({ id: SOURCE })),
    findSourceById: mockFn(),
    findSourceByCode: mockFn(() => Promise.resolve(null)),
    createSchedule: mockFn(() => ({ id: SCHEDULE })),
    findScheduleForUpdate: mockFn(),
    claimDueSchedules: mockFn(() => Promise.resolve([])),
    createCollectionRun: mockFn(() => ({ id: RUN })),
    findRunById: mockFn(),
    findRunForUpdate: mockFn(),
    findRunByIdempotencyKey: mockFn(() => Promise.resolve(null)),
    createObservation: mockFn(() => ({ id: 'observation-1' })),
    findObservationByHash: mockFn(() => Promise.resolve(null)),
    findObservationsByRun: mockFn(() => Promise.resolve([])),
    countObservations: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ContextCollectionService(
    em as any,
    contextRepo as any,
    logger as any,
  );
  return { service, tx, em, contextRepo, logger };
}

/**
 * Ejecuta la operación active agent.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de active agent conforme al contrato `any`.
 */
function activeAgent(overrides: Record<string, unknown> = {}): any {
  return { id: AGENT, statusConceptId: CONCEPTS.STATE_ACTIVE, ...overrides };
}

/**
 * Ejecuta la operación running run.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de running run conforme al contrato `any`.
 */
function runningRun(overrides: Record<string, unknown> = {}): any {
  return {
    id: RUN,
    countryConceptId: COUNTRY,
    statusConceptId: CONCEPTS.HCTX_RUN_RUNNING,
    ...overrides,
  };
}

/**
 * Fuente activa y confiable (con nivel de confianza); `overrides` la altera.
 *
 * @param overrides - Campos a sustituir.
 * @returns La fuente de prueba.
 */
function activeSource(overrides: Record<string, unknown> = {}): any {
  return {
    id: SOURCE,
    statusConceptId: CONCEPTS.STATE_ACTIVE,
    trustTierConceptId: TRUST,
    ...overrides,
  };
}

/**
 * Violación de unicidad de una restricción concreta del driver.
 *
 * @param constraint - Nombre del índice único violado.
 * @returns La excepción tipada del ORM.
 */
function uniqueViolation(
  constraint: string,
): UniqueConstraintViolationException {
  return new UniqueConstraintViolationException(
    Object.assign(new Error('duplicate key'), { constraint }) as any,
  );
}

describe('ContextCollectionService', () => {
  describe('createAgent (UC-44-01)', () => {
    const dto: any = {
      code: 'minsal-crawler',
      name: 'Crawler MINSAL',
      agentTypeConceptId: TYPE,
    };

    it('registers the agent as active', async () => {
      const d = build();

      const res = await d.service.createAgent(dto, actor);

      expect(res).toEqual({
        id: AGENT,
        code: 'minsal-crawler',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
    });

    it('rejects a duplicate code', async () => {
      const d = build();
      d.contextRepo.findAgentByCode.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.createAgent(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createSource (UC-44-02)', () => {
    const dto: any = {
      code: 'minsal-boletines',
      name: 'Boletines MINSAL',
      sourceTypeConceptId: TYPE,
      trustTierConceptId: TRUST,
    };

    it('registers the source with its trust tier', async () => {
      const d = build();

      const res = await d.service.createSource(dto, actor);

      expect(res.id).toBe(SOURCE);
      expect(d.contextRepo.createSource).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ trustTierConceptId: TRUST }),
      );
    });

    it('rejects a duplicate code', async () => {
      const d = build();
      d.contextRepo.findSourceByCode.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.createSource(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createSchedule (UC-44-03)', () => {
    const dto: any = {
      countryConceptId: COUNTRY,
      agentId: AGENT,
      scheduleExpression: '0 3 * * *',
    };

    it('schedules the collection for the country', async () => {
      const d = build();
      d.contextRepo.findAgentById.mockResolvedValue(activeAgent());

      const res = await d.service.createSchedule(dto, actor);

      expect(res).toMatchObject({ id: SCHEDULE, agentId: AGENT });
    });

    it('rejects a cron expression that is not five fields', async () => {
      const d = build();

      await expect(
        d.service.createSchedule(
          { ...dto, scheduleExpression: '0 3 * *' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an agent that is not active', async () => {
      const d = build();
      d.contextRepo.findAgentById.mockResolvedValue(
        activeAgent({ statusConceptId: CONCEPTS.STATE_REVOKED }),
      );

      await expect(
        d.service.createSchedule(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the agent does not exist', async () => {
      const d = build();
      d.contextRepo.findAgentById.mockResolvedValue(null);

      await expect(
        d.service.createSchedule(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('runDueSchedules (tick de recolección)', () => {
    /**
     * Programación vencida de referencia, apta para disparar.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de schedule conforme al contrato `any`.
     */
    function dueSchedule(overrides: Record<string, unknown> = {}): any {
      return {
        id: SCHEDULE,
        agentId: AGENT,
        countryConceptId: COUNTRY,
        scheduleExpression: '0 2 * * *',
        nextRunAt: new Date('2026-08-01T02:00:00Z'),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ...overrides,
      };
    }

    it('queues a run for a due schedule and advances next_run_at', async () => {
      const d = build();
      d.contextRepo.findAgentById.mockResolvedValue(activeAgent());
      d.contextRepo.createCollectionRun.mockReturnValue({ id: RUN });
      const due = dueSchedule();
      d.contextRepo.claimDueSchedules.mockResolvedValue([due]);

      const res = await d.service.runDueSchedules({}, actor);

      expect(res.claimed).toBe(1);
      expect(res.queued).toBe(1);
      expect(res.results[0]).toMatchObject({
        scheduleId: SCHEDULE,
        runId: RUN,
      });
      expect(d.contextRepo.createCollectionRun).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          scheduleId: SCHEDULE,
          agentId: AGENT,
          countryConceptId: COUNTRY,
          triggerConceptId: CONCEPTS.HCTX_TRIGGER_SCHEDULED,
          idempotencyKey: `schedule:${SCHEDULE}:2026-08-01T02:00:00.000Z`,
        }),
      );
      // La próxima marca de `0 2 * * *` desde el 2026-08-01T02:00Z es el día siguiente.
      expect(due.nextRunAt.toISOString()).toBe('2026-08-02T02:00:00.000Z');
    });

    it('skips but still reschedules when the agent is not active', async () => {
      const d = build();
      d.contextRepo.findAgentById.mockResolvedValue(
        activeAgent({ statusConceptId: CONCEPTS.STATE_REVOKED }),
      );
      const due = dueSchedule();
      d.contextRepo.claimDueSchedules.mockResolvedValue([due]);

      const res = await d.service.runDueSchedules({}, actor);

      expect(res.queued).toBe(0);
      expect(res.results[0].skippedReason).toBe('AGENT_NOT_ACTIVE');
      expect(d.contextRepo.createCollectionRun).not.toHaveBeenCalled();
      expect(due.nextRunAt.toISOString()).toBe('2026-08-02T02:00:00.000Z');
    });

    it('is idempotent: a run already recorded for the due mark is not duplicated', async () => {
      const d = build();
      d.contextRepo.findAgentById.mockResolvedValue(activeAgent());
      d.contextRepo.findRunByIdempotencyKey.mockResolvedValue({ id: RUN });
      const due = dueSchedule();
      d.contextRepo.claimDueSchedules.mockResolvedValue([due]);

      const res = await d.service.runDueSchedules({}, actor);

      expect(res.results[0].runId).toBe(RUN);
      expect(d.contextRepo.createCollectionRun).not.toHaveBeenCalled();
    });

    it('returns an empty batch when nothing is due', async () => {
      const d = build();
      d.contextRepo.claimDueSchedules.mockResolvedValue([]);

      const res = await d.service.runDueSchedules({ limit: 5 }, actor);

      expect(res).toEqual({ claimed: 0, queued: 0, results: [] });
    });
  });

  describe('startCollectionRun (UC-44-05)', () => {
    const dto: any = {
      idempotencyKey: 'run-2026-07-20',
      trigger: 'SCHEDULED',
      scheduleId: SCHEDULE,
    };

    /**
     * Ejecuta la operación active schedule.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de active schedule conforme al contrato `any`.
     */
    function activeSchedule(overrides: Record<string, unknown> = {}): any {
      return {
        id: SCHEDULE,
        agentId: AGENT,
        countryConceptId: COUNTRY,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ...overrides,
      };
    }

    it('starts the run taking agent and country from the schedule', async () => {
      const d = build();
      d.contextRepo.findScheduleForUpdate.mockResolvedValue(activeSchedule());
      d.contextRepo.findAgentById.mockResolvedValue(activeAgent());

      const res = await d.service.startCollectionRun(dto, actor);

      expect(res).toEqual({
        id: RUN,
        statusConceptId: CONCEPTS.HCTX_RUN_RUNNING,
        duplicate: false,
      });
      expect(d.contextRepo.createCollectionRun).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          agentId: AGENT,
          countryConceptId: COUNTRY,
          triggerConceptId: CONCEPTS.HCTX_TRIGGER_SCHEDULED,
        }),
      );
    });

    it('moves the schedule forward when the next run is given', async () => {
      const d = build();
      const schedule = activeSchedule();
      d.contextRepo.findScheduleForUpdate.mockResolvedValue(schedule);
      d.contextRepo.findAgentById.mockResolvedValue(activeAgent());

      await d.service.startCollectionRun(
        { ...dto, nextRunAt: '2026-07-21T03:00:00.000Z' },
        actor,
      );

      expect(schedule.nextRunAt).toBeInstanceOf(Date);
    });

    it('returns the previous run when the idempotency key repeats', async () => {
      const d = build();
      d.contextRepo.findRunByIdempotencyKey.mockResolvedValue({
        id: 'run-prev',
        statusConceptId: CONCEPTS.HCTX_RUN_SUCCEEDED,
      });

      const res = await d.service.startCollectionRun(dto, actor);

      expect(res).toEqual({
        id: 'run-prev',
        statusConceptId: CONCEPTS.HCTX_RUN_SUCCEEDED,
        duplicate: true,
      });
      expect(d.contextRepo.createCollectionRun).not.toHaveBeenCalled();
    });

    it('starts a manual run with explicit agent and country', async () => {
      const d = build();
      d.contextRepo.findAgentById.mockResolvedValue(activeAgent());

      const res = await d.service.startCollectionRun(
        {
          idempotencyKey: 'manual-1',
          trigger: 'MANUAL',
          agentId: AGENT,
          countryConceptId: COUNTRY,
        } as any,
        actor,
      );

      expect(res.id).toBe(RUN);
      expect(d.contextRepo.createCollectionRun).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          triggerConceptId: CONCEPTS.HCTX_TRIGGER_MANUAL,
        }),
      );
    });

    it('refuses a manual run without agent or country', async () => {
      const d = build();

      await expect(
        d.service.startCollectionRun(
          { idempotencyKey: 'manual-2', trigger: 'MANUAL' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a schedule that is not active', async () => {
      const d = build();
      d.contextRepo.findScheduleForUpdate.mockResolvedValue(
        activeSchedule({ statusConceptId: CONCEPTS.STATE_REVOKED }),
      );

      await expect(
        d.service.startCollectionRun(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the schedule does not exist', async () => {
      const d = build();
      d.contextRepo.findScheduleForUpdate.mockResolvedValue(null);

      await expect(
        d.service.startCollectionRun(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('startCollectionRun: programación manda sobre el DTO (HC-02)', () => {
    const OTHER_AGENT = '99999999-9999-9999-9999-999999999999';
    const OTHER_COUNTRY = '88888888-8888-8888-8888-888888888888';
    const base: any = {
      idempotencyKey: 'run-hc02',
      trigger: 'SCHEDULED',
      scheduleId: SCHEDULE,
    };

    /**
     * Programación activa de la que se espera la atribución.
     *
     * @returns La programación de prueba.
     */
    function schedule(): any {
      return {
        id: SCHEDULE,
        agentId: AGENT,
        countryConceptId: COUNTRY,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        nextRunAt: new Date('2026-07-20T03:00:00.000Z'),
      };
    }

    it.each([
      ['agente', { agentId: OTHER_AGENT }],
      ['país', { countryConceptId: OTHER_COUNTRY }],
      [
        'agente y país',
        { agentId: OTHER_AGENT, countryConceptId: OTHER_COUNTRY },
      ],
    ])(
      'falla catalogada: %s distinto al de la programación => 422 sin corrida ni avance de next_run_at',
      async (_label, override) => {
        const d = build();
        const row = schedule();
        const before = row.nextRunAt;
        d.contextRepo.findScheduleForUpdate.mockResolvedValue(row);
        d.contextRepo.findAgentById.mockResolvedValue(activeAgent());

        await expect(
          d.service.startCollectionRun(
            { ...base, ...override, nextRunAt: '2026-07-21T03:00:00.000Z' },
            actor as any,
          ),
        ).rejects.toMatchObject({
          status: 422,
          code: 'PRECONDITION_FAILED',
          reason: HealthContextErrorReason.SCHEDULE_BINDING_MISMATCH,
        });

        expect(d.contextRepo.createCollectionRun).not.toHaveBeenCalled();
        expect(row.nextRunAt).toBe(before);
      },
    );

    it('límite: mismos UUIDs que la programación => conserva la atribución', async () => {
      const d = build();
      d.contextRepo.findScheduleForUpdate.mockResolvedValue(schedule());
      d.contextRepo.findAgentById.mockResolvedValue(activeAgent());

      const res = await d.service.startCollectionRun(
        { ...base, agentId: AGENT, countryConceptId: COUNTRY },
        actor as any,
      );

      expect(res.duplicate).toBe(false);
      expect(d.contextRepo.createCollectionRun).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ agentId: AGENT, countryConceptId: COUNTRY }),
      );
    });

    it('correcto: sin agente ni país los copia de la programación', async () => {
      const d = build();
      d.contextRepo.findScheduleForUpdate.mockResolvedValue(schedule());
      d.contextRepo.findAgentById.mockResolvedValue(activeAgent());

      await d.service.startCollectionRun(base, actor as any);

      expect(d.contextRepo.createCollectionRun).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          scheduleId: SCHEDULE,
          agentId: AGENT,
          countryConceptId: COUNTRY,
        }),
      );
    });
  });

  describe('startCollectionRun: carrera de idempotencia (HC-03)', () => {
    const manual: any = {
      idempotencyKey: 'run-hc03',
      trigger: 'MANUAL',
      agentId: AGENT,
      countryConceptId: COUNTRY,
    };
    const IDX = 'uq_context_collection_runs_idempotency_key';

    /**
     * Simula dos transacciones: la primera lectura no ve la corrida y la
     * confirmación pierde el índice único; la relectura sí ve a la ganadora.
     *
     * @param d - Sistema bajo prueba.
     * @param error - Error con el que falla la confirmación.
     */
    function loseTheRace(d: ReturnType<typeof build>, error: unknown): void {
      d.contextRepo.findAgentById.mockResolvedValue(activeAgent());
      d.em.transactional.mockImplementationOnce(async (cb: any) => {
        await cb(d.tx);
        throw error;
      });
    }

    it('correcto: primera petición con clave nueva => duplicate false', async () => {
      const d = build();
      d.contextRepo.findAgentById.mockResolvedValue(activeAgent());

      const res = await d.service.startCollectionRun(manual, actor as any);

      expect(res).toEqual({
        id: RUN,
        statusConceptId: CONCEPTS.HCTX_RUN_RUNNING,
        duplicate: false,
      });
    });

    it('error: pierde el único => relee en transacción nueva y devuelve la ganadora como duplicate', async () => {
      const d = build();
      loseTheRace(d, uniqueViolation(IDX));
      d.contextRepo.findRunByIdempotencyKey
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'run-winner',
          statusConceptId: CONCEPTS.HCTX_RUN_RUNNING,
        });

      const res = await d.service.startCollectionRun(manual, actor as any);

      expect(res).toEqual({
        id: 'run-winner',
        statusConceptId: CONCEPTS.HCTX_RUN_RUNNING,
        duplicate: true,
      });
      expect(d.em.fork).toHaveBeenCalled();
      expect(d.contextRepo.findRunByIdempotencyKey).toHaveBeenLastCalledWith(
        d.tx,
        'run-hc03',
      );
    });

    it('falla catalogada: único ajeno => 409 HEALTH_CONTEXT_IDEMPOTENCY_RESOLUTION_FAILED sin releer', async () => {
      const d = build();
      loseTheRace(d, uniqueViolation('uq_otro_indice'));

      await expect(
        d.service.startCollectionRun(manual, actor as any),
      ).rejects.toMatchObject({
        status: 409,
        code: 'CONFLICT',
        reason: HealthContextErrorReason.IDEMPOTENCY_RESOLUTION_FAILED,
      });
      expect(d.contextRepo.findRunByIdempotencyKey).toHaveBeenCalledTimes(1);
    });

    it('falla catalogada: la ganadora no se puede releer => 409 catalogado', async () => {
      const d = build();
      loseTheRace(d, uniqueViolation(IDX));
      d.contextRepo.findRunByIdempotencyKey.mockResolvedValue(null);

      await expect(
        d.service.startCollectionRun(manual, actor as any),
      ).rejects.toMatchObject({
        reason: HealthContextErrorReason.IDEMPOTENCY_RESOLUTION_FAILED,
      });
    });

    it('un error que no es de unicidad se propaga sin tocar la relectura', async () => {
      const d = build();
      loseTheRace(d, new Error('boom'));

      await expect(
        d.service.startCollectionRun(manual, actor as any),
      ).rejects.toThrow('boom');
      expect(d.contextRepo.findRunByIdempotencyKey).toHaveBeenCalledTimes(1);
    });

    it('las altas de agente y fuente que pierden el único reciben el mismo conflicto de negocio', async () => {
      const agent = build();
      agent.em.transactional.mockImplementationOnce(async (cb: any) => {
        await cb(agent.tx);
        throw uniqueViolation('uq_context_agents_code');
      });
      await expect(
        agent.service.createAgent(
          { code: 'a', name: 'A', agentTypeConceptId: TYPE } as any,
          actor as any,
        ),
      ).rejects.toMatchObject({
        status: 409,
        response: { message: 'Ya existe un agente con ese código' },
      });

      const source = build();
      source.em.transactional.mockImplementationOnce(async (cb: any) => {
        await cb(source.tx);
        throw uniqueViolation('uq_health_context_sources_code');
      });
      await expect(
        source.service.createSource(
          {
            code: 's',
            name: 'S',
            sourceTypeConceptId: TYPE,
            trustTierConceptId: TRUST,
          } as any,
          actor as any,
        ),
      ).rejects.toMatchObject({
        status: 409,
        response: { message: 'Ya existe una fuente con ese código' },
      });
    });
  });

  describe('recordObservation (UC-44-06)', () => {
    const dto: any = {
      sourceId: SOURCE,
      contentHash: 'hash-1',
      status: 'ACCEPTED',
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param run - Valor de run requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, run = runningRun()) {
      d.contextRepo.findRunForUpdate.mockResolvedValue(run);
      d.contextRepo.findSourceById.mockResolvedValue(activeSource());
      return run;
    }

    it('records the observation and bumps the run counters', async () => {
      const d = build();
      const run = wire(d);

      const res = await d.service.recordObservation(RUN, dto, actor);

      expect(res).toEqual({
        id: 'observation-1',
        statusConceptId: CONCEPTS.HCTX_OBS_ACCEPTED,
        duplicate: false,
      });
      expect(run.observationsRead).toBe('1');
      expect(run.observationsAccepted).toBe('1');
    });

    it('counts a rejected observation apart and warns', async () => {
      const d = build();
      const run = wire(d);

      const res = await d.service.recordObservation(
        RUN,
        { ...dto, status: 'REJECTED' },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.HCTX_OBS_REJECTED);
      expect(run.observationsRejected).toBe('1');
      expect(run.observationsAccepted).toBeUndefined();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('keeps counting from what the run already had', async () => {
      const d = build();
      const run = wire(d, runningRun({ observationsRead: '9007199254740993' }));

      await d.service.recordObservation(RUN, dto, actor);

      expect(run.observationsRead).toBe('9007199254740994');
    });

    it('does not record the same content twice in the run', async () => {
      const d = build();
      const run = wire(d);
      d.contextRepo.findObservationByHash.mockResolvedValue({
        id: 'observation-prev',
        statusConceptId: CONCEPTS.HCTX_OBS_ACCEPTED,
      });

      const res = await d.service.recordObservation(RUN, dto, actor);

      expect(res).toEqual({
        id: 'observation-prev',
        statusConceptId: CONCEPTS.HCTX_OBS_ACCEPTED,
        duplicate: true,
      });
      expect(run.observationsRead).toBeUndefined();
    });

    it('refuses recording on a run that is no longer running', async () => {
      const d = build();
      wire(d, runningRun({ statusConceptId: CONCEPTS.HCTX_RUN_SUCCEEDED }));

      await expect(
        d.service.recordObservation(RUN, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a source that is not active', async () => {
      const d = build();
      wire(d);
      d.contextRepo.findSourceById.mockResolvedValue({
        id: SOURCE,
        statusConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.recordObservation(RUN, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    describe('procedencia de la fuente (HC-01)', () => {
      const OTHER_COUNTRY = '88888888-8888-8888-8888-888888888888';
      const NOT_ELIGIBLE = {
        status: 422,
        code: 'PRECONDITION_FAILED',
        reason: HealthContextErrorReason.SOURCE_NOT_ELIGIBLE,
      };

      it('correcto: fuente del país de la corrida con nivel de confianza se acepta', async () => {
        const d = build();
        const run = wire(d);
        d.contextRepo.findSourceById.mockResolvedValue(
          activeSource({ countryConceptId: COUNTRY }),
        );

        const res = await d.service.recordObservation(RUN, dto, actor);

        expect(res.statusConceptId).toBe(CONCEPTS.HCTX_OBS_ACCEPTED);
        expect(d.contextRepo.createObservation).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({ countryConceptId: COUNTRY }),
        );
        expect(run.observationsAccepted).toBe('1');
      });

      it('límite: fuente global (sin país) se acepta en la corrida de cualquier país', async () => {
        const d = build();
        wire(d);
        d.contextRepo.findSourceById.mockResolvedValue(
          activeSource({ countryConceptId: undefined }),
        );

        const res = await d.service.recordObservation(RUN, dto, actor);

        expect(res.duplicate).toBe(false);
        expect(d.contextRepo.createObservation).toHaveBeenCalledTimes(1);
      });

      it.each(['ACCEPTED', 'REJECTED'])(
        'error: fuente de otro país (%s) => 422 sin observación ni contadores',
        async (status) => {
          const d = build();
          const run = wire(d);
          d.contextRepo.findSourceById.mockResolvedValue(
            activeSource({ countryConceptId: OTHER_COUNTRY }),
          );

          await expect(
            d.service.recordObservation(RUN, { ...dto, status }, actor as any),
          ).rejects.toMatchObject(NOT_ELIGIBLE);

          expect(d.contextRepo.createObservation).not.toHaveBeenCalled();
          expect(run.observationsRead).toBeUndefined();
          expect(run.observationsAccepted).toBeUndefined();
          expect(run.observationsRejected).toBeUndefined();
        },
      );

      it('falla catalogada: sin nivel de confianza no se acepta, y la respuesta no revela país ni fuente', async () => {
        const d = build();
        const run = wire(d);
        d.contextRepo.findSourceById.mockResolvedValue(
          activeSource({
            trustTierConceptId: undefined,
            countryConceptId: OTHER_COUNTRY,
          }),
        );
        const failure = await d.service
          .recordObservation(RUN, dto, actor as any)
          .catch((e: any) => e);

        expect(failure).toMatchObject(NOT_ELIGIBLE);
        expect(failure.details).toBeUndefined();
        const body = JSON.stringify(failure.getResponse());
        expect(body).not.toContain(OTHER_COUNTRY);
        expect(body).not.toContain(SOURCE);
        expect(run.observationsRead).toBeUndefined();
      });

      it('una fuente sin nivel de confianza sí puede registrar una observación rechazada', async () => {
        const d = build();
        const run = wire(d);
        d.contextRepo.findSourceById.mockResolvedValue(
          activeSource({ trustTierConceptId: undefined }),
        );

        const res = await d.service.recordObservation(
          RUN,
          { ...dto, status: 'REJECTED' },
          actor,
        );

        expect(res.statusConceptId).toBe(CONCEPTS.HCTX_OBS_REJECTED);
        expect(run.observationsRejected).toBe('1');
      });

      it('una fuente no elegible no devuelve una observación duplicada', async () => {
        const d = build();
        wire(d);
        d.contextRepo.findSourceById.mockResolvedValue(
          activeSource({ countryConceptId: OTHER_COUNTRY }),
        );
        d.contextRepo.findObservationByHash.mockResolvedValue({ id: 'prev' });

        await expect(
          d.service.recordObservation(RUN, dto, actor as any),
        ).rejects.toMatchObject(NOT_ELIGIBLE);
      });
    });

    it('fails when the run does not exist', async () => {
      const d = build();
      d.contextRepo.findRunForUpdate.mockResolvedValue(null);

      await expect(
        d.service.recordObservation(RUN, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('finishCollectionRun (UC-44-10)', () => {
    const dto: any = { outcome: 'SUCCEEDED' };

    it('reconciles the counters against the observations table', async () => {
      const d = build();
      const run = runningRun({ scheduleId: SCHEDULE, observationsRead: '99' });
      d.contextRepo.findRunForUpdate.mockResolvedValue(run);
      d.contextRepo.findObservationsByRun.mockResolvedValue([
        { sourceId: SOURCE, statusConceptId: CONCEPTS.HCTX_OBS_ACCEPTED },
        { sourceId: SOURCE, statusConceptId: CONCEPTS.HCTX_OBS_ACCEPTED },
        { sourceId: 'source-2', statusConceptId: CONCEPTS.HCTX_OBS_REJECTED },
      ]);
      d.contextRepo.findScheduleForUpdate.mockResolvedValue({ id: SCHEDULE });

      const res = await d.service.finishCollectionRun(RUN, dto, actor);

      expect(res).toEqual({
        id: RUN,
        statusConceptId: CONCEPTS.HCTX_RUN_SUCCEEDED,
        observationsRead: '3',
        observationsAccepted: '2',
        observationsRejected: '1',
        sourceCount: 2,
      });
      // El contador llevado al vuelo se corrige con el recuento real.
      expect(run.observationsRead).toBe('3');
    });

    it('stamps the last success on the schedule', async () => {
      const d = build();
      d.contextRepo.findRunForUpdate.mockResolvedValue(
        runningRun({ scheduleId: SCHEDULE }),
      );
      const schedule: any = { id: SCHEDULE };
      d.contextRepo.findScheduleForUpdate.mockResolvedValue(schedule);

      await d.service.finishCollectionRun(RUN, dto, actor);

      expect(schedule.lastSuccessAt).toBeInstanceOf(Date);
    });

    it('does not stamp the last success when the run failed', async () => {
      const d = build();
      d.contextRepo.findRunForUpdate.mockResolvedValue(
        runningRun({ scheduleId: SCHEDULE }),
      );
      const schedule: any = { id: SCHEDULE };
      d.contextRepo.findScheduleForUpdate.mockResolvedValue(schedule);

      const res = await d.service.finishCollectionRun(
        RUN,
        { outcome: 'FAILED', errorSummary: 'la fuente devolvió 503' } as any,
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.HCTX_RUN_FAILED);
      expect(schedule.lastSuccessAt).toBeUndefined();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('demands an error summary when the run failed', async () => {
      const d = build();

      await expect(
        d.service.finishCollectionRun(
          RUN,
          { outcome: 'FAILED' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses closing the run twice', async () => {
      const d = build();
      d.contextRepo.findRunForUpdate.mockResolvedValue(
        runningRun({ statusConceptId: CONCEPTS.HCTX_RUN_SUCCEEDED }),
      );

      await expect(
        d.service.finishCollectionRun(RUN, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the run does not exist', async () => {
      const d = build();
      d.contextRepo.findRunForUpdate.mockResolvedValue(null);

      await expect(
        d.service.finishCollectionRun(RUN, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
