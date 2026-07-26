import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { SEED, type AuthenticatedUser } from '../../../common';
import { TreatmentInformedConsentsRepository, ConsentEventsRepository } from '../repositories';
import { CONS } from '../consent.concepts';
import {
  CreateTreatmentInformedConsentDto,
  TreatmentInformedConsentResponseDto,
} from '../dto';

/**
 * UC-07-08: captura un consentimiento informado de tratamiento firmado en el
 * contexto de un encuentro clínico. Deja el estado en `signed` y emite el evento
 * append-only correspondiente.
 */
@Injectable()
export class TreatmentInformedConsentsService {
  constructor(
    private readonly em: EntityManager,
    private readonly treatmentRepo: TreatmentInformedConsentsRepository,
    private readonly eventsRepo: ConsentEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TreatmentInformedConsentsService.name);
  }

  /** UC-07-08: firma el consentimiento informado de tratamiento. */
  async sign(
    dto: CreateTreatmentInformedConsentDto,
    actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    this.logger.info(
      { operation: 'consent.treatment.sign', encounterId: dto.encounterId },
      'Signing treatment informed consent',
    );
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const consent = this.treatmentRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        tenantId: dto.tenantId ?? SEED.tenantId,
        encounterId: dto.encounterId,
        procedureCodeConceptId: dto.procedureCodeConceptId,
        informationVersion: dto.informationVersion,
        interpreterUserId: dto.interpreterUserId,
        witnessUserId: dto.witnessUserId,
        decisionConceptId:
          dto.decision === 'DECLINED' ? CONS.DECISION_DECLINED : CONS.DECISION_ACCEPTED,
        statusConceptId: CONS.TREATMENT_SIGNED,
        signedAt: now,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_TREATMENT,
        subjectId: consent.id,
        eventTypeConceptId: CONS.EVENT_SIGNED,
        previousStatusConceptId: CONS.TREATMENT_DRAFT,
        newStatusConceptId: CONS.TREATMENT_SIGNED,
        recordedByUserId: actor.id,
      });

      this.logger.info(
        { operation: 'consent.treatment.sign', treatmentConsentId: consent.id },
        'Treatment informed consent signed',
      );
      return {
        id: consent.id,
        patientProfileId: consent.patientProfileId,
        status: consent.statusConceptId,
        decision: consent.decisionConceptId,
        createdAt: consent.createdAt,
      };
    });
  }
}
