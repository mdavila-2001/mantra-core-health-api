import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { JurisdictionAuthorizations } from '../entities';
import { createdBy } from '../../../common';

/** Datos de una autorización jurisdiccional (licencia). */
export interface CreateJurisdictionAuthorizationData {
  practitionerProfileId: string;
  jurisdictionConceptId: string;
  licenseNumber: string;
  regulatoryAuthority?: string;
  practiceScopeConceptId?: string;
  stateConceptId: string;
  validFrom?: Date;
  validTo?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `profiles.jurisdiction_authorizations`. */
@Injectable()
export class JurisdictionAuthorizationsRepository {
  create(
    em: EntityManager,
    data: CreateJurisdictionAuthorizationData,
  ): JurisdictionAuthorizations {
    return em.create(
      JurisdictionAuthorizations,
      {
        practitionerProfileId: data.practitionerProfileId,
        jurisdictionConceptId: data.jurisdictionConceptId,
        licenseNumber: data.licenseNumber,
        regulatoryAuthority: data.regulatoryAuthority,
        practiceScopeConceptId: data.practiceScopeConceptId,
        stateConceptId: data.stateConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
