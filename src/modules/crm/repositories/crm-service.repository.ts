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

export interface CreateActivityData {
  tenantId: string;
  activityTypeConceptId: string;
  subjectTypeConceptId: string;
  subjectRefId: string;
  directionConceptId: string;
  subject?: string;
  bodyText?: string;
  dueAt?: Date;
  contactId?: string;
  crmAccountId?: string;
  ownerUserId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateCaseData {
  tenantId: string;
  caseNumber: string;
  subject: string;
  description?: string;
  crmAccountId?: string;
  primaryContactId?: string;
  caseTypeConceptId?: string;
  originConceptId?: string;
  priorityConceptId?: string;
  ownerUserId?: string;
  openedAt: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de actividades, partnerships y casos de servicio. */
@Injectable()
export class CrmServiceRepository {
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
      crmActivityId: string;
      taskSubtypeConceptId: string;
      priorityConceptId?: string;
      dueDate?: Date;
      statusConceptId: string;
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
      crmActivityId: string;
      noteText: string;
      isPrivate?: boolean;
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

  createPartnership(
    em: EntityManager,
    data: {
      tenantId: string;
      name: string;
      partnershipTypeConceptId: string;
      partnerRefType: string;
      partnerRefId: string;
      crmAccountId?: string;
      revenueSharePercent?: string;
      startDate?: Date;
      endDate?: Date;
      statusConceptId: string;
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

  createAgreement(
    em: EntityManager,
    data: {
      partnershipId: string;
      agreementTypeConceptId: string;
      commitmentAmount?: string;
      currencyConceptId?: string;
      validFrom?: Date;
      validTo?: Date;
      statusConceptId: string;
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

  createCaseComment(
    em: EntityManager,
    data: {
      crmCaseId: string;
      commentText: string;
      isPublic?: boolean;
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
      crmCaseId: string;
      fromStatusConceptId?: string;
      toStatusConceptId: string;
      changedByUserId?: string;
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
