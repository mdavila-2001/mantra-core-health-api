import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ClinicalAlerts } from '../entities';
import { createdBy } from '../../../common';

/** Datos para levantar una alerta clínica. */
export interface CreateClinicalAlertData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a alert type concept.
   */
  alertTypeConceptId: string;
  /**
   * Identificador asociado a severity concept.
   */
  severityConceptId: string;
  /**
   * Valor de source resource type mantenido por la instancia.
   */
  sourceResourceType?: string;
  /**
   * Identificador asociado a source resource.
   */
  sourceResourceId?: string;
  /**
   * Identificador asociado a trigger concept.
   */
  triggerConceptId?: string;
  /**
   * Identificador asociado a rule.
   */
  ruleId?: string;
  /**
   * Valor de detail text mantenido por la instancia.
   */
  detailText?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de detected at mantenido por la instancia.
   */
  detectedAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.clinical_alerts`. */
@Injectable()
export class ClinicalAlertsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ClinicalAlerts | null>`.
   */
  findById(em: EntityManager, id: string): Promise<ClinicalAlerts | null> {
    return em.findOne(ClinicalAlerts, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ClinicalAlerts`.
   */
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
