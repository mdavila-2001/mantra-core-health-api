import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostic_units', tableName: 'diagnostic_unit_sites' })
export class DiagnosticUnitSites {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'diagnostic_unit_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_units
  diagnosticUnitId!: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites
  practiceSiteId!: string;

  @Property({ fieldName: 'site_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  siteRoleConceptId!: string;

  @Property({
    fieldName: 'accession_prefix',
    columnType: 'varchar',
    nullable: true,
  })
  accessionPrefix?: string;

  @Property({
    fieldName: 'sample_collection_available',
    type: 'boolean',
    nullable: true,
  })
  sampleCollectionAvailable?: boolean;

  @Property({ fieldName: 'imaging_available', type: 'boolean', nullable: true })
  imagingAvailable?: boolean;

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
