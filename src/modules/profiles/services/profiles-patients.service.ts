import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PROF } from '../profiles.concepts';
import {
  PersonsRepository,
  PersonProfilesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
  PatientIdentityLinksRepository,
  PatientMergeEventsRepository,
  RelatedPersonsRepository,
  PatientPortalProxiesRepository,
} from '../repositories';
import {
  CreatePatientDto,
  PatientProfileResponseDto,
  LinkAccountDto,
  AccountLinkResponseDto,
  AddIdentityLinkDto,
  IdentityLinkResponseDto,
  MergePatientsDto,
  ReverseMergeDto,
  MergeEventResponseDto,
  AddRelatedPersonDto,
  RelatedPersonResponseDto,
  GrantPortalProxyDto,
  PortalProxyResponseDto,
  DeceasePersonDto,
  DeceaseResponseDto,
} from '../dto';

/**
 * Casos de uso del ciclo de vida de personas y pacientes: alta (UC-05-01),
 * vinculación de cuenta de portal (UC-05-02), vínculos de identidad MPI
 * (UC-05-07), fusión y reversión (UC-05-08/09), personas relacionadas (UC-05-10),
 * proxies de portal (UC-05-11) y defunción/anonimización (UC-05-12).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre antes de crear hijos, porque las FK son columnas uuid planas y MikroORM
 * no ordena inserts entre entidades no relacionadas.
 */
@Injectable()
export class ProfilesPatientsService {
  constructor(
    private readonly em: EntityManager,
    private readonly personsRepo: PersonsRepository,
    private readonly personProfilesRepo: PersonProfilesRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly identityLinksRepo: PatientIdentityLinksRepository,
    private readonly mergeEventsRepo: PatientMergeEventsRepository,
    private readonly relatedPersonsRepo: RelatedPersonsRepository,
    private readonly portalProxiesRepo: PatientPortalProxiesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProfilesPatientsService.name);
  }

  /** UC-05-01: alta de persona + perfil de paciente en una sola transacción. */
  async registerPatient(
    dto: CreatePatientDto,
    actor: AuthenticatedUser,
  ): Promise<PatientProfileResponseDto> {
    this.logger.info({ operation: 'profiles.patient.create', actorId: actor.id }, 'Registering patient');
    return this.em.transactional(async (tx) => {
      const clash = await this.patientProfilesRepo.findByPatientCode(tx, dto.patientCode);
      if (clash) {
        this.logger.warn(
          { operation: 'profiles.patient.create', reason: 'patient-code-in-use' },
          'Rejected patient creation: patient_code already exists',
        );
        throw new ConflictException('El patient_code ya está en uso', {
          patientCode: dto.patientCode,
        });
      }

      const person = this.personsRepo.create(tx, {
        personStatusConceptId: PROF.PERSON_ACTIVE,
        vitalStatusConceptId: PROF.VITAL_ALIVE,
        displayName: dto.displayName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        administrativeGenderConceptId: dto.administrativeGenderConceptId,
        sexAtBirthConceptId: dto.sexAtBirthConceptId,
        actorUserId: actor.id,
      });
      await tx.flush();

      // person_profiles clasifica a la persona (uq_person_profiles_person_type),
      // pero NO es el destino de la FK del subtipo: patient_profiles.profile_id
      // referencia profiles.persons(id), así que el perfil de paciente usa person.id.
      this.personProfilesRepo.create(tx, {
        personId: person.id,
        profileTypeConceptId: PROF.PROFILE_TYPE_PATIENT,
        statusConceptId: PROF.PROFILE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      const patient = this.patientProfilesRepo.create(tx, {
        profileId: person.id,
        patientCode: dto.patientCode,
        masterPatientIndexCode: dto.masterPatientIndexCode,
        recordLinkageStatusConceptId: PROF.LINKAGE_UNLINKED,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'profiles.patient.create', profileId: patient.profileId },
        'Patient registered',
      );
      return {
        profileId: patient.profileId,
        personId: person.id,
        patientCode: patient.patientCode,
        recordLinkageStatus: patient.recordLinkageStatusConceptId!,
        createdAt: patient.createdAt,
      };
    });
  }

  /** UC-05-02: vincula una cuenta de portal a la persona (supersede el vínculo previo). */
  async linkAccount(
    personId: string,
    dto: LinkAccountDto,
    actor: AuthenticatedUser,
  ): Promise<AccountLinkResponseDto> {
    this.logger.info({ operation: 'profiles.account.link', personId }, 'Linking portal account');
    return this.em.transactional(async (tx) => {
      const person = await this.personsRepo.findById(tx, personId);
      if (!person) throw new ResourceNotFoundException('Persona no encontrada', { personId });
      if (person.personStatusConceptId !== PROF.PERSON_ACTIVE) {
        throw new PreconditionFailedException('La persona no está activa', { personId });
      }

      const now = new Date();
      // Respeta uq_person_account_links_active_user: solo un vínculo activo por usuario.
      await this.accountLinksRepo.supersedeActiveForUser(tx, dto.userId, now);

      const link = this.accountLinksRepo.create(tx, {
        personId,
        userId: dto.userId,
        linkTypeConceptId: dto.linkTypeConceptId ?? PROF.ACCOUNT_LINK_SELF,
        verificationStatusConceptId: PROF.ACCOUNT_LINK_VERIFIED,
        statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
        validFrom: now,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: link.id,
        personId,
        userId: dto.userId,
        status: link.statusConceptId,
        validFrom: link.validFrom,
      };
    });
  }

  /** UC-05-07: vincula (upsert) una identidad externa de paciente y marca el registro como linked. */
  async addIdentityLink(
    profileId: string,
    dto: AddIdentityLinkDto,
    actor: AuthenticatedUser,
  ): Promise<IdentityLinkResponseDto> {
    this.logger.info({ operation: 'profiles.identity.link', profileId }, 'Adding patient identity link');
    return this.em.transactional(async (tx) => {
      const patient = await this.patientProfilesRepo.findById(tx, profileId);
      if (!patient) throw new ResourceNotFoundException('Paciente no encontrado', { profileId });

      const verificationStatus = dto.verified ? PROF.IDENTITY_VERIFIED : PROF.IDENTITY_UNVERIFIED;
      const existing = await this.identityLinksRepo.findBySource(
        tx,
        dto.sourceTenantId,
        dto.sourceSystemUri,
        dto.sourcePatientIdentifier,
      );

      let linkId: string;
      let created: boolean;
      if (existing) {
        // ON CONFLICT → conserva la mayor confianza y actualiza verificación.
        existing.confidenceScore = String(dto.confidenceScore);
        existing.verificationStatusConceptId = verificationStatus;
        existing.verifiedByUserId = dto.verified ? actor.id : undefined;
        existing.verifiedAt = dto.verified ? new Date() : undefined;
        touch(existing, actor.id);
        linkId = existing.id;
        created = false;
      } else {
        const link = this.identityLinksRepo.create(tx, {
          patientProfileId: profileId,
          sourceTenantId: dto.sourceTenantId,
          sourcePatientIdentifier: dto.sourcePatientIdentifier,
          sourceSystemUri: dto.sourceSystemUri,
          linkTypeConceptId: dto.linkTypeConceptId ?? PROF.IDENTITY_LINK_MPI,
          confidenceScore: String(dto.confidenceScore),
          verificationStatusConceptId: verificationStatus,
          verifiedByUserId: dto.verified ? actor.id : undefined,
          verifiedAt: dto.verified ? new Date() : undefined,
          actorUserId: actor.id,
        });
        await tx.flush();
        linkId = link.id;
        created = true;
      }

      patient.recordLinkageStatusConceptId = PROF.LINKAGE_LINKED;
      touch(patient, actor.id);
      await tx.flush();

      return { id: linkId, patientProfileId: profileId, verificationStatus, created };
    });
  }

  /** UC-05-08: fusiona un paciente perdedor sobre el sobreviviente (evento IMMUTABLE + reasignación). */
  async mergePatients(
    dto: MergePatientsDto,
    actor: AuthenticatedUser,
  ): Promise<MergeEventResponseDto> {
    this.logger.info(
      {
        operation: 'profiles.patient.merge',
        surviving: dto.survivingPatientProfileId,
        merged: dto.mergedPatientProfileId,
      },
      'Merging patients',
    );
    return this.em.transactional(async (tx) => {
      if (dto.survivingPatientProfileId === dto.mergedPatientProfileId) {
        throw new PreconditionFailedException('No se puede fusionar un paciente consigo mismo', {
          profileId: dto.survivingPatientProfileId,
        });
      }
      const surviving = await this.patientProfilesRepo.findById(tx, dto.survivingPatientProfileId);
      if (!surviving) {
        throw new ResourceNotFoundException('Paciente sobreviviente no encontrado', {
          profileId: dto.survivingPatientProfileId,
        });
      }
      const merged = await this.patientProfilesRepo.findById(tx, dto.mergedPatientProfileId);
      if (!merged) {
        throw new ResourceNotFoundException('Paciente a fusionar no encontrado', {
          profileId: dto.mergedPatientProfileId,
        });
      }
      if (merged.recordLinkageStatusConceptId === PROF.LINKAGE_MERGED) {
        throw new ConflictException('El paciente ya fue fusionado', {
          profileId: dto.mergedPatientProfileId,
        });
      }

      const now = new Date();
      const event = this.mergeEventsRepo.create(tx, {
        survivingPatientProfileId: dto.survivingPatientProfileId,
        mergedPatientProfileId: dto.mergedPatientProfileId,
        reasonConceptId: dto.reasonConceptId ?? PROF.MERGE_REASON_DUPLICATE,
        decisionStatusConceptId: PROF.MERGE_APPROVED,
        approvedByUserId: actor.id,
        recordedAt: now,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      // Estado del paciente perdedor.
      merged.recordLinkageStatusConceptId = PROF.LINKAGE_MERGED;
      touch(merged, actor.id);

      // patient_profiles.profile_id ES persons.id (FK a profiles.persons), así que
      // el id de perfil del perdedor identifica directamente a su persona.
      const mergedPerson = await this.personsRepo.findById(tx, merged.profileId);
      if (mergedPerson) {
        mergedPerson.mergeSurvivorPersonId = surviving.profileId;
        mergedPerson.personStatusConceptId = PROF.PERSON_MERGED;
        touch(mergedPerson, actor.id);
      }

      // Reasigna referencias del perdedor al sobreviviente.
      await this.identityLinksRepo.reassignPatientProfile(
        tx,
        merged.profileId,
        surviving.profileId,
        now,
      );
      await this.relatedPersonsRepo.reassignPatientProfile(
        tx,
        merged.profileId,
        surviving.profileId,
        now,
      );
      await this.portalProxiesRepo.reassignPatientProfile(
        tx,
        merged.profileId,
        surviving.profileId,
        now,
      );
      await tx.flush();

      return this.toEventDto(event);
    });
  }

  /** UC-05-09: revierte una fusión previa aprobada (nuevo evento IMMUTABLE de reversión). */
  async reverseMerge(
    eventId: string,
    dto: ReverseMergeDto,
    actor: AuthenticatedUser,
  ): Promise<MergeEventResponseDto> {
    this.logger.info({ operation: 'profiles.patient.merge.reverse', eventId }, 'Reversing patient merge');
    return this.em.transactional(async (tx) => {
      const original = await this.mergeEventsRepo.findById(tx, eventId);
      if (!original) throw new ResourceNotFoundException('Evento de fusión no encontrado', { eventId });
      if (original.decisionStatusConceptId !== PROF.MERGE_APPROVED) {
        throw new PreconditionFailedException('Solo se puede revertir una fusión aprobada', {
          eventId,
        });
      }
      const alreadyReversed = await this.mergeEventsRepo.findByReversalOf(tx, eventId);
      if (alreadyReversed) {
        throw new ConflictException('La fusión ya fue revertida', { eventId });
      }

      const now = new Date();
      const reversal = this.mergeEventsRepo.create(tx, {
        survivingPatientProfileId: original.survivingPatientProfileId,
        mergedPatientProfileId: original.mergedPatientProfileId,
        reasonConceptId: dto.reasonConceptId ?? original.reasonConceptId,
        decisionStatusConceptId: PROF.MERGE_REVERSED,
        approvedByUserId: actor.id,
        reversalOfEventId: eventId,
        recordedAt: now,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      // Restaura el estado del paciente y la persona del perdedor.
      const merged = await this.patientProfilesRepo.findById(tx, original.mergedPatientProfileId);
      if (merged) {
        merged.recordLinkageStatusConceptId = PROF.LINKAGE_LINKED;
        touch(merged, actor.id);
        const mergedPerson = await this.personsRepo.findById(tx, merged.profileId);
        if (mergedPerson) {
          mergedPerson.mergeSurvivorPersonId = undefined;
          mergedPerson.personStatusConceptId = PROF.PERSON_ACTIVE;
          touch(mergedPerson, actor.id);
        }
      }
      await tx.flush();

      return this.toEventDto(reversal);
    });
  }

  /** UC-05-10: registra una persona relacionada / contacto de emergencia del paciente. */
  async addRelatedPerson(
    profileId: string,
    dto: AddRelatedPersonDto,
    actor: AuthenticatedUser,
  ): Promise<RelatedPersonResponseDto> {
    this.logger.info({ operation: 'profiles.related.add', profileId }, 'Adding related person');
    return this.em.transactional(async (tx) => {
      const patient = await this.patientProfilesRepo.findById(tx, profileId);
      if (!patient) throw new ResourceNotFoundException('Paciente no encontrado', { profileId });

      if (dto.isLegalGuardian) {
        const guardian = await this.relatedPersonsRepo.findActiveGuardian(tx, profileId);
        if (guardian) {
          throw new ConflictException('El paciente ya tiene un tutor legal activo', { profileId });
        }
      }

      let personId = dto.personId;
      if (personId) {
        const existing = await this.personsRepo.findById(tx, personId);
        if (!existing) {
          throw new ResourceNotFoundException('Persona relacionada no encontrada', { personId });
        }
      } else {
        const person = this.personsRepo.create(tx, {
          personStatusConceptId: PROF.PERSON_ACTIVE,
          vitalStatusConceptId: PROF.VITAL_ALIVE,
          displayName: dto.displayName,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          actorUserId: actor.id,
        });
        await tx.flush();
        personId = person.id;
      }

      const related = this.relatedPersonsRepo.create(tx, {
        patientProfileId: profileId,
        personId,
        relationshipConceptId: dto.relationshipConceptId ?? PROF.RELATIONSHIP_GUARDIAN,
        isEmergencyContact: dto.isEmergencyContact ?? false,
        isLegalGuardian: dto.isLegalGuardian ?? false,
        statusConceptId: PROF.RELATED_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: related.id,
        patientProfileId: profileId,
        personId,
        status: related.statusConceptId,
        createdAt: related.createdAt,
      };
    });
  }

  /** UC-05-11: otorga un proxy de portal a un representante (revoca el proxy previo del mismo usuario). */
  async grantPortalProxy(
    profileId: string,
    dto: GrantPortalProxyDto,
    actor: AuthenticatedUser,
  ): Promise<PortalProxyResponseDto> {
    this.logger.info({ operation: 'profiles.proxy.grant', profileId }, 'Granting portal proxy');
    return this.em.transactional(async (tx) => {
      const patient = await this.patientProfilesRepo.findById(tx, profileId);
      if (!patient) throw new ResourceNotFoundException('Paciente no encontrado', { profileId });

      if (dto.relatedPersonId) {
        const related = await this.relatedPersonsRepo.findById(tx, dto.relatedPersonId);
        if (!related || related.patientProfileId !== profileId) {
          throw new PreconditionFailedException(
            'La persona relacionada no pertenece al paciente',
            { relatedPersonId: dto.relatedPersonId },
          );
        }
      }

      const now = new Date();
      await this.portalProxiesRepo.revokeActiveForProxyUser(tx, profileId, dto.proxyUserId, now);

      const proxy = this.portalProxiesRepo.create(tx, {
        patientProfileId: profileId,
        proxyUserId: dto.proxyUserId,
        relatedPersonId: dto.relatedPersonId,
        scopeValueSetId: dto.scopeValueSetId,
        legalBasisRecordId: dto.legalBasisRecordId,
        statusConceptId: PROF.PROXY_ACTIVE,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : now,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: proxy.id,
        patientProfileId: profileId,
        proxyUserId: dto.proxyUserId,
        status: proxy.statusConceptId,
        createdAt: proxy.createdAt,
      };
    });
  }

  /** UC-05-12: registra defunción y revoca los accesos activos de la persona. */
  async decease(
    personId: string,
    dto: DeceasePersonDto,
    actor: AuthenticatedUser,
  ): Promise<DeceaseResponseDto> {
    this.logger.info({ operation: 'profiles.person.decease', personId }, 'Recording decease');
    return this.em.transactional(async (tx) => {
      const person = await this.personsRepo.findById(tx, personId);
      if (!person) throw new ResourceNotFoundException('Persona no encontrada', { personId });
      if (person.vitalStatusConceptId === PROF.VITAL_DECEASED) {
        throw new ConflictException('La persona ya está registrada como fallecida', { personId });
      }

      const now = new Date();
      person.vitalStatusConceptId = PROF.VITAL_DECEASED;
      person.deceasedAt = dto.deceasedAt ? new Date(dto.deceasedAt) : now;
      person.personStatusConceptId = PROF.PERSON_INACTIVE;
      if (dto.anonymize) {
        person.anonymizedAt = now;
        person.displayName = 'ANONYMIZED';
      }
      touch(person, actor.id);

      const revokedAccountLinks = await this.accountLinksRepo.revokeActiveForPerson(tx, personId, now);

      // patient_profiles.profile_id ES persons.id: los proxies del posible perfil
      // de paciente de esta persona se revocan usando su propio id (0 si no es paciente).
      const revokedProxies = await this.portalProxiesRepo.revokeActiveForPatient(tx, personId, now);
      await tx.flush();

      return {
        id: person.id,
        vitalStatus: person.vitalStatusConceptId,
        personStatus: person.personStatusConceptId,
        deceasedAt: person.deceasedAt,
        revokedAccountLinks,
        revokedProxies,
      };
    });
  }

  private toEventDto(event: {
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
}
