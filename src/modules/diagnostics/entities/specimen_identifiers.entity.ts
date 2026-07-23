import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'specimen_identifiers' })
export class SpecimenIdentifiers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  @Property({ fieldName: 'identifier_system', columnType: 'varchar' })
  identifierSystem!: string;

  @Property({ fieldName: 'identifier_value', columnType: 'varchar' })
  identifierValue!: string;

  @Property({ fieldName: 'identifier_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  identifierTypeConceptId!: string;

  @Property({
    fieldName: 'assigning_organization_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  assigningOrganizationId?: string;

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

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
