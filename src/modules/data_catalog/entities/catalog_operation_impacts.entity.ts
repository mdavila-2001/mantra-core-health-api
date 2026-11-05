import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_operation_impacts`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_operation_impacts' })
export class CatalogOperationImpacts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a operation.
   */
  @Property({ fieldName: 'operation_id', type: 'uuid' }) // FK (destino no resuelto)
  operationId!: string;

  /**
   * Identificador asociado a object.
   */
  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK (destino no resuelto)
  objectId!: string;

  /**
   * Identificador asociado a column.
   */
  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  columnId?: string;

  /**
   * Valor de access kind mantenido por la instancia.
   */
  @Property({ fieldName: 'access_kind', columnType: 'varchar' })
  accessKind!: string;

  /**
   * Valor de access detail mantenido por la instancia.
   */
  @Property({
    fieldName: 'access_detail',
    columnType: 'varchar',
    nullable: true,
  })
  accessDetail?: string;

  /**
   * Valor de confidence mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  confidence?: string;

  /**
   * Valor de call path mantenido por la instancia.
   */
  @Property({
    fieldName: 'call_path',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  callPath?: unknown;

  /**
   * Valor de source ref mantenido por la instancia.
   */
  @Property({ fieldName: 'source_ref', columnType: 'varchar', nullable: true })
  sourceRef?: string;

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
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
