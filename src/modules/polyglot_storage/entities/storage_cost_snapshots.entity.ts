import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'storage_cost_snapshots' })
export class StorageCostSnapshots {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'storage_backend_region_id', type: 'uuid' }) // FK → polyglot_storage.storage_backend_regions
  storageBackendRegionId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'dataset_definition_id', type: 'uuid' }) // FK → polyglot_storage.dataset_definitions
  datasetDefinitionId!: string;

  @Property({ fieldName: 'period_start', columnType: 'date' })
  periodStart!: Date;

  @Property({ fieldName: 'period_end', columnType: 'date' })
  periodEnd!: Date;

  @Property({ fieldName: 'storage_bytes', type: 'bigint' })
  storageBytes!: string;

  @Property({ fieldName: 'read_units', columnType: 'numeric' })
  readUnits!: string;

  @Property({ fieldName: 'write_units', columnType: 'numeric' })
  writeUnits!: string;

  @Property({ fieldName: 'egress_bytes', type: 'bigint' })
  egressBytes!: string;

  @Property({ fieldName: 'estimated_cost', columnType: 'numeric(18,6)' })
  estimatedCost!: string;

  @Property({ fieldName: 'currency_code', columnType: 'char(3)' })
  currencyCode!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
