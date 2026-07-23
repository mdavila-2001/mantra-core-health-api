import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'auth_providers', tableName: 'federated_identities' })
export class FederatedIdentities {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK (destino no resuelto)
  providerId!: string;

  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  @Property({ fieldName: 'external_subject', columnType: 'varchar' })
  externalSubject!: string;

  @Property({
    fieldName: 'external_email',
    columnType: 'varchar',
    nullable: true,
  })
  externalEmail?: string;

  @Property({
    fieldName: 'display_name',
    columnType: 'varchar',
    nullable: true,
  })
  displayName?: string;

  @Property({
    fieldName: 'linked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  linkedAt?: Date;

  @Property({
    fieldName: 'last_login_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastLoginAt?: Date;

  @Property({
    fieldName: 'raw_claims_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  rawClaimsJson?: unknown;

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
