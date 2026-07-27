import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityAuthorities, IdentityAuthorityEndpoints } from '../entities';
import { createdBy } from '../../../common';

/** Alta de una autoridad de identidad (UC-27-01). */
export interface CreateAuthorityData {
  tenantId: string;
  authorityCode: string;
  name: string;
  authorityTypeConceptId: string;
  jurisdictionConceptId?: string;
  assuranceFrameworkConceptId?: string;
  verificationStatusConceptId: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Alta de un endpoint de autoridad (UC-27-01). */
export interface CreateAuthorityEndpointData {
  identityAuthorityId: string;
  integrationEndpointId: string;
  capabilityConceptId: string;
  assuranceLevelConceptId?: string;
  requestContractVersion?: string;
  responseContractVersion?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `identity_assurance.identity_authorities`. Stateless: cada
 * método recibe el `EntityManager` activo para que el servicio controle la
 * transacción y el orden de `flush` (las FK son columnas uuid planas).
 */
@Injectable()
export class IdentityAuthoritiesRepository {
  findById(em: EntityManager, id: string): Promise<IdentityAuthorities | null> {
    return em.findOne(IdentityAuthorities, { id });
  }

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
  findById(
    em: EntityManager,
    id: string,
  ): Promise<IdentityAuthorityEndpoints | null> {
    return em.findOne(IdentityAuthorityEndpoints, { id });
  }

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
