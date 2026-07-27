import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { SEED, type AuthenticatedUser } from '../../../common';
import {
  PrivacyRestrictionsRepository,
  ConsentEventsRepository,
} from '../repositories';
import { CONS } from '../consent.concepts';
import {
  CreatePrivacyRestrictionDto,
  PrivacyRestrictionResponseDto,
} from '../dto';

/**
 * UC-07-07: aplica una restricción de privacidad que afecta el RLS clínico. Se
 * materializa en `consent.privacy_restrictions` y se emite un evento append-only;
 * el worker de autorización (async, fuera de este servicio) recalcula los grants.
 */
@Injectable()
export class PrivacyRestrictionsService {
  constructor(
    private readonly em: EntityManager,
    private readonly restrictionsRepo: PrivacyRestrictionsRepository,
    private readonly eventsRepo: ConsentEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PrivacyRestrictionsService.name);
  }

  /** UC-07-07: crea la restricción activa. */
  async apply(
    dto: CreatePrivacyRestrictionDto,
    actor: AuthenticatedUser,
  ): Promise<PrivacyRestrictionResponseDto> {
    this.logger.info(
      {
        operation: 'consent.restriction.apply',
        patientProfileId: dto.patientProfileId,
      },
      'Applying privacy restriction',
    );
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const restriction = this.restrictionsRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        tenantId: dto.tenantId ?? SEED.tenantId,
        restrictionTypeConceptId:
          dto.restrictionTypeConceptId ?? CONS.RESTRICTION_TYPE_BLOCK,
        dataClassConceptId: dto.dataClassConceptId,
        targetActorTypeConceptId: dto.targetActorTypeConceptId,
        targetActorId: dto.targetActorId,
        reasonText: dto.reasonText,
        statusConceptId: CONS.RESTRICTION_ACTIVE,
        validFrom: now,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_RESTRICTION,
        subjectId: restriction.id,
        eventTypeConceptId: CONS.EVENT_RESTRICTION_APPLIED,
        previousStatusConceptId: CONS.STATUS_NONE,
        newStatusConceptId: CONS.RESTRICTION_ACTIVE,
        recordedByUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'consent.restriction.apply',
          restrictionId: restriction.id,
        },
        'Privacy restriction applied',
      );
      return {
        id: restriction.id,
        patientProfileId: restriction.patientProfileId,
        status: restriction.statusConceptId,
        createdAt: restriction.createdAt,
      };
    });
  }
}
