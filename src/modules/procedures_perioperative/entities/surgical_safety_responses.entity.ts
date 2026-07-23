import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'surgical_safety_responses',
})
export class SurgicalSafetyResponses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'surgical_safety_checklist_id', type: 'uuid' }) // FK → procedures_perioperative.surgical_safety_checklists
  surgicalSafetyChecklistId!: string;

  @Property({ fieldName: 'surgical_safety_item_id', type: 'uuid' }) // FK → procedures_perioperative.surgical_safety_items
  surgicalSafetyItemId!: string;

  @Property({ fieldName: 'response_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  responseStatusConceptId!: string;

  @Property({ fieldName: 'response_boolean', type: 'boolean', nullable: true })
  responseBoolean?: boolean;

  @Property({ fieldName: 'response_text', columnType: 'text', nullable: true })
  responseText?: string;

  @Property({ fieldName: 'response_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  responseConceptId?: string;

  @Property({
    fieldName: 'responded_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  respondedByProfileId?: string;

  @Property({ fieldName: 'responded_at', columnType: 'timestamptz' })
  respondedAt!: Date;

  @Property({
    fieldName: 'exception_reason',
    columnType: 'text',
    nullable: true,
  })
  exceptionReason?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
