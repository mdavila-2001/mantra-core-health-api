import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, getCurrentTenantId } from '../../../../common';
import { AuthzEffectiveRolesService } from '../../../authz/services';
import { ClinicalNoteHeaders, DocumentRecords } from '../../../chart/entities';
import { COMM } from '../../../community/community.concepts';
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
  PractitionerDirectoryStats,
} from '../../application/ports/practitioner-context.port';
import { PROF } from '../../profiles.concepts';

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

  /**
   * Las cifras de la guía para toda una página, en dos consultas.
   *
   * La actividad se cuenta con el mismo criterio que {@link activity} —lo que
   * asentó la cuenta del titular—, así que el número por el que se ordena la
   * guía es el que después muestra la ficha. La nota es la de
   * `ratingsByProfile` de comunidad: reseñas publicadas y no retiradas, de su
   * perfil público **visible**; las de un perfil oculto no salen por acá.
   */
  async directoryStats(
    em: EntityManager,
    profileIds: readonly string[],
  ): Promise<Map<string, PractitionerDirectoryStats>> {
    const output = new Map<string, PractitionerDirectoryStats>();
    if (profileIds.length === 0) return output;
    const ids = [...profileIds];
    const connection = em.getConnection();

    const [activityRows, ratingRows] = await Promise.all([
      connection.execute<
        {
          person_id: string;
          encounters: string;
          medication_requests: string;
          clinical_notes: string;
          documents: string;
        }[]
      >(
        `SELECT l.person_id,
                (SELECT COUNT(*) FROM clinical.encounters x
                  WHERE x.created_by_user_id = l.user_id) AS encounters,
                (SELECT COUNT(*) FROM clinical.medication_requests x
                  WHERE x.created_by_user_id = l.user_id) AS medication_requests,
                (SELECT COUNT(*) FROM chart.clinical_note_headers x
                  WHERE x.created_by_user_id = l.user_id) AS clinical_notes,
                (SELECT COUNT(*) FROM chart.document_records x
                  WHERE x.created_by_user_id = l.user_id) AS documents
           FROM profiles.person_account_links l
          WHERE l.person_id IN (?)
            AND l.status_concept_id = ?`,
        [ids, PROF.ACCOUNT_LINK_ACTIVE],
        'all',
      ),
      connection.execute<{ target_id: string; avg: string; total: string }[]>(
        `SELECT p.target_id, AVG(r.overall_rating)::numeric AS avg, COUNT(*) AS total
           FROM community.public_profiles p
           JOIN community.service_reviews r
             ON r.target_public_profile_id = p.id
          WHERE p.target_type_concept_id = ?
            AND p.target_id IN (?)
            AND p.visibility_concept_id = ?
            AND p.status_concept_id = ?
            AND r.publication_status_concept_id = ?
            AND r.moderation_status_concept_id <> ?
          GROUP BY p.target_id`,
        [
          COMM.PROFILE_TARGET_PRACTITIONER,
          ids,
          COMM.PROFILE_VISIBILITY_PUBLIC,
          CONCEPTS.STATE_ACTIVE,
          COMM.PUBLICATION_PUBLISHED,
          COMM.MODERATION_REMOVED,
        ],
        'all',
      ),
    ]);

    const entry = (profileId: string): PractitionerDirectoryStats => {
      const existing = output.get(profileId);
      if (existing) return existing;
      const created: PractitionerDirectoryStats = {
        activity: {
          encounters: 0,
          medicationRequests: 0,
          clinicalNotes: 0,
          documents: 0,
        },
        ratingAverage: null,
        ratingCount: 0,
      };
      output.set(profileId, created);
      return created;
    };

    // Se suma y no se pisa: si una persona tuviera dos vínculos activos, lo
    // asentado con las dos cuentas es suyo igual.
    for (const row of activityRows) {
      const { activity } = entry(row.person_id);
      activity.encounters += Number(row.encounters);
      activity.medicationRequests += Number(row.medication_requests);
      activity.clinicalNotes += Number(row.clinical_notes);
      activity.documents += Number(row.documents);
    }
    for (const row of ratingRows) {
      const stats = entry(row.target_id);
      // Una decimal, como en la ficha.
      stats.ratingAverage = Math.round(Number(row.avg) * 10) / 10;
      stats.ratingCount = Number(row.total);
    }
    return output;
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
