import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { MedicationRecordsRepository, MedicationRequestsRepository } from '../repositories';
import {
  CreateMedicationRecordDto,
  CreateMedicationRequestDto,
  MedicationRecordResponseDto,
  MedicationRequestResponseDto,
} from '../dto';
import { CLIN } from '../clinical.concepts';

/**
 * UC-08-10 (prescribir) y UC-08-11 (administrar/registrar) de medicación. La
 * administración puede cerrar la prescripción (dosis final). `medication_records`
 * no es el ledger de inventario de farmacia.
 */
@Injectable()
export class MedicationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly requestsRepo: MedicationRequestsRepository,
    private readonly recordsRepo: MedicationRecordsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MedicationsService.name);
  }

  /** UC-08-10: prescribe una medicación (orden activa). */
  async prescribe(
    dto: CreateMedicationRequestDto,
    actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    this.logger.info(
      { operation: 'clinical.medication.prescribe', patientProfileId: dto.patientProfileId },
      'Prescribing medication',
    );
    return this.em.transactional(async (tx) => {
      const request = this.requestsRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        medicationConceptId: dto.medicationConceptId,
        substanceAtcConceptId: dto.substanceAtcConceptId,
        intentConceptId: CLIN.MEDICATION_INTENT_ORDER,
        statusConceptId: CLIN.MEDICATION_REQUEST_ACTIVE,
        prescriberProfileId: dto.prescriberProfileId,
        doseText: dto.doseText,
        routeConceptId: dto.routeConceptId,
        frequencyText: dto.frequencyText,
        quantityDecimal: dto.quantityDecimal !== undefined ? String(dto.quantityDecimal) : undefined,
        unitConceptId: dto.unitConceptId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.medication.prescribe', requestId: request.id },
        'Medication prescribed',
      );
      return {
        id: request.id,
        patientProfileId: request.patientProfileId,
        status: request.statusConceptId,
        createdAt: request.createdAt,
      };
    });
  }

  /** UC-08-11: registra la administración de una medicación. */
  async administer(
    dto: CreateMedicationRecordDto,
    actor: AuthenticatedUser,
  ): Promise<MedicationRecordResponseDto> {
    this.logger.info(
      { operation: 'clinical.medication.administer', patientProfileId: dto.patientProfileId },
      'Recording medication administration',
    );
    return this.em.transactional(async (tx) => {
      if (dto.requestId) {
        const request = await this.requestsRepo.findById(tx, dto.requestId);
        if (!request) {
          throw new ResourceNotFoundException('Prescripción no encontrada', {
            requestId: dto.requestId,
          });
        }
        if (request.statusConceptId !== CLIN.MEDICATION_REQUEST_ACTIVE) {
          throw new PreconditionFailedException('La prescripción no está activa', {
            requestId: dto.requestId,
            status: request.statusConceptId,
          });
        }
        if (dto.isFinalDose) {
          request.statusConceptId = CLIN.MEDICATION_REQUEST_COMPLETED;
          touch(request, actor.id);
        }
      }

      const record = this.recordsRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        requestId: dto.requestId,
        medicationConceptId: dto.medicationConceptId,
        statusConceptId: CLIN.MEDICATION_RECORD_COMPLETED,
        recordTypeConceptId: CLIN.MEDICATION_RECORD_TYPE_ADMINISTRATION,
        doseDecimal: dto.doseDecimal !== undefined ? String(dto.doseDecimal) : undefined,
        unitConceptId: dto.unitConceptId,
        administeredAt: dto.administeredAt ? new Date(dto.administeredAt) : new Date(),
        recordedByUserId: actor.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.medication.administer', recordId: record.id },
        'Medication administration recorded',
      );
      return {
        id: record.id,
        patientProfileId: record.patientProfileId,
        status: record.statusConceptId,
        requestId: record.requestId ?? null,
        createdAt: record.createdAt,
      };
    });
  }
}
