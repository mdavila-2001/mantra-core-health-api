import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import type {
  PatientIdentityLinksRepository,
  PatientMergeEventsRepository,
  PatientPortalProxiesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
  PersonsRepository,
  RelatedPersonsRepository,
} from '../../../infrastructure/repositories';
import type {
  MergeEventResponseDto,
  MergePatientsDto,
} from '../../../presentation/dto';
import { PROF } from '../../../profiles.concepts';
import { ProfilesErrorReason } from '../../../profiles.error-reasons';

/** Repositories the merge writes through, all in one transaction. */
export interface MergePatientsRepositories {
  readonly patientProfiles: PatientProfilesRepository;
  readonly persons: PersonsRepository;
  readonly mergeEvents: PatientMergeEventsRepository;
  readonly identityLinks: PatientIdentityLinksRepository;
  readonly relatedPersons: RelatedPersonsRepository;
  readonly portalProxies: PatientPortalProxiesRepository;
  readonly accountLinks: PersonAccountLinksRepository;
}

/** Shape of a merge event as the API returns it. */
export function toMergeEventDto(event: {
  id: string;
  survivingPatientProfileId: string;
  mergedPatientProfileId: string;
  decisionStatusConceptId: string;
  reversalOfEventId?: string;
  recordedAt: Date;
}): MergeEventResponseDto {
  return {
    id: event.id,
    survivingPatientProfileId: event.survivingPatientProfileId,
    mergedPatientProfileId: event.mergedPatientProfileId,
    decisionStatus: event.decisionStatusConceptId,
    reversalOfEventId: event.reversalOfEventId,
    recordedAt: event.recordedAt,
  };
}

/**
 * UC-05-08: merges a loser patient onto the survivor (IMMUTABLE event plus
 * reassignment of the loser's references).
 *
 * The loser's own portal account moves to the survivor when the survivor has
 * none: otherwise the person would keep logging into a merged, hidden profile
 * and never see what is addressed to the surviving one.
 */
export class MergePatientsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly repos: MergePatientsRepositories,
  ) {}

  execute(
    dto: MergePatientsDto,
    actor: AuthenticatedUser,
  ): Promise<MergeEventResponseDto> {
    const survivorId = dto.survivingPatientProfileId;
    const loserId = dto.mergedPatientProfileId;
    return this.em.transactional(async (tx) => {
      if (survivorId === loserId) {
        throw new PreconditionFailedException(
          'No se puede fusionar un paciente consigo mismo',
          { profileId: survivorId },
          ProfilesErrorReason.MERGE_SAME_PATIENT,
        );
      }
      const surviving = await this.repos.patientProfiles.findById(
        tx,
        survivorId,
      );
      if (!surviving) {
        throw new ResourceNotFoundException(
          'Paciente sobreviviente no encontrado',
          { profileId: survivorId },
          ProfilesErrorReason.MERGE_SURVIVING_PATIENT_NOT_FOUND,
        );
      }
      const merged = await this.repos.patientProfiles.findById(tx, loserId);
      if (!merged) {
        throw new ResourceNotFoundException(
          'Paciente a fusionar no encontrado',
          { profileId: loserId },
          ProfilesErrorReason.MERGE_TARGET_PATIENT_NOT_FOUND,
        );
      }
      if (merged.recordLinkageStatusConceptId === PROF.LINKAGE_MERGED) {
        throw new ConflictException(
          'El paciente ya fue fusionado',
          { profileId: loserId },
          ProfilesErrorReason.PATIENT_ALREADY_MERGED,
        );
      }

      const now = new Date();
      const event = this.repos.mergeEvents.create(tx, {
        survivingPatientProfileId: survivorId,
        mergedPatientProfileId: loserId,
        reasonConceptId: dto.reasonConceptId ?? PROF.MERGE_REASON_DUPLICATE,
        decisionStatusConceptId: PROF.MERGE_APPROVED,
        approvedByUserId: actor.id,
        recordedAt: now,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      merged.recordLinkageStatusConceptId = PROF.LINKAGE_MERGED;
      touch(merged, actor.id);

      // patient_profiles.profile_id IS persons.id, so the loser's profile id
      // names its person directly.
      const mergedPerson = await this.repos.persons.findById(tx, loserId);
      if (mergedPerson) {
        mergedPerson.mergeSurvivorPersonId = survivorId;
        mergedPerson.personStatusConceptId = PROF.PERSON_MERGED;
        touch(mergedPerson, actor.id);
      }

      await this.repos.identityLinks.reassignPatientProfile(
        tx,
        loserId,
        survivorId,
        now,
      );
      await this.repos.relatedPersons.reassignPatientProfile(
        tx,
        loserId,
        survivorId,
        now,
      );
      await this.repos.portalProxies.reassignPatientProfile(
        tx,
        loserId,
        survivorId,
        now,
      );
      if (!(await this.repos.accountLinks.hasSelfActiveLink(tx, survivorId))) {
        await this.repos.accountLinks.reassignSelfActiveLinks(
          tx,
          loserId,
          survivorId,
          now,
        );
      }
      await tx.flush();

      return toMergeEventDto(event);
    });
  }
}
