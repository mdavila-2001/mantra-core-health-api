import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'data_catalog', tableName: 'catalog_annotations' })
export class CatalogAnnotations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'target_kind', columnType: 'varchar' })
  targetKind!: string;

  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK (destino no resuelto)
  objectId!: string;

  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  columnId?: string;

  @Property({
    fieldName: 'business_name',
    columnType: 'varchar',
    nullable: true,
  })
  businessName?: string;

  @Property({ columnType: 'text', nullable: true })
  definition?: string;

  @Property({ columnType: 'text', nullable: true })
  purpose?: string;

  @Property({
    fieldName: 'existence_rationale',
    columnType: 'text',
    nullable: true,
  })
  existenceRationale?: string;

  @Property({ fieldName: 'row_grain', columnType: 'text', nullable: true })
  rowGrain?: string;

  @Property({
    fieldName: 'alternatives_rationale',
    columnType: 'text',
    nullable: true,
  })
  alternativesRationale?: string;

  @Property({
    fieldName: 'process_supported',
    columnType: 'text',
    nullable: true,
  })
  processSupported?: string;

  @Property({
    fieldName: 'source_of_truth',
    columnType: 'text',
    nullable: true,
  })
  sourceOfTruth?: string;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  producers?: unknown;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  consumers?: unknown;

  @Property({
    fieldName: 'deletion_impact',
    columnType: 'text',
    nullable: true,
  })
  deletionImpact?: string;

  @Property({
    fieldName: 'business_owner',
    columnType: 'varchar',
    nullable: true,
  })
  businessOwner?: string;

  @Property({
    fieldName: 'data_steward',
    columnType: 'varchar',
    nullable: true,
  })
  dataSteward?: string;

  @Property({
    fieldName: 'technical_owner',
    columnType: 'varchar',
    nullable: true,
  })
  technicalOwner?: string;

  @Property({ columnType: 'varchar', nullable: true })
  unit?: string;

  @Property({ fieldName: 'value_domain', columnType: 'text', nullable: true })
  valueDomain?: string;

  @Property({ fieldName: 'null_semantics', columnType: 'text', nullable: true })
  nullSemantics?: string;

  @Property({ columnType: 'varchar' })
  sensitivity!: string;

  @Property({
    fieldName: 'open_questions',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  openQuestions?: unknown;

  @Property({ fieldName: 'review_status', columnType: 'varchar' })
  reviewStatus!: string;

  @Property({ columnType: 'varchar' })
  origin!: string;

  @Property({ fieldName: 'current_revision_no', columnType: 'int' })
  currentRevisionNo!: number;

  @Property({
    fieldName: 'approved_revision_no',
    columnType: 'int',
    nullable: true,
  })
  approvedRevisionNo?: number;

  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  approvedByUserId?: string;

  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
