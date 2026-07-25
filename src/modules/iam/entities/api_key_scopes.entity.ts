import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'iam', tableName: 'api_key_scopes' })
export class ApiKeyScopes {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'api_key_id', type: 'uuid' })
  apiKeyId!: string;

  @Property({ fieldName: 'scope_concept_id', type: 'uuid' })
  scopeConceptId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  resource?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
