import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  assertRouteTenant,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  AccessPolicies,
  ClinicalAccessGrants,
  ResourceScopeGrants,
  UserPermissionGrants,
} from '../entities';
import type {
  AccessPolicyItemDto,
  ClinicalAccessGrantItemDto,
  ListAccessPoliciesQueryDto,
  ListClinicalAccessGrantsQueryDto,
  ListResourceScopeGrantsQueryDto,
  ListUserPermissionGrantsQueryDto,
  ResourceScopeGrantItemDto,
  UserPermissionGrantItemDto,
} from '../dto';

/**
 * Lecturas de colección de `authz`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class AuthzCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar las concesiones de acceso clínico del tenant (V06-03, V06-06).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listClinicalAccessGrants(
    query: ListClinicalAccessGrantsQueryDto,
  ): Promise<PageResponseDto<ClinicalAccessGrantItemDto>> {
    return listTenantCollection(this.em.fork(), ClinicalAccessGrants, {
      query,
      sortable: ['createdAt', 'updatedAt', 'validFrom'],
      where: definedFilters({
        patientProfileId: query.patientProfileId,
        grantedUserId: query.grantedUserId,
        stateConceptId: query.stateConceptId,
      }),
      map: (row): ClinicalAccessGrantItemDto => ({
        id: row.id,
        patientProfileId: row.patientProfileId,
        grantedUserId: row.grantedUserId,
        tenantId: row.tenantId,
        branchId: row.branchId ?? null,
        encounterId: row.encounterId ?? null,
        consentId: row.consentId ?? null,
        reasonConceptId: row.reasonConceptId,
        accessLevelConceptId: row.accessLevelConceptId,
        stateConceptId: row.stateConceptId,
        validFrom: row.validFrom,
        validTo: row.validTo,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar las concesiones de alcance de recurso del tenant (V06-10).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listResourceScopeGrants(
    query: ListResourceScopeGrantsQueryDto,
  ): Promise<PageResponseDto<ResourceScopeGrantItemDto>> {
    return listTenantCollection(this.em.fork(), ResourceScopeGrants, {
      query,
      sortable: ['createdAt', 'updatedAt', 'validFrom'],
      where: definedFilters({
        subjectId: query.subjectId,
        resourceId: query.resourceId,
        permissionId: query.permissionId,
      }),
      map: (row): ResourceScopeGrantItemDto => ({
        id: row.id,
        subjectTypeConceptId: row.subjectTypeConceptId,
        subjectId: row.subjectId,
        permissionId: row.permissionId,
        resourceTypeConceptId: row.resourceTypeConceptId,
        resourceId: row.resourceId,
        effectConceptId: row.effectConceptId,
        tenantId: row.tenantId ?? null,
        validFrom: row.validFrom ?? null,
        validTo: row.validTo ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar las políticas de acceso ABAC del tenant (V06-14).
   *
   * @param tenantId - Tenant de la ruta; tiene que ser el del contexto.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  async listAccessPolicies(
    tenantId: string,
    query: ListAccessPoliciesQueryDto,
  ): Promise<PageResponseDto<AccessPolicyItemDto>> {
    assertRouteTenant(tenantId);
    return listTenantCollection(this.em.fork(), AccessPolicies, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): AccessPolicyItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        name: row.name,
        effectConceptId: row.effectConceptId,
        targetResource: row.targetResource ?? null,
        conditionJson: row.conditionJson ?? null,
        priority: row.priority ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar las excepciones de permiso de un usuario en el tenant (V06-15).
   *
   * Las excepciones globales (`tenant_id` nulo) no salen: no son del tenant que administra.
   *
   * @param userId - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listUserPermissionGrants(
    userId: string,
    query: ListUserPermissionGrantsQueryDto,
  ): Promise<PageResponseDto<UserPermissionGrantItemDto>> {
    return listTenantCollection(this.em.fork(), UserPermissionGrants, {
      query,
      sortable: ['createdAt', 'updatedAt', 'validFrom'],
      where: definedFilters({
        userId: userId,
        permissionId: query.permissionId,
        stateConceptId: query.stateConceptId,
      }),
      map: (row): UserPermissionGrantItemDto => ({
        id: row.id,
        userId: row.userId,
        permissionId: row.permissionId,
        effectConceptId: row.effectConceptId,
        scopeConceptId: row.scopeConceptId ?? null,
        resourceSelectorJson: row.resourceSelectorJson ?? null,
        tenantId: row.tenantId ?? null,
        reason: row.reason ?? null,
        validFrom: row.validFrom ?? null,
        validTo: row.validTo ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
