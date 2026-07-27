import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import {
  StateMachinesRepository,
  WorkflowRuntimeRepository,
} from '../repositories';
import {
  CreateWorkflowInstanceDto,
  WorkflowInstanceResponseDto,
  CompleteTaskDto,
  CompleteTaskResponseDto,
  SweepTimeoutsDto,
  SweepTimeoutsResponseDto,
} from '../dto';

/** Estados en los que una instancia sigue viva y compite por el sujeto. */
const LIVE_INSTANCE_STATUSES = [
  CONCEPTS.WF_INSTANCE_ACTIVE,
  CONCEPTS.WF_INSTANCE_RUNNING,
  CONCEPTS.WF_INSTANCE_RETRY_SCHEDULED,
  CONCEPTS.WF_INSTANCE_ESCALATED,
];

/** Estados en los que una tarea todavía se puede trabajar. */
const OPEN_TASK_STATUSES = [
  CONCEPTS.WF_TASK_OPEN,
  CONCEPTS.WF_TASK_IN_PROGRESS,
];

const DEFAULT_SWEEP_BATCH = 50;
const MAX_SWEEP_BATCH = 500;

/**
 * Instancias de workflow y sus tareas (UC-32-10, 12, 13): crear la instancia con
 * sus tareas iniciales, completar una tarea y barrer los plazos vencidos.
 */
@Injectable()
export class WorkflowInstancesService {
  constructor(
    private readonly em: EntityManager,
    private readonly machinesRepo: StateMachinesRepository,
    private readonly runtimeRepo: WorkflowRuntimeRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WorkflowInstancesService.name);
  }

  /**
   * UC-32-12: crear una instancia de workflow y sus tareas iniciales.
   *
   * El estado inicial **no lo elige el llamante**: sale del `is_initial` de la
   * definición activa. Dejarlo entrar por la petición permitiría arrancar una
   * instancia en mitad del flujo, saltándose todo lo que hay antes.
   *
   * Una sola instancia viva por (código, sujeto): dos flujos del mismo tipo sobre
   * el mismo agregado competirían por moverlo.
   */
  async createInstance(
    dto: CreateWorkflowInstanceDto,
    actor: AuthenticatedUser,
  ): Promise<WorkflowInstanceResponseDto> {
    return this.em.transactional(async (tx) => {
      const machine = await this.machinesRepo.findActiveMachineByCode(
        tx,
        dto.workflowCode,
        CONCEPTS.WF_DEF_ACTIVE,
      );
      if (!machine) {
        throw new ResourceNotFoundException(
          'No hay una versión activa de la máquina de estado para ese workflow.',
          { workflowCode: dto.workflowCode },
        );
      }

      const initialState = await this.machinesRepo.findInitialState(
        tx,
        machine.id,
      );
      if (!initialState) {
        throw new PreconditionFailedException(
          'La definición activa no declara estado inicial.',
          { machineId: machine.id },
        );
      }

      const live = await this.runtimeRepo.findLiveInstance(
        tx,
        dto.workflowCode,
        dto.subjectId,
        LIVE_INSTANCE_STATUSES,
      );
      if (live) {
        throw new ConflictException(
          'Ya hay una instancia viva de ese workflow para el sujeto.',
          {
            workflowCode: dto.workflowCode,
            subjectId: dto.subjectId,
            workflowInstanceId: live.id,
          },
        );
      }

      const instance = this.runtimeRepo.createInstance(tx, {
        workflowCode: dto.workflowCode,
        subjectTypeConceptId: dto.subjectTypeConceptId,
        subjectId: dto.subjectId,
        tenantId: dto.tenantId,
        currentStateConceptId: initialState.stateConceptId,
        currentStepCode: dto.currentStepCode,
        contextJson: dto.contextJson,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        statusConceptId: CONCEPTS.WF_INSTANCE_ACTIVE,
        actorUserId: actor.id,
      });

      const taskIds: string[] = [];
      for (const task of dto.tasks ?? []) {
        const created = this.runtimeRepo.createTask(tx, {
          workflowInstanceId: instance.id,
          taskCode: task.taskCode,
          taskTypeConceptId: task.taskTypeConceptId,
          assignedUserId: task.assignedUserId,
          assignedRoleConceptId: task.assignedRoleConceptId,
          requiredPermissionId: task.requiredPermissionId,
          dueAt: task.dueAt ? new Date(task.dueAt) : undefined,
          statusConceptId: CONCEPTS.WF_TASK_OPEN,
          actorUserId: actor.id,
        });
        taskIds.push(created.id);
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'WorkflowInstanceStarted',
        aggregateType: 'workflow.workflow_instances',
        aggregateId: instance.id,
        payloadJson: {
          workflowCode: instance.workflowCode,
          subjectId: instance.subjectId,
          currentStateConceptId: instance.currentStateConceptId,
          taskCount: taskIds.length,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'workflow.instance.create',
          instanceId: instance.id,
          tasks: taskIds.length,
        },
        'Instancia de workflow creada',
      );

      return {
        id: instance.id,
        workflowCode: instance.workflowCode,
        currentStateConceptId: instance.currentStateConceptId,
        statusConceptId: instance.statusConceptId,
        taskIds,
      };
    });
  }

  /**
   * UC-32-13: completar una tarea.
   *
   * Sólo se completa una tarea abierta o en curso, y sólo si su instancia sigue
   * viva: completar una tarea de una instancia terminada avanzaría un paso de un
   * flujo que ya acabó.
   *
   * Quien completa queda fijado en `assigned_user_id`. Es la única forma de saber
   * después quién dio por buena la tarea cuando estaba asignada a un rol y no a
   * una persona.
   */
  async completeTask(
    taskId: string,
    dto: CompleteTaskDto,
    actor: AuthenticatedUser,
  ): Promise<CompleteTaskResponseDto> {
    return this.em.transactional(async (tx) => {
      const task = await this.runtimeRepo.findTaskForUpdate(tx, taskId);
      if (!task) {
        throw new ResourceNotFoundException(
          'Tarea de workflow no encontrada.',
          { taskId },
        );
      }
      if (!OPEN_TASK_STATUSES.includes(task.statusConceptId)) {
        throw new PreconditionFailedException('La tarea ya no está abierta.', {
          taskId,
          statusConceptId: task.statusConceptId,
        });
      }

      const instance = await this.runtimeRepo.findInstanceForUpdate(
        tx,
        task.workflowInstanceId,
      );
      if (!instance) {
        throw new ResourceNotFoundException(
          'Instancia de workflow no encontrada.',
          {
            workflowInstanceId: task.workflowInstanceId,
          },
        );
      }
      if (!LIVE_INSTANCE_STATUSES.includes(instance.statusConceptId)) {
        throw new PreconditionFailedException(
          'La instancia ya no está viva; su tarea no puede completarse.',
          {
            workflowInstanceId: instance.id,
            statusConceptId: instance.statusConceptId,
          },
        );
      }

      // Si la tarea estaba asignada a otra persona, completarla no es "cerrarla":
      // es apropiarse de una decisión que era de alguien más.
      if (task.assignedUserId && task.assignedUserId !== actor.id) {
        throw new ConflictException('La tarea está asignada a otro usuario.', {
          taskId,
        });
      }

      task.statusConceptId = CONCEPTS.WF_TASK_COMPLETED;
      task.assignedUserId = actor.id;
      touch(task, actor.id);

      if (dto.nextStepCode) instance.currentStepCode = dto.nextStepCode;
      instance.dueAt = dto.nextDueAt ? new Date(dto.nextDueAt) : undefined;
      if (dto.resultJson) {
        const context = (instance.contextJson ?? {}) as Record<string, unknown>;
        instance.contextJson = {
          ...context,
          [`task:${task.taskCode}`]: dto.resultJson,
        };
      }
      touch(instance, actor.id);

      // La transición que dispara el completado, si la definición la declara para
      // el comando recibido. Sin comando, la tarea sólo avanza el paso.
      let transitionEventId: string | undefined;
      if (dto.commandCode) {
        const machine = await this.machinesRepo.findActiveMachineByCode(
          tx,
          instance.workflowCode,
          CONCEPTS.WF_DEF_ACTIVE,
        );
        if (!machine) {
          throw new ResourceNotFoundException(
            'No hay una versión activa de la máquina de estado para ese workflow.',
            { workflowCode: instance.workflowCode },
          );
        }
        const transition = await this.machinesRepo.findTransitionByCommand(
          tx,
          machine.id,
          instance.currentStateConceptId,
          dto.commandCode,
        );
        if (!transition) {
          throw new PreconditionFailedException(
            'El comando no es aplicable desde el estado actual de la instancia.',
            {
              commandCode: dto.commandCode,
              currentStateConceptId: instance.currentStateConceptId,
            },
          );
        }

        const event = this.runtimeRepo.createTransitionEvent(tx, {
          stateMachineDefinitionId: machine.id,
          transitionDefinitionId: transition.id,
          aggregateId: instance.subjectId,
          fromStateConceptId: instance.currentStateConceptId,
          toStateConceptId: transition.toStateConceptId,
          actorUserId: actor.id,
          actorTenantId: instance.tenantId,
          reasonConceptId: CONCEPTS.WF_REASON_TASK_COMPLETED,
          idempotencyKey: `task-complete:${taskId}`,
        });
        transitionEventId = event.id;
        instance.currentStateConceptId = transition.toStateConceptId;
      }

      const remaining = await this.runtimeRepo.findOpenTasksByInstance(
        tx,
        instance.id,
        OPEN_TASK_STATUSES,
      );

      await this.outbox.publishDomainEvent(tx, {
        tenantId: instance.tenantId,
        eventType: 'WorkflowTaskCompleted',
        aggregateType: 'workflow.workflow_tasks',
        aggregateId: task.id,
        payloadJson: {
          workflowInstanceId: instance.id,
          taskCode: task.taskCode,
          currentStepCode: instance.currentStepCode,
          transitionEventId: transitionEventId ?? null,
          remainingOpenTasks: remaining.length,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'workflow.task.complete',
          taskId,
          instanceId: instance.id,
          transitionEventId,
        },
        'Tarea de workflow completada',
      );

      return {
        taskId: task.id,
        statusConceptId: task.statusConceptId,
        workflowInstanceId: instance.id,
        currentStepCode: instance.currentStepCode,
        transitionEventId,
        remainingOpenTasks: remaining.length,
      };
    });
  }

  /**
   * UC-32-10: barrer los plazos vencidos y escalar.
   *
   * Toma un lote de instancias con `due_at` pasado usando `SKIP LOCKED`, para que
   * dos barridos concurrentes se repartan la cola en vez de bloquearse el uno al
   * otro. Lo que este barrido no toma, lo toma el siguiente.
   *
   * Escalar no cancela: la instancia queda `escalated` y sus tareas vencidas
   * también. Cerrarla automáticamente perdería el trabajo hecho, y un plazo
   * vencido significa que alguien tiene que mirarlo, no que haya que tirarlo.
   */
  async sweepTimeouts(
    dto: SweepTimeoutsDto,
    actor: AuthenticatedUser,
  ): Promise<SweepTimeoutsResponseDto> {
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const batchSize = Math.min(
        dto.batchSize ?? DEFAULT_SWEEP_BATCH,
        MAX_SWEEP_BATCH,
      );

      const due = await this.runtimeRepo.findDueInstancesForUpdate(
        tx,
        now,
        [CONCEPTS.WF_INSTANCE_ACTIVE, CONCEPTS.WF_INSTANCE_RUNNING],
        batchSize,
      );

      const instanceIds: string[] = [];
      let escalatedTasks = 0;

      for (const instance of due) {
        instance.statusConceptId = CONCEPTS.WF_INSTANCE_ESCALATED;
        instance.currentStateConceptId = CONCEPTS.WF_INSTANCE_ESCALATED;
        // Se limpia el plazo al escalar: dejarlo vencido haría que el siguiente
        // barrido volviera a tomar la misma instancia una y otra vez.
        instance.dueAt = undefined;
        touch(instance, actor.id);
        instanceIds.push(instance.id);

        const tasks = await this.runtimeRepo.findDueTasksByInstanceForUpdate(
          tx,
          instance.id,
          now,
          OPEN_TASK_STATUSES,
        );
        for (const task of tasks) {
          task.statusConceptId = CONCEPTS.WF_TASK_ESCALATED;
          touch(task, actor.id);
          escalatedTasks += 1;
        }

        await this.outbox.publishDomainEvent(tx, {
          tenantId: instance.tenantId,
          eventType: 'WorkflowTimedOut',
          aggregateType: 'workflow.workflow_instances',
          aggregateId: instance.id,
          payloadJson: {
            workflowCode: instance.workflowCode,
            subjectId: instance.subjectId,
            escalatedTasks: tasks.length,
          },
          // Una instancia sólo se escala una vez por barrido: la clave lo hace
          // explícito y evita que un reintento del worker duplique el aviso.
          idempotencyKey: `workflow-timeout:${instance.id}:${now.toISOString()}`,
          actorUserId: actor.id,
        });
      }

      if (instanceIds.length > 0) {
        this.logger.warn(
          {
            operation: 'workflow.instance.sweep-timeouts',
            escalatedInstances: instanceIds.length,
            escalatedTasks,
          },
          'Instancias de workflow escaladas por vencimiento',
        );
      }

      return {
        escalatedInstances: instanceIds.length,
        escalatedTasks,
        instanceIds,
      };
    });
  }
}
