import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tenant_storage_bindings`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'tenant_storage_bindings' })
export class TenantStorageBindings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a dataset definition.
   */
  @Property({ fieldName: 'dataset_definition_id', type: 'uuid' }) // FK → polyglot_storage.dataset_definitions
  datasetDefinitionId!: string;

  /**
   * Identificador asociado a primary placement.
   */
  @Property({ fieldName: 'primary_placement_id', type: 'uuid' }) // FK → polyglot_storage.dataset_placements
  primaryPlacementId!: string;

  /**
   * Identificador asociado a secondary placement.
   */
  @Property({
    fieldName: 'secondary_placement_id',
    type: 'uuid',
    nullable: true,
  }) // FK → polyglot_storage.dataset_placements
  secondaryPlacementId?: string;

  /**
   * Valor de tenant partition key mantenido por la instancia.
   */
  @Property({ fieldName: 'tenant_partition_key', columnType: 'varchar' })
  tenantPartitionKey!: string;

  /**
   * Valor de tenant encryption key ref mantenido por la instancia.
   */
  @Property({ fieldName: 'tenant_encryption_key_ref', columnType: 'varchar' })
  tenantEncryptionKeyRef!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
