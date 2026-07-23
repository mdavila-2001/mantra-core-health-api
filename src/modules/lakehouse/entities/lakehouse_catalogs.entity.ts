import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'lakehouse_catalogs' })
export class LakehouseCatalogs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'catalog_type', columnType: 'varchar' })
  catalogType!: string;

  @Property({ fieldName: 'metastore_uri', columnType: 'varchar' })
  metastoreUri!: string;

  @Property({ fieldName: 'default_format', columnType: 'varchar' })
  defaultFormat!: string;

  @Property({ fieldName: 'default_compression', columnType: 'varchar' })
  defaultCompression!: string;

  @Property({ columnType: 'varchar' })
  state!: string;
}
