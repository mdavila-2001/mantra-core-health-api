import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import { StateMachineDefinitionService } from './state-machine-definition.service';

const actor = { id: 'user-1', roles: ['WORKFLOW_ARCHITECT'] } as any;
const MACHINE_ID = '11111111-1111-1111-1111-111111111111';
const VALUE_SET_ID = '22222222-2222-2222-2222-222222222222';
const STATE_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const STATE_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const STATE_C = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const machinesRepo = {
    findMachineByCode: mockFn(async () => null),
    findMachineById: mockFn(async () => null),
    findMachineForUpdate: mockFn(async () => null),
    findActiveMachineForUpdate: mockFn(async () => null),
    findMaxVersionNumber: mockFn(async () => 0),
    createMachine: mockFn((_tx: any, data: any) => ({
      id: MACHINE_ID,
      ...data,
    })),
    findStatesByMachine: mockFn(async () => []),
    findState: mockFn(async () => null),
    createState: mockFn((_tx: any, data: any) => ({ id: 'state-1', ...data })),
    findTransitionByCode: mockFn(async () => null),
    findTransitionsByMachine: mockFn(async () => []),
    createTransition: mockFn((_tx: any, data: any) => ({
      id: 'transition-1',
      ...data,
    })),
    createGuard: mockFn((_tx: any, data: any) => ({ id: 'guard-1', ...data })),
    createSideEffect: mockFn((_tx: any, data: any) => ({
      id: 'effect-1',
      ...data,
    })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new StateMachineDefinitionService(
    em as any,
    machinesRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, machinesRepo, outbox, logger };
}

const REGISTER_DTO = {
  machineCode: 'encounter-lifecycle',
  aggregateSchemaName: 'clinical',
  aggregateEntityName: 'encounters',
  statusFieldName: 'status_concept_id',
  stateValueSetId: VALUE_SET_ID,
} as any;

describe('StateMachineDefinitionService', () => {
  describe('registerStateMachine (UC-32-01)', () => {
    it('nace en borrador con la versión siguiente del value set', async () => {
      const d = build();
      d.machinesRepo.findMaxVersionNumber.mockResolvedValue(2);

      const result = await d.service.registerStateMachine(REGISTER_DTO, actor);

      const created = d.machinesRepo.createMachine.mock.calls[0][1];
      expect(created.statusConceptId).toBe(CONCEPTS.WF_DEF_DRAFT);
      expect(created.versionNumber).toBe(3);
      expect(result.id).toBe(MACHINE_ID);
    });

    it('rechaza un código de máquina repetido', async () => {
      const d = build();
      d.machinesRepo.findMachineByCode.mockResolvedValue({ id: 'otra' });

      await expect(
        d.service.registerStateMachine(REGISTER_DTO, actor),
      ).rejects.toThrow(/Ya existe una máquina/);
    });

    it('publica StateMachineDefined en la misma transacción', async () => {
      const d = build();

      await d.service.registerStateMachine(REGISTER_DTO, actor);

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'StateMachineDefined' }),
      );
    });
  });

  describe('defineStates (UC-32-02)', () => {
    const DTO = {
      states: [
        {
          stateConceptId: STATE_A,
          stateCodeSnapshot: 'draft',
          isInitial: true,
          ordinal: 0,
        },
        {
          stateConceptId: STATE_B,
          stateCodeSnapshot: 'closed',
          isTerminal: true,
          ordinal: 1,
        },
      ],
    } as any;

    it('crea los estados y devuelve el total', async () => {
      const d = build();
      d.machinesRepo.findMachineForUpdate.mockResolvedValue({
        id: MACHINE_ID,
        statusConceptId: CONCEPTS.WF_DEF_DRAFT,
      });

      const result = await d.service.defineStates(MACHINE_ID, DTO, actor);

      expect(d.machinesRepo.createState).toHaveBeenCalledTimes(2);
      expect(result.totalStates).toBe(2);
      expect(result.stateIds).toHaveLength(2);
    });

    it('rechaza declarar estados sobre una definición ya publicada', async () => {
      const d = build();
      d.machinesRepo.findMachineForUpdate.mockResolvedValue({
        id: MACHINE_ID,
        statusConceptId: CONCEPTS.WF_DEF_ACTIVE,
      });

      await expect(
        d.service.defineStates(MACHINE_ID, DTO, actor),
      ).rejects.toThrow(/en borrador/);
    });

    it('exige exactamente un estado inicial contando los ya declarados', async () => {
      const d = build();
      d.machinesRepo.findMachineForUpdate.mockResolvedValue({
        id: MACHINE_ID,
        statusConceptId: CONCEPTS.WF_DEF_DRAFT,
      });
      d.machinesRepo.findStatesByMachine.mockResolvedValue([
        { stateConceptId: STATE_C, isInitial: true },
      ]);

      await expect(
        d.service.defineStates(MACHINE_ID, DTO, actor),
      ).rejects.toThrow(/exactamente un estado inicial/);
    });

    it('rechaza declarar dos veces el mismo concepto de estado', async () => {
      const d = build();
      d.machinesRepo.findMachineForUpdate.mockResolvedValue({
        id: MACHINE_ID,
        statusConceptId: CONCEPTS.WF_DEF_DRAFT,
      });
      d.machinesRepo.findStatesByMachine.mockResolvedValue([
        { stateConceptId: STATE_A, isInitial: false },
      ]);

      await expect(
        d.service.defineStates(MACHINE_ID, DTO, actor),
      ).rejects.toThrow(/ya está declarado/);
    });
  });

  describe('defineTransition (UC-32-03)', () => {
    const DTO = {
      transitionCode: 'close',
      fromStateConceptId: STATE_A,
      toStateConceptId: STATE_B,
      commandCode: 'CLOSE',
      requiredPermissionId: '33333333-3333-3333-3333-333333333333',
      purposeOfUseConceptId: '44444444-4444-4444-4444-444444444444',
      guards: [
        {
          guardCode: 'g1',
          guardTypeConceptId: CONCEPTS.WF_GUARD_EXPRESSION,
          evaluationOrder: 0,
        },
      ],
      sideEffects: [
        {
          sideEffectCode: 'e1',
          sideEffectTypeConceptId: CONCEPTS.WF_EFFECT_OUTBOX,
          executionModeConceptId: CONCEPTS.WF_EXEC_ASYNCHRONOUS,
          executionOrder: 0,
          outboxEventType: 'EncounterClosed',
        },
      ],
    } as any;

    /**
     * Ejecuta la operación with draft machine.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de with draft machine.
     */
    function withDraftMachine(d: ReturnType<typeof build>) {
      d.machinesRepo.findMachineForUpdate.mockResolvedValue({
        id: MACHINE_ID,
        statusConceptId: CONCEPTS.WF_DEF_DRAFT,
      });
      d.machinesRepo.findState.mockImplementation(
        async (_tx: any, _m: any, conceptId: string) => {
          if (conceptId === STATE_A)
            return { stateConceptId: STATE_A, isTerminal: false };
          if (conceptId === STATE_B)
            return { stateConceptId: STATE_B, isTerminal: true };
          return null;
        },
      );
    }

    it('crea la transición con sus guardas y efectos', async () => {
      const d = build();
      withDraftMachine(d);

      const result = await d.service.defineTransition(MACHINE_ID, DTO, actor);

      expect(result.guardCount).toBe(1);
      expect(result.sideEffectCount).toBe(1);
      expect(d.machinesRepo.createGuard).toHaveBeenCalledTimes(1);
      expect(d.machinesRepo.createSideEffect).toHaveBeenCalledTimes(1);
    });

    it('rechaza una transición que sale de un estado terminal', async () => {
      const d = build();
      withDraftMachine(d);

      await expect(
        d.service.defineTransition(
          MACHINE_ID,
          { ...DTO, fromStateConceptId: STATE_B, toStateConceptId: STATE_A },
          actor,
        ),
      ).rejects.toThrow(/estado terminal/);
    });

    it('rechaza un estado de destino no declarado', async () => {
      const d = build();
      withDraftMachine(d);

      await expect(
        d.service.defineTransition(
          MACHINE_ID,
          { ...DTO, toStateConceptId: STATE_C },
          actor,
        ),
      ).rejects.toThrow(/destino no está declarado/);
    });

    it('rechaza dos guardas con el mismo orden de evaluación', async () => {
      const d = build();
      withDraftMachine(d);

      await expect(
        d.service.defineTransition(
          MACHINE_ID,
          {
            ...DTO,
            guards: [
              {
                guardCode: 'g1',
                guardTypeConceptId: CONCEPTS.WF_GUARD_EXPRESSION,
                evaluationOrder: 0,
              },
              {
                guardCode: 'g2',
                guardTypeConceptId: CONCEPTS.WF_GUARD_EXPRESSION,
                evaluationOrder: 0,
              },
            ],
          },
          actor,
        ),
      ).rejects.toThrow(/mismo orden de evaluación/);
    });

    it('rechaza un código de transición repetido', async () => {
      const d = build();
      withDraftMachine(d);
      d.machinesRepo.findTransitionByCode.mockResolvedValue({ id: 'otra' });

      await expect(
        d.service.defineTransition(MACHINE_ID, DTO, actor),
      ).rejects.toThrow(/Ya existe una transición/);
    });
  });

  describe('publishStateMachine (UC-32-04)', () => {
    /**
     * Ejecuta la operación with graph.
     *
     * @param d - Valor de d requerido por la operación.
     * @param states - Valor de states requerido por la operación.
     * @param transitions - Valor de transitions requerido por la operación.
     * @param machine - Valor de machine requerido por la operación.
     * @returns Resultado de with graph.
     */
    function withGraph(
      d: ReturnType<typeof build>,
      states: any[],
      transitions: any[],
      machine: any = {
        id: MACHINE_ID,
        statusConceptId: CONCEPTS.WF_DEF_DRAFT,
        stateValueSetId: VALUE_SET_ID,
        versionNumber: 1,
      },
    ) {
      d.machinesRepo.findMachineForUpdate.mockResolvedValue(machine);
      d.machinesRepo.findStatesByMachine.mockResolvedValue(states);
      d.machinesRepo.findTransitionsByMachine.mockResolvedValue(transitions);
      return machine;
    }

    it('activa la definición cuando el grafo es alcanzable', async () => {
      const d = build();
      const machine = withGraph(
        d,
        [
          { stateConceptId: STATE_A, isInitial: true, isTerminal: false },
          { stateConceptId: STATE_B, isInitial: false, isTerminal: true },
        ],
        [{ fromStateConceptId: STATE_A, toStateConceptId: STATE_B }],
      );

      const result = await d.service.publishStateMachine(MACHINE_ID, {}, actor);

      expect(machine.statusConceptId).toBe(CONCEPTS.WF_DEF_ACTIVE);
      expect(result.statusConceptId).toBe(CONCEPTS.WF_DEF_ACTIVE);
    });

    it('rechaza publicar un grafo con estados inalcanzables', async () => {
      const d = build();
      withGraph(
        d,
        [
          { stateConceptId: STATE_A, isInitial: true, isTerminal: false },
          { stateConceptId: STATE_B, isInitial: false, isTerminal: true },
          { stateConceptId: STATE_C, isInitial: false, isTerminal: false },
        ],
        [{ fromStateConceptId: STATE_A, toStateConceptId: STATE_B }],
      );

      await expect(
        d.service.publishStateMachine(MACHINE_ID, {} as any, actor),
      ).rejects.toThrow(/inalcanzables/);
    });

    it('rechaza publicar sin estado terminal', async () => {
      const d = build();
      withGraph(
        d,
        [
          { stateConceptId: STATE_A, isInitial: true, isTerminal: false },
          { stateConceptId: STATE_B, isInitial: false, isTerminal: false },
        ],
        [{ fromStateConceptId: STATE_A, toStateConceptId: STATE_B }],
      );

      await expect(
        d.service.publishStateMachine(MACHINE_ID, {} as any, actor),
      ).rejects.toThrow(/estado terminal/);
    });

    it('retira la versión activa anterior del mismo value set', async () => {
      const d = build();
      withGraph(
        d,
        [
          { stateConceptId: STATE_A, isInitial: true, isTerminal: false },
          { stateConceptId: STATE_B, isInitial: false, isTerminal: true },
        ],
        [{ fromStateConceptId: STATE_A, toStateConceptId: STATE_B }],
      );
      const previous = {
        id: 'version-anterior',
        statusConceptId: CONCEPTS.WF_DEF_ACTIVE,
        updatedAt: new Date(),
      };
      d.machinesRepo.findActiveMachineForUpdate.mockResolvedValue(previous);

      const result = await d.service.publishStateMachine(MACHINE_ID, {}, actor);

      expect(previous.statusConceptId).toBe(CONCEPTS.WF_DEF_RETIRED);
      expect(result.retiredVersionId).toBe('version-anterior');
    });

    it('rechaza publicar una definición que ya no está en borrador', async () => {
      const d = build();
      d.machinesRepo.findMachineForUpdate.mockResolvedValue({
        id: MACHINE_ID,
        statusConceptId: CONCEPTS.WF_DEF_ACTIVE,
      });

      await expect(
        d.service.publishStateMachine(MACHINE_ID, {} as any, actor),
      ).rejects.toThrow(/ya no está en borrador/);
    });
  });
});
