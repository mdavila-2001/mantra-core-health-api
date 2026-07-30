import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticReports } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create diagnostic report data.
 */
export interface CreateDiagnosticReportData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a service request.
   */
  serviceRequestId?: string;
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
   * Identificador asociado a lifecycle status concept.
   */
  lifecycleStatusConceptId: string;
  /**
   * Identificador asociado a result release status concept.
   */
  resultReleaseStatusConceptId?: string;
  /**
   * Identificador asociado a current version.
   */
  currentVersionId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical.diagnostic_reports` (stateless). */
@Injectable()
export class DiagnosticReportsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DiagnosticReports | null>`.
   */
  findById(em: EntityManager, id: string): Promise<DiagnosticReports | null> {
    return em.findOne(DiagnosticReports, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DiagnosticReports`.
   */
  create(
    em: EntityManager,
    data: CreateDiagnosticReportData,
  ): DiagnosticReports {
    return em.create(
      DiagnosticReports,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        serviceRequestId: data.serviceRequestId,
        encounterId: data.encounterId,
        codeConceptId: data.codeConceptId,
        categoryConceptId: data.categoryConceptId,
        lifecycleStatusConceptId: data.lifecycleStatusConceptId,
        resultReleaseStatusConceptId: data.resultReleaseStatusConceptId,
        currentVersionId: data.currentVersionId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
