import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { touch, type AuthenticatedUser } from '../../../common';
import {
  ConsentsRepository,
  HipaaAuthorizationsRepository,
  PrivacyRestrictionsRepository,
  ConsentEventsRepository,
} from '../repositories';
import { CONS } from '../consent.concepts';
import { ExpirationSweepResultDto } from '../dto';

/**
 * UC-07-11: barrido de expiraciones (worker programado). Transiciona a `expired`
 * los consentimientos y restricciones cuyo `valid_to` venció y las autorizaciones
 * HIPAA (por fecha) cuyo `expires_at` venció; por cada fila deja un evento
 * append-only. En producción se ejecuta bajo lock distribuido con SKIP LOCKED;
 * aquí se materializa la transición transaccional de dominio.
 */
@Injectable()
export class ConsentSweepService {
  constructor(
    private readonly em: EntityManager,
    private readonly consentsRepo: ConsentsRepository,
    private readonly authRepo: HipaaAuthorizationsRepository,
    private readonly restrictionsRepo: PrivacyRestrictionsRepository,
    private readonly eventsRepo: ConsentEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConsentSweepService.name);
  }

  /** UC-07-11: expira las directivas vencidas y devuelve el conteo por tipo. */
  async sweep(actor: AuthenticatedUser): Promise<ExpirationSweepResultDto> {
    this.logger.info({ operation: 'consent.sweep.run', actorId: actor.id }, 'Running expiration sweep');
    return this.em.transactional(async (tx) => {
      const now = new Date();

      const consents = await this.consentsRepo.findExpirable(tx, CONS.CONSENT_ACTIVE, now);
      for (const consent of consents) {
        consent.statusConceptId = CONS.CONSENT_EXPIRED;
        touch(consent, actor.id);
        this.eventsRepo.record(tx, {
          subjectTypeConceptId: CONS.SUBJECT_CONSENT,
          subjectId: consent.id,
          eventTypeConceptId: CONS.EVENT_EXPIRED,
          previousStatusConceptId: CONS.CONSENT_ACTIVE,
          newStatusConceptId: CONS.CONSENT_EXPIRED,
          recordedByUserId: actor.id,
        });
      }

      const auths = await this.authRepo.findExpirable(tx, CONS.HIPAA_ACTIVE, now);
      for (const auth of auths) {
        auth.statusConceptId = CONS.HIPAA_EXPIRED;
        touch(auth, actor.id);
        this.eventsRepo.record(tx, {
          subjectTypeConceptId: CONS.SUBJECT_HIPAA,
          subjectId: auth.id,
          eventTypeConceptId: CONS.EVENT_EXPIRED,
          previousStatusConceptId: CONS.HIPAA_ACTIVE,
          newStatusConceptId: CONS.HIPAA_EXPIRED,
          recordedByUserId: actor.id,
        });
      }

      const restrictions = await this.restrictionsRepo.findExpirable(tx, CONS.RESTRICTION_ACTIVE, now);
      for (const restriction of restrictions) {
        restriction.statusConceptId = CONS.RESTRICTION_EXPIRED;
        touch(restriction, actor.id);
        this.eventsRepo.record(tx, {
          subjectTypeConceptId: CONS.SUBJECT_RESTRICTION,
          subjectId: restriction.id,
          eventTypeConceptId: CONS.EVENT_EXPIRED,
          previousStatusConceptId: CONS.RESTRICTION_ACTIVE,
          newStatusConceptId: CONS.RESTRICTION_EXPIRED,
          recordedByUserId: actor.id,
        });
      }

      const result: ExpirationSweepResultDto = {
        expiredConsents: consents.length,
        expiredAuthorizations: auths.length,
        expiredRestrictions: restrictions.length,
      };
      this.logger.info({ operation: 'consent.sweep.run', ...result }, 'Expiration sweep completed');
      return result;
    });
  }
}
