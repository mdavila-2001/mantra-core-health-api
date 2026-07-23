import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'surgical_safety_items',
})
export class SurgicalSafetyItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'checklist_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  checklistTypeConceptId!: string;

  @Property({ fieldName: 'checklist_version', columnType: 'varchar' })
  checklistVersion!: string;

  @Property({ fieldName: 'phase_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  phaseConceptId!: string;

  @Property({ fieldName: 'item_code', columnType: 'varchar' })
  itemCode!: string;

  @Property({ fieldName: 'prompt_text', columnType: 'text' })
  promptText!: string;

  @Property({ fieldName: 'response_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  responseTypeConceptId!: string;

  @Property({ fieldName: 'display_order', columnType: 'int' })
  displayOrder!: number;

  @Property({ fieldName: 'is_mandatory', type: 'boolean' })
  isMandatory!: boolean;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
