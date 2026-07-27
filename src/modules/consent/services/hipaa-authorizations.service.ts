import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  SEED,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  HipaaAuthorizationsRepository,
  ConsentEventsRepository,
} from '../repositories';
import { CONS } from '../consent.concepts';
import {
  CreateHipaaAuthorizationDto,
  HipaaAuthorizationResponseDto,
  StatusResultDto,
} from '../dto';

/**
 * Casos de uso sobre `consent.hipaa_authorizations`: otorgar una autorización de
 * divulgación (UC-07-04) y revocarla (UC-07-05). Cada operación deja rastro en
 * `consent_events` (append-only) dentro de la misma transacción.
 */
@Injectable()
export class HipaaAuthorizationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly authRepo: HipaaAuthorizationsRepository,
    private readonly eventsRepo: ConsentEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HipaaAuthorizationsService.name);
  }

  /** UC-07-04: otorga una autorización HIPAA firmada. */
  async grant(
    dto: CreateHipaaAuthorizationDto,
    actor: AuthenticatedUser,
  ): Promise<HipaaAuthorizationResponseDto> {
    this.logger.info(
      {
        operation: 'consent.hipaa.grant',
        patientProfileId: dto.patientProfileId,
      },
      'Granting HIPAA authorization',
    );
    if (dto.expirationType === 'DATE' && !dto.expiresAt) {
      throw new PreconditionFailedException(
        'expiresAt es obligatorio cuando expirationType=DATE',
        {
          expirationType: dto.expirationType,
        },
      );
    }
    if (dto.expirationType === 'EVENT' && !dto.expirationEventText) {
      throw new PreconditionFailedException(
        'expirationEventText es obligatorio cuando expirationType=EVENT',
        { expirationType: dto.expirationType },
      );
    }

    return this.em.transactional(async (tx) => {
      const now = new Date();
      const auth = this.authRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        tenantId: dto.tenantId ?? SEED.tenantId,
        processingPurposeId: dto.processingPurposeId,
        recipientDescription: dto.recipientDescription,
        informationDescription: dto.informationDescription,
        expirationTypeConceptId:
          dto.expirationType === 'EVENT'
            ? CONS.EXPIRATION_TYPE_EVENT
            : CONS.EXPIRATION_TYPE_DATE,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        expirationEventText: dto.expirationEventText,
        statusConceptId: CONS.HIPAA_ACTIVE,
        signedAt: now,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_HIPAA,
        subjectId: auth.id,
        eventTypeConceptId: CONS.EVENT_AUTHORIZED,
        previousStatusConceptId: CONS.STATUS_NONE,
        newStatusConceptId: CONS.HIPAA_ACTIVE,
        recordedByUserId: actor.id,
      });

      this.logger.info(
        { operation: 'consent.hipaa.grant', authId: auth.id },
        'HIPAA authorization granted',
      );
      return {
        id: auth.id,
        patientProfileId: auth.patientProfileId,
        status: auth.statusConceptId,
        createdAt: auth.createdAt,
      };
    });
  }

  /** UC-07-05: revoca una autorización HIPAA activa. */
  async revoke(id: string, actor: AuthenticatedUser): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'consent.hipaa.revoke', authId: id },
      'Revoking HIPAA authorization',
    );
    return this.em.transactional(async (tx) => {
      const auth = await this.authRepo.findById(tx, id);
      if (!auth)
        throw new ResourceNotFoundException(
          'Autorización HIPAA no encontrada',
          { id },
        );
      if (auth.statusConceptId !== CONS.HIPAA_ACTIVE) {
        throw new ConflictException('La autorización no está activa', {
          id,
          status: auth.statusConceptId,
        });
      }

      auth.statusConceptId = CONS.HIPAA_REVOKED;
      auth.revokedAt = new Date();
      touch(auth, actor.id);

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_HIPAA,
        subjectId: auth.id,
        eventTypeConceptId: CONS.EVENT_REVOKED,
        previousStatusConceptId: CONS.HIPAA_ACTIVE,
        newStatusConceptId: CONS.HIPAA_REVOKED,
        recordedByUserId: actor.id,
      });

      return { ok: true };
    });
  }
}
