import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `key_rotation_policies`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'key_rotation_policies' })
export class KeyRotationPolicies {
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
   * Valor de rotation interval days mantenido por la instancia.
   */
  @Property({ fieldName: 'rotation_interval_days', columnType: 'int' })
  rotationIntervalDays!: number;

  /**
   * Valor de overlap days mantenido por la instancia.
   */
  @Property({ fieldName: 'overlap_days', columnType: 'int' })
  overlapDays!: number;

  /**
   * Valor de reencrypt existing data mantenido por la instancia.
   */
  @Property({ fieldName: 'reencrypt_existing_data', type: 'boolean' })
  reencryptExistingData!: boolean;

  /**
   * Valor de emergency rotation enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'emergency_rotation_enabled', type: 'boolean' })
  emergencyRotationEnabled!: boolean;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
