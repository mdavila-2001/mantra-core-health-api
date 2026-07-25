import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'auth_providers', tableName: 'provider_attribute_mappings' })
export class ProviderAttributeMappings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → auth_providers.identity_providers
  providerId!: string;

  @Property({ fieldName: 'source_claim', columnType: 'varchar' })
  sourceClaim!: string;

  @Property({ fieldName: 'target_attribute', columnType: 'varchar' })
  targetAttribute!: string;

  @Property({ fieldName: 'is_identifier', type: 'boolean', nullable: true })
  isIdentifier?: boolean;

  @Property({
    fieldName: 'transform_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  transformJson?: unknown;

  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

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
