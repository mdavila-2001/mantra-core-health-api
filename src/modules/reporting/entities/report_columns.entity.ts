import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'reporting', tableName: 'report_columns' })
export class ReportColumns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'report_definition_id', type: 'uuid' }) // FK → reporting.report_definitions
  reportDefinitionId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  label!: string;

  @Property({ columnType: 'text', nullable: true })
  expression?: string;

  @Property({
    fieldName: 'data_type',
    columnType: 'terminology.technical_data_type',
    nullable: true,
  })
  dataType?: string;

  @Property({
    fieldName: 'aggregation_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  aggregationConceptId?: string;

  @Property({ fieldName: 'format_mask', columnType: 'varchar', nullable: true })
  formatMask?: string;

  @Property({ fieldName: 'is_visible', type: 'boolean', nullable: true })
  isVisible?: boolean;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
