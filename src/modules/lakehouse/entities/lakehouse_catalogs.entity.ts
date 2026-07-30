import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lakehouse_catalogs`.
 */
@Entity({ schema: 'lakehouse', tableName: 'lakehouse_catalogs' })
export class LakehouseCatalogs {
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
   * Valor de catalog type mantenido por la instancia.
   */
  @Property({ fieldName: 'catalog_type', columnType: 'varchar' })
  catalogType!: string;

  /**
   * Valor de metastore uri mantenido por la instancia.
   */
  @Property({ fieldName: 'metastore_uri', columnType: 'varchar' })
  metastoreUri!: string;

  /**
   * Valor de default format mantenido por la instancia.
   */
  @Property({ fieldName: 'default_format', columnType: 'varchar' })
  defaultFormat!: string;

  /**
   * Valor de default compression mantenido por la instancia.
   */
  @Property({ fieldName: 'default_compression', columnType: 'varchar' })
  defaultCompression!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
