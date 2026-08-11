import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientMergeEvents } from '../entities';

/**
 * Datos de un evento de fusión IMMUTABLE. La tabla no lleva campos de auditoría
 * estándar (`created_at`/`row_version`): solo `recorded_at` + `recorded_by`, más
 * `approved_by`. No se actualiza nunca; la reversión es un nuevo evento.
 */
export interface CreateMergeEventData {
  /**
   * Identificador asociado a surviving patient profile.
   */
  survivingPatientProfileId: string;
  /**
   * Identificador asociado a merged patient profile.
   */
  mergedPatientProfileId: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId: string;
  /**
   * Identificador asociado a decision status concept.
   */
  decisionStatusConceptId: string;
  /**
   * Identificador asociado a approved by user.
   */
  approvedByUserId?: string;
  /**
   * Identificador asociado a reversal of event.
   */
  reversalOfEventId?: string;
  /**
   * Valor de recorded at mantenido por la instancia.
   */
  recordedAt: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/** Acceso a datos de `profiles.patient_merge_events` (append-only). */
@Injectable()
export class PatientMergeEventsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PatientMergeEvents | null>`.
   */
  findById(em: EntityManager, id: string): Promise<PatientMergeEvents | null> {
    return em.findOne(PatientMergeEvents, { id });
  }

  /** Evento de reversión que ya apunte a un evento dado (impide revertir dos veces). */
  findByReversalOf(
    em: EntityManager,
    eventId: string,
  ): Promise<PatientMergeEvents | null> {
    return em.findOne(PatientMergeEvents, { reversalOfEventId: eventId });
  }

  /**
   * Eventos de fusión, del más reciente al más antiguo.
   *
   * Existe porque sin esta lectura **una fusión dejaba de ser reversible en
   * cuanto se cerraba la pantalla**: `reverse` exige el `eventId`, y ese
   * identificador sólo aparecía en la respuesta del `POST` que lo creó. Quien se
   * diera cuenta del error al día siguiente no tenía camino de vuelta.
   *
   * El filtro por paciente busca en **los dos lados** de la fusión: quien va a
   * revisar un registro sospechoso lo tiene delante, y no sabe —ni tiene por qué
   * saber— si el que mira fue el que sobrevivió o el que quedó absorbido.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filtros - Paciente involucrado, opcional.
   * @param limit - Tope de filas a devolver.
   * @returns Los eventos, del más reciente al más antiguo.
   */
  findEvents(
    em: EntityManager,
    filtros: { patientProfileId?: string },
    limit: number,
  ): Promise<PatientMergeEvents[]> {
    const where =
      filtros.patientProfileId === undefined
        ? {}
        : {
            $or: [
              { survivingPatientProfileId: filtros.patientProfileId },
              { mergedPatientProfileId: filtros.patientProfileId },
            ],
          };

    return em.find(PatientMergeEvents, where, {
      orderBy: { recordedAt: 'DESC' },
      limit,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PatientMergeEvents`.
   */
  create(em: EntityManager, data: CreateMergeEventData): PatientMergeEvents {
    return em.create(
      PatientMergeEvents,
      {
        survivingPatientProfileId: data.survivingPatientProfileId,
        mergedPatientProfileId: data.mergedPatientProfileId,
        reasonConceptId: data.reasonConceptId,
        decisionStatusConceptId: data.decisionStatusConceptId,
        approvedByUserId: data.approvedByUserId,
        reversalOfEventId: data.reversalOfEventId,
        recordedAt: data.recordedAt,
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }
}
