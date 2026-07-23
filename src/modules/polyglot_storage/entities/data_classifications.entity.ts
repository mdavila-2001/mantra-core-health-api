import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'data_classifications' })
export class PolyglotStorageDataClassifications {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'sensitivity_level', columnType: 'smallint' })
  sensitivityLevel!: number;

  @Property({ fieldName: 'contains_phi', type: 'boolean' })
  containsPhi!: boolean;

  @Property({ fieldName: 'contains_pii', type: 'boolean' })
  containsPii!: boolean;

  @Property({ fieldName: 'contains_financial_data', type: 'boolean' })
  containsFinancialData!: boolean;

  @Property({ fieldName: 'default_encryption_profile_id', type: 'uuid' }) // FK (destino no resuelto)
  defaultEncryptionProfileId!: string;

  @Property({ fieldName: 'default_retention_policy_id', type: 'uuid' }) // FK (destino no resuelto)
  defaultRetentionPolicyId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
