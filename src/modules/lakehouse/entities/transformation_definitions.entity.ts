import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `transformation_definitions`.
 */
@Entity({ schema: 'lakehouse', tableName: 'transformation_definitions' })
export class TransformationDefinitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  version!: string;

  /**
   * Valor de engine mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  engine!: string;

  /**
   * Valor de source dataset ids mantenido por la instancia.
   */
  @Property({ fieldName: 'source_dataset_ids', type: 'array' })
  sourceDatasetIds!: string[];

  /**
   * Identificador asociado a target dataset.
   */
  @Property({ fieldName: 'target_dataset_id', type: 'uuid' })
  targetDatasetId!: string;

  /**
   * Valor de transformation ref mantenido por la instancia.
   */
  @Property({ fieldName: 'transformation_ref', columnType: 'varchar' })
  transformationRef!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
