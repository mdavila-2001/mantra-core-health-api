import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CrmActivities,
  CrmTasks,
  CrmNotes,
  Partnerships,
  PartnershipAgreements,
  CrmCases,
  CrmCaseComments,
  CrmCaseStatusHistory,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create activity data.
 */
export interface CreateActivityData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a activity type concept.
   */
  activityTypeConceptId: string;
  /**
   * Identificador asociado a subject type concept.
   */
  subjectTypeConceptId: string;
  /**
   * Identificador asociado a subject ref.
   */
  subjectRefId: string;
  /**
   * Identificador asociado a direction concept.
   */
  directionConceptId: string;
  /**
   * Valor de subject mantenido por la instancia.
   */
  subject?: string;
  /**
   * Valor de body text mantenido por la instancia.
   */
  bodyText?: string;
  /**
   * Valor de due at mantenido por la instancia.
   */
  dueAt?: Date;
  /**
   * Identificador asociado a contact.
   */
  contactId?: string;
  /**
   * Identificador asociado a crm account.
   */
  crmAccountId?: string;
  /**
   * Identificador asociado a owner user.
   */
  ownerUserId?: string;
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
 * Describe el contrato estructural de create case data.
 */
export interface CreateCaseData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de case number mantenido por la instancia.
   */
  caseNumber: string;
  /**
   * Valor de subject mantenido por la instancia.
   */
  subject: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a crm account.
   */
  crmAccountId?: string;
  /**
   * Identificador asociado a primary contact.
   */
  primaryContactId?: string;
  /**
   * Identificador asociado a case type concept.
   */
  caseTypeConceptId?: string;
  /**
   * Identificador asociado a origin concept.
   */
  originConceptId?: string;
  /**
   * Identificador asociado a priority concept.
   */
  priorityConceptId?: string;
  /**
   * Identificador asociado a owner user.
   */
  ownerUserId?: string;
  /**
   * Valor de opened at mantenido por la instancia.
   */
  openedAt: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de actividades, partnerships y casos de servicio. */
@Injectable()
export class CrmServiceRepository {
  /**
   * Crea create activity.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create activity conforme al contrato `CrmActivities`.
   */
  createActivity(em: EntityManager, data: CreateActivityData): CrmActivities {
    return em.create(
      CrmActivities,
      {
        tenantId: data.tenantId,
        activityTypeConceptId: data.activityTypeConceptId,
        subjectTypeConceptId: data.subjectTypeConceptId,
        subjectRefId: data.subjectRefId,
        directionConceptId: data.directionConceptId,
        subject: data.subject,
        bodyText: data.bodyText,
        dueAt: data.dueAt,
        contactId: data.contactId,
        crmAccountId: data.crmAccountId,
        ownerUserId: data.ownerUserId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find activity by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find activity by id conforme al contrato `Promise<CrmActivities | null>`.
   */
  findActivityById(
    em: EntityManager,
    id: string,
  ): Promise<CrmActivities | null> {
    return em.findOne(CrmActivities, { id });
  }

  /** Subtipo tarea: extiende la actividad con vencimiento y prioridad. */
  createTask(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a crm activity.
       */
      crmActivityId: string;
      /**
       * Identificador asociado a task subtype concept.
       */
      taskSubtypeConceptId: string;
      /**
       * Identificador asociado a priority concept.
       */
      priorityConceptId?: string;
      /**
       * Valor de due date mantenido por la instancia.
       */
      dueDate?: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): CrmTasks {
    return em.create(
      CrmTasks,
      {
        crmActivityId: data.crmActivityId,
        taskSubtypeConceptId: data.taskSubtypeConceptId,
        priorityConceptId: data.priorityConceptId,
        dueDate: data.dueDate,
        isRecurring: false,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Subtipo nota: texto libre asociado a la actividad. */
  createNote(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a crm activity.
       */
      crmActivityId: string;
      /**
       * Valor de note text mantenido por la instancia.
       */
      noteText: string;
      /**
       * Valor de is private mantenido por la instancia.
       */
      isPrivate?: boolean;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): CrmNotes {
    return em.create(
      CrmNotes,
      {
        crmActivityId: data.crmActivityId,
        noteText: data.noteText,
        isPrivate: data.isPrivate ?? false,
        isPinned: false,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create partnership.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create partnership conforme al contrato `Partnerships`.
   */
  createPartnership(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Identificador asociado a partnership type concept.
       */
      partnershipTypeConceptId: string;
      /**
       * Valor de partner ref type mantenido por la instancia.
       */
      partnerRefType: string;
      /**
       * Identificador asociado a partner ref.
       */
      partnerRefId: string;
      /**
       * Identificador asociado a crm account.
       */
      crmAccountId?: string;
      /**
       * Valor de revenue share percent mantenido por la instancia.
       */
      revenueSharePercent?: string;
      /**
       * Valor de start date mantenido por la instancia.
       */
      startDate?: Date;
      /**
       * Valor de end date mantenido por la instancia.
       */
      endDate?: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): Partnerships {
    return em.create(
      Partnerships,
      {
        tenantId: data.tenantId,
        name: data.name,
        partnershipTypeConceptId: data.partnershipTypeConceptId,
        partnerRefType: data.partnerRefType,
        partnerRefId: data.partnerRefId,
        crmAccountId: data.crmAccountId,
        revenueSharePercent: data.revenueSharePercent,
        startDate: data.startDate,
        endDate: data.endDate,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create agreement.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create agreement conforme al contrato `PartnershipAgreements`.
   */
  createAgreement(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a partnership.
       */
      partnershipId: string;
      /**
       * Identificador asociado a agreement type concept.
       */
      agreementTypeConceptId: string;
      /**
       * Valor de commitment amount mantenido por la instancia.
       */
      commitmentAmount?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Valor de valid from mantenido por la instancia.
       */
      validFrom?: Date;
      /**
       * Valor de valid to mantenido por la instancia.
       */
      validTo?: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): PartnershipAgreements {
    return em.create(
      PartnershipAgreements,
      {
        partnershipId: data.partnershipId,
        agreementTypeConceptId: data.agreementTypeConceptId,
        commitmentAmount: data.commitmentAmount,
        currencyConceptId: data.currencyConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create case.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create case conforme al contrato `CrmCases`.
   */
  createCase(em: EntityManager, data: CreateCaseData): CrmCases {
    return em.create(
      CrmCases,
      {
        tenantId: data.tenantId,
        caseNumber: data.caseNumber,
        subject: data.subject,
        description: data.description,
        crmAccountId: data.crmAccountId,
        primaryContactId: data.primaryContactId,
        caseTypeConceptId: data.caseTypeConceptId,
        originConceptId: data.originConceptId,
        priorityConceptId: data.priorityConceptId,
        ownerUserId: data.ownerUserId,
        openedAt: data.openedAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find case by id for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find case by id for update conforme al contrato `Promise<CrmCases | null>`.
   */
  findCaseByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<CrmCases | null> {
    return em.findOne(
      CrmCases,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** El número de caso es único por tenant; esta lectura anticipa el conflicto. */
  findCaseByNumber(
    em: EntityManager,
    tenantId: string,
    caseNumber: string,
  ): Promise<CrmCases | null> {
    return em.findOne(CrmCases, { tenantId, caseNumber });
  }

  /**
   * Crea create case comment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create case comment conforme al contrato `CrmCaseComments`.
   */
  createCaseComment(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a crm case.
       */
      crmCaseId: string;
      /**
       * Valor de comment text mantenido por la instancia.
       */
      commentText: string;
      /**
       * Valor de is public mantenido por la instancia.
       */
      isPublic?: boolean;
      /**
       * Identificador asociado a author user.
       */
      authorUserId?: string;
    },
  ): CrmCaseComments {
    return em.create(
      CrmCaseComments,
      {
        crmCaseId: data.crmCaseId,
        commentText: data.commentText,
        isPublic: data.isPublic ?? true,
        authorUserId: data.authorUserId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Historial append-only de transiciones del caso. */
  recordCaseStatusChange(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a crm case.
       */
      crmCaseId: string;
      /**
       * Identificador asociado a from status concept.
       */
      fromStatusConceptId?: string;
      /**
       * Identificador asociado a to status concept.
       */
      toStatusConceptId: string;
      /**
       * Identificador asociado a changed by user.
       */
      changedByUserId?: string;
      /**
       * Valor de reason text mantenido por la instancia.
       */
      reasonText?: string;
    },
  ): CrmCaseStatusHistory {
    return em.create(
      CrmCaseStatusHistory,
      {
        crmCaseId: data.crmCaseId,
        fromStatusConceptId: data.fromStatusConceptId,
        toStatusConceptId: data.toStatusConceptId,
        changedAt: new Date(),
        changedByUserId: data.changedByUserId,
        reasonText: data.reasonText,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Actividades del sujeto, para la vista 360 de la cuenta. */
  findActivitiesByAccount(
    em: EntityManager,
    crmAccountId: string,
    limit: number,
  ): Promise<CrmActivities[]> {
    return em.find(
      CrmActivities,
      { crmAccountId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * Obtiene find cases by account.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param crmAccountId - Identificador de crm account.
   * @param limit - Valor de limit requerido por la operación.
   * @returns Resultado de find cases by account conforme al contrato `Promise<CrmCases[]>`.
   */
  findCasesByAccount(
    em: EntityManager,
    crmAccountId: string,
    limit: number,
  ): Promise<CrmCases[]> {
    return em.find(
      CrmCases,
      { crmAccountId },
      { orderBy: { openedAt: 'DESC' }, limit },
    );
  }
}
