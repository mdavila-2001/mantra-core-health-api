import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `data_lake_zones`.
 */
@Entity({ schema: 'lakehouse', tableName: 'data_lake_zones' })
export class DataLakeZones {
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
   * Valor de zone type mantenido por la instancia.
   */
  @Property({ fieldName: 'zone_type', columnType: 'varchar' })
  zoneType!: string;

  /**
   * Identificador asociado a namespace.
   */
  @Property({ fieldName: 'namespace_id', type: 'uuid' })
  namespaceId!: string;

  /**
   * Valor de encryption profile code mantenido por la instancia.
   */
  @Property({ fieldName: 'encryption_profile_code', columnType: 'varchar' })
  encryptionProfileCode!: string;

  /**
   * Valor de retention policy code mantenido por la instancia.
   */
  @Property({ fieldName: 'retention_policy_code', columnType: 'varchar' })
  retentionPolicyCode!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
