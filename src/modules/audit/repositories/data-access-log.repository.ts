import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DataAccessLog, PatientContentAccessLog } from '../entities';

/** Registro de acceso/lectura clínica (accounting WORM, UC-10-01). */
export interface RecordDataAccessData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de purpose mantenido por la instancia.
   */
  purpose?: string;
  /**
   * Identificador asociado a legal basis concept.
   */
  legalBasisConceptId?: string;
  /**
   * Valor de resource type mantenido por la instancia.
   */
  resourceType?: string;
  /**
   * Identificador asociado a resource.
   */
  resourceId?: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/** Registro de acceso a contenido del paciente (detalle por recurso, UC-10-01). */
export interface RecordPatientContentAccessData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a resource type concept.
   */
  resourceTypeConceptId: string;
  /**
   * Identificador asociado a resource.
   */
  resourceId: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a purpose of use concept.
   */
  purposeOfUseConceptId: string;
  /**
   * Identificador asociado a resource version.
   */
  resourceVersionId?: string;
  /**
   * Identificador asociado a decision concept.
   */
  decisionConceptId?: string;
  /**
   * Valor de policy version mantenido por la instancia.
   */
  policyVersion?: string;
  /**
   * Identificador asociado a request.
   */
  requestId?: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Acceso a `audit.data_access_log` y `audit.patient_content_access_log` — tablas
 * WORM (append-only, solo `recorded_at`/`recorded_by_user_id`). Stateless: el `em`
 * activo llega como primer parámetro para participar en la tx del acceso.
 */
@Injectable()
export class DataAccessLogRepository {
  /** Encola una fila de contabilidad de acceso; sin flush. */
  record(em: EntityManager, data: RecordDataAccessData): DataAccessLog {
    return em.create(
      DataAccessLog,
      {
        userId: data.userId,
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        purpose: data.purpose,
        legalBasisConceptId: data.legalBasisConceptId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        actionConceptId: data.actionConceptId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId ?? data.userId,
      },
      { partial: true },
    );
  }

  /** Encola el detalle de acceso a contenido del paciente; sin flush. */
  recordPatientContent(
    em: EntityManager,
    data: RecordPatientContentAccessData,
  ): PatientContentAccessLog {
    return em.create(
      PatientContentAccessLog,
      {
        patientProfileId: data.patientProfileId,
        resourceTypeConceptId: data.resourceTypeConceptId,
        resourceId: data.resourceId,
        resourceVersionId: data.resourceVersionId,
        actionConceptId: data.actionConceptId,
        purposeOfUseConceptId: data.purposeOfUseConceptId,
        decisionConceptId: data.decisionConceptId,
        policyVersion: data.policyVersion,
        requestId: data.requestId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /** Cuenta accesos de un usuario desde una fecha (heurística de anomalías, UC-10-10). */
  countByUserSince(
    em: EntityManager,
    userId: string,
    since: Date,
  ): Promise<number> {
    return em.count(DataAccessLog, { userId, recordedAt: { $gte: since } });
  }

  /**
   * Purga de retención (UC-10-09): borra los accesos con `recorded_at` ANTERIOR
   * al corte (nunca los de dentro de la ventana) y devuelve el nº REAL de filas
   * afectadas. Se acota por tenant cuando se indica, para no cruzar particiones.
   * `nativeDelete` ejecuta el DELETE dentro de la tx activa y reporta el conteo
   * exacto que hizo la base.
   */
  purgeOlderThan(
    em: EntityManager,
    olderThan: Date,
    tenantId?: string,
  ): Promise<number> {
    const where: Record<string, unknown> = { recordedAt: { $lt: olderThan } };
    if (tenantId) where.tenantId = tenantId;
    return em.nativeDelete(DataAccessLog, where);
  }
}
