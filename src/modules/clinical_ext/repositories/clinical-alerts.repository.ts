import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ClinicalAlerts } from '../entities';
import { createdBy } from '../../../common';

/** Datos para levantar una alerta clínica. */
export interface CreateClinicalAlertData {
  patientProfileId: string;
  encounterId?: string;
  alertTypeConceptId: string;
  severityConceptId: string;
  sourceResourceType?: string;
  sourceResourceId?: string;
  triggerConceptId?: string;
  ruleId?: string;
  detailText?: string;
  statusConceptId: string;
  detectedAt: Date;
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.clinical_alerts`. */
@Injectable()
export class ClinicalAlertsRepository {
  findById(em: EntityManager, id: string): Promise<ClinicalAlerts | null> {
    return em.findOne(ClinicalAlerts, { id });
  }

  create(em: EntityManager, data: CreateClinicalAlertData): ClinicalAlerts {
    return em.create(
      ClinicalAlerts,
      {
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        alertTypeConceptId: data.alertTypeConceptId,
        severityConceptId: data.severityConceptId,
        sourceResourceType: data.sourceResourceType,
        sourceResourceId: data.sourceResourceId,
        triggerConceptId: data.triggerConceptId,
        ruleId: data.ruleId,
        detailText: data.detailText,
        statusConceptId: data.statusConceptId,
        detectedAt: data.detectedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
