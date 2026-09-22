import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Evidencia que respalda una ficha (`data_catalog.catalog_evidence_items`):
 * una referencia verificable (nota de la bóveda, migración, archivo de código,
 * declaración del owner) con su procedencia. Nunca contiene secretos ni filas
 * de producción; el extracto se limita en el DTO.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_evidence_items' })
export class CatalogEvidenceItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK → data_catalog.catalog_objects
  objectId!: string;

  /** Null si la evidencia es de la tabla entera. */
  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK → data_catalog.catalog_columns
  columnId?: string;

  /** SCHEMA_COMMENT | VAULT_NOTE | MIGRATION | CODE_REFERENCE | OPENAPI | OWNER_STATEMENT | DOCUMENT. */
  @Property({ columnType: 'varchar' })
  kind!: string;

  /** Ruta, URL o identificador verificable de la fuente. */
  @Property({ columnType: 'text' })
  reference!: string;

  @Property({ columnType: 'text', nullable: true })
  excerpt?: string;

  /** Commit o hash de la fuente citada, si se conoce. */
  @Property({
    fieldName: 'source_revision',
    columnType: 'varchar',
    nullable: true,
  })
  sourceRevision?: string;

  @Property({ fieldName: 'added_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  addedByUserId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
