import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  StateMachineDefinitions,
  StateDefinitions,
  StateTransitionDefinitions,
  TransitionGuards,
  TransitionSideEffects,
} from '../entities';
import { createdBy } from '../../../common/persistence/audit-fields';

export interface CreateMachineData {
  machineCode: string;
  aggregateSchemaName: string;
  aggregateEntityName: string;
  statusFieldName: string;
  stateValueSetId: string;
  versionNumber: number;
  statusConceptId: string;
  effectiveFrom?: Date;
  actorUserId?: string;
}

export interface CreateStateData {
  stateMachineDefinitionId: string;
  stateConceptId: string;
  stateCodeSnapshot: string;
  isInitial: boolean;
  isTerminal: boolean;
  allowsEdit: boolean;
  ordinal: number;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateTransitionData {
  stateMachineDefinitionId: string;
  transitionCode: string;
  fromStateConceptId: string;
  toStateConceptId: string;
  commandCode: string;
  requiredPermissionId: string;
  purposeOfUseConceptId: string;
  idempotencyRequired?: boolean;
  optimisticLockRequired?: boolean;
  reasonRequired?: boolean;
  transitionTimeoutSeconds?: number;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateGuardData {
  stateTransitionDefinitionId: string;
  guardCode: string;
  guardTypeConceptId: string;
  evaluationOrder: number;
  expressionJson?: unknown;
  failureCode?: string;
  failureMessageKey?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateSideEffectData {
  stateTransitionDefinitionId: string;
  sideEffectCode: string;
  sideEffectTypeConceptId: string;
  executionModeConceptId: string;
  executionOrder: number;
  outboxEventType?: string;
  actionSpecJson?: unknown;
  compensationSpecJson?: unknown;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso al catálogo de definición de `workflow.*`: máquinas, sus estados, sus
 * transiciones y las guardas y efectos que cuelgan de cada transición. Es la parte
 * que sólo escribe el arquitecto de workflow; la ejecución vive en el otro
 * repositorio.
 */
@Injectable()
export class StateMachinesRepository {
  // --- Definiciones de máquina (UC-32-01, 04) ---

  createMachine(
    em: EntityManager,
    data: CreateMachineData,
  ): StateMachineDefinitions {
    return em.create(
      StateMachineDefinitions,
      {
        machineCode: data.machineCode,
        aggregateSchemaName: data.aggregateSchemaName,
        aggregateEntityName: data.aggregateEntityName,
        statusFieldName: data.statusFieldName,
        stateValueSetId: data.stateValueSetId,
        versionNumber: data.versionNumber,
        statusConceptId: data.statusConceptId,
        effectiveFrom: data.effectiveFrom,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findMachineById(
    em: EntityManager,
    id: string,
  ): Promise<StateMachineDefinitions | null> {
    return em.findOne(StateMachineDefinitions, { id });
  }

  /** Bloquea la definición: publicar y añadir estados compiten por la misma fila. */
  findMachineForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<StateMachineDefinitions | null> {
    return em.findOne(
      StateMachineDefinitions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findMachineByCode(
    em: EntityManager,
    machineCode: string,
  ): Promise<StateMachineDefinitions | null> {
    return em.findOne(StateMachineDefinitions, { machineCode });
  }

  /**
   * Versión vigente de la máquina. El `code` identifica la máquina lógica; la
   * versión activa es la única contra la que se pueden disparar transiciones.
   */
  findActiveMachineByCode(
    em: EntityManager,
    machineCode: string,
    activeStatusConceptId: string,
  ): Promise<StateMachineDefinitions | null> {
    return em.findOne(StateMachineDefinitions, {
      machineCode,
      statusConceptId: activeStatusConceptId,
    });
  }

  /** La activa vigente, bloqueada: al publicar una nueva hay que retirarla. */
  findActiveMachineForUpdate(
    em: EntityManager,
    stateValueSetId: string,
    activeStatusConceptId: string,
  ): Promise<StateMachineDefinitions | null> {
    return em.findOne(
      StateMachineDefinitions,
      { stateValueSetId, statusConceptId: activeStatusConceptId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Mayor número de versión emitido para el value set, para derivar el siguiente. */
  async findMaxVersionNumber(
    em: EntityManager,
    stateValueSetId: string,
  ): Promise<number> {
    const rows = await em.find(
      StateMachineDefinitions,
      { stateValueSetId },
      {
        fields: ['versionNumber'],
        orderBy: { versionNumber: 'DESC' },
        limit: 1,
      },
    );
    return rows.length > 0 ? rows[0].versionNumber : 0;
  }

  // --- Estados (UC-32-02) ---

  createState(em: EntityManager, data: CreateStateData): StateDefinitions {
    return em.create(
      StateDefinitions,
      {
        stateMachineDefinitionId: data.stateMachineDefinitionId,
        stateConceptId: data.stateConceptId,
        stateCodeSnapshot: data.stateCodeSnapshot,
        isInitial: data.isInitial,
        isTerminal: data.isTerminal,
        allowsEdit: data.allowsEdit,
        ordinal: data.ordinal,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findStatesByMachine(
    em: EntityManager,
    stateMachineDefinitionId: string,
  ): Promise<StateDefinitions[]> {
    return em.find(
      StateDefinitions,
      { stateMachineDefinitionId },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  findState(
    em: EntityManager,
    stateMachineDefinitionId: string,
    stateConceptId: string,
  ): Promise<StateDefinitions | null> {
    return em.findOne(StateDefinitions, {
      stateMachineDefinitionId,
      stateConceptId,
    });
  }

  findInitialState(
    em: EntityManager,
    stateMachineDefinitionId: string,
  ): Promise<StateDefinitions | null> {
    return em.findOne(StateDefinitions, {
      stateMachineDefinitionId,
      isInitial: true,
    });
  }

  // --- Transiciones (UC-32-03) ---

  createTransition(
    em: EntityManager,
    data: CreateTransitionData,
  ): StateTransitionDefinitions {
    return em.create(
      StateTransitionDefinitions,
      {
        stateMachineDefinitionId: data.stateMachineDefinitionId,
        transitionCode: data.transitionCode,
        fromStateConceptId: data.fromStateConceptId,
        toStateConceptId: data.toStateConceptId,
        commandCode: data.commandCode,
        requiredPermissionId: data.requiredPermissionId,
        purposeOfUseConceptId: data.purposeOfUseConceptId,
        idempotencyRequired: data.idempotencyRequired,
        optimisticLockRequired: data.optimisticLockRequired,
        reasonRequired: data.reasonRequired,
        transitionTimeoutSeconds: data.transitionTimeoutSeconds,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findTransitionById(
    em: EntityManager,
    id: string,
  ): Promise<StateTransitionDefinitions | null> {
    return em.findOne(StateTransitionDefinitions, { id });
  }

  findTransitionByCode(
    em: EntityManager,
    stateMachineDefinitionId: string,
    transitionCode: string,
  ): Promise<StateTransitionDefinitions | null> {
    return em.findOne(StateTransitionDefinitions, {
      stateMachineDefinitionId,
      transitionCode,
    });
  }

  /**
   * La transición aplicable a un disparo: la que sale del estado actual con el
   * comando pedido. Si no existe, el comando no es legal desde donde está el
   * agregado.
   */
  findTransitionByCommand(
    em: EntityManager,
    stateMachineDefinitionId: string,
    fromStateConceptId: string,
    commandCode: string,
  ): Promise<StateTransitionDefinitions | null> {
    return em.findOne(StateTransitionDefinitions, {
      stateMachineDefinitionId,
      fromStateConceptId,
      commandCode,
    });
  }

  findTransitionsByMachine(
    em: EntityManager,
    stateMachineDefinitionId: string,
  ): Promise<StateTransitionDefinitions[]> {
    return em.find(StateTransitionDefinitions, { stateMachineDefinitionId });
  }

  // --- Guardas y efectos (UC-32-03, 05, 07, 08) ---

  createGuard(em: EntityManager, data: CreateGuardData): TransitionGuards {
    return em.create(
      TransitionGuards,
      {
        stateTransitionDefinitionId: data.stateTransitionDefinitionId,
        guardCode: data.guardCode,
        guardTypeConceptId: data.guardTypeConceptId,
        evaluationOrder: data.evaluationOrder,
        expressionJson: data.expressionJson,
        failureCode: data.failureCode,
        failureMessageKey: data.failureMessageKey,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** En orden de evaluación: la primera que falla corta, y el orden es contractual. */
  findGuardsByTransition(
    em: EntityManager,
    stateTransitionDefinitionId: string,
  ): Promise<TransitionGuards[]> {
    return em.find(
      TransitionGuards,
      { stateTransitionDefinitionId },
      { orderBy: { evaluationOrder: 'ASC' } },
    );
  }

  createSideEffect(
    em: EntityManager,
    data: CreateSideEffectData,
  ): TransitionSideEffects {
    return em.create(
      TransitionSideEffects,
      {
        stateTransitionDefinitionId: data.stateTransitionDefinitionId,
        sideEffectCode: data.sideEffectCode,
        sideEffectTypeConceptId: data.sideEffectTypeConceptId,
        executionModeConceptId: data.executionModeConceptId,
        executionOrder: data.executionOrder,
        outboxEventType: data.outboxEventType,
        actionSpecJson: data.actionSpecJson,
        compensationSpecJson: data.compensationSpecJson,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findSideEffectsByTransition(
    em: EntityManager,
    stateTransitionDefinitionId: string,
  ): Promise<TransitionSideEffects[]> {
    return em.find(
      TransitionSideEffects,
      { stateTransitionDefinitionId },
      { orderBy: { executionOrder: 'ASC' } },
    );
  }
}
