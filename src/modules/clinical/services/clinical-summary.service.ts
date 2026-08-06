import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CLIN } from '../clinical.concepts';
import { ClinicalSummaryRepository } from '../repositories';
import {
  ClinicalSummaryQueryDto,
  ClinicalSummaryResponseDto,
  SUMMARY_MAX_PER_LIST,
} from '../dto';

/** Lectura del resumen clínico del paciente. */
@Injectable()
export class ClinicalSummaryService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param summaryRepo - Repositorio de lectura del resumen.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly summaryRepo: ClinicalSummaryRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ClinicalSummaryService.name);
  }

  /** Problemas, alergias y medicación del paciente. */
  async getSummary(
    patientProfileId: string,
    query: ClinicalSummaryQueryDto,
  ): Promise<ClinicalSummaryResponseDto> {
    const em = this.em.fork();
    const includeInactive = query.includeInactive ?? false;
    const limit = SUMMARY_MAX_PER_LIST;

    const conditions = await this.summaryRepo.findConditions(
      em,
      patientProfileId,
      includeInactive ? undefined : CLIN.CONDITION_ACTIVE,
      limit,
    );
    const allergies = await this.summaryRepo.findAllergies(
      em,
      patientProfileId,
      includeInactive ? undefined : CLIN.ALLERGY_ACTIVE,
      limit,
    );
    const medications = await this.summaryRepo.findMedications(
      em,
      patientProfileId,
      includeInactive ? undefined : CLIN.MEDICATION_REQUEST_ACTIVE,
      limit,
    );

    const truncated =
      conditions.length > limit ||
      allergies.length > limit ||
      medications.length > limit;
    if (truncated) {
      this.logger.warn(
        { operation: 'clinical.summary.read', patientProfileId, limit },
        'Clinical summary hit the per-list cap',
      );
    }

    return {
      patientProfileId,
      conditions: conditions.slice(0, limit).map((condition) => ({
        id: condition.id,
        codeConceptId: condition.codeConceptId,
        categoryConceptId: condition.categoryConceptId ?? null,
        clinicalStatusConceptId: condition.clinicalStatusConceptId ?? null,
        verificationStatusConceptId:
          condition.verificationStatusConceptId ?? null,
        severityConceptId: condition.severityConceptId ?? null,
        onsetAt: condition.onsetAt?.toISOString() ?? null,
        resolvedAt: condition.resolvedAt?.toISOString() ?? null,
        encounterId: condition.encounterId ?? null,
      })),
      allergies: allergies.slice(0, limit).map((allergy) => ({
        id: allergy.id,
        substanceConceptId: allergy.substanceConceptId,
        typeConceptId: allergy.typeConceptId ?? null,
        categoryConceptId: allergy.categoryConceptId ?? null,
        criticalityConceptId: allergy.criticalityConceptId ?? null,
        clinicalStatusConceptId: allergy.clinicalStatusConceptId ?? null,
        verificationStatusConceptId:
          allergy.verificationStatusConceptId ?? null,
      })),
      medications: medications.slice(0, limit).map((medication) => ({
        id: medication.id,
        medicationConceptId: medication.medicationConceptId,
        statusConceptId: medication.statusConceptId,
        prescriberProfileId: medication.prescriberProfileId ?? null,
        doseText: medication.doseText ?? null,
        frequencyText: medication.frequencyText ?? null,
        routeConceptId: medication.routeConceptId ?? null,
        validFrom: medication.validFrom?.toISOString() ?? null,
      })),
      truncated,
    };
  }
}
