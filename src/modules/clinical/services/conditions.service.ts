import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import { ConditionsRepository } from '../repositories';
import { CreateConditionDto, ConditionResponseDto } from '../dto';
import { CLIN } from '../clinical.concepts';

/** UC-08-08: registro de condiciones/diagnósticos (activa + confirmada). */
@Injectable()
export class ConditionsService {
  constructor(
    private readonly em: EntityManager,
    private readonly conditionsRepo: ConditionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConditionsService.name);
  }

  /** UC-08-08: registra una condición evitando duplicados activos por código. */
  async create(dto: CreateConditionDto, actor: AuthenticatedUser): Promise<ConditionResponseDto> {
    this.logger.info(
      { operation: 'clinical.condition.create', patientProfileId: dto.patientProfileId },
      'Recording condition',
    );
    return this.em.transactional(async (tx) => {
      const existing = await this.conditionsRepo.findActiveByCode(
        tx,
        dto.custodianTenantId,
        dto.patientProfileId,
        dto.codeConceptId,
        CLIN.CONDITION_ACTIVE,
      );
      if (existing) {
        throw new ConflictException('El paciente ya tiene esa condición activa', {
          patientProfileId: dto.patientProfileId,
          codeConceptId: dto.codeConceptId,
        });
      }

      const condition = this.conditionsRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        codeConceptId: dto.codeConceptId,
        categoryConceptId: dto.categoryConceptId,
        clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
        verificationStatusConceptId: CLIN.CONDITION_CONFIRMED,
        severityConceptId: dto.severityConceptId,
        lateralityConceptId: dto.lateralityConceptId,
        onsetAt: dto.onsetAt ? new Date(dto.onsetAt) : undefined,
        recordedByUserId: actor.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.condition.create', conditionId: condition.id },
        'Condition recorded',
      );
      return {
        id: condition.id,
        patientProfileId: condition.patientProfileId,
        clinicalStatus: condition.clinicalStatusConceptId ?? null,
        verificationStatus: condition.verificationStatusConceptId ?? null,
        createdAt: condition.createdAt,
      };
    });
  }
}
