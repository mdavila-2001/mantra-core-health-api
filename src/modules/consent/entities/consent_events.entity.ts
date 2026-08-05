import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `consent_events`.
 */
@Entity({ schema: 'consent', tableName: 'consent_events' })
export class ConsentEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a subject type concept.
   */
  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a subject.
   */
  @Property({ fieldName: 'subject_id', type: 'uuid' })
  subjectId!: string;

  /**
   * Identificador asociado a event type concept.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  /**
   * Identificador asociado a previous status concept.
   */
  @Property({ fieldName: 'previous_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  previousStatusConceptId!: string;

  /**
   * Identificador asociado a new status concept.
   */
  @Property({ fieldName: 'new_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  newStatusConceptId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  /**
   * Identificador asociado a correlation.
   */
  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
