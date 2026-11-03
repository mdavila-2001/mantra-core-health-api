import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { type AuthenticatedUser } from '../../../common';
import {
  PrivacyRestrictionsRepository,
  ConsentEventsRepository,
} from '../repositories';
import { ConsentScopeService } from './consent-scope.service';
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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param restrictionsRepo - Valor de restrictions repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param scope - Política común de tenant y referencias de la decisión.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly restrictionsRepo: PrivacyRestrictionsRepository,
    private readonly eventsRepo: ConsentEventsRepository,
    private readonly scope: ConsentScopeService,
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
    // El tenant sale del contexto verificado, nunca del cuerpo.
    const tenantId = this.scope.resolveTenant(dto.tenantId);
    return this.em.transactional(async (tx) => {
      await this.scope.assertPatientExists(tx, dto.patientProfileId);
      const now = new Date();
      const restriction = this.restrictionsRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        tenantId,
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
