import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MedicationRequests } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create medication request data.
 */
export interface CreateMedicationRequestData {
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
   * Identificador asociado a medication concept.
   */
  medicationConceptId: string;
  /**
   * Identificador asociado a substance atc concept.
   */
  substanceAtcConceptId?: string;
  /**
   * Identificador asociado a intent concept.
   */
  intentConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a prescriber profile.
   */
  prescriberProfileId?: string;
  /**
   * Valor de dose text mantenido por la instancia.
   */
  doseText?: string;
  /**
   * Identificador asociado a route concept.
   */
  routeConceptId?: string;
  /**
   * Valor de frequency text mantenido por la instancia.
   */
  frequencyText?: string;
  /**
   * Valor de quantity decimal mantenido por la instancia.
   */
  quantityDecimal?: string;
  /**
   * Identificador asociado a unit concept.
   */
  unitConceptId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Valor de issued at mantenido por la instancia.
   */
  issuedAt?: Date;
  /**
   * Valor de status reason text mantenido por la instancia.
   */
  statusReasonText?: string;
  /**
   * Identificador asociado a replaces request.
   */
  replacesRequestId?: string;
  /**
   * Identificador asociado a replaced by request.
   */
  replacedByRequestId?: string;
  /**
   * Identificador asociado a renewed from request.
   */
  renewedFromRequestId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical.medication_requests` (stateless). */
@Injectable()
export class MedicationRequestsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<MedicationRequests | null>`.
   */
  findById(em: EntityManager, id: string): Promise<MedicationRequests | null> {
    return em.findOne(MedicationRequests, { id });
  }

  /**
   * Busca una receta por su clave de idempotencia de emisión. `issue_idempotency_key`
   * tiene un índice UNIQUE global (parcial, `WHERE ... IS NOT NULL`); esto permite
   * detectar en el propio servicio la reutilización de una clave sobre una receta
   * *distinta* antes de intentar el `flush` y devolver un 409 claro en vez de dejar
   * que la violación de restricción llegue cruda a la capa de persistencia.
   */
  findByIssueIdempotencyKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<MedicationRequests | null> {
    return em.findOne(MedicationRequests, {
      issueIdempotencyKey: idempotencyKey,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `MedicationRequests`.
   */
  create(
    em: EntityManager,
    data: CreateMedicationRequestData,
  ): MedicationRequests {
    return em.create(
      MedicationRequests,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        medicationConceptId: data.medicationConceptId,
        substanceAtcConceptId: data.substanceAtcConceptId,
        intentConceptId: data.intentConceptId,
        statusConceptId: data.statusConceptId,
        prescriberProfileId: data.prescriberProfileId,
        doseText: data.doseText,
        routeConceptId: data.routeConceptId,
        frequencyText: data.frequencyText,
        quantityDecimal: data.quantityDecimal,
        unitConceptId: data.unitConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        issuedAt: data.issuedAt,
        statusReasonText: data.statusReasonText,
        replacesRequestId: data.replacesRequestId,
        replacedByRequestId: data.replacedByRequestId,
        renewedFromRequestId: data.renewedFromRequestId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
