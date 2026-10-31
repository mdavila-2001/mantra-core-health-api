import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { COMM } from '../../community/community.concepts';
import { ConversationAssignments } from '../../community/entities';
import { AppointmentBookings, BookableSlots } from '../../scheduling/entities';
import { SCHED } from '../../scheduling/domain/scheduling.concepts';
import { WorkflowInstances, WorkflowTasks } from '../../workflow/entities';
import { OrganizationUserAssignments } from '../entities';

/** Conversación de la bandeja que la persona tiene asignada y no resolvió. */
export interface HandoverConversation {
  /** Id de la asignación (`community.conversation_assignments`). */
  readonly id: string;
  /** Doctor de la conversación: define quién puede responder. */
  readonly practitionerProfileId: string;
}

/** Cita pendiente de confirmación creada por la persona, aún futura. */
export interface HandoverBooking {
  /** Id de la cita (`scheduling.appointment_bookings`). */
  readonly id: string;
  /** Inicio del horario reservado. */
  readonly startAt: Date;
}

/** Con quién se compara una fila antes de reasignarla: su organización y quien la tenía. */
export interface HandoverOwner {
  /** Organización del traspaso. */
  readonly tenantId: string;
  /** Persona que se fue: dueña actual esperada de la fila. */
  readonly fromUserId: string;
}

/**
 * Lecturas y escrituras de lo que una persona tiene «en las manos» al irse
 * (CONTRATO-GOBIERNO §6.1): conversaciones de la bandeja, tareas abiertas,
 * cuentas que supervisa y citas pendientes. Es el único lugar del módulo que
 * toca esas tablas de `community`, `workflow` y `scheduling`; solo escribe el
 * puntero de asignación (nunca el contenido ni la autoría de una cita).
 * Stateless: cada método recibe el `EntityManager` activo.
 */
@Injectable()
export class HandoverWorkRepository {
  /**
   * Conversaciones asignadas a la persona y no resueltas.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param userId - Persona que se va.
   * @returns Las asignaciones, en orden estable.
   */
  async findOpenConversations(
    em: EntityManager,
    tenantId: string,
    userId: string,
  ): Promise<HandoverConversation[]> {
    const rows = await em.find(
      ConversationAssignments,
      {
        tenantId,
        assignedUserId: userId,
        statusConceptId: { $ne: COMM.CONVERSATION_ASSIGNMENT_RESOLVED },
      },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
    return rows.map((r) => ({
      id: r.id,
      practitionerProfileId: r.practitionerProfileId,
    }));
  }

  /**
   * Doctor de cada conversación (para saber quién puede responder por él).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Asignaciones de conversación.
   * @returns Mapa `id → perfil del doctor`.
   */
  async conversationProfiles(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const rows = await em.find(ConversationAssignments, {
      id: { $in: [...ids] },
    });
    return new Map(rows.map((r) => [r.id, r.practitionerProfileId]));
  }

  /**
   * Ids de las tareas abiertas de la persona dentro de la organización. La tarea
   * no guarda organización: es la de su instancia de flujo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param userId - Persona que se va.
   * @returns Ids de tarea, en orden estable.
   */
  async findOpenTaskIds(
    em: EntityManager,
    tenantId: string,
    userId: string,
  ): Promise<string[]> {
    const tasks = await em.find(
      WorkflowTasks,
      {
        assignedUserId: userId,
        statusConceptId: {
          $in: [CONCEPTS.WF_TASK_OPEN, CONCEPTS.WF_TASK_IN_PROGRESS],
        },
      },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
    if (tasks.length === 0) return [];
    const instances = await em.find(WorkflowInstances, {
      id: { $in: [...new Set(tasks.map((t) => t.workflowInstanceId))] },
      tenantId,
    });
    const own = new Set(instances.map((i) => i.id));
    return tasks.filter((t) => own.has(t.workflowInstanceId)).map((t) => t.id);
  }

  /**
   * Citas futuras creadas por la persona y todavía pendientes de confirmar.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param userId - Persona que se va.
   * @param now - Reloj.
   * @returns Las citas, las más próximas primero.
   */
  async findPendingBookings(
    em: EntityManager,
    tenantId: string,
    userId: string,
    now: Date,
  ): Promise<HandoverBooking[]> {
    const bookings = await em.find(AppointmentBookings, {
      tenantId,
      bookedByUserId: userId,
      statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
    });
    if (bookings.length === 0) return [];
    const slots = await em.find(BookableSlots, {
      id: { $in: [...new Set(bookings.map((b) => b.bookableSlotId))] },
      startAt: { $gt: now },
    });
    const startOf = new Map(slots.map((s) => [s.id, s.startAt]));
    return bookings
      .filter((b) => startOf.has(b.bookableSlotId))
      .map((b) => ({ id: b.id, startAt: startOf.get(b.bookableSlotId)! }))
      .sort(
        (a, b) =>
          a.startAt.getTime() - b.startAt.getTime() || a.id.localeCompare(b.id),
      );
  }

  /**
   * Vínculos de la organización cuyo dueño es la persona que se va.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param assignmentIds - Vínculos de la organización (ya acotados por ella).
   * @param userId - Dueño actual.
   * @returns Los vínculos que supervisa.
   */
  async findSupervised(
    em: EntityManager,
    assignmentIds: readonly string[],
    userId: string,
  ): Promise<OrganizationUserAssignments[]> {
    if (assignmentIds.length === 0) return [];
    return em.find(
      OrganizationUserAssignments,
      { id: { $in: [...assignmentIds] }, supervisorUserId: userId },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
  }

  /**
   * Reasigna una conversación: a una persona (conserva su estado) o a la bandeja
   * común (sin responsable y de nuevo `NEW`).
   *
   * Solo toca la fila si TODAS estas condiciones siguen valiendo al escribir
   * (B-B6): es de la organización, sigue asignada a quien se fue y no está
   * resuelta. Así un ítem viejo del traspaso (un `assign()` días después de la
   * baja) no pisa lo que otra persona ya recibió ni reabre una conversación
   * resuelta por otra vía; una fila ajena o que ya cambió de dueño responde
   * `false` sin escribir.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Asignación de conversación.
   * @param toUserId - Destino; `null` = bandeja común.
   * @param byUserId - Quien reasigna.
   * @param now - Reloj.
   * @param owner - Organización y dueño actual esperado (la persona que se fue).
   * @returns `true` si la fila era de ese dueño y se reasignó.
   */
  async reassignConversation(
    em: EntityManager,
    id: string,
    toUserId: string | null,
    byUserId: string | undefined,
    now: Date,
    owner: HandoverOwner,
  ): Promise<boolean> {
    const row = await em.findOne(ConversationAssignments, {
      id,
      tenantId: owner.tenantId,
      assignedUserId: owner.fromUserId,
      statusConceptId: { $ne: COMM.CONVERSATION_ASSIGNMENT_RESOLVED },
    });
    if (!row) return false;
    row.assignedUserId = toUserId ?? undefined;
    if (toUserId === null)
      row.statusConceptId = COMM.CONVERSATION_ASSIGNMENT_NEW;
    row.updatedAt = now;
    row.updatedByUserId = byUserId;
    return true;
  }

  /**
   * Reasigna una tarea: a una persona o sin responsable (queda por rol). Solo si
   * es de la organización (por su instancia de flujo), sigue asignada a quien se
   * fue y está abierta o en curso (B-B6).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Tarea.
   * @param toUserId - Destino; `null` = por rol.
   * @param byUserId - Quien reasigna.
   * @param now - Reloj.
   * @param owner - Organización y dueño actual esperado.
   * @returns `true` si la tarea era de ese dueño y se reasignó.
   */
  async reassignTask(
    em: EntityManager,
    id: string,
    toUserId: string | null,
    byUserId: string | undefined,
    now: Date,
    owner: HandoverOwner,
  ): Promise<boolean> {
    const row = await em.findOne(WorkflowTasks, {
      id,
      assignedUserId: owner.fromUserId,
      statusConceptId: {
        $in: [CONCEPTS.WF_TASK_OPEN, CONCEPTS.WF_TASK_IN_PROGRESS],
      },
    });
    if (!row) return false;
    // La tarea no guarda organización: es la de su instancia de flujo.
    const instance = await em.findOne(WorkflowInstances, {
      id: row.workflowInstanceId,
      tenantId: owner.tenantId,
    });
    if (!instance) return false;
    row.assignedUserId = toUserId ?? undefined;
    row.updatedAt = now;
    row.updatedByUserId = byUserId;
    return true;
  }

  /**
   * Cambia el dueño de la cuenta de un vínculo. Solo si el vínculo es de la
   * organización y su dueño actual sigue siendo quien se fue (B-B6).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param assignmentId - Vínculo.
   * @param toUserId - Nuevo dueño.
   * @param byUserId - Quien lo cambia.
   * @param now - Reloj.
   * @param owner - Organización y dueño actual esperado.
   * @returns `true` si el vínculo era de ese dueño y cambió.
   */
  async setSupervisor(
    em: EntityManager,
    assignmentId: string,
    toUserId: string,
    byUserId: string | undefined,
    now: Date,
    owner: HandoverOwner,
  ): Promise<boolean> {
    const row = await em.findOne(OrganizationUserAssignments, {
      id: assignmentId,
      tenantId: owner.tenantId,
      supervisorUserId: owner.fromUserId,
    });
    if (!row) return false;
    row.supervisorUserId = toUserId;
    row.updatedAt = now;
    row.updatedByUserId = byUserId;
    return true;
  }
}
