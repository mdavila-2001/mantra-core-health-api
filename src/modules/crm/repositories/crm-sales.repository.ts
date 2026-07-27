import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CrmAccounts,
  AccountTeamMembers,
  Leads,
  Opportunities,
  OpportunityStageHistory,
  PipelineStages,
  Contacts,
  ContactChannelEndpoints,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateAccountData {
  tenantId: string;
  name: string;
  accountTypeConceptId: string;
  website?: string;
  taxId?: string;
  ownerUserId?: string;
  parentAccountId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateTeamMemberData {
  crmAccountId: string;
  userId: string;
  teamRoleConceptId: string;
  accessLevelConceptId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateLeadData {
  tenantId: string;
  leadSourceConceptId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  interestText?: string;
  /** `numeric` en el modelo: se transporta como cadena para no perder precisión. */
  leadScore?: string;
  leadStatusConceptId: string;
  ownerUserId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateOpportunityData {
  tenantId: string;
  pipelineId: string;
  stageId: string;
  name: string;
  crmAccountId?: string;
  amount?: string;
  currencyConceptId?: string;
  expectedCloseDate?: Date;
  ownerUserId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos del ciclo comercial: cuentas, equipo, contactos, leads y oportunidades. */
@Injectable()
export class CrmSalesRepository {
  createAccount(em: EntityManager, data: CreateAccountData): CrmAccounts {
    return em.create(
      CrmAccounts,
      {
        tenantId: data.tenantId,
        name: data.name,
        accountTypeConceptId: data.accountTypeConceptId,
        website: data.website,
        taxId: data.taxId,
        ownerUserId: data.ownerUserId,
        parentAccountId: data.parentAccountId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findAccountById(em: EntityManager, id: string): Promise<CrmAccounts | null> {
    return em.findOne(CrmAccounts, { id });
  }

  createTeamMember(
    em: EntityManager,
    data: CreateTeamMemberData,
  ): AccountTeamMembers {
    return em.create(
      AccountTeamMembers,
      {
        crmAccountId: data.crmAccountId,
        userId: data.userId,
        teamRoleConceptId: data.teamRoleConceptId,
        accessLevelConceptId: data.accessLevelConceptId,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }

  /** Un usuario no puede figurar dos veces en el equipo de la misma cuenta. */
  findTeamMember(
    em: EntityManager,
    crmAccountId: string,
    userId: string,
  ): Promise<AccountTeamMembers | null> {
    return em.findOne(AccountTeamMembers, { crmAccountId, userId });
  }

  createContact(
    em: EntityManager,
    data: {
      tenantId: string;
      crmAccountId?: string;
      firstName: string;
      lastName?: string;
      contactTypeConceptId: string;
      jobTitle?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): Contacts {
    return em.create(
      Contacts,
      {
        tenantId: data.tenantId,
        crmAccountId: data.crmAccountId,
        firstName: data.firstName,
        lastName: data.lastName,
        contactTypeConceptId: data.contactTypeConceptId,
        jobTitle: data.jobTitle,
        doNotContact: false,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findContactById(em: EntityManager, id: string): Promise<Contacts | null> {
    return em.findOne(Contacts, { id });
  }

  findChannelEndpointForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ContactChannelEndpoints | null> {
    return em.findOne(
      ContactChannelEndpoints,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createLead(em: EntityManager, data: CreateLeadData): Leads {
    return em.create(
      Leads,
      {
        tenantId: data.tenantId,
        leadSourceConceptId: data.leadSourceConceptId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        interestText: data.interestText,
        leadScore: data.leadScore,
        leadStatusConceptId: data.leadStatusConceptId,
        ownerUserId: data.ownerUserId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findLeadByIdForUpdate(em: EntityManager, id: string): Promise<Leads | null> {
    return em.findOne(Leads, { id }, { lockMode: LockMode.PESSIMISTIC_WRITE });
  }

  createOpportunity(
    em: EntityManager,
    data: CreateOpportunityData,
  ): Opportunities {
    return em.create(
      Opportunities,
      {
        tenantId: data.tenantId,
        pipelineId: data.pipelineId,
        stageId: data.stageId,
        name: data.name,
        crmAccountId: data.crmAccountId,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        expectedCloseDate: data.expectedCloseDate,
        ownerUserId: data.ownerUserId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findOpportunityByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<Opportunities | null> {
    return em.findOne(
      Opportunities,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findStageById(em: EntityManager, id: string): Promise<PipelineStages | null> {
    return em.findOne(PipelineStages, { id });
  }

  /** Registro append-only del movimiento de etapa (auditoría del pipeline). */
  recordStageChange(
    em: EntityManager,
    data: {
      opportunityId: string;
      fromStageId?: string;
      toStageId: string;
      changedByUserId?: string;
      amountAtChange?: string;
      probabilityAtChange?: string;
      reasonConceptId?: string;
    },
  ): OpportunityStageHistory {
    return em.create(
      OpportunityStageHistory,
      {
        opportunityId: data.opportunityId,
        fromStageId: data.fromStageId,
        toStageId: data.toStageId,
        changedAt: new Date(),
        changedByUserId: data.changedByUserId,
        amountAtChange: data.amountAtChange,
        probabilityAtChange: data.probabilityAtChange,
        reasonConceptId: data.reasonConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
