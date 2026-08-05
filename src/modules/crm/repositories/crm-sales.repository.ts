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

/**
 * Describe el contrato estructural de create account data.
 */
export interface CreateAccountData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a account type concept.
   */
  accountTypeConceptId: string;
  /**
   * Valor de website mantenido por la instancia.
   */
  website?: string;
  /**
   * Identificador asociado a tax.
   */
  taxId?: string;
  /**
   * Identificador asociado a owner user.
   */
  ownerUserId?: string;
  /**
   * Identificador asociado a parent account.
   */
  parentAccountId?: string;
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
 * Describe el contrato estructural de create team member data.
 */
export interface CreateTeamMemberData {
  /**
   * Identificador asociado a crm account.
   */
  crmAccountId: string;
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a team role concept.
   */
  teamRoleConceptId: string;
  /**
   * Identificador asociado a access level concept.
   */
  accessLevelConceptId?: string;
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
 * Describe el contrato estructural de create lead data.
 */
export interface CreateLeadData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a lead source concept.
   */
  leadSourceConceptId: string;
  /**
   * Valor de full name mantenido por la instancia.
   */
  fullName?: string;
  /**
   * Valor de email mantenido por la instancia.
   */
  email?: string;
  /**
   * Valor de phone mantenido por la instancia.
   */
  phone?: string;
  /**
   * Valor de interest text mantenido por la instancia.
   */
  interestText?: string;
  /** `numeric` en el modelo: se transporta como cadena para no perder precisión. */
  leadScore?: string;
  /**
   * Identificador asociado a lead status concept.
   */
  leadStatusConceptId: string;
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
 * Describe el contrato estructural de create opportunity data.
 */
export interface CreateOpportunityData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a pipeline.
   */
  pipelineId: string;
  /**
   * Identificador asociado a stage.
   */
  stageId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a crm account.
   */
  crmAccountId?: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de expected close date mantenido por la instancia.
   */
  expectedCloseDate?: Date;
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

/** Acceso a datos del ciclo comercial: cuentas, equipo, contactos, leads y oportunidades. */
@Injectable()
export class CrmSalesRepository {
  /**
   * Crea create account.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create account conforme al contrato `CrmAccounts`.
   */
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

  /**
   * Obtiene find account by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find account by id conforme al contrato `Promise<CrmAccounts | null>`.
   */
  findAccountById(em: EntityManager, id: string): Promise<CrmAccounts | null> {
    return em.findOne(CrmAccounts, { id });
  }

  /**
   * Crea create team member.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create team member conforme al contrato `AccountTeamMembers`.
   */
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

  /**
   * Crea create contact.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create contact conforme al contrato `Contacts`.
   */
  createContact(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a crm account.
       */
      crmAccountId?: string;
      /**
       * Valor de first name mantenido por la instancia.
       */
      firstName: string;
      /**
       * Valor de last name mantenido por la instancia.
       */
      lastName?: string;
      /**
       * Identificador asociado a contact type concept.
       */
      contactTypeConceptId: string;
      /**
       * Valor de job title mantenido por la instancia.
       */
      jobTitle?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find contact by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find contact by id conforme al contrato `Promise<Contacts | null>`.
   */
  findContactById(em: EntityManager, id: string): Promise<Contacts | null> {
    return em.findOne(Contacts, { id });
  }

  /**
   * Obtiene find channel endpoint for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find channel endpoint for update conforme al contrato `Promise<ContactChannelEndpoints | null>`.
   */
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

  /**
   * Crea create lead.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create lead conforme al contrato `Leads`.
   */
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

  /**
   * Obtiene find lead by id for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find lead by id for update conforme al contrato `Promise<Leads | null>`.
   */
  findLeadByIdForUpdate(em: EntityManager, id: string): Promise<Leads | null> {
    return em.findOne(Leads, { id }, { lockMode: LockMode.PESSIMISTIC_WRITE });
  }

  /**
   * Crea create opportunity.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create opportunity conforme al contrato `Opportunities`.
   */
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

  /**
   * Obtiene find opportunity by id for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find opportunity by id for update conforme al contrato `Promise<Opportunities | null>`.
   */
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

  /**
   * Obtiene find stage by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find stage by id conforme al contrato `Promise<PipelineStages | null>`.
   */
  findStageById(em: EntityManager, id: string): Promise<PipelineStages | null> {
    return em.findOne(PipelineStages, { id });
  }

  /** Registro append-only del movimiento de etapa (auditoría del pipeline). */
  recordStageChange(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a opportunity.
       */
      opportunityId: string;
      /**
       * Identificador asociado a from stage.
       */
      fromStageId?: string;
      /**
       * Identificador asociado a to stage.
       */
      toStageId: string;
      /**
       * Identificador asociado a changed by user.
       */
      changedByUserId?: string;
      /**
       * Valor de amount at change mantenido por la instancia.
       */
      amountAtChange?: string;
      /**
       * Valor de probability at change mantenido por la instancia.
       */
      probabilityAtChange?: string;
      /**
       * Identificador asociado a reason concept.
       */
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
