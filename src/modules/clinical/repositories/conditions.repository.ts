import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Conditions } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create condition data.
 */
export interface CreateConditionData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a code concept.
   */
  codeConceptId: string;
  /**
   * Identificador asociado a category concept.
   */
  categoryConceptId?: string;
  /**
   * Identificador asociado a clinical status concept.
   */
  clinicalStatusConceptId?: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId?: string;
  /**
   * Identificador asociado a severity concept.
   */
  severityConceptId?: string;
  /**
   * Identificador asociado a laterality concept.
   */
  lateralityConceptId?: string;
  /**
   * Identificador asociado a clinical course concept.
   */
  clinicalCourseConceptId?: string;
  /**
   * Valor de onset at mantenido por la instancia.
   */
  onsetAt?: Date;
  /**
   * Valor de expected resolution at mantenido por la instancia.
   */
  expectedResolutionAt?: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical.conditions` (stateless). */
@Injectable()
export class ConditionsRepository {
  /**
   * Condiciones del paciente, de la más reciente a la más antigua.
   *
   * Es parte de la cara de lectura del módulo (UC-39-20): sin ella se podían
   * registrar datos clínicos pero no volver a leerlos, así que ninguna pantalla
   * podía mostrar el historial del paciente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Paciente cuyo historial se lee.
   * @param limit - Tope de filas.
   * @returns Filas del paciente, ordenadas de la más reciente a la más antigua.
   */
  findByPatient(
    em: EntityManager,
    patientProfileId: string,
    limit: number,
  ): Promise<Conditions[]> {
    return em.find(
      Conditions,
      { patientProfileId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Conditions | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Conditions | null> {
    return em.findOne(Conditions, { id });
  }

  /** Condición activa del paciente con el mismo código (evita duplicados). */
  findActiveByCode(
    em: EntityManager,
    custodianTenantId: string,
    patientProfileId: string,
    codeConceptId: string,
    activeStatusConceptId: string,
  ): Promise<Conditions | null> {
    return em.findOne(Conditions, {
      custodianTenantId,
      patientProfileId,
      codeConceptId,
      clinicalStatusConceptId: activeStatusConceptId,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Conditions`.
   */
  create(em: EntityManager, data: CreateConditionData): Conditions {
    return em.create(
      Conditions,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        codeConceptId: data.codeConceptId,
        categoryConceptId: data.categoryConceptId,
        clinicalStatusConceptId: data.clinicalStatusConceptId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        severityConceptId: data.severityConceptId,
        lateralityConceptId: data.lateralityConceptId,
        clinicalCourseConceptId: data.clinicalCourseConceptId,
        onsetAt: data.onsetAt,
        expectedResolutionAt: data.expectedResolutionAt,
        recordedByUserId: data.recordedByUserId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
