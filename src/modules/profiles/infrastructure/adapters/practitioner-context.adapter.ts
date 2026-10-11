import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { getCurrentTenantId } from '../../../../common';
import { AuthzEffectiveRolesService } from '../../../authz/services';
import { ClinicalNoteHeaders, DocumentRecords } from '../../../chart/entities';
import { Encounters, MedicationRequests } from '../../../clinical/entities';
import { JurisdictionAuthorizationsHistory } from '../../../audit/entities';
import { IdentityVerificationCases } from '../../../identity_assurance/entities';
import { IDA } from '../../../identity_assurance/identity_assurance.concepts';
import { PracticeSites } from '../../../practice/entities';
import {
  BookableSlots,
  SchedulableResources,
} from '../../../scheduling/entities';
import type {
  PractitionerActivityCounts,
  PractitionerContextPort,
} from '../../application/ports/practitioner-context.port';

@Injectable()
export class PractitionerContextAdapter implements PractitionerContextPort {
  constructor(private readonly effectiveRoles: AuthzEffectiveRolesService) {}

  async onboardingContext(em: EntityManager, profileId: string) {
    const resources = await em.find(SchedulableResources, {
      resourceRefId: profileId,
    });
    const slotCount = resources.length
      ? await em.count(BookableSlots, {
          resourceId: { $in: resources.map((resource) => resource.id) },
        })
      : 0;
    return { resources, slotCount };
  }

  async activity(
    em: EntityManager,
    userId: string,
  ): Promise<PractitionerActivityCounts> {
    const [encounters, medicationRequests, clinicalNotes, documents] =
      await Promise.all([
        em.count(Encounters, { createdByUserId: userId }),
        em.count(MedicationRequests, { createdByUserId: userId }),
        em.count(ClinicalNoteHeaders, { createdByUserId: userId }),
        em.count(DocumentRecords, { createdByUserId: userId }),
      ]);
    return { encounters, medicationRequests, clinicalNotes, documents };
  }

  async hasAuthorizationHistory(em: EntityManager, authorizationId: string) {
    return (
      (await em.count(JurisdictionAuthorizationsHistory, {
        jurisdictionAuthorizationId: authorizationId,
      })) > 0
    );
  }

  async hasOpenIdentityCase(em: EntityManager, licenseId: string) {
    return (
      (await em.count(IdentityVerificationCases, {
        subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_LICENSE,
        subjectEntityId: licenseId,
        statusConceptId: {
          $in: [
            IDA.CASE_OPEN,
            IDA.CASE_IN_VERIFICATION,
            IDA.CASE_AT_RISK,
            IDA.CASE_MANUAL_REVIEW,
          ],
        },
      })) > 0
    );
  }

  ensurePractitionerRole(
    em: EntityManager,
    userId: string,
    actorUserId: string,
  ) {
    return this.effectiveRoles.ensureRoleByCode(em, userId, 'PRACTITIONER', {
      tenantId: getCurrentTenantId(),
      actorUserId,
    });
  }

  async managingTenantId(em: EntityManager, siteId: string) {
    return (
      (await em.findOne(PracticeSites, { id: siteId }))?.managingTenantId ??
      null
    );
  }
}
