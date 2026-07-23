import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'operating_room_utilization_events',
})
export class OperatingRoomUtilizationEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'operating_room_id', type: 'uuid' }) // FK (destino no resuelto)
  operatingRoomId!: string;

  @Property({ fieldName: 'procedure_case_id', type: 'uuid', nullable: true }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId?: string;

  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'duration_seconds', type: 'bigint', nullable: true })
  durationSeconds?: string;

  @Property({
    fieldName: 'delay_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  delayReasonConceptId?: string;

  @Property({
    fieldName: 'turnover_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  turnoverCategoryConceptId?: string;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;

  @Property({
    fieldName: 'details_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  detailsJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
