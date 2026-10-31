import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { HandoverItems, LifecycleCases } from '../entities';

/** Datos para abrir un caso de ciclo de vida. */
export interface CreateLifecycleCaseData {
  /** Organización (la del contexto verificado). */
  readonly tenantId: string;
  /** Vínculo del caso. */
  readonly organizationUserAssignmentId: string;
  /** Persona del caso. */
  readonly subjectUserId: string;
  /** Concepto del tipo (`LIFECYCLE_JOINER|MOVER|LEAVER|SUSPENSION|REACTIVATION`). */
  readonly kindConceptId: string;
  /** Quien lo abre; ausente = el sistema. */
  readonly openedByUserId?: string;
  /** Instante de apertura. */
  readonly openedAt: Date;
  /** Fecha límite. */
  readonly dueAt?: Date;
  /** Motivo. */
  readonly reasonText?: string;
  /** Lista de verificación inicial. */
  readonly checklist: readonly unknown[];
  /** Detalles propios del tipo de caso. */
  readonly details?: unknown;
  /** Quien lo crea (auditoría). */
  readonly actorUserId?: string;
}

/** Filtro de la lista de casos. */
export interface LifecycleCasesFilter {
  /** Solo este tipo. */
  readonly kindConceptId?: string;
  /** Solo este estado. */
  readonly statusConceptId?: string;
}

/** Datos de un ítem de traspaso. */
export interface CreateHandoverItemData {
  /** Organización. */
  readonly tenantId: string;
  /** Caso al que pertenece. */
  readonly lifecycleCaseId: string;
  /** Concepto del tipo de ítem (`HANDOVER_CONVERSATION|WORKFLOW_TASK|…`). */
  readonly itemKindConceptId: string;
  /** Identificador del objeto a traspasar. */
  readonly sourceId: string;
  /** Persona que se va. */
  readonly fromUserId: string;
  /** Etiqueta sin datos del paciente. */
  readonly summaryText?: string;
  /** Quien lo crea. */
  readonly actorUserId?: string;
}

/** Reasignación de un ítem de traspaso. */
export interface HandoverReassignment {
  /** Quien recibe el trabajo. */
  readonly toUserId: string;
  /** Quien reasigna. */
  readonly byUserId?: string;
  /** Instante. */
  readonly now: Date;
  /** Nota. */
  readonly note?: string;
}

/** Acceso a datos de `lifecycle_cases` y `handover_items`. */
@Injectable()
export class LifecycleRepository {
  /**
   * Caso por id, acotado a la organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param id - Id del caso.
   * @returns El caso o `null`.
   */
  findCaseById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<LifecycleCases | null> {
    return em.findOne(LifecycleCases, { tenantId, id });
  }

  /**
   * Caso abierto de un tipo para un vínculo (la llave del único parcial).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param assignmentId - Vínculo.
   * @param kindConceptId - Tipo de caso.
   * @returns El caso abierto o `null`.
   */
  findOpenCase(
    em: EntityManager,
    assignmentId: string,
    kindConceptId: string,
  ): Promise<LifecycleCases | null> {
    return em.findOne(LifecycleCases, {
      organizationUserAssignmentId: assignmentId,
      kindConceptId,
      statusConceptId: DELEG.LIFECYCLE_OPEN,
    });
  }

  /**
   * Casos de una organización, los más recientes primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param filter - Tipo y estado opcionales.
   * @returns Los casos.
   */
  findCases(
    em: EntityManager,
    tenantId: string,
    filter: LifecycleCasesFilter = {},
  ): Promise<LifecycleCases[]> {
    return em.find(
      LifecycleCases,
      {
        tenantId,
        ...(filter.kindConceptId
          ? { kindConceptId: filter.kindConceptId }
          : {}),
        ...(filter.statusConceptId
          ? { statusConceptId: filter.statusConceptId }
          : {}),
      },
      { orderBy: { openedAt: 'desc', id: 'asc' } },
    );
  }

  /**
   * Abre un caso con su lista de verificación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del caso.
   * @returns El caso creado (aún sin flush).
   */
  createCase(em: EntityManager, data: CreateLifecycleCaseData): LifecycleCases {
    return em.create(
      LifecycleCases,
      {
        tenantId: data.tenantId,
        organizationUserAssignmentId: data.organizationUserAssignmentId,
        subjectUserId: data.subjectUserId,
        kindConceptId: data.kindConceptId,
        statusConceptId: DELEG.LIFECYCLE_OPEN,
        openedByUserId: data.openedByUserId,
        openedAt: data.openedAt,
        dueAt: data.dueAt,
        reasonText: data.reasonText,
        checklistJson: [...data.checklist],
        detailsJson: data.details,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Completa un caso.
   *
   * @param row - Caso a completar.
   * @param now - Instante de cierre.
   * @param actorUserId - Quien lo completa.
   */
  complete(
    row: LifecycleCases,
    now: Date,
    actorUserId: string | undefined,
  ): void {
    row.statusConceptId = DELEG.LIFECYCLE_COMPLETED;
    row.completedAt = now;
    row.updatedAt = now;
    row.updatedByUserId = actorUserId;
  }

  /**
   * Ítems de traspaso de un caso.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param lifecycleCaseId - Caso.
   * @returns Los ítems en orden estable.
   */
  findHandoverItems(
    em: EntityManager,
    lifecycleCaseId: string,
  ): Promise<HandoverItems[]> {
    return em.find(
      HandoverItems,
      { lifecycleCaseId },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
  }

  /**
   * Crea ítems de traspaso pendientes.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param items - Datos de los ítems.
   * @returns Los ítems creados (aún sin flush).
   */
  createHandoverItems(
    em: EntityManager,
    items: readonly CreateHandoverItemData[],
  ): HandoverItems[] {
    return items.map((data) =>
      em.create(
        HandoverItems,
        {
          tenantId: data.tenantId,
          lifecycleCaseId: data.lifecycleCaseId,
          itemKindConceptId: data.itemKindConceptId,
          sourceId: data.sourceId,
          fromUserId: data.fromUserId,
          statusConceptId: DELEG.HANDOVER_PENDING,
          summaryText: data.summaryText,
          ...createdBy(data.actorUserId),
        },
        { partial: true },
      ),
    );
  }

  /**
   * Reasigna un ítem a otra persona.
   *
   * @param row - Ítem a reasignar.
   * @param reassignment - Destino, autor, instante y nota.
   */
  reassign(row: HandoverItems, reassignment: HandoverReassignment): void {
    row.statusConceptId = DELEG.HANDOVER_REASSIGNED;
    row.toUserId = reassignment.toUserId;
    row.reassignedAt = reassignment.now;
    row.reassignedByUserId = reassignment.byUserId;
    row.noteText = reassignment.note;
    row.updatedAt = reassignment.now;
    row.updatedByUserId = reassignment.byUserId;
  }

  /**
   * Devuelve un ítem al pool de recepción (sin destino individual).
   *
   * @param row - Ítem a devolver.
   * @param actorUserId - Quien lo devuelve.
   * @param now - Instante.
   */
  returnToPool(
    row: HandoverItems,
    actorUserId: string | undefined,
    now: Date,
  ): void {
    row.statusConceptId = DELEG.HANDOVER_RETURNED_TO_POOL;
    row.reassignedAt = now;
    row.reassignedByUserId = actorUserId;
    row.updatedAt = now;
    row.updatedByUserId = actorUserId;
  }

  /**
   * Ítems de traspaso pendientes que apuntan a un objeto (p. ej. la cuenta que
   * supervisaba quien se fue), de los casos que siguen abiertos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param sourceId - Objeto a traspasar.
   * @param itemKindConceptId - Tipo de ítem (`HANDOVER_*`).
   * @returns Los ítems pendientes, en orden estable.
   */
  findPendingItemsBySource(
    em: EntityManager,
    tenantId: string,
    sourceId: string,
    itemKindConceptId: string,
  ): Promise<HandoverItems[]> {
    return em.find(
      HandoverItems,
      {
        tenantId,
        sourceId,
        itemKindConceptId,
        statusConceptId: DELEG.HANDOVER_PENDING,
      },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
  }

  /**
   * Cuenta los ítems de traspaso pendientes de un caso.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param lifecycleCaseId - Caso.
   * @returns Cuántos faltan por resolver.
   */
  countPendingHandover(
    em: EntityManager,
    lifecycleCaseId: string,
  ): Promise<number> {
    return em.count(HandoverItems, {
      lifecycleCaseId,
      statusConceptId: DELEG.HANDOVER_PENDING,
    });
  }
}
