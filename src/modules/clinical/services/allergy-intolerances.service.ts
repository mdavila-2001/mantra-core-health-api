import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import { AllergyIntolerancesRepository } from '../repositories';
import { CreateAllergyIntoleranceDto, AllergyIntoleranceResponseDto } from '../dto';
import { CLIN } from '../clinical.concepts';

/** UC-08-09: registro de alergias/intolerancias con reacciones (CDS). */
@Injectable()
export class AllergyIntolerancesService {
  constructor(
    private readonly em: EntityManager,
    private readonly allergyRepo: AllergyIntolerancesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AllergyIntolerancesService.name);
  }

  /** UC-08-09: registra una alergia y sus reacciones, sin duplicar por sustancia. */
  async create(
    dto: CreateAllergyIntoleranceDto,
    actor: AuthenticatedUser,
  ): Promise<AllergyIntoleranceResponseDto> {
    this.logger.info(
      { operation: 'clinical.allergy.create', patientProfileId: dto.patientProfileId },
      'Recording allergy',
    );
    return this.em.transactional(async (tx) => {
      const existing = await this.allergyRepo.findActiveBySubstance(
        tx,
        dto.custodianTenantId,
        dto.patientProfileId,
        dto.substanceConceptId,
        CLIN.ALLERGY_ACTIVE,
      );
      if (existing) {
        throw new ConflictException('El paciente ya tiene una alergia activa a esa sustancia', {
          patientProfileId: dto.patientProfileId,
          substanceConceptId: dto.substanceConceptId,
        });
      }

      const allergy = this.allergyRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        substanceConceptId: dto.substanceConceptId,
        typeConceptId: dto.typeConceptId,
        categoryConceptId: dto.categoryConceptId,
        criticalityConceptId: dto.criticalityConceptId,
        clinicalStatusConceptId: CLIN.ALLERGY_ACTIVE,
        verificationStatusConceptId: CLIN.ALLERGY_CONFIRMED,
        recordedByUserId: actor.id,
        actorUserId: actor.id,
      });
      // FK plana: persistir la alergia antes de sus reacciones.
      await tx.flush();

      const reactionIds: string[] = [];
      for (const r of dto.reactions ?? []) {
        const reaction = this.allergyRepo.createReaction(tx, {
          allergyId: allergy.id,
          manifestationConceptId: r.manifestationConceptId,
          severityConceptId: r.severityConceptId,
          description: r.description,
          actorUserId: actor.id,
        });
        reactionIds.push(reaction.id);
      }
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.allergy.create', allergyId: allergy.id },
        'Allergy recorded',
      );
      return {
        id: allergy.id,
        patientProfileId: allergy.patientProfileId,
        clinicalStatus: allergy.clinicalStatusConceptId ?? null,
        reactionIds,
        createdAt: allergy.createdAt,
      };
    });
  }
}
