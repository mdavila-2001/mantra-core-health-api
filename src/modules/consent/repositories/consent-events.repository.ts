import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConsentEvents } from '../entities';

/** Datos de un evento append-only del ciclo de vida de una directiva. */
export interface RecordEventData {
  subjectTypeConceptId: string;
  subjectId: string;
  eventTypeConceptId: string;
  previousStatusConceptId: string;
  newStatusConceptId: string;
  reasonConceptId?: string;
  correlationId?: string;
  recordedByUserId?: string;
}

/**
 * Acceso a datos de `consent.consent_events` (bitácora append-only del
 * `consent_machine`). No hay `row_version`; solo se insertan filas.
 */
@Injectable()
export class ConsentEventsRepository {
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
