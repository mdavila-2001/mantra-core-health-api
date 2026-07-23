import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'fhir_profile_versions' })
export class FhirProfileVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'fhir_profile_definition_id', type: 'uuid' }) // FK → health_data.fhir_profile_definitions
  fhirProfileDefinitionId!: string;

  @Property({ columnType: 'varchar' })
  version!: string;

  @Property({ fieldName: 'fhir_release_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fhirReleaseConceptId!: string;

  @Property({
    fieldName: 'structure_definition_json',
    type: 'json',
    columnType: 'jsonb',
  })
  structureDefinitionJson!: unknown;

  @Property({
    fieldName: 'package_name',
    columnType: 'varchar',
    nullable: true,
  })
  packageName?: string;

  @Property({
    fieldName: 'package_version',
    columnType: 'varchar',
    nullable: true,
  })
  packageVersion?: string;

  @Property({
    fieldName: 'checksum_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  checksumSha256?: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

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
