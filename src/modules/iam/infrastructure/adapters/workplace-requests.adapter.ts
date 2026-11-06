import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerInsurerRequestsService } from '../../../insurance/application/services/practitioner-insurer-requests.service';
import { RegistrationAffiliationsService } from '../../../profiles/application/services/registration-affiliations.service';
import type {
  RequestedAffiliation,
  WorkplaceRequestsInput,
  WorkplaceRequestsPort,
  WorkplaceRequestsResult,
} from '../../application/ports/workplace-requests.port';

/** Instituciones en `profiles`, aseguradoras en `insurance`. */
@Injectable()
export class WorkplaceRequestsAdapter implements WorkplaceRequestsPort {
  constructor(
    private readonly affiliations: RegistrationAffiliationsService,
    private readonly insurerRequests: PractitionerInsurerRequestsService,
  ) {}

  async request(
    tx: EntityManager,
    input: WorkplaceRequestsInput,
  ): Promise<WorkplaceRequestsResult> {
    const affiliations = await this.affiliations.requestWithin(tx, {
      practitionerProfileId: input.practitionerProfileId,
      organizationSlugs: input.institutionSlugs,
      actorUserId: input.actorUserId,
    });
    const insurers = await this.insurerRequests.requestWithin(tx, {
      practitionerProfileId: input.practitionerProfileId,
      carrierIds: input.insurerCarrierIds,
      actorUserId: input.actorUserId,
    });
    return {
      affiliations,
      insurerRequestIds: insurers.requested.map((r) => r.id),
    };
  }

  notify(
    practitionerProfileId: string,
    affiliations: readonly RequestedAffiliation[],
  ) {
    return this.affiliations.notifyPending(practitionerProfileId, affiliations);
  }
}
