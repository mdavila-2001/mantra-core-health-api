import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dataset_definitions`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'dataset_definitions' })
export class DatasetDefinitions {
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
   * Valor de owning module code mantenido por la instancia.
   */
  @Property({ fieldName: 'owning_module_code', columnType: 'varchar' })
  owningModuleCode!: string;

  /**
   * Identificador asociado a data classification.
   */
  @Property({ fieldName: 'data_classification_id', type: 'uuid' }) // FK → polyglot_storage.data_classifications
  dataClassificationId!: string;

  /**
   * Valor de source of truth mantenido por la instancia.
   */
  @Property({ fieldName: 'source_of_truth', columnType: 'varchar' })
  sourceOfTruth!: string;

  /**
   * Valor de canonical entity type mantenido por la instancia.
   */
  @Property({ fieldName: 'canonical_entity_type', columnType: 'varchar' })
  canonicalEntityType!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;

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

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
