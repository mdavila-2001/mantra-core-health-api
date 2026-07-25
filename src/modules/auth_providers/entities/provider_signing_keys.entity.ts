import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'auth_providers', tableName: 'provider_signing_keys' })
export class ProviderSigningKeys {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → auth_providers.identity_providers
  providerId!: string;

  @Property({ fieldName: 'key_id', columnType: 'varchar' })
  keyId!: string;

  @Property({ fieldName: 'key_use_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  keyUseConceptId!: string;

  @Property({ columnType: 'varchar' })
  algorithm!: string;

  @Property({ fieldName: 'public_key', columnType: 'text' })
  publicKey!: string;

  @Property({ columnType: 'text', nullable: true })
  certificate?: string;

  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
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
