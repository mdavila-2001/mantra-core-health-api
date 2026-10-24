import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  CrmAccounts,
  CrmActivities,
  CrmCases,
  Leads,
  Opportunities,
  Partnerships,
} from '../entities';
import type {
  CrmAccountItemDto,
  CrmActivityItemDto,
  CrmCaseItemDto,
  LeadItemDto,
  ListAccountsQueryDto,
  ListActivitiesQueryDto,
  ListCasesQueryDto,
  ListLeadsQueryDto,
  ListOpportunitiesQueryDto,
  ListPartnershipsQueryDto,
  OpportunityItemDto,
  PartnershipItemDto,
} from '../dto';

/**
 * Lecturas de colección de `crm`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class CrmCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar prospectos del tenant (V49-01).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listLeads(query: ListLeadsQueryDto): Promise<PageResponseDto<LeadItemDto>> {
    return listTenantCollection(this.em.fork(), Leads, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): LeadItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        leadSourceConceptId: row.leadSourceConceptId,
        contactId: row.contactId ?? null,
        crmAccountId: row.crmAccountId ?? null,
        fullName: row.fullName ?? null,
        email: row.email ?? null,
        phone: row.phone ?? null,
        interestText: row.interestText ?? null,
        leadScore: row.leadScore ?? null,
        leadStatusConceptId: row.leadStatusConceptId,
        ownerUserId: row.ownerUserId ?? null,
        campaignRefId: row.campaignRefId ?? null,
        convertedOpportunityId: row.convertedOpportunityId ?? null,
        convertedAt: row.convertedAt ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar oportunidades del tenant (V49-02).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listOpportunities(
    query: ListOpportunitiesQueryDto,
  ): Promise<PageResponseDto<OpportunityItemDto>> {
    return listTenantCollection(this.em.fork(), Opportunities, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): OpportunityItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        pipelineId: row.pipelineId,
        stageId: row.stageId,
        name: row.name,
        crmAccountId: row.crmAccountId ?? null,
        primaryContactId: row.primaryContactId ?? null,
        amount: row.amount ?? null,
        currencyConceptId: row.currencyConceptId ?? null,
        expectedCloseDate: row.expectedCloseDate ?? null,
        probabilityPercent: row.probabilityPercent ?? null,
        ownerUserId: row.ownerUserId ?? null,
        contractId: row.contractId ?? null,
        salesOrderId: row.salesOrderId ?? null,
        lostReasonConceptId: row.lostReasonConceptId ?? null,
        wonAt: row.wonAt ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar casos de CRM del tenant (V49-03).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listCases(
    query: ListCasesQueryDto,
  ): Promise<PageResponseDto<CrmCaseItemDto>> {
    return listTenantCollection(this.em.fork(), CrmCases, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): CrmCaseItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        caseNumber: row.caseNumber,
        subject: row.subject,
        description: row.description ?? null,
        crmAccountId: row.crmAccountId ?? null,
        primaryContactId: row.primaryContactId ?? null,
        businessPartnerId: row.businessPartnerId ?? null,
        contractId: row.contractId ?? null,
        invoiceId: row.invoiceId ?? null,
        caseTypeConceptId: row.caseTypeConceptId ?? null,
        originConceptId: row.originConceptId ?? null,
        priorityConceptId: row.priorityConceptId ?? null,
        ownerUserId: row.ownerUserId ?? null,
        parentCaseId: row.parentCaseId ?? null,
        openedAt: row.openedAt ?? null,
        closedAt: row.closedAt ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar cuentas de CRM del tenant (V49-06).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listAccounts(
    query: ListAccountsQueryDto,
  ): Promise<PageResponseDto<CrmAccountItemDto>> {
    return listTenantCollection(this.em.fork(), CrmAccounts, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): CrmAccountItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        name: row.name,
        accountTypeConceptId: row.accountTypeConceptId,
        industryConceptId: row.industryConceptId ?? null,
        parentAccountId: row.parentAccountId ?? null,
        website: row.website ?? null,
        taxId: row.taxId ?? null,
        linkedTenantId: row.linkedTenantId ?? null,
        businessPartnerId: row.businessPartnerId ?? null,
        linkedOrgRefType: row.linkedOrgRefType ?? null,
        linkedOrgRefId: row.linkedOrgRefId ?? null,
        ownerUserId: row.ownerUserId ?? null,
        annualValue: row.annualValue ?? null,
        currencyConceptId: row.currencyConceptId ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar actividades de CRM del tenant (V49-09).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listActivities(
    query: ListActivitiesQueryDto,
  ): Promise<PageResponseDto<CrmActivityItemDto>> {
    return listTenantCollection(this.em.fork(), CrmActivities, {
      query,
      sortable: ['createdAt', 'updatedAt', 'completedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): CrmActivityItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        activityTypeConceptId: row.activityTypeConceptId,
        subjectTypeConceptId: row.subjectTypeConceptId,
        subjectRefId: row.subjectRefId,
        contactId: row.contactId ?? null,
        crmAccountId: row.crmAccountId ?? null,
        directionConceptId: row.directionConceptId,
        subject: row.subject ?? null,
        bodyText: row.bodyText ?? null,
        outcomeConceptId: row.outcomeConceptId ?? null,
        dueAt: row.dueAt ?? null,
        completedAt: row.completedAt ?? null,
        ownerUserId: row.ownerUserId ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar alianzas del tenant (V49-11).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listPartnerships(
    query: ListPartnershipsQueryDto,
  ): Promise<PageResponseDto<PartnershipItemDto>> {
    return listTenantCollection(this.em.fork(), Partnerships, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): PartnershipItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        name: row.name,
        partnershipTypeConceptId: row.partnershipTypeConceptId,
        partnerRefType: row.partnerRefType,
        partnerRefId: row.partnerRefId,
        crmAccountId: row.crmAccountId ?? null,
        adPartnerId: row.adPartnerId ?? null,
        contractId: row.contractId ?? null,
        tierConceptId: row.tierConceptId ?? null,
        revenueSharePercent: row.revenueSharePercent ?? null,
        startDate: row.startDate ?? null,
        endDate: row.endDate ?? null,
        ownerUserId: row.ownerUserId ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
