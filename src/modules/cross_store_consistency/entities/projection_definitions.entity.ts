import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `projection_definitions`.
 */
@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_definitions',
})
export class ProjectionDefinitions {
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
   * Identificador asociado a source dataset.
   */
  @Property({ fieldName: 'source_dataset_id', type: 'uuid' })
  sourceDatasetId!: string;

  /**
   * Identificador asociado a target dataset.
   */
  @Property({ fieldName: 'target_dataset_id', type: 'uuid' })
  targetDatasetId!: string;

  /**
   * Valor de projection version mantenido por la instancia.
   */
  @Property({ fieldName: 'projection_version', columnType: 'varchar' })
  projectionVersion!: string;

  /**
   * Valor de delivery semantics mantenido por la instancia.
   */
  @Property({ fieldName: 'delivery_semantics', columnType: 'varchar' })
  deliverySemantics!: string;

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

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
