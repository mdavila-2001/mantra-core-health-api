import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_evidence_items`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_evidence_items' })
export class CatalogEvidenceItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a object.
   */
  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK → data_catalog.catalog_objects
  objectId!: string;

  /**
   * Identificador asociado a column.
   */
  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK → data_catalog.catalog_columns
  columnId?: string;

  /**
   * Valor de kind mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  kind!: string;

  /**
   * Valor de reference mantenido por la instancia.
   */
  @Property({ columnType: 'text' })
  reference!: string;

  /**
   * Valor de excerpt mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  excerpt?: string;

  /**
   * Valor de source revision mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_revision',
    columnType: 'varchar',
    nullable: true,
  })
  sourceRevision?: string;

  /**
   * Identificador asociado a added by user.
   */
  @Property({ fieldName: 'added_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  addedByUserId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
