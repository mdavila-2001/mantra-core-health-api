import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MedicationRequests } from '../entities';
import { createdBy } from '../../../common';
import type { MedicationTimingColumns } from '../services/medication-timing.mapper';

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
   * Valor de patient instructions text mantenido por la instancia.
   */
  patientInstructionsText?: string;
  /**
   * Condición que motiva la prescripción (Patch v4.1.6).
   */
  indicationConditionId?: string;
  /**
   * Motivo escrito a mano cuando no hay condición codificada (P24).
   */
  indicationText?: string;
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
   * Posología estructurada (patch v4.2.35), ya traducida a columnas.
   */
  timing?: MedicationTimingColumns;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical.medication_requests` (stateless). */
@Injectable()
export class MedicationRequestsRepository {
  /**
   * Prescripciones del paciente, de la más reciente a la más antigua.
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
  ): Promise<MedicationRequests[]> {
    return em.find(
      MedicationRequests,
      { patientProfileId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

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
   * Prescripciones de un encuentro (para el sello y el PDF oficial del
   * cierre: el hash tiene que ser determinista).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param encounterId - Encuentro cuyas prescripciones se leen.
   * @returns Filas ordenadas por `createdAt, id`.
   */
  findByEncounter(
    em: EntityManager,
    encounterId: string,
  ): Promise<MedicationRequests[]> {
    return em.find(
      MedicationRequests,
      { encounterId },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    );
  }

  /**
   * Recetas vigentes con posología programable, para el despacho de
   * recordatorios (patch v4.2.35).
   *
   * Sólo las que están en efecto (`ISSUED`/`ACTIVE`), no PRN, con frecuencia u
   * horas del día, cuyo ancla ya empezó antes del fin de la ventana y cuya
   * vigencia no terminó. El filtro fino (duración, tomas exactas) lo hace el
   * generador de cronograma: acá sólo se acota el lote. Usa el índice parcial
   * `ix_medication_requests_schedulable`.
   *
   * @param em - Contexto de persistencia.
   * @param criteria - Estados en efecto, instante actual, fin de ventana y tope.
   * @returns Recetas candidatas, de la más antigua a la más reciente.
   */
  findSchedulable(
    em: EntityManager,
    criteria: {
      /** Estados que cuentan como «en efecto». */
      statusConceptIds: string[];
      /** Instante de la pasada. */
      now: Date;
      /** Fin de la ventana de despacho. */
      windowEnd: Date;
      /** Tope de filas. */
      limit: number;
    },
  ): Promise<MedicationRequests[]> {
    return em.find(
      MedicationRequests,
      {
        statusConceptId: { $in: criteria.statusConceptIds },
        timingAsNeeded: false,
        $and: [
          {
            $or: [
              { timingFrequency: { $ne: null } },
              { timingTimesOfDay: { $ne: null } },
            ],
          },
          {
            $or: [
              { timingStartAt: { $lt: criteria.windowEnd } },
              { timingStartAt: null },
            ],
          },
          { $or: [{ validTo: null }, { validTo: { $gte: criteria.now } }] },
        ],
      },
      { orderBy: { createdAt: 'ASC', id: 'ASC' }, limit: criteria.limit },
    );
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
        patientInstructionsText: data.patientInstructionsText,
        indicationConditionId: data.indicationConditionId,
        indicationText: data.indicationText,
        issuedAt: data.issuedAt,
        statusReasonText: data.statusReasonText,
        replacesRequestId: data.replacesRequestId,
        replacedByRequestId: data.replacedByRequestId,
        renewedFromRequestId: data.renewedFromRequestId,
        ...(data.timing ?? {}),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
