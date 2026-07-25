import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticReports } from '../entities';
import { createdBy } from '../../../common';

export interface CreateDiagnosticReportData {
  custodianTenantId: string;
  patientProfileId: string;
  serviceRequestId?: string;
  encounterId?: string;
  codeConceptId: string;
  categoryConceptId?: string;
  lifecycleStatusConceptId: string;
  resultReleaseStatusConceptId?: string;
  currentVersionId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `clinical.diagnostic_reports` (stateless). */
@Injectable()
export class DiagnosticReportsRepository {
  findById(em: EntityManager, id: string): Promise<DiagnosticReports | null> {
    return em.findOne(DiagnosticReports, { id });
  }

  create(em: EntityManager, data: CreateDiagnosticReportData): DiagnosticReports {
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
