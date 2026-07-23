import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'iam', tableName: 'authentication_credentials' })
export class AuthenticationCredentials {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  @Property({ fieldName: 'method_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  methodConceptId!: string;

  @Property({
    fieldName: 'external_subject',
    columnType: 'varchar',
    nullable: true,
  })
  externalSubject?: string;

  @Property({ fieldName: 'secret_hash', columnType: 'varchar', nullable: true })
  secretHash?: string;

  @Property({
    fieldName: 'hash_algorithm_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  hashAlgorithmConceptId?: string;

  @Property({ fieldName: 'public_key', columnType: 'text', nullable: true })
  publicKey?: string;

  @Property({
    fieldName: 'identity_provider',
    columnType: 'varchar',
    nullable: true,
  })
  identityProvider?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  @Property({
    fieldName: 'last_used_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastUsedAt?: Date;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

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
