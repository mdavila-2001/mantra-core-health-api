import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical_ext', tableName: 'reference_ranges' })
export class ReferenceRanges {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  codeConceptId!: string;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  @Property({ fieldName: 'sex_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sexConceptId?: string;

  @Property({ fieldName: 'age_min_days', columnType: 'int', nullable: true })
  ageMinDays?: number;

  @Property({ fieldName: 'age_max_days', columnType: 'int', nullable: true })
  ageMaxDays?: number;

  @Property({ fieldName: 'condition_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  conditionConceptId?: string;

  @Property({ fieldName: 'low_value', columnType: 'numeric', nullable: true })
  lowValue?: string;

  @Property({ fieldName: 'high_value', columnType: 'numeric', nullable: true })
  highValue?: string;

  @Property({
    fieldName: 'critical_low',
    columnType: 'numeric',
    nullable: true,
  })
  criticalLow?: string;

  @Property({
    fieldName: 'critical_high',
    columnType: 'numeric',
    nullable: true,
  })
  criticalHigh?: string;

  @Property({
    fieldName: 'interpretation_text',
    columnType: 'text',
    nullable: true,
  })
  interpretationText?: string;

  @Property({ columnType: 'varchar', nullable: true })
  source?: string;

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
