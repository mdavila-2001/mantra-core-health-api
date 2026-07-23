import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_drift_events',
})
export class ProjectionDriftEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  @Property({ fieldName: 'canonical_entity_id', type: 'uuid' })
  canonicalEntityId!: string;

  @Property({ fieldName: 'drift_type', columnType: 'varchar' })
  driftType!: string;

  @Property({ columnType: 'varchar' })
  severity!: string;

  @Property({ fieldName: 'canonical_version', type: 'bigint' })
  canonicalVersion!: string;

  @Property({ fieldName: 'target_version', columnType: 'varchar' })
  targetVersion!: string;

  @Property({ fieldName: 'reconciliation_item_id', type: 'uuid' })
  reconciliationItemId!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'detected_at', columnType: 'timestamptz' })
  detectedAt!: Date;
}
