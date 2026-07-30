import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityAuthorities, IdentityAuthorityEndpoints } from '../entities';
import { createdBy } from '../../../common';

/** Alta de una autoridad de identidad (UC-27-01). */
export interface CreateAuthorityData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de authority code mantenido por la instancia.
   */
  authorityCode: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a authority type concept.
   */
  authorityTypeConceptId: string;
  /**
   * Identificador asociado a jurisdiction concept.
   */
  jurisdictionConceptId?: string;
  /**
   * Identificador asociado a assurance framework concept.
   */
  assuranceFrameworkConceptId?: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de un endpoint de autoridad (UC-27-01). */
export interface CreateAuthorityEndpointData {
  /**
   * Identificador asociado a identity authority.
   */
  identityAuthorityId: string;
  /**
   * Identificador asociado a integration endpoint.
   */
  integrationEndpointId: string;
  /**
   * Identificador asociado a capability concept.
   */
  capabilityConceptId: string;
  /**
   * Identificador asociado a assurance level concept.
   */
  assuranceLevelConceptId?: string;
  /**
   * Valor de request contract version mantenido por la instancia.
   */
  requestContractVersion?: string;
  /**
   * Valor de response contract version mantenido por la instancia.
   */
  responseContractVersion?: string;
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
 * Acceso a datos de `identity_assurance.identity_authorities`. Stateless: cada
 * método recibe el `EntityManager` activo para que el servicio controle la
 * transacción y el orden de `flush` (las FK son columnas uuid planas).
 */
@Injectable()
export class IdentityAuthoritiesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<IdentityAuthorities | null>`.
   */
  findById(em: EntityManager, id: string): Promise<IdentityAuthorities | null> {
    return em.findOne(IdentityAuthorities, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `IdentityAuthorities`.
   */
  create(em: EntityManager, data: CreateAuthorityData): IdentityAuthorities {
    return em.create(
      IdentityAuthorities,
      {
        tenantId: data.tenantId,
        authorityCode: data.authorityCode,
        name: data.name,
        authorityTypeConceptId: data.authorityTypeConceptId,
        jurisdictionConceptId: data.jurisdictionConceptId,
        assuranceFrameworkConceptId: data.assuranceFrameworkConceptId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}

/** Acceso a datos de `identity_assurance.identity_authority_endpoints`. */
@Injectable()
export class IdentityAuthorityEndpointsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<IdentityAuthorityEndpoints | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<IdentityAuthorityEndpoints | null> {
    return em.findOne(IdentityAuthorityEndpoints, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `IdentityAuthorityEndpoints`.
   */
  create(
    em: EntityManager,
    data: CreateAuthorityEndpointData,
  ): IdentityAuthorityEndpoints {
    return em.create(
      IdentityAuthorityEndpoints,
      {
        identityAuthorityId: data.identityAuthorityId,
        integrationEndpointId: data.integrationEndpointId,
        capabilityConceptId: data.capabilityConceptId,
        assuranceLevelConceptId: data.assuranceLevelConceptId,
        requestContractVersion: data.requestContractVersion,
        responseContractVersion: data.responseContractVersion,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
