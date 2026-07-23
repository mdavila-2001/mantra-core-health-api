import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'canonical_resource_identifiers' })
export class CanonicalResourceIdentifiers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'canonical_health_resource_id', type: 'uuid' }) // FK → health_data.canonical_health_resources
  canonicalHealthResourceId!: string;

  @Property({ fieldName: 'identifier_system', columnType: 'varchar' })
  identifierSystem!: string;

  @Property({ fieldName: 'identifier_value', columnType: 'varchar' })
  identifierValue!: string;

  @Property({ fieldName: 'identifier_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  identifierTypeConceptId!: string;

  @Property({
    fieldName: 'assigning_authority',
    columnType: 'varchar',
    nullable: true,
  })
  assigningAuthority?: string;

  @Property({ fieldName: 'is_primary', type: 'boolean' })
  isPrimary!: boolean;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
