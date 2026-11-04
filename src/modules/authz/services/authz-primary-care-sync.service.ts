import { Injectable } from '@nestjs/common';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AuditTrailService } from '../../audit/services';
import { PatientPrimaryPractitionersRepository } from '../../profiles/infrastructure/repositories';
import { AUTHZ } from '../authz.concepts';
import type { CareRelationships } from '../entities';
import { CareRelationshipsRepository } from '../repositories';

/**
 * Keeps the primary-care relation (B, `authz.care_relationships` of type
 * PRIMARY) and the patient's current primary practitioner (C,
 * `profiles.patient_primary_practitioners`) in step.
 *
 * Every method runs on the caller's transaction: B and C change together or
 * not at all. Nothing here opens a transaction, flushes the final state or
 * publishes the outbox event; the caller owns those.
 */
@Injectable()
export class AuthzPrimaryCareSyncService {
  /**
   * @param careRepo - Care relationships (B).
   * @param primaryRepo - Current primary practitioner (C).
   * @param auditTrail - WORM trail for the relation that gets replaced.
   */
  constructor(
    private readonly careRepo: CareRelationshipsRepository,
    private readonly primaryRepo: PatientPrimaryPractitionersRepository,
    private readonly auditTrail: AuditTrailService,
  ) {}

  /**
   * Activates a pending relation. For a PRIMARY one it also replaces the
   * previous primary of the patient in the tenant and rewrites C.
   *
   * Order matters: the old PRIMARY is revoked, the new one activated, the
   * current C closed, a `flush`, and only then the new C opened, because the
   * unique index of the current C is not deferrable.
   *
   * @param tx - Caller's transaction.
   * @param rel - Pending relation to activate.
   * @param actor - Who accepts.
   * @throws PreconditionFailedException if the actor is the one who asked.
   * @throws ConflictException if the primary practitioner changed concurrently.
   */
  async activate(
    tx: EntityManager,
    rel: CareRelationships,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const now = new Date();
    const isPrimary = rel.relationshipTypeConceptId === AUTHZ.CARE_REL_PRIMARY;
    if (isPrimary && rel.establishedByUserId === actor.id) {
      // The counterpart accepts; whoever asked cannot approve their own request.
      throw new PreconditionFailedException(
        'Sólo la otra parte puede aceptar esta solicitud',
        { id: rel.id },
      );
    }
    if (isPrimary) await this.revokePrevious(tx, rel, actor, now);

    // The request may have waited days: validity starts when it is accepted.
    rel.statusConceptId = CONCEPTS.STATE_ACTIVE;
    rel.validFrom = now;
    if (!isPrimary) return;

    try {
      const current = await this.primaryRepo.findCurrentByPatient(
        tx,
        rel.patientProfileId,
      );
      if (current) this.primaryRepo.close(current, now, actor.id);
      await tx.flush();
      this.primaryRepo.open(
        tx,
        {
          patientProfileId: rel.patientProfileId,
          practitionerProfileId: rel.practitionerProfileId,
          actorUserId: actor.id,
        },
        now,
      );
      await tx.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          'Su médico de cabecera cambió mientras se aceptaba. Vuelva a intentarlo.',
        );
      }
      throw error;
    }
  }

  /**
   * Closes C when the revoked relation is the patient's current primary one.
   * Does not flush: the caller does it with the revoked relation.
   *
   * @param tx - Caller's transaction.
   * @param rel - Relation that was just revoked.
   * @param actor - Who revokes.
   */
  async onRevoked(
    tx: EntityManager,
    rel: CareRelationships,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (rel.relationshipTypeConceptId !== AUTHZ.CARE_REL_PRIMARY) return;
    const current = await this.primaryRepo.findCurrentByPatient(
      tx,
      rel.patientProfileId,
    );
    if (current?.practitionerProfileId !== rel.practitionerProfileId) return;
    this.primaryRepo.close(current, new Date(), actor.id);
  }

  /** Revokes the PRIMARY relations still active for the patient in the tenant. */
  private async revokePrevious(
    tx: EntityManager,
    rel: CareRelationships,
    actor: AuthenticatedUser,
    now: Date,
  ): Promise<void> {
    const previous = await this.careRepo.findActivePrimaryInTenant(
      tx,
      rel.patientProfileId,
      rel.tenantId,
    );
    for (const old of previous) {
      if (old.id === rel.id) continue;
      old.statusConceptId = CONCEPTS.STATE_REVOKED;
      old.validTo = now;
      touch(old, actor.id, now);
      await this.auditTrail.record(tx, actor, {
        action: 'CARE_RELATIONSHIP_REVOKED',
        entity: 'care_relationship',
        entityId: old.id,
        tenantId: old.tenantId,
      });
    }
  }
}
