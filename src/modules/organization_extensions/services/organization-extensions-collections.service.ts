import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  FacilityLicenses,
  Hospitals,
  OrganizationDataBoundaries,
} from '../entities';
import type {
  FacilityLicenseItemDto,
  HospitalItemDto,
  ListDataBoundariesQueryDto,
  ListFacilityLicensesQueryDto,
  ListHospitalsQueryDto,
  OrganizationDataBoundaryItemDto,
} from '../dto';

/**
 * Lecturas de colección de `organization_extensions`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class OrganizationExtensionsCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar licencias de establecimiento del tenant (V22-02).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listFacilityLicenses(
    query: ListFacilityLicensesQueryDto,
  ): Promise<PageResponseDto<FacilityLicenseItemDto>> {
    return listTenantCollection(this.em.fork(), FacilityLicenses, {
      query,
      sortable: ['createdAt', 'updatedAt', 'validFrom'],
      where: definedFilters({
        practiceSiteId: query.practiceSiteId,
        verificationStatusConceptId: query.verificationStatusConceptId,
      }),
      map: (row): FacilityLicenseItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        practiceSiteId: row.practiceSiteId ?? null,
        facilityTypeConceptId: row.facilityTypeConceptId,
        licenseTypeConceptId: row.licenseTypeConceptId,
        licenseNumber: row.licenseNumber,
        issuingAuthorityTenantId: row.issuingAuthorityTenantId ?? null,
        issuingAuthorityName: row.issuingAuthorityName ?? null,
        jurisdictionConceptId: row.jurisdictionConceptId ?? null,
        validFrom: row.validFrom ?? null,
        validTo: row.validTo ?? null,
        evidenceFileId: row.evidenceFileId ?? null,
        verificationStatusConceptId: row.verificationStatusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar hospitales del tenant (V22-03).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listHospitals(
    query: ListHospitalsQueryDto,
  ): Promise<PageResponseDto<HospitalItemDto>> {
    return listTenantCollection(this.em.fork(), Hospitals, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): HospitalItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        practiceId: row.practiceId,
        primaryPracticeSiteId: row.primaryPracticeSiteId ?? null,
        publicProfileId: row.publicProfileId ?? null,
        hospitalTypeConceptId: row.hospitalTypeConceptId,
        careLevelConceptId: row.careLevelConceptId ?? null,
        ownershipTypeConceptId: row.ownershipTypeConceptId ?? null,
        teachingStatusConceptId: row.teachingStatusConceptId ?? null,
        emergencyCapabilityConceptId: row.emergencyCapabilityConceptId ?? null,
        licensedBedCapacity: row.licensedBedCapacity ?? null,
        operationalBedCapacity: row.operationalBedCapacity ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar fronteras de datos del tenant (V22-05).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDataBoundaries(
    query: ListDataBoundariesQueryDto,
  ): Promise<PageResponseDto<OrganizationDataBoundaryItemDto>> {
    return listTenantCollection(this.em.fork(), OrganizationDataBoundaries, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): OrganizationDataBoundaryItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        boundaryTypeConceptId: row.boundaryTypeConceptId,
        dataControllerTenantId: row.dataControllerTenantId,
        dataProcessorTenantId: row.dataProcessorTenantId ?? null,
        jurisdictionConceptId: row.jurisdictionConceptId ?? null,
        residencyRegionConceptId: row.residencyRegionConceptId ?? null,
        allowedPurposeValueSetId: row.allowedPurposeValueSetId ?? null,
        isolationSchemaName: row.isolationSchemaName ?? null,
        isolationPolicyVersion: row.isolationPolicyVersion ?? null,
        statusConceptId: row.statusConceptId,
        effectiveFrom: row.effectiveFrom,
        effectiveTo: row.effectiveTo ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
