import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'auth_providers', tableName: 'identity_providers' })
export class IdentityProviders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'protocol_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  protocolConceptId!: string;

  @Property({ fieldName: 'provider_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  providerCategoryConceptId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  issuer?: string;

  @Property({ fieldName: 'logo_file_id', type: 'uuid', nullable: true }) // FK → common.files
  logoFileId?: string;

  @Property({ fieldName: 'is_global', type: 'boolean', nullable: true })
  isGlobal?: boolean;

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
