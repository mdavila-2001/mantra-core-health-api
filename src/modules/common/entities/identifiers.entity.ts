import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'common', tableName: 'identifiers' })
export class Identifiers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'owner_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ownerTypeConceptId!: string;

  @Property({ fieldName: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Property({ fieldName: 'use_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  useConceptId?: string;

  @Property({ fieldName: 'type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  typeConceptId!: string;

  @Property({ columnType: 'text', nullable: true })
  system?: string;

  @Property({ columnType: 'varchar' })
  value!: string;

  @Property({
    fieldName: 'issuer_country_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  issuerCountryConceptId?: string;

  @Property({ fieldName: 'assigner_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  assignerTenantId?: string;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
