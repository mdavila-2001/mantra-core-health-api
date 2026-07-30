import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  StateTransitionEvents,
  WorkflowInstances,
  WorkflowTasks,
} from '../entities';
import { createdBy } from '../../../common/persistence/audit-fields';

/**
 * Describe el contrato estructural de create transition event data.
 */
export interface CreateTransitionEventData {
  /**
   * Identificador asociado a state machine definition.
   */
  stateMachineDefinitionId: string;
  /**
   * Identificador asociado a transition definition.
   */
  transitionDefinitionId: string;
  /**
   * Identificador asociado a aggregate.
   */
  aggregateId: string;
  /**
   * Identificador asociado a from state concept.
   */
  fromStateConceptId: string;
  /**
   * Identificador asociado a to state concept.
   */
  toStateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId: string;
  /**
   * Identificador asociado a actor tenant.
   */
  actorTenantId?: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId?: string;
  /**
   * Valor de reason text mantenido por la instancia.
   */
  reasonText?: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey?: string;
  /**
   * Identificador asociado a correlation.
   */
  correlationId?: string;
  /**
   * Identificador asociado a causation.
   */
  causationId?: string;
  /**
   * Valor de aggregate row version before mantenido por la instancia.
   */
  aggregateRowVersionBefore?: number;
  /**
   * Valor de aggregate row version after mantenido por la instancia.
   */
  aggregateRowVersionAfter?: number;
  /**
   * Valor de occurred at mantenido por la instancia.
   */
  occurredAt?: Date;
}

/**
 * Describe el contrato estructural de create instance data.
 */
export interface CreateInstanceData {
  /**
   * Valor de workflow code mantenido por la instancia.
   */
  workflowCode: string;
  /**
   * Identificador asociado a subject type concept.
   */
  subjectTypeConceptId: string;
  /**
   * Identificador asociado a subject.
   */
  subjectId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a current state concept.
   */
  currentStateConceptId: string;
  /**
   * Valor de current step code mantenido por la instancia.
   */
  currentStepCode?: string;
  /**
   * Valor de context json mantenido por la instancia.
   */
  contextJson?: unknown;
  /**
   * Valor de due at mantenido por la instancia.
   */
  dueAt?: Date;
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
 * Describe el contrato estructural de create task data.
 */
export interface CreateTaskData {
  /**
   * Identificador asociado a workflow instance.
   */
  workflowInstanceId: string;
  /**
   * Valor de task code mantenido por la instancia.
   */
  taskCode: string;
  /**
   * Identificador asociado a task type concept.
   */
  taskTypeConceptId: string;
  /**
   * Identificador asociado a assigned user.
   */
  assignedUserId?: string;
  /**
   * Identificador asociado a assigned role concept.
   */
  assignedRoleConceptId?: string;
  /**
   * Identificador asociado a required permission.
   */
  requiredPermissionId?: string;
  /**
   * Valor de due at mantenido por la instancia.
   */
  dueAt?: Date;
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
 * Acceso a la ejecución de `workflow.*`: el histórico inmutable de transiciones,
 * las instancias en curso y sus tareas.
 */
@Injectable()
export class WorkflowRuntimeRepository {
  // --- Eventos de transición (UC-32-05, 06, 08, 09, 10, 11, 13) ---

  /**
   * Append-only: no hay `update*` ni `delete*` sobre esta tabla. Un histórico de
   * transiciones que se puede editar deja de ser el registro de lo que pasó, que
   * es exactamente para lo que existe.
   */
  createTransitionEvent(
    em: EntityManager,
    data: CreateTransitionEventData,
  ): StateTransitionEvents {
    return em.create(
      StateTransitionEvents,
      {
        stateMachineDefinitionId: data.stateMachineDefinitionId,
        transitionDefinitionId: data.transitionDefinitionId,
        aggregateId: data.aggregateId,
        fromStateConceptId: data.fromStateConceptId,
        toStateConceptId: data.toStateConceptId,
        actorUserId: data.actorUserId,
        actorTenantId: data.actorTenantId,
        reasonConceptId: data.reasonConceptId,
        reasonText: data.reasonText,
        idempotencyKey: data.idempotencyKey,
        correlationId: data.correlationId,
        causationId: data.causationId,
        aggregateRowVersionBefore: data.aggregateRowVersionBefore,
        aggregateRowVersionAfter: data.aggregateRowVersionAfter,
        occurredAt: data.occurredAt ?? new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find transition event by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find transition event by id conforme al contrato `Promise<StateTransitionEvents | null>`.
   */
  findTransitionEventById(
    em: EntityManager,
    id: string,
  ): Promise<StateTransitionEvents | null> {
    return em.findOne(StateTransitionEvents, { id });
  }

  /**
   * Resuelve la clave de idempotencia (UC-32-06). El unique parcial es
   * `(state_machine_definition_id, aggregate_id, idempotency_key)`: la misma clave
   * sobre otro agregado es otra operación.
   */
  findTransitionEventByIdempotencyKey(
    em: EntityManager,
    stateMachineDefinitionId: string,
    aggregateId: string,
    idempotencyKey: string,
  ): Promise<StateTransitionEvents | null> {
    return em.findOne(StateTransitionEvents, {
      stateMachineDefinitionId,
      aggregateId,
      idempotencyKey,
    });
  }

  /** Historial del agregado, del más reciente al más antiguo (UC-32-11). */
  findTransitionEventsByAggregate(
    em: EntityManager,
    aggregateId: string,
    options: {
      /**
       * Identificador asociado a state machine definition.
       */
      stateMachineDefinitionId?: string;
      /**
       * Valor de limit mantenido por la instancia.
       */
      limit: number;
      /**
       * Valor de offset mantenido por la instancia.
       */
      offset: number;
    },
  ): Promise<[StateTransitionEvents[], number]> {
    const where: Record<string, unknown> = { aggregateId };
    if (options.stateMachineDefinitionId) {
      where.stateMachineDefinitionId = options.stateMachineDefinitionId;
    }
    return em.findAndCount(StateTransitionEvents, where, {
      orderBy: { occurredAt: 'DESC' },
      limit: options.limit,
      offset: options.offset,
    });
  }

  /** La última transición del agregado da su estado actual sin tocar el agregado. */
  findLastTransitionEvent(
    em: EntityManager,
    stateMachineDefinitionId: string,
    aggregateId: string,
  ): Promise<StateTransitionEvents | null> {
    return em.findOne(
      StateTransitionEvents,
      { stateMachineDefinitionId, aggregateId },
      { orderBy: { occurredAt: 'DESC' } },
    );
  }

  // --- Instancias (UC-32-09, 10, 11, 12, 13) ---

  /**
   * Crea create instance.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create instance conforme al contrato `WorkflowInstances`.
   */
  createInstance(
    em: EntityManager,
    data: CreateInstanceData,
  ): WorkflowInstances {
    return em.create(
      WorkflowInstances,
      {
        workflowCode: data.workflowCode,
        subjectTypeConceptId: data.subjectTypeConceptId,
        subjectId: data.subjectId,
        tenantId: data.tenantId,
        currentStateConceptId: data.currentStateConceptId,
        currentStepCode: data.currentStepCode,
        contextJson: data.contextJson,
        dueAt: data.dueAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find instance by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find instance by id conforme al contrato `Promise<WorkflowInstances | null>`.
   */
  findInstanceById(
    em: EntityManager,
    id: string,
  ): Promise<WorkflowInstances | null> {
    return em.findOne(WorkflowInstances, { id });
  }

  /**
   * Obtiene find instance for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find instance for update conforme al contrato `Promise<WorkflowInstances | null>`.
   */
  findInstanceForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<WorkflowInstances | null> {
    return em.findOne(
      WorkflowInstances,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Instancia viva para el par (código, sujeto). Sirve al unique parcial de
   * UC-32-12: no puede haber dos instancias activas del mismo workflow sobre el
   * mismo sujeto, o dos flujos competirían por el mismo agregado.
   */
  findLiveInstance(
    em: EntityManager,
    workflowCode: string,
    subjectId: string,
    liveStatusConceptIds: string[],
  ): Promise<WorkflowInstances | null> {
    return em.findOne(WorkflowInstances, {
      workflowCode,
      subjectId,
      statusConceptId: { $in: liveStatusConceptIds },
    });
  }

  /**
   * Obtiene find instance by aggregate.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param subjectId - Identificador de subject.
   * @returns Resultado de find instance by aggregate conforme al contrato `Promise<WorkflowInstances | null>`.
   */
  findInstanceByAggregate(
    em: EntityManager,
    subjectId: string,
  ): Promise<WorkflowInstances | null> {
    return em.findOne(
      WorkflowInstances,
      { subjectId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /**
   * Cola de vencidos para el barrido de timeouts (UC-32-10). `SKIP LOCKED` para
   * que dos barridos concurrentes se repartan la cola en vez de bloquearse.
   */
  findDueInstancesForUpdate(
    em: EntityManager,
    now: Date,
    statusConceptIds: string[],
    limit: number,
  ): Promise<WorkflowInstances[]> {
    return em.find(
      WorkflowInstances,
      { dueAt: { $lt: now }, statusConceptId: { $in: statusConceptIds } },
      {
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
        orderBy: { dueAt: 'ASC' },
        limit,
      },
    );
  }

  // --- Tareas (UC-32-10, 12, 13) ---

  /**
   * Crea create task.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create task conforme al contrato `WorkflowTasks`.
   */
  createTask(em: EntityManager, data: CreateTaskData): WorkflowTasks {
    return em.create(
      WorkflowTasks,
      {
        workflowInstanceId: data.workflowInstanceId,
        taskCode: data.taskCode,
        taskTypeConceptId: data.taskTypeConceptId,
        assignedUserId: data.assignedUserId,
        assignedRoleConceptId: data.assignedRoleConceptId,
        requiredPermissionId: data.requiredPermissionId,
        dueAt: data.dueAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find task by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find task by id conforme al contrato `Promise<WorkflowTasks | null>`.
   */
  findTaskById(em: EntityManager, id: string): Promise<WorkflowTasks | null> {
    return em.findOne(WorkflowTasks, { id });
  }

  /**
   * Obtiene find task for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find task for update conforme al contrato `Promise<WorkflowTasks | null>`.
   */
  findTaskForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<WorkflowTasks | null> {
    return em.findOne(
      WorkflowTasks,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find open tasks by instance.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param workflowInstanceId - Identificador de workflow instance.
   * @param openStatusConceptIds - Valor de open status concept ids requerido por la operación.
   * @returns Resultado de find open tasks by instance conforme al contrato `Promise<WorkflowTasks[]>`.
   */
  findOpenTasksByInstance(
    em: EntityManager,
    workflowInstanceId: string,
    openStatusConceptIds: string[],
  ): Promise<WorkflowTasks[]> {
    return em.find(WorkflowTasks, {
      workflowInstanceId,
      statusConceptId: { $in: openStatusConceptIds },
    });
  }

  /** Tareas vencidas de una instancia que se escala: se escalan con ella. */
  findDueTasksByInstanceForUpdate(
    em: EntityManager,
    workflowInstanceId: string,
    now: Date,
    openStatusConceptIds: string[],
  ): Promise<WorkflowTasks[]> {
    return em.find(
      WorkflowTasks,
      {
        workflowInstanceId,
        dueAt: { $lt: now },
        statusConceptId: { $in: openStatusConceptIds },
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
