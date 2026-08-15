import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  AllergyIntolerancesRepository,
  CareEpisodesRepository,
  ConditionsRepository,
  EncountersRepository,
  MedicationRequestsRepository,
  ObservationsRepository,
} from '../repositories';
import type { PatientClinicalSummaryResponseDto } from '../dto';

/**
 * Cara de lectura del registro clínico (UC-39-20).
 *
 * El módulo `clinical` era íntegramente de escritura: doce endpoints para
 * registrar condiciones, alergias, medicación, procedimientos, inmunizaciones y
 * observaciones, y ninguno para volver a leerlos. Una historia clínica que sólo
 * se puede escribir no es una historia clínica.
 *
 * Devuelve los cinco bloques juntos porque es una sola pantalla —la cabecera
 * clínica del paciente— y porque las alergias, en particular, no deben depender
 * de que el cliente se acuerde de pedirlas en una llamada aparte.
 */
@Injectable()
export class ClinicalReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param conditionsRepo - Acceso a condiciones.
   * @param allergiesRepo - Acceso a alergias e intolerancias.
   * @param medicationRequestsRepo - Acceso a prescripciones.
   * @param observationsRepo - Acceso a observaciones.
   * @param encountersRepo - Acceso a encuentros.
   * @param episodesRepo - Acceso a episodios de cuidado (internaciones).
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly conditionsRepo: ConditionsRepository,
    private readonly allergiesRepo: AllergyIntolerancesRepository,
    private readonly medicationRequestsRepo: MedicationRequestsRepository,
    private readonly observationsRepo: ObservationsRepository,
    private readonly encountersRepo: EncountersRepository,
    private readonly episodesRepo: CareEpisodesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ClinicalReadService.name);
  }

  /**
   * UC-39-20: historial clínico del paciente.
   *
   * @param patientProfileId - Paciente cuyo historial se lee.
   * @param limit - Tope por bloque.
   * @returns Condiciones, alergias, medicación, observaciones, encuentros y
   *          episodios de cuidado.
   */
  async getPatientSummary(
    patientProfileId: string,
    limit: number,
  ): Promise<PatientClinicalSummaryResponseDto> {
    this.logger.info(
      { operation: 'clinical.patient.read', patientProfileId, limit },
      'Leyendo historial clínico del paciente',
    );

    const em = this.em.fork();
    const over = limit + 1;

    const [
      conditions,
      allergies,
      medicationRequests,
      observations,
      encounters,
      careEpisodes,
    ] = await Promise.all([
      this.conditionsRepo.findByPatient(em, patientProfileId, over),
      this.allergiesRepo.findByPatient(em, patientProfileId, over),
      this.medicationRequestsRepo.findByPatient(em, patientProfileId, over),
      this.observationsRepo.findByPatient(em, patientProfileId, over),
      this.encountersRepo.findByPatient(em, patientProfileId, over),
      this.episodesRepo.findByPatient(em, patientProfileId, over),
    ]);

    const truncated: string[] = [];

    return {
      patientProfileId,
      conditions: this.cut(conditions, limit, 'conditions', truncated).map(
        (row) => ({
          id: row.id,
          codeConceptId: row.codeConceptId,
          categoryConceptId: row.categoryConceptId,
          clinicalStatusConceptId: row.clinicalStatusConceptId,
          verificationStatusConceptId: row.verificationStatusConceptId,
          severityConceptId: row.severityConceptId,
          encounterId: row.encounterId,
          onsetAt: row.onsetAt,
          resolvedAt: row.resolvedAt,
          createdAt: row.createdAt,
        }),
      ),
      allergies: this.cut(allergies, limit, 'allergies', truncated).map(
        (row) => ({
          id: row.id,
          substanceConceptId: row.substanceConceptId,
          typeConceptId: row.typeConceptId,
          categoryConceptId: row.categoryConceptId,
          criticalityConceptId: row.criticalityConceptId,
          clinicalStatusConceptId: row.clinicalStatusConceptId,
          createdAt: row.createdAt,
        }),
      ),
      medicationRequests: this.cut(
        medicationRequests,
        limit,
        'medicationRequests',
        truncated,
      ).map((row) => ({
        id: row.id,
        medicationConceptId: row.medicationConceptId,
        statusConceptId: row.statusConceptId,
        prescriberProfileId: row.prescriberProfileId,
        doseText: row.doseText,
        frequencyText: row.frequencyText,
        validFrom: row.validFrom,
        validTo: row.validTo,
        signedAt: row.signedAt,
        issuedAt: row.issuedAt,
        createdAt: row.createdAt,
      })),
      observations: this.cut(
        observations,
        limit,
        'observations',
        truncated,
      ).map((row) => ({
        id: row.id,
        codeConceptId: row.codeConceptId,
        statusConceptId: row.statusConceptId,
        interpretationConceptId: row.interpretationConceptId,
        valueDecimal: row.valueDecimal,
        valueText: row.valueText,
        valueBoolean: row.valueBoolean,
        valueConceptId: row.valueConceptId,
        quantityValue: row.quantityValue,
        quantityUnitConceptId: row.quantityUnitConceptId,
        effectiveStartAt: row.effectiveStartAt,
        encounterId: row.encounterId,
      })),
      encounters: this.cut(encounters, limit, 'encounters', truncated).map(
        (row) => ({
          id: row.id,
          episodeId: row.episodeId,
          statusConceptId: row.statusConceptId,
          classConceptId: row.classConceptId,
          primaryPractitionerId: row.primaryPractitionerId,
          reasonText: row.reasonText,
          startAt: row.startAt,
          endAt: row.endAt,
        }),
      ),
      careEpisodes: this.cut(
        careEpisodes,
        limit,
        'careEpisodes',
        truncated,
      ).map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        typeConceptId: row.typeConceptId,
        statusConceptId: row.statusConceptId,
        responsiblePractitionerId: row.responsiblePractitionerId,
        startAt: row.startAt,
        endAt: row.endAt,
        createdAt: row.createdAt,
      })),
      limit,
      truncated,
    };
  }

  /**
   * Recorta el bloque al tope y anota su nombre si sobraba.
   *
   * @param rows - Filas leídas, con una de más.
   * @param limit - Tope del bloque.
   * @param name - Nombre del bloque en la respuesta.
   * @param truncated - Acumulador de bloques recortados.
   * @returns Las filas del bloque, ya recortadas.
   */
  private cut<T>(
    rows: T[],
    limit: number,
    name: string,
    truncated: string[],
  ): T[] {
    if (rows.length > limit) {
      truncated.push(name);
      return rows.slice(0, limit);
    }
    return rows;
  }
}
