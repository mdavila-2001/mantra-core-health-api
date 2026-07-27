import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import { TransitionExecutionService } from './transition-execution.service';

const actor = { id: 'user-1', roles: ['CLINICIAN'] } as any;
const AGGREGATE_ID = '11111111-1111-1111-1111-111111111111';
const EVENT_ID = '22222222-2222-2222-2222-222222222222';
const STATE_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const STATE_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const MACHINE = {
  id: 'machine-1',
  machineCode: 'encounter-lifecycle',
  aggregateSchemaName: 'clinical',
  aggregateEntityName: 'encounters',
  statusFieldName: 'status_concept_id',
  statusConceptId: CONCEPTS.WF_DEF_ACTIVE,
};

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const machinesRepo = {
    findActiveMachineByCode: mockFn(async () => MACHINE),
    findMachineById: mockFn(async () => MACHINE),
    findTransitionByCommand: mockFn(async () => null),
    findTransitionById: mockFn(async () => null),
    findGuardsByTransition: mockFn(async () => []),
    findSideEffectsByTransition: mockFn(async () => []),
  };
  const runtimeRepo = {
    findTransitionEventByIdempotencyKey: mockFn(async () => null),
    findTransitionEventById: mockFn(async () => null),
    findTransitionEventsByAggregate: mockFn(async () => [[], 0]),
    findInstanceByAggregate: mockFn(async () => null),
    findInstanceForUpdate: mockFn(async () => null),
    createTransitionEvent: mockFn((_tx: any, data: any) => ({
      id: 'event-nuevo',
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      ...data,
    })),
  };
  const aggregateRepo = {
    findForUpdate: mockFn(async () => ({
      stateConceptId: STATE_A,
      rowVersion: 4,
    })),
    updateState: mockFn(async () => true),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new TransitionExecutionService(
    em as any,
    machinesRepo as any,
    runtimeRepo as any,
    aggregateRepo,
    outbox as any,
    logger as any,
  );
  return {
    service,
    em,
    tx,
    machinesRepo,
    runtimeRepo,
    aggregateRepo,
    outbox,
    logger,
  };
}

const TRANSITION = {
  id: 'transition-1',
  transitionCode: 'close',
  commandCode: 'CLOSE',
  fromStateConceptId: STATE_A,
  toStateConceptId: STATE_B,
  idempotencyRequired: false,
  optimisticLockRequired: false,
  reasonRequired: false,
};

const DTO = { machineCode: 'encounter-lifecycle' } as any;

describe('TransitionExecutionService', () => {
  describe('triggerTransition (UC-32-05)', () => {
    it('bloquea el agregado antes de resolver la transición', async () => {
      const d = build();
      d.machinesRepo.findTransitionByCommand.mockResolvedValue(TRANSITION);

      await d.service.triggerTransition(AGGREGATE_ID, 'CLOSE', DTO, actor);

      expect(d.aggregateRepo.findForUpdate).toHaveBeenCalledWith(
        d.tx,
        {
          schemaName: 'clinical',
          entityName: 'encounters',
          statusFieldName: 'status_concept_id',
        },
        AGGREGATE_ID,
      );
    });

    it('mueve el estado y registra el evento con las dos versiones del agregado', async () => {
      const d = build();
      d.machinesRepo.findTransitionByCommand.mockResolvedValue(TRANSITION);

      const result = await d.service.triggerTransition(
        AGGREGATE_ID,
        'CLOSE',
        DTO,
        actor,
      );

      const event = d.runtimeRepo.createTransitionEvent.mock.calls[0][1];
      expect(event.fromStateConceptId).toBe(STATE_A);
      expect(event.toStateConceptId).toBe(STATE_B);
      expect(event.aggregateRowVersionBefore).toBe(4);
      expect(event.aggregateRowVersionAfter).toBe(5);
      expect(result.duplicate).toBe(false);
    });

    it('rechaza un comando que no sale del estado actual', async () => {
      const d = build();

      await expect(
        d.service.triggerTransition(AGGREGATE_ID, 'REOPEN', DTO, actor),
      ).rejects.toThrow(/no es aplicable/);
    });

    it('rechaza si no hay versión activa de la máquina', async () => {
      const d = build();
      d.machinesRepo.findActiveMachineByCode.mockResolvedValue(null);

      await expect(
        d.service.triggerTransition(AGGREGATE_ID, 'CLOSE', DTO, actor),
      ).rejects.toThrow(/versión activa/);
    });

    it('rechaza si el agregado gobernado no existe', async () => {
      const d = build();
      d.aggregateRepo.findForUpdate.mockResolvedValue(null);

      await expect(
        d.service.triggerTransition(AGGREGATE_ID, 'CLOSE', DTO, actor),
      ).rejects.toThrow(/agregado gobernado no existe/);
    });

    describe('idempotencia (UC-32-06)', () => {
      it('exige la cabecera cuando la transición la declara obligatoria', async () => {
        const d = build();
        d.machinesRepo.findTransitionByCommand.mockResolvedValue({
          ...TRANSITION,
          idempotencyRequired: true,
        });

        await expect(
          d.service.triggerTransition(AGGREGATE_ID, 'CLOSE', DTO, actor),
        ).rejects.toThrow(/Idempotency-Key/);
      });

      it('devuelve el resultado previo sin volver a mover el agregado', async () => {
        const d = build();
        d.machinesRepo.findTransitionByCommand.mockResolvedValue(TRANSITION);
        d.runtimeRepo.findTransitionEventByIdempotencyKey.mockResolvedValue({
          id: EVENT_ID,
          aggregateId: AGGREGATE_ID,
          fromStateConceptId: STATE_A,
          toStateConceptId: STATE_B,
          occurredAt: new Date('2026-01-01T00:00:00.000Z'),
        });

        const result = await d.service.triggerTransition(
          AGGREGATE_ID,
          'CLOSE',
          DTO,
          actor,
          'clave-repetida',
        );

        expect(result.duplicate).toBe(true);
        expect(result.id).toBe(EVENT_ID);
        expect(d.aggregateRepo.updateState).not.toHaveBeenCalled();
        expect(d.runtimeRepo.createTransitionEvent).not.toHaveBeenCalled();
      });
    });

    describe('bloqueo optimista', () => {
      it('exige la versión esperada cuando la transición la declara', async () => {
        const d = build();
        d.machinesRepo.findTransitionByCommand.mockResolvedValue({
          ...TRANSITION,
          optimisticLockRequired: true,
        });

        await expect(
          d.service.triggerTransition(AGGREGATE_ID, 'CLOSE', DTO, actor),
        ).rejects.toThrow(/versión del agregado/);
      });

      it('convierte el UPDATE sin filas en conflicto de concurrencia', async () => {
        const d = build();
        d.machinesRepo.findTransitionByCommand.mockResolvedValue({
          ...TRANSITION,
          optimisticLockRequired: true,
        });
        d.aggregateRepo.updateState.mockResolvedValue(false);

        await expect(
          d.service.triggerTransition(
            AGGREGATE_ID,
            'CLOSE',
            { ...DTO, expectedRowVersion: 4 },
            actor,
          ),
        ).rejects.toThrow(/cambió desde que el llamante/);
      });

      it('no envía versión esperada si la transición no la exige', async () => {
        const d = build();
        d.machinesRepo.findTransitionByCommand.mockResolvedValue(TRANSITION);

        await d.service.triggerTransition(
          AGGREGATE_ID,
          'CLOSE',
          { ...DTO, expectedRowVersion: 99 },
          actor,
        );

        expect(d.aggregateRepo.updateState.mock.calls[0][4]).toBeUndefined();
      });
    });

    describe('motivo', () => {
      it('lo exige cuando la transición lo declara obligatorio', async () => {
        const d = build();
        d.machinesRepo.findTransitionByCommand.mockResolvedValue({
          ...TRANSITION,
          reasonRequired: true,
        });

        await expect(
          d.service.triggerTransition(AGGREGATE_ID, 'CLOSE', DTO, actor),
        ).rejects.toThrow(/motivo/);
      });
    });

    describe('guardas', () => {
      function withGuard(d: ReturnType<typeof build>, guard: any) {
        d.machinesRepo.findTransitionByCommand.mockResolvedValue(TRANSITION);
        d.machinesRepo.findGuardsByTransition.mockResolvedValue([guard]);
      }

      it('deja pasar una expresión que se cumple', async () => {
        const d = build();
        withGuard(d, {
          guardCode: 'g1',
          guardTypeConceptId: CONCEPTS.WF_GUARD_EXPRESSION,
          expressionJson: { field: 'signed', op: 'eq', value: true },
        });

        await expect(
          d.service.triggerTransition(
            AGGREGATE_ID,
            'CLOSE',
            { ...DTO, payloadJson: { signed: true } },
            actor,
          ),
        ).resolves.toMatchObject({ duplicate: false });
      });

      it('rechaza con el código de fallo declarado, sin filtrar la expresión', async () => {
        const d = build();
        withGuard(d, {
          guardCode: 'g1',
          guardTypeConceptId: CONCEPTS.WF_GUARD_EXPRESSION,
          expressionJson: { field: 'signed', op: 'eq', value: true },
          failureCode: 'ENCOUNTER_NOT_SIGNED',
          failureMessageKey: 'workflow.encounter.not-signed',
        });

        await expect(
          d.service.triggerTransition(
            AGGREGATE_ID,
            'CLOSE',
            { ...DTO, payloadJson: { signed: false } },
            actor,
          ),
        ).rejects.toMatchObject({
          response: {
            message: 'workflow.encounter.not-signed',
            details: { failureCode: 'ENCOUNTER_NOT_SIGNED' },
          },
        });
      });

      it('resuelve rutas con puntos dentro del payload', async () => {
        const d = build();
        withGuard(d, {
          guardCode: 'g1',
          guardTypeConceptId: CONCEPTS.WF_GUARD_EXPRESSION,
          expressionJson: { field: 'clinical.notes', op: 'exists' },
        });

        await expect(
          d.service.triggerTransition(
            AGGREGATE_ID,
            'CLOSE',
            { ...DTO, payloadJson: { clinical: { notes: 'texto' } } },
            actor,
          ),
        ).resolves.toBeDefined();
      });

      it('falla cerrado ante una expresión que no sabe leer', async () => {
        const d = build();
        withGuard(d, {
          guardCode: 'g1',
          guardTypeConceptId: CONCEPTS.WF_GUARD_EXPRESSION,
          expressionJson: { sql: 'select 1' },
        });

        await expect(
          d.service.triggerTransition(AGGREGATE_ID, 'CLOSE', DTO, actor),
        ).rejects.toThrow();
      });

      it('falla cerrado ante un tipo de guarda desconocido', async () => {
        const d = build();
        withGuard(d, {
          guardCode: 'g1',
          guardTypeConceptId: 'tipo-que-no-existe',
          expressionJson: { field: 'a', op: 'exists' },
        });

        await expect(
          d.service.triggerTransition(
            AGGREGATE_ID,
            'CLOSE',
            { ...DTO, payloadJson: { a: 1 } },
            actor,
          ),
        ).rejects.toThrow();
      });

      it('acepta la guarda de permiso cuando el actor tiene uno de los roles', async () => {
        const d = build();
        withGuard(d, {
          guardCode: 'g1',
          guardTypeConceptId: CONCEPTS.WF_GUARD_PERMISSION,
          expressionJson: { anyOfRoles: ['CLINICIAN', 'PLATFORM_ADMIN'] },
        });

        await expect(
          d.service.triggerTransition(AGGREGATE_ID, 'CLOSE', DTO, actor),
        ).resolves.toBeDefined();
      });

      it('rechaza la guarda de permiso cuando el actor no tiene ninguno', async () => {
        const d = build();
        withGuard(d, {
          guardCode: 'g1',
          guardTypeConceptId: CONCEPTS.WF_GUARD_PERMISSION,
          expressionJson: { anyOfRoles: ['PLATFORM_ADMIN'] },
        });

        await expect(
          d.service.triggerTransition(AGGREGATE_ID, 'CLOSE', DTO, actor),
        ).rejects.toThrow();
      });
    });

    describe('efectos', () => {
      it('publica un evento de outbox por efecto con tipo declarado', async () => {
        const d = build();
        d.machinesRepo.findTransitionByCommand.mockResolvedValue(TRANSITION);
        d.machinesRepo.findSideEffectsByTransition.mockResolvedValue([
          {
            sideEffectCode: 'notify',
            outboxEventType: 'EncounterClosed',
            executionOrder: 0,
            executionModeConceptId: CONCEPTS.WF_EXEC_ASYNCHRONOUS,
          },
          { sideEffectCode: 'sin-evento', executionOrder: 1 },
        ]);

        const result = await d.service.triggerTransition(
          AGGREGATE_ID,
          'CLOSE',
          DTO,
          actor,
        );

        expect(d.outbox.publishDomainEvent).toHaveBeenCalledTimes(1);
        expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({ eventType: 'EncounterClosed' }),
        );
        expect(result.publishedEffects).toBe(1);
      });
    });
  });

  describe('compensateTransition (UC-32-08)', () => {
    const ORIGINAL = {
      id: EVENT_ID,
      aggregateId: AGGREGATE_ID,
      stateMachineDefinitionId: MACHINE.id,
      transitionDefinitionId: 'transition-1',
      fromStateConceptId: STATE_A,
      toStateConceptId: STATE_B,
      occurredAt: new Date(),
    };
    const DTO_COMP = { reasonText: 'el pago falló aguas abajo' } as any;

    it('devuelve el agregado al estado de origen y registra la compensación', async () => {
      const d = build();
      d.runtimeRepo.findTransitionEventById.mockResolvedValue(ORIGINAL);
      d.machinesRepo.findSideEffectsByTransition.mockResolvedValue([
        {
          sideEffectCode: 'pago',
          compensationSpecJson: { refund: true },
          outboxEventType: 'PaymentTaken',
        },
      ]);
      d.aggregateRepo.findForUpdate.mockResolvedValue({
        stateConceptId: STATE_B,
        rowVersion: 5,
      });

      const result = await d.service.compensateTransition(
        AGGREGATE_ID,
        EVENT_ID,
        DTO_COMP,
        actor,
      );

      expect(d.aggregateRepo.updateState.mock.calls[0][3]).toBe(STATE_A);
      expect(result.restoredStateConceptId).toBe(STATE_A);
      const event = d.runtimeRepo.createTransitionEvent.mock.calls[0][1];
      expect(event.causationId).toBe(EVENT_ID);
      expect(event.reasonConceptId).toBe(CONCEPTS.WF_REASON_COMPENSATION);
    });

    it('rechaza compensar una transición sin compensación declarada', async () => {
      const d = build();
      d.runtimeRepo.findTransitionEventById.mockResolvedValue(ORIGINAL);
      d.machinesRepo.findSideEffectsByTransition.mockResolvedValue([
        { sideEffectCode: 'pago', outboxEventType: 'PaymentTaken' },
      ]);

      await expect(
        d.service.compensateTransition(AGGREGATE_ID, EVENT_ID, DTO_COMP, actor),
      ).rejects.toThrow(/no es reversible/);
    });

    it('rechaza compensar si el agregado ya se movió a otro estado', async () => {
      const d = build();
      d.runtimeRepo.findTransitionEventById.mockResolvedValue(ORIGINAL);
      d.machinesRepo.findSideEffectsByTransition.mockResolvedValue([
        { sideEffectCode: 'pago', compensationSpecJson: { refund: true } },
      ]);
      d.aggregateRepo.findForUpdate.mockResolvedValue({
        stateConceptId: STATE_A,
        rowVersion: 6,
      });

      await expect(
        d.service.compensateTransition(AGGREGATE_ID, EVENT_ID, DTO_COMP, actor),
      ).rejects.toThrow(/ya no está en el estado/);
    });

    it('rechaza compensar un evento de otro agregado', async () => {
      const d = build();
      d.runtimeRepo.findTransitionEventById.mockResolvedValue({
        ...ORIGINAL,
        aggregateId: 'otro-agregado',
      });

      await expect(
        d.service.compensateTransition(AGGREGATE_ID, EVENT_ID, DTO_COMP, actor),
      ).rejects.toThrow(/no existe para ese agregado/);
    });
  });

  describe('retryTransition (UC-32-09)', () => {
    const ORIGINAL = {
      id: EVENT_ID,
      aggregateId: AGGREGATE_ID,
      stateMachineDefinitionId: MACHINE.id,
      transitionDefinitionId: 'transition-1',
      fromStateConceptId: STATE_A,
      toStateConceptId: STATE_B,
      idempotencyKey: 'clave-original',
      occurredAt: new Date(),
    };

    it('conserva la clave de idempotencia del original', async () => {
      const d = build();
      d.runtimeRepo.findTransitionEventById.mockResolvedValue(ORIGINAL);

      const result = await d.service.retryTransition(
        AGGREGATE_ID,
        EVENT_ID,
        {},
        actor,
      );

      const event = d.runtimeRepo.createTransitionEvent.mock.calls[0][1];
      expect(event.idempotencyKey).toBe('clave-original');
      expect(result.idempotencyKey).toBe('clave-original');
    });

    it('no mueve el agregado: la transición ya se había aplicado', async () => {
      const d = build();
      d.runtimeRepo.findTransitionEventById.mockResolvedValue(ORIGINAL);

      await d.service.retryTransition(AGGREGATE_ID, EVENT_ID, {}, actor);

      expect(d.aggregateRepo.updateState).not.toHaveBeenCalled();
      const event = d.runtimeRepo.createTransitionEvent.mock.calls[0][1];
      expect(event.fromStateConceptId).toBe(STATE_B);
      expect(event.toStateConceptId).toBe(STATE_B);
    });

    it('devuelve la instancia de retry_scheduled a running', async () => {
      const d = build();
      d.runtimeRepo.findTransitionEventById.mockResolvedValue(ORIGINAL);
      const instance = {
        id: 'instancia-1',
        currentStateConceptId: CONCEPTS.WF_INSTANCE_RETRY_SCHEDULED,
        statusConceptId: CONCEPTS.WF_INSTANCE_RETRY_SCHEDULED,
        updatedAt: new Date(),
      };
      d.runtimeRepo.findInstanceForUpdate.mockResolvedValue(instance);

      const result = await d.service.retryTransition(
        AGGREGATE_ID,
        EVENT_ID,
        { workflowInstanceId: 'instancia-1' },
        actor,
      );

      expect(instance.currentStateConceptId).toBe(CONCEPTS.WF_INSTANCE_RUNNING);
      expect(result.workflowInstanceId).toBe('instancia-1');
    });

    it('rechaza reintentar sobre una instancia que no está esperando reintento', async () => {
      const d = build();
      d.runtimeRepo.findTransitionEventById.mockResolvedValue(ORIGINAL);
      d.runtimeRepo.findInstanceForUpdate.mockResolvedValue({
        id: 'instancia-1',
        currentStateConceptId: CONCEPTS.WF_INSTANCE_RUNNING,
      });

      await expect(
        d.service.retryTransition(
          AGGREGATE_ID,
          EVENT_ID,
          { workflowInstanceId: 'instancia-1' } as any,
          actor,
        ),
      ).rejects.toThrow(/espera de reintento/);
    });
  });

  describe('getTransitionHistory (UC-32-11)', () => {
    it('resuelve el código de transición una vez por definición distinta', async () => {
      const d = build();
      d.runtimeRepo.findTransitionEventsByAggregate.mockResolvedValue([
        [
          {
            id: 'e1',
            transitionDefinitionId: 'transition-1',
            fromStateConceptId: STATE_A,
            toStateConceptId: STATE_B,
            actorUserId: 'user-1',
            occurredAt: new Date('2026-01-02T00:00:00.000Z'),
          },
          {
            id: 'e2',
            transitionDefinitionId: 'transition-1',
            fromStateConceptId: STATE_A,
            toStateConceptId: STATE_B,
            actorUserId: 'user-1',
            occurredAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        ],
        2,
      ]);
      d.machinesRepo.findTransitionById.mockResolvedValue({
        transitionCode: 'close',
        commandCode: 'CLOSE',
      });

      const result = await d.service.getTransitionHistory(AGGREGATE_ID, {});

      expect(d.machinesRepo.findTransitionById).toHaveBeenCalledTimes(1);
      expect(result.total).toBe(2);
      expect(result.transitions[0].transitionCode).toBe('close');
    });

    it('recorta el límite pedido al máximo del módulo', async () => {
      const d = build();

      await d.service.getTransitionHistory(AGGREGATE_ID, {
        limit: 5000,
      });

      expect(
        d.runtimeRepo.findTransitionEventsByAggregate.mock.calls[0][2].limit,
      ).toBe(200);
    });

    it('devuelve el estado actual de la instancia asociada', async () => {
      const d = build();
      d.runtimeRepo.findInstanceByAggregate.mockResolvedValue({
        currentStateConceptId: STATE_B,
      });

      const result = await d.service.getTransitionHistory(AGGREGATE_ID, {});

      expect(result.currentStateConceptId).toBe(STATE_B);
    });

    it('rechaza filtrar por una máquina sin versión activa', async () => {
      const d = build();
      d.machinesRepo.findActiveMachineByCode.mockResolvedValue(null);

      await expect(
        d.service.getTransitionHistory(AGGREGATE_ID, {
          machineCode: 'no-existe',
        } as any),
      ).rejects.toThrow(/máquina activa/);
    });
  });
});
