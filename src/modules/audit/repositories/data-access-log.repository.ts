import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DataAccessLog, PatientContentAccessLog } from '../entities';

/** Registro de acceso/lectura clínica (accounting WORM, UC-10-01). */
export interface RecordDataAccessData {
  userId: string;
  actionConceptId: string;
  patientProfileId?: string;
  tenantId?: string;
  purpose?: string;
  legalBasisConceptId?: string;
  resourceType?: string;
  resourceId?: string;
  recordedByUserId?: string;
}

/** Registro de acceso a contenido del paciente (detalle por recurso, UC-10-01). */
export interface RecordPatientContentAccessData {
  patientProfileId: string;
  resourceTypeConceptId: string;
  resourceId: string;
  actionConceptId: string;
  purposeOfUseConceptId: string;
  resourceVersionId?: string;
  decisionConceptId?: string;
  policyVersion?: string;
  requestId?: string;
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
}
