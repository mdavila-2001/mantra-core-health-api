import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'key_rotation_policies' })
export class KeyRotationPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'rotation_interval_days', columnType: 'int' })
  rotationIntervalDays!: number;

  @Property({ fieldName: 'overlap_days', columnType: 'int' })
  overlapDays!: number;

  @Property({ fieldName: 'reencrypt_existing_data', type: 'boolean' })
  reencryptExistingData!: boolean;

  @Property({ fieldName: 'emergency_rotation_enabled', type: 'boolean' })
  emergencyRotationEnabled!: boolean;

  @Property({ columnType: 'varchar' })
  state!: string;
}
