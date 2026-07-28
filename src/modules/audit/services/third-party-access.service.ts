import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import {
  ThirdPartyAccessRepository,
  AuditLogRepository,
} from '../repositories';
import { AUD } from '../audit.concepts';
import { RecordThirdPartyAccessDto, ThirdPartyAccessResultDto } from '../dto';

const PURPOSE_OF_USE: Record<string, string> = {
  TREATMENT: AUD.PURPOSE_TREATMENT,
  PAYMENT: AUD.PURPOSE_PAYMENT,
  OPERATIONS: AUD.PURPOSE_OPERATIONS,
  COVERAGE: AUD.PURPOSE_COVERAGE,
  VERIFICATION: AUD.PURPOSE_VERIFICATION,
};

/**
 * UC-10-12: registra un acceso delegado / de tercero gobernado. Según el `channel`
 * escribe en el log especializado (delegated / insurance / identity / pharmacy) y
 * sella provenance en `audit_log`. Cada canal exige sus FKs NOT NULL propias; si
 * faltan se rechaza con 412 antes de tocar la BD.
 */
@Injectable()
export class ThirdPartyAccessService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tpaRepo - Valor de tpa repo requerido por la operación.
   * @param auditLogRepo - Valor de audit log repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tpaRepo: ThirdPartyAccessRepository,
    private readonly auditLogRepo: AuditLogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ThirdPartyAccessService.name);
  }

  /**
   * Ejecuta la operación record.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de record conforme al contrato `Promise<ThirdPartyAccessResultDto>`.
   */
  async record(
    dto: RecordThirdPartyAccessDto,
    actor: AuthenticatedUser,
  ): Promise<ThirdPartyAccessResultDto> {
    this.logger.info(
      {
        operation: 'audit.thirdParty.record',
        actorId: actor.id,
        channel: dto.channel,
      },
      'Recording governed third-party access',
    );
    const outcome =
      dto.outcome === 'FAILURE'
        ? CONCEPTS.OUTCOME_FAILURE
        : CONCEPTS.OUTCOME_SUCCESS;
    const purpose = PURPOSE_OF_USE[dto.purposeOfUse ?? 'TREATMENT'];

    return this.em.transactional(async (tx) => {
      let rowId: string;

      switch (dto.channel) {
        case 'DELEGATED': {
          this.require(
            dto.delegatingPractitionerProfileId,
            'delegatingPractitionerProfileId',
          );
          const row = this.tpaRepo.recordDelegated(tx, {
            delegateUserId: actor.id,
            delegatingPractitionerProfileId:
              dto.delegatingPractitionerProfileId!,
            delegatedAssignmentId: dto.delegatedAssignmentId,
            patientProfileId: dto.patientProfileId,
            resourceTypeConceptId: AUD.RESOURCE_TYPE_CLINICAL,
            resourceId: dto.resourceId,
            actionConceptId: AUD.ACTION_READ,
            outcomeConceptId: outcome,
          });
          rowId = row.id;
          break;
        }
        case 'INSURANCE': {
          this.require(dto.insuranceCarrierId, 'insuranceCarrierId');
          this.require(dto.patientProfileId, 'patientProfileId');
          const row = this.tpaRepo.recordInsurance(tx, {
            insuranceCarrierId: dto.insuranceCarrierId!,
            actorUserId: actor.id,
            patientProfileId: dto.patientProfileId!,
            claimId: dto.claimId,
            authorizationRequestId: dto.authorizationRequestId,
            actionConceptId: AUD.ACTION_READ,
            purposeOfUseConceptId:
              PURPOSE_OF_USE[dto.purposeOfUse ?? 'COVERAGE'],
            outcomeConceptId: outcome,
          });
          rowId = row.id;
          break;
        }
        case 'IDENTITY': {
          this.require(dto.verificationCaseId, 'verificationCaseId');
          const row = this.tpaRepo.recordIdentity(tx, {
            verificationCaseId: dto.verificationCaseId!,
            actorUserId: actor.id,
            actionConceptId: AUD.ACTION_READ,
            purposeOfUseConceptId:
              PURPOSE_OF_USE[dto.purposeOfUse ?? 'VERIFICATION'],
            outcomeConceptId: outcome,
          });
          rowId = row.id;
          break;
        }
        case 'PHARMACY':
        default: {
          this.require(dto.pharmacyId, 'pharmacyId');
          const row = this.tpaRepo.recordPharmacy(tx, {
            pharmacyId: dto.pharmacyId!,
            actorUserId: actor.id,
            actionConceptId: AUD.ACTION_READ,
            targetId: dto.resourceId,
            purposeOfUseConceptId: purpose,
            outcomeConceptId: outcome,
            correlationId: dto.correlationId,
          });
          rowId = row.id;
          break;
        }
      }

      const audit = await this.auditLogRepo.append(tx, {
        userId: actor.id,
        action: 'THIRD_PARTY_ACCESS',
        entity: dto.channel,
        entityId: rowId,
        outcomeConceptId: outcome,
        recordedByUserId: actor.id,
      });

      return { id: rowId, channel: dto.channel, auditLogId: audit.id };
    });
  }

  /**
   * Ejecuta la operación require.
   *
   * @param value - Valor de value requerido por la operación.
   * @param field - Valor de field requerido por la operación.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private require(value: string | undefined, field: string): void {
    if (!value) {
      throw new PreconditionFailedException(
        `Falta el campo requerido para el canal: ${field}`,
        {
          field,
        },
      );
    }
  }
}
