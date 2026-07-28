import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConsentEvents } from '../entities';

/** Datos de un evento append-only del ciclo de vida de una directiva. */
export interface RecordEventData {
  /**
   * Identificador asociado a subject type concept.
   */
  subjectTypeConceptId: string;
  /**
   * Identificador asociado a subject.
   */
  subjectId: string;
  /**
   * Identificador asociado a event type concept.
   */
  eventTypeConceptId: string;
  /**
   * Identificador asociado a previous status concept.
   */
  previousStatusConceptId: string;
  /**
   * Identificador asociado a new status concept.
   */
  newStatusConceptId: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId?: string;
  /**
   * Identificador asociado a correlation.
   */
  correlationId?: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Acceso a datos de `consent.consent_events` (bitácora append-only del
 * `consent_machine`). No hay `row_version`; solo se insertan filas.
 */
@Injectable()
export class ConsentEventsRepository {
  /**
   * Ejecuta la operación record.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de record conforme al contrato `ConsentEvents`.
   */
  record(em: EntityManager, data: RecordEventData): ConsentEvents {
    return em.create(
      ConsentEvents,
      {
        subjectTypeConceptId: data.subjectTypeConceptId,
        subjectId: data.subjectId,
        eventTypeConceptId: data.eventTypeConceptId,
        previousStatusConceptId: data.previousStatusConceptId,
        newStatusConceptId: data.newStatusConceptId,
        reasonConceptId: data.reasonConceptId,
        correlationId: data.correlationId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }
}
