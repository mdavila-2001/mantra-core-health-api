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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conditionsRepo - Valor de conditions repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly conditionsRepo: ConditionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConditionsService.name);
  }

  /**
   * Condición activa del paciente con ese código, si ya está registrada.
   *
   * La expone `procedures_perioperative`, que declara el diagnóstico del caso
   * por código: cuando el clínico ya registró esa misma condición en consulta,
   * el caso quirúrgico debe apuntar a la que existe en vez de fallar.
   *
   * @param custodianTenantId - Tenant custodio de la historia.
   * @param patientProfileId - Paciente.
   * @param codeConceptId - Código de la condición.
   * @returns El id de la condición activa, o `null`.
   */
  async findActiveByCode(
    custodianTenantId: string,
    patientProfileId: string,
    codeConceptId: string,
  ): Promise<{ id: string } | null> {
    const found = await this.conditionsRepo.findActiveByCode(
      this.em,
      custodianTenantId,
      patientProfileId,
      codeConceptId,
      CLIN.CONDITION_ACTIVE,
    );
    return found ? { id: found.id } : null;
  }

  /** UC-08-08: registra una condición evitando duplicados activos por código. */
  async create(
    dto: CreateConditionDto,
    actor: AuthenticatedUser,
  ): Promise<ConditionResponseDto> {
    this.logger.info(
      {
        operation: 'clinical.condition.create',
        patientProfileId: dto.patientProfileId,
      },
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
        throw new ConflictException(
          'El paciente ya tiene esa condición activa',
          {
            patientProfileId: dto.patientProfileId,
            codeConceptId: dto.codeConceptId,
          },
        );
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
