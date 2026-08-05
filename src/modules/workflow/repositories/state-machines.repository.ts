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

/**
 * Describe el contrato estructural de create machine data.
 */
export interface CreateMachineData {
  /**
   * Valor de machine code mantenido por la instancia.
   */
  machineCode: string;
  /**
   * Valor de aggregate schema name mantenido por la instancia.
   */
  aggregateSchemaName: string;
  /**
   * Valor de aggregate entity name mantenido por la instancia.
   */
  aggregateEntityName: string;
  /**
   * Valor de status field name mantenido por la instancia.
   */
  statusFieldName: string;
  /**
   * Identificador asociado a state value set.
   */
  stateValueSetId: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  effectiveFrom?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create state data.
 */
export interface CreateStateData {
  /**
   * Identificador asociado a state machine definition.
   */
  stateMachineDefinitionId: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Valor de state code snapshot mantenido por la instancia.
   */
  stateCodeSnapshot: string;
  /**
   * Valor de is initial mantenido por la instancia.
   */
  isInitial: boolean;
  /**
   * Valor de is terminal mantenido por la instancia.
   */
  isTerminal: boolean;
  /**
   * Valor de allows edit mantenido por la instancia.
   */
  allowsEdit: boolean;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create transition data.
 */
export interface CreateTransitionData {
  /**
   * Identificador asociado a state machine definition.
   */
  stateMachineDefinitionId: string;
  /**
   * Valor de transition code mantenido por la instancia.
   */
  transitionCode: string;
  /**
   * Identificador asociado a from state concept.
   */
  fromStateConceptId: string;
  /**
   * Identificador asociado a to state concept.
   */
  toStateConceptId: string;
  /**
   * Valor de command code mantenido por la instancia.
   */
  commandCode: string;
  /**
   * Identificador asociado a required permission.
   */
  requiredPermissionId: string;
  /**
   * Identificador asociado a purpose of use concept.
   */
  purposeOfUseConceptId: string;
  /**
   * Valor de idempotency required mantenido por la instancia.
   */
  idempotencyRequired?: boolean;
  /**
   * Valor de optimistic lock required mantenido por la instancia.
   */
  optimisticLockRequired?: boolean;
  /**
   * Valor de reason required mantenido por la instancia.
   */
  reasonRequired?: boolean;
  /**
   * Valor de transition timeout seconds mantenido por la instancia.
   */
  transitionTimeoutSeconds?: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create guard data.
 */
export interface CreateGuardData {
  /**
   * Identificador asociado a state transition definition.
   */
  stateTransitionDefinitionId: string;
  /**
   * Valor de guard code mantenido por la instancia.
   */
  guardCode: string;
  /**
   * Identificador asociado a guard type concept.
   */
  guardTypeConceptId: string;
  /**
   * Valor de evaluation order mantenido por la instancia.
   */
  evaluationOrder: number;
  /**
   * Valor de expression json mantenido por la instancia.
   */
  expressionJson?: unknown;
  /**
   * Valor de failure code mantenido por la instancia.
   */
  failureCode?: string;
  /**
   * Valor de failure message key mantenido por la instancia.
   */
  failureMessageKey?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create side effect data.
 */
export interface CreateSideEffectData {
  /**
   * Identificador asociado a state transition definition.
   */
  stateTransitionDefinitionId: string;
  /**
   * Valor de side effect code mantenido por la instancia.
   */
  sideEffectCode: string;
  /**
   * Identificador asociado a side effect type concept.
   */
  sideEffectTypeConceptId: string;
  /**
   * Identificador asociado a execution mode concept.
   */
  executionModeConceptId: string;
  /**
   * Valor de execution order mantenido por la instancia.
   */
  executionOrder: number;
  /**
   * Valor de outbox event type mantenido por la instancia.
   */
  outboxEventType?: string;
  /**
   * Valor de action spec json mantenido por la instancia.
   */
  actionSpecJson?: unknown;
  /**
   * Valor de compensation spec json mantenido por la instancia.
   */
  compensationSpecJson?: unknown;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
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

  /**
   * Crea create machine.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create machine conforme al contrato `StateMachineDefinitions`.
   */
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

  /**
   * Obtiene find machine by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find machine by id conforme al contrato `Promise<StateMachineDefinitions | null>`.
   */
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

  /**
   * Obtiene find machine by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param machineCode - Valor de machine code requerido por la operación.
   * @returns Resultado de find machine by code conforme al contrato `Promise<StateMachineDefinitions | null>`.
   */
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

  /**
   * Crea create state.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create state conforme al contrato `StateDefinitions`.
   */
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

  /**
   * Obtiene find states by machine.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param stateMachineDefinitionId - Identificador de state machine definition.
   * @returns Resultado de find states by machine conforme al contrato `Promise<StateDefinitions[]>`.
   */
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

  /**
   * Obtiene find state.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param stateMachineDefinitionId - Identificador de state machine definition.
   * @param stateConceptId - Identificador de state concept.
   * @returns Resultado de find state conforme al contrato `Promise<StateDefinitions | null>`.
   */
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

  /**
   * Obtiene find initial state.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param stateMachineDefinitionId - Identificador de state machine definition.
   * @returns Resultado de find initial state conforme al contrato `Promise<StateDefinitions | null>`.
   */
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

  /**
   * Crea create transition.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create transition conforme al contrato `StateTransitionDefinitions`.
   */
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

  /**
   * Obtiene find transition by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find transition by id conforme al contrato `Promise<StateTransitionDefinitions | null>`.
   */
  findTransitionById(
    em: EntityManager,
    id: string,
  ): Promise<StateTransitionDefinitions | null> {
    return em.findOne(StateTransitionDefinitions, { id });
  }

  /**
   * Obtiene find transition by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param stateMachineDefinitionId - Identificador de state machine definition.
   * @param transitionCode - Valor de transition code requerido por la operación.
   * @returns Resultado de find transition by code conforme al contrato `Promise<StateTransitionDefinitions | null>`.
   */
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

  /**
   * Obtiene find transitions by machine.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param stateMachineDefinitionId - Identificador de state machine definition.
   * @returns Resultado de find transitions by machine conforme al contrato `Promise<StateTransitionDefinitions[]>`.
   */
  findTransitionsByMachine(
    em: EntityManager,
    stateMachineDefinitionId: string,
  ): Promise<StateTransitionDefinitions[]> {
    return em.find(StateTransitionDefinitions, { stateMachineDefinitionId });
  }

  // --- Guardas y efectos (UC-32-03, 05, 07, 08) ---

  /**
   * Crea create guard.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create guard conforme al contrato `TransitionGuards`.
   */
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

  /**
   * Crea create side effect.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create side effect conforme al contrato `TransitionSideEffects`.
   */
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

  /**
   * Obtiene find side effects by transition.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param stateTransitionDefinitionId - Identificador de state transition definition.
   * @returns Resultado de find side effects by transition conforme al contrato `Promise<TransitionSideEffects[]>`.
   */
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
