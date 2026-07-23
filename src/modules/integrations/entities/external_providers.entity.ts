import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'integrations', tableName: 'external_providers' })
export class ExternalProviders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'provider_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  providerTypeConceptId!: string;

  @Property({ fieldName: 'base_url', columnType: 'text', nullable: true })
  baseUrl?: string;

  @Property({ fieldName: 'auth_type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  authTypeConceptId?: string;

  @Property({ fieldName: 'doc_url', columnType: 'text', nullable: true })
  docUrl?: string;

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
