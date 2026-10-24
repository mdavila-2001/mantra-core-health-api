import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  Consents,
  HipaaAuthorizations,
  PatientObjections,
  PrivacyRestrictions,
  ProcessingLegalBases,
  TreatmentInformedConsents,
} from '../entities';
import type {
  ConsentItemDto,
  HipaaAuthorizationItemDto,
  ListConsentsQueryDto,
  ListHipaaAuthorizationsQueryDto,
  ListPatientObjectionsQueryDto,
  ListPrivacyRestrictionsQueryDto,
  ListProcessingLegalBasesQueryDto,
  ListTreatmentInformedConsentsQueryDto,
  PatientObjectionItemDto,
  PrivacyRestrictionItemDto,
  ProcessingLegalBasisItemDto,
  TreatmentInformedConsentItemDto,
} from '../dto';

/**
 * Lecturas de colección de `consent`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class ConsentCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar los consentimientos del tenant (V07-01).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listConsents(
    query: ListConsentsQueryDto,
  ): Promise<PageResponseDto<ConsentItemDto>> {
    return listTenantCollection(this.em.fork(), Consents, {
      query,
      sortable: ['createdAt', 'updatedAt', 'validFrom'],
      where: definedFilters({
        patientProfileId: query.patientProfileId,
        statusConceptId: query.statusConceptId,
        processingPurposeId: query.processingPurposeId,
      }),
      map: (row): ConsentItemDto => ({
        id: row.id,
        patientProfileId: row.patientProfileId,
        grantedByUserId: row.grantedByUserId ?? null,
        grantedByRelatedPersonId: row.grantedByRelatedPersonId ?? null,
        categoryConceptId: row.categoryConceptId,
        processingPurposeId: row.processingPurposeId,
        processingLegalBasisId: row.processingLegalBasisId ?? null,
        statusConceptId: row.statusConceptId,
        policyUri: row.policyUri ?? null,
        policyVersion: row.policyVersion ?? null,
        tenantId: row.tenantId ?? null,
        validFrom: row.validFrom ?? null,
        validTo: row.validTo ?? null,
        withdrawalReasonConceptId: row.withdrawalReasonConceptId ?? null,
        withdrawnAt: row.withdrawnAt ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar las autorizaciones HIPAA del tenant (V07-03).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listHipaaAuthorizations(
    query: ListHipaaAuthorizationsQueryDto,
  ): Promise<PageResponseDto<HipaaAuthorizationItemDto>> {
    return listTenantCollection(this.em.fork(), HipaaAuthorizations, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({
        patientProfileId: query.patientProfileId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): HipaaAuthorizationItemDto => ({
        id: row.id,
        patientProfileId: row.patientProfileId,
        tenantId: row.tenantId,
        processingPurposeId: row.processingPurposeId,
        recipientDescription: row.recipientDescription,
        informationDescription: row.informationDescription,
        expirationTypeConceptId: row.expirationTypeConceptId,
        expiresAt: row.expiresAt ?? null,
        expirationEventText: row.expirationEventText ?? null,
        statusConceptId: row.statusConceptId,
        signedAt: row.signedAt ?? null,
        revokedAt: row.revokedAt ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar las objeciones de paciente del tenant (V07-04).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listPatientObjections(
    query: ListPatientObjectionsQueryDto,
  ): Promise<PageResponseDto<PatientObjectionItemDto>> {
    return listTenantCollection(this.em.fork(), PatientObjections, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({
        patientProfileId: query.patientProfileId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): PatientObjectionItemDto => ({
        id: row.id,
        patientProfileId: row.patientProfileId,
        tenantId: row.tenantId,
        processingPurposeId: row.processingPurposeId,
        objectionTypeConceptId: row.objectionTypeConceptId,
        reasonText: row.reasonText ?? null,
        statusConceptId: row.statusConceptId,
        raisedAt: row.raisedAt ?? null,
        resolvedAt: row.resolvedAt ?? null,
        resolutionConceptId: row.resolutionConceptId ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar las restricciones de privacidad del tenant (V07-06).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listPrivacyRestrictions(
    query: ListPrivacyRestrictionsQueryDto,
  ): Promise<PageResponseDto<PrivacyRestrictionItemDto>> {
    return listTenantCollection(this.em.fork(), PrivacyRestrictions, {
      query,
      sortable: ['createdAt', 'updatedAt', 'validFrom'],
      where: definedFilters({
        patientProfileId: query.patientProfileId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): PrivacyRestrictionItemDto => ({
        id: row.id,
        patientProfileId: row.patientProfileId,
        tenantId: row.tenantId,
        restrictionTypeConceptId: row.restrictionTypeConceptId,
        dataClassConceptId: row.dataClassConceptId,
        targetActorTypeConceptId: row.targetActorTypeConceptId ?? null,
        targetActorId: row.targetActorId ?? null,
        reasonText: row.reasonText ?? null,
        statusConceptId: row.statusConceptId,
        validFrom: row.validFrom ?? null,
        validTo: row.validTo ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar las bases legales de tratamiento del tenant (V07-07).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listProcessingLegalBases(
    query: ListProcessingLegalBasesQueryDto,
  ): Promise<PageResponseDto<ProcessingLegalBasisItemDto>> {
    return listTenantCollection(this.em.fork(), ProcessingLegalBases, {
      query,
      sortable: ['createdAt', 'updatedAt', 'validFrom'],
      where: definedFilters({
        processingPurposeId: query.processingPurposeId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): ProcessingLegalBasisItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        processingPurposeId: row.processingPurposeId,
        jurisdictionConceptId: row.jurisdictionConceptId,
        generalLegalBasisConceptId: row.generalLegalBasisConceptId,
        specialCategoryConditionConceptId:
          row.specialCategoryConditionConceptId ?? null,
        policyVersion: row.policyVersion ?? null,
        legalReferenceUri: row.legalReferenceUri ?? null,
        validFrom: row.validFrom,
        validTo: row.validTo ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar los consentimientos informados de tratamiento del tenant (V07-08).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listTreatmentInformedConsents(
    query: ListTreatmentInformedConsentsQueryDto,
  ): Promise<PageResponseDto<TreatmentInformedConsentItemDto>> {
    return listTenantCollection(this.em.fork(), TreatmentInformedConsents, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({
        patientProfileId: query.patientProfileId,
        encounterId: query.encounterId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): TreatmentInformedConsentItemDto => ({
        id: row.id,
        patientProfileId: row.patientProfileId,
        tenantId: row.tenantId,
        encounterId: row.encounterId,
        procedureCodeConceptId: row.procedureCodeConceptId ?? null,
        informationVersion: row.informationVersion ?? null,
        interpreterUserId: row.interpreterUserId ?? null,
        witnessUserId: row.witnessUserId ?? null,
        decisionConceptId: row.decisionConceptId,
        statusConceptId: row.statusConceptId,
        signedAt: row.signedAt ?? null,
        withdrawnAt: row.withdrawnAt ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
