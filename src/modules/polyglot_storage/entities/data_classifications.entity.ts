import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `polyglot_storage_data_classifications`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'data_classifications' })
export class PolyglotStorageDataClassifications {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de sensitivity level mantenido por la instancia.
   */
  @Property({ fieldName: 'sensitivity_level', columnType: 'smallint' })
  sensitivityLevel!: number;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @Property({ fieldName: 'contains_phi', type: 'boolean' })
  containsPhi!: boolean;

  /**
   * Valor de contains pii mantenido por la instancia.
   */
  @Property({ fieldName: 'contains_pii', type: 'boolean' })
  containsPii!: boolean;

  /**
   * Valor de contains financial data mantenido por la instancia.
   */
  @Property({ fieldName: 'contains_financial_data', type: 'boolean' })
  containsFinancialData!: boolean;

  /**
   * Identificador asociado a default encryption profile.
   */
  @Property({ fieldName: 'default_encryption_profile_id', type: 'uuid' }) // FK → polyglot_storage.encryption_profiles
  defaultEncryptionProfileId!: string;

  /**
   * Identificador asociado a default retention policy.
   */
  @Property({ fieldName: 'default_retention_policy_id', type: 'uuid' }) // FK → polyglot_storage.retention_policies
  defaultRetentionPolicyId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
