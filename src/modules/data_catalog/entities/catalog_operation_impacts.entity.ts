import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'data_catalog', tableName: 'catalog_operation_impacts' })
export class CatalogOperationImpacts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'operation_id', type: 'uuid' }) // FK (destino no resuelto)
  operationId!: string;

  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK (destino no resuelto)
  objectId!: string;

  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  columnId?: string;

  @Property({ fieldName: 'access_kind', columnType: 'varchar' })
  accessKind!: string;

  @Property({
    fieldName: 'access_detail',
    columnType: 'varchar',
    nullable: true,
  })
  accessDetail?: string;

  @Property({ columnType: 'varchar', nullable: true })
  confidence?: string;

  @Property({
    fieldName: 'call_path',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  callPath?: unknown;

  @Property({ fieldName: 'source_ref', columnType: 'varchar', nullable: true })
  sourceRef?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
