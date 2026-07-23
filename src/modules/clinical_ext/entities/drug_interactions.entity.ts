import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical_ext', tableName: 'drug_interactions' })
export class DrugInteractions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'substance_a_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  substanceAConceptId!: string;

  @Property({ fieldName: 'substance_b_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  substanceBConceptId!: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  @Property({ fieldName: 'mechanism_text', columnType: 'text', nullable: true })
  mechanismText?: string;

  @Property({
    fieldName: 'management_text',
    columnType: 'text',
    nullable: true,
  })
  managementText?: string;

  @Property({
    fieldName: 'evidence_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  evidenceLevelConceptId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  source?: string;

  @Property({
    fieldName: 'source_version',
    columnType: 'varchar',
    nullable: true,
  })
  sourceVersion?: string;

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
