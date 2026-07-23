import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'data_lake_zones' })
export class DataLakeZones {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'zone_type', columnType: 'varchar' })
  zoneType!: string;

  @Property({ fieldName: 'namespace_id', type: 'uuid' })
  namespaceId!: string;

  @Property({ fieldName: 'encryption_profile_code', columnType: 'varchar' })
  encryptionProfileCode!: string;

  @Property({ fieldName: 'retention_policy_code', columnType: 'varchar' })
  retentionPolicyCode!: string;

  @Property({ columnType: 'varchar' })
  state!: string;
}
