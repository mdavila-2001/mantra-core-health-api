import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AuditTrailService } from '../../audit/services';
import { NotificationsService, OutboxService } from '../../messaging/services';
import {
  HealthPractitionerProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/infrastructure/repositories';
import { ProfilesErrorReason } from '../../profiles/profiles.error-reasons';
import { AUTHZ } from '../authz.concepts';
import {
  type AuthzIdResponseDto,
  type AuthzStatusResultDto,
  type RequestPrimaryPractitionerDto,
  type RespondPrimaryCareRequestDto,
} from '../dto';
import { CareRelationshipsRepository } from '../repositories';
import { AuthzClinicalScopeService } from './authz-clinical-scope.service';
import { AuthzPrimaryCareSyncService } from './authz-primary-care-sync.service';

/**
 * Primary-care (cabecera) requests started by the patient, and the
 * practitioner's answer to them. Requests started by the practitioner use the
 * existing `/authz/care-relationships/request` flow with type PRIMARY.
 */
@Injectable()
export class AuthzPrimaryCareService {
  /**
   * @param em - Persistence context.
   * @param scope - Active-tenant policy.
   * @param careRepo - Care relationships (B).
   * @param practitionersRepo - Practitioner profiles, to validate the choice.
   * @param accountLinksRepo - Person ↔ account links.
   * @param sync - Keeps B and the current primary practitioner (C) in step.
   * @param auditTrail - WORM trail.
   * @param outbox - Domain events.
   * @param notifications - In-app notice to the practitioner.
   * @param logger - Structured logger.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly scope: AuthzClinicalScopeService,
    private readonly careRepo: CareRelationshipsRepository,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly sync: AuthzPrimaryCareSyncService,
    private readonly auditTrail: AuditTrailService,
    private readonly outbox: OutboxService,
    private readonly notifications: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzPrimaryCareService.name);
  }

  /**
   * The patient asks a practitioner to be their primary-care doctor. Nothing
   * is granted until the practitioner accepts.
   *
   * @param dto - Chosen practitioner.
   * @param actor - The patient (the subject always comes from the session).
   * @returns The new pending relation.
   * @throws ResourceNotFoundException if the account has no patient profile or the practitioner does not exist.
   * @throws PreconditionFailedException if the patient picks themselves or the practitioner takes no new patients.
   * @throws ConflictException if the pair already has a primary relation active or pending in the tenant.
   */
  async requestAsPatient(
    dto: RequestPrimaryPractitionerDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    const patientProfileId = this.ownPatientProfileId(actor);
    this.logger.info(
      {
        operation: 'authz.primary-care.request',
        practitionerProfileId: dto.practitionerProfileId,
      },
      'Patient requesting a primary practitioner',
    );
    const created = await this.em.transactional(async (tx) => {
      const tenantId = this.scope.resolveTenant();
      await this.assertChoosable(tx, patientProfileId, dto);
      // Only a primary relation of this pair counts as a duplicate: a treating
      // relation from a past visit must not stop the patient from choosing them.
      const open = await this.careRepo.findOpenPrimaryOfPair(
        tx,
        patientProfileId,
        dto.practitionerProfileId,
        tenantId,
      );
      if (open) {
        throw new ConflictException(
          'Ya existe una solicitud de cabecera activa o pendiente con este profesional',
        );
      }
      const rel = this.careRepo.create(tx, {
        tenantId,
        patientProfileId,
        practitionerProfileId: dto.practitionerProfileId,
        relationshipTypeConceptId: AUTHZ.CARE_REL_PRIMARY,
        validFrom: new Date(),
        actorUserId: actor.id,
        statusConceptId: CONCEPTS.STATE_PENDING,
      });
      await tx.flush();
      await this.auditTrail.record(tx, actor, {
        action: 'CARE_RELATIONSHIP_REQUESTED',
        entity: 'care_relationship',
        entityId: rel.id,
        tenantId,
      });
      return { id: rel.id, tenantId, createdAt: rel.createdAt };
    });

    await this.notifyPractitioner(dto.practitionerProfileId, created, actor);
    return {
      id: created.id,
      status: CONCEPTS.STATE_PENDING,
      createdAt: created.createdAt,
    };
  }

  /**
   * The practitioner answers a primary-care request a patient made. Accepting
   * replaces the previous primary practitioner and rewrites C in the same
   * transaction.
   *
   * @param id - Relation to answer.
   * @param dto - Accept or reject.
   * @param actor - The practitioner the request is addressed to.
   * @throws ResourceNotFoundException if it does not exist or is addressed to someone else.
   * @throws PreconditionFailedException if it is not a pending primary request made by the patient.
   */
  async respondAsPractitioner(
    id: string,
    dto: RespondPrimaryCareRequestDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    this.logger.info(
      { operation: 'authz.primary-care.respond', id, decision: dto.decision },
      'Practitioner answering a primary-care request',
    );
    return this.em.transactional(async (tx) => {
      const rel = await this.careRepo.findById(tx, id);
      // Someone else's request answers like a missing one: it does not reveal it exists.
      if (
        !rel ||
        !actor.practitionerProfileId ||
        rel.practitionerProfileId !== actor.practitionerProfileId
      ) {
        throw new ResourceNotFoundException('Solicitud no encontrada', { id });
      }
      if (
        rel.relationshipTypeConceptId !== AUTHZ.CARE_REL_PRIMARY ||
        rel.statusConceptId !== CONCEPTS.STATE_PENDING
      ) {
        throw new PreconditionFailedException(
          'La solicitud ya fue respondida o no es de cabecera',
          { id, status: rel.statusConceptId },
        );
      }
      const patientLink = await this.accountLinksRepo.findActiveByPerson(
        tx,
        rel.patientProfileId,
      );
      if (
        !rel.establishedByUserId ||
        rel.establishedByUserId !== patientLink?.userId
      ) {
        throw new PreconditionFailedException(
          'Esta solicitud no la inició el paciente: la responde él',
          { id },
        );
      }

      if (dto.decision === 'ACCEPT') {
        await this.sync.activate(tx, rel, actor);
      } else {
        rel.statusConceptId = AUTHZ.CARE_REL_STATUS_DECLINED;
        rel.validTo = new Date();
      }
      touch(rel, actor.id);
      await tx.flush();

      await this.auditTrail.record(tx, actor, {
        action:
          dto.decision === 'ACCEPT'
            ? 'CARE_RELATIONSHIP_ACCEPTED'
            : 'CARE_RELATIONSHIP_REJECTED',
        entity: 'care_relationship',
        entityId: rel.id,
        tenantId: rel.tenantId,
      });
      await this.outbox.publishDomainEvent(tx, {
        tenantId: rel.tenantId,
        eventType: 'authz.care_relationship.responded',
        aggregateType: 'care_relationship',
        aggregateId: rel.id,
        payloadJson: {
          decision: dto.decision,
          patientProfileId: rel.patientProfileId,
          practitionerProfileId: rel.practitionerProfileId,
          authorizedSpecialtyConceptIds: [],
        },
        actorUserId: actor.id,
      });
      return { ok: true, affected: 1 };
    });
  }

  /** The patient of the session; the subject never comes from the body. */
  private ownPatientProfileId(actor: AuthenticatedUser): string {
    if (!actor.patientProfileId) {
      throw new ResourceNotFoundException(
        'Paciente no encontrado',
        {},
        ProfilesErrorReason.PATIENT_PROFILE_NOT_FOUND,
      );
    }
    return actor.patientProfileId;
  }

  /** Same rules as choosing the primary practitioner directly. */
  private async assertChoosable(
    tx: EntityManager,
    patientProfileId: string,
    dto: RequestPrimaryPractitionerDto,
  ): Promise<void> {
    if (dto.practitionerProfileId === patientProfileId) {
      throw new PreconditionFailedException(
        'No puede elegirse a sí mismo como médico de cabecera.',
        {},
        ProfilesErrorReason.PRIMARY_PRACTITIONER_SELF,
      );
    }
    const practitioner = await this.practitionersRepo.findById(
      tx,
      dto.practitionerProfileId,
    );
    if (!practitioner) {
      throw new ResourceNotFoundException(
        'Profesional no encontrado',
        {},
        ProfilesErrorReason.PRACTITIONER_PROFILE_NOT_FOUND,
      );
    }
    // Only an explicit `false` closes the door: not declaring is not a "no".
    if (practitioner.acceptsNewPatients === false) {
      throw new PreconditionFailedException(
        'Este profesional no está aceptando pacientes nuevos.',
        {},
        ProfilesErrorReason.PRIMARY_PRACTITIONER_NOT_ACCEPTING_PATIENTS,
      );
    }
  }

  /** In-app notice after the commit; a missing account only skips the notice. */
  private async notifyPractitioner(
    practitionerProfileId: string,
    created: { id: string; tenantId: string },
    actor: AuthenticatedUser,
  ): Promise<void> {
    const link = await this.accountLinksRepo.findActiveByPerson(
      this.em.fork(),
      practitionerProfileId,
    );
    if (!link) {
      this.logger.warn(
        {
          operation: 'authz.primary-care.request.notify-missing',
          id: created.id,
        },
        'Practitioner has no active account: request created without notice',
      );
      return;
    }
    await this.notifications.emitInApp({
      recipientUserId: link.userId,
      category: 'CLINICAL',
      subject: 'Un paciente le pidió ser su médico de cabecera',
      bodyText: 'Puede aceptar o rechazar la solicitud desde sus solicitudes.',
      tenantId: created.tenantId,
      actorUserId: actor.id,
    });
  }
}
