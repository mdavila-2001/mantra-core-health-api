import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  StateTransitionEvents,
  WorkflowInstances,
  WorkflowTasks,
} from '../entities';
import { createdBy } from '../../../common/persistence/audit-fields';

export interface CreateTransitionEventData {
  stateMachineDefinitionId: string;
  transitionDefinitionId: string;
  aggregateId: string;
  fromStateConceptId: string;
  toStateConceptId: string;
  actorUserId: string;
  actorTenantId?: string;
  reasonConceptId?: string;
  reasonText?: string;
  idempotencyKey?: string;
  correlationId?: string;
  causationId?: string;
  aggregateRowVersionBefore?: number;
  aggregateRowVersionAfter?: number;
  occurredAt?: Date;
}

export interface CreateInstanceData {
  workflowCode: string;
  subjectTypeConceptId: string;
  subjectId: string;
  tenantId: string;
  currentStateConceptId: string;
  currentStepCode?: string;
  contextJson?: unknown;
  dueAt?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateTaskData {
  workflowInstanceId: string;
  taskCode: string;
  taskTypeConceptId: string;
  assignedUserId?: string;
  assignedRoleConceptId?: string;
  requiredPermissionId?: string;
  dueAt?: Date;
  statusConceptId: string;
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
      stateMachineDefinitionId?: string;
      limit: number;
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

  findInstanceById(
    em: EntityManager,
    id: string,
  ): Promise<WorkflowInstances | null> {
    return em.findOne(WorkflowInstances, { id });
  }

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

  findTaskById(em: EntityManager, id: string): Promise<WorkflowTasks | null> {
    return em.findOne(WorkflowTasks, { id });
  }

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
