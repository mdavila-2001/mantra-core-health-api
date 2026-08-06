import { Injectable } from '@nestjs/common';
import type { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import {
  AllergyIntolerances,
  Conditions,
  MedicationRequests,
} from '../entities';

/**
 * Lecturas del resumen clínico: problemas, alergias y medicación de un paciente.
 *
 * El módulo `clinical` sólo exponía escritura y una lectura de políticas de
 * firma; nada que permitiera *mostrar* el archivo clínico.
 */
@Injectable()
export class ClinicalSummaryRepository {
  /**
   * Problemas del paciente, del más reciente al más antiguo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Identificador del paciente.
   * @param activeStatusConceptId - Estado clínico a filtrar, si sólo se quiere lo vigente.
   * @param limit - Tope de resultados.
   * @returns Resultado conforme al contrato `Promise<Conditions[]>`.
   */
  findConditions(
    em: EntityManager,
    patientProfileId: string,
    activeStatusConceptId: string | undefined,
    limit: number,
  ): Promise<Conditions[]> {
    const where: FilterQuery<Conditions> = { patientProfileId };
    if (activeStatusConceptId) {
      where.clinicalStatusConceptId = activeStatusConceptId;
    }
    return em.find(Conditions, where, {
      orderBy: { createdAt: 'desc' },
      limit: limit + 1,
    });
  }

  /**
   * Alergias del paciente, de la más reciente a la más antigua.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Identificador del paciente.
   * @param activeStatusConceptId - Estado clínico a filtrar, si sólo se quiere lo vigente.
   * @param limit - Tope de resultados.
   * @returns Resultado conforme al contrato `Promise<AllergyIntolerances[]>`.
   */
  findAllergies(
    em: EntityManager,
    patientProfileId: string,
    activeStatusConceptId: string | undefined,
    limit: number,
  ): Promise<AllergyIntolerances[]> {
    const where: FilterQuery<AllergyIntolerances> = { patientProfileId };
    if (activeStatusConceptId) {
      where.clinicalStatusConceptId = activeStatusConceptId;
    }
    return em.find(AllergyIntolerances, where, {
      orderBy: { createdAt: 'desc' },
      limit: limit + 1,
    });
  }

  /**
   * Prescripciones del paciente, de la más reciente a la más antigua.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Identificador del paciente.
   * @param activeStatusConceptId - Estado a filtrar, si sólo se quiere lo vigente.
   * @param limit - Tope de resultados.
   * @returns Resultado conforme al contrato `Promise<MedicationRequests[]>`.
   */
  findMedications(
    em: EntityManager,
    patientProfileId: string,
    activeStatusConceptId: string | undefined,
    limit: number,
  ): Promise<MedicationRequests[]> {
    const where: FilterQuery<MedicationRequests> = { patientProfileId };
    if (activeStatusConceptId) {
      where.statusConceptId = activeStatusConceptId;
    }
    return em.find(MedicationRequests, where, {
      orderBy: { createdAt: 'desc' },
      limit: limit + 1,
    });
  }
}
