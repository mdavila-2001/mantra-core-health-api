import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'offline_conversion_sets' })
export class OfflineConversionSets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'upload_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  uploadSourceConceptId!: string;

  @Property({ fieldName: 'total_events', columnType: 'int', nullable: true })
  totalEvents?: number;

  @Property({ fieldName: 'matched_events', columnType: 'int', nullable: true })
  matchedEvents?: number;

  @Property({ fieldName: 'match_rate', columnType: 'numeric', nullable: true })
  matchRate?: string;

  @Property({
    fieldName: 'attributed_value',
    columnType: 'numeric',
    nullable: true,
  })
  attributedValue?: string;

  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'uploaded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  uploadedAt?: Date;

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
