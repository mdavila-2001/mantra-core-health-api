import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `operating_room_utilization_events`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'operating_room_utilization_events',
})
export class OperatingRoomUtilizationEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a operating room.
   */
  @Property({ fieldName: 'operating_room_id', type: 'uuid' }) // FK → practice.care_spaces
  operatingRoomId!: string;

  /**
   * Identificador asociado a procedure case.
   */
  @Property({ fieldName: 'procedure_case_id', type: 'uuid', nullable: true }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId?: string;

  /**
   * Identificador asociado a event type concept.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Valor de duration seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'duration_seconds', type: 'bigint', nullable: true })
  durationSeconds?: string;

  /**
   * Identificador asociado a delay reason concept.
   */
  @Property({
    fieldName: 'delay_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  delayReasonConceptId?: string;

  /**
   * Identificador asociado a turnover category concept.
   */
  @Property({
    fieldName: 'turnover_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  turnoverCategoryConceptId?: string;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;

  /**
   * Valor de details json mantenido por la instancia.
   */
  @Property({
    fieldName: 'details_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  detailsJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
