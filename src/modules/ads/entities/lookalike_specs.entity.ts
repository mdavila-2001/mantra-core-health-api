import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'lookalike_specs' })
export class LookalikeSpecs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ fieldName: 'source_audience_id', type: 'uuid' }) // FK (destino no resuelto)
  sourceAudienceId!: string;

  @Property({ fieldName: 'country_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  countryConceptId!: string;

  @Property({ fieldName: 'ratio_percent', columnType: 'numeric' })
  ratioPercent!: string;

  @Property({
    fieldName: 'similarity_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  similarityConceptId?: string;

  @Property({
    fieldName: 'generated_audience_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  generatedAudienceId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
