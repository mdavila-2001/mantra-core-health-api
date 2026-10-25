import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'data_catalog', tableName: 'catalog_operations' })
export class CatalogOperations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'source_code', columnType: 'varchar' })
  sourceCode!: string;

  @Property({ fieldName: 'operation_key', columnType: 'varchar' })
  operationKey!: string;

  @Property({ fieldName: 'http_method', columnType: 'varchar' })
  httpMethod!: string;

  @Property({ fieldName: 'route_template', columnType: 'varchar' })
  routeTemplate!: string;

  @Property({ fieldName: 'module_code', columnType: 'varchar', nullable: true })
  moduleCode?: string;

  @Property({
    fieldName: 'controller_name',
    columnType: 'varchar',
    nullable: true,
  })
  controllerName?: string;

  @Property({
    fieldName: 'handler_name',
    columnType: 'varchar',
    nullable: true,
  })
  handlerName?: string;

  @Property({ fieldName: 'source_ref', columnType: 'varchar', nullable: true })
  sourceRef?: string;

  @Property({ fieldName: 'is_public', type: 'boolean' })
  isPublic!: boolean;

  @Property({
    fieldName: 'required_roles',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  requiredRoles?: unknown;

  @Property({ fieldName: 'risk_level', columnType: 'varchar' })
  riskLevel!: string;

  @Property({ fieldName: 'observation_status', columnType: 'varchar' })
  observationStatus!: string;

  @Property({
    fieldName: 'technical_hash',
    columnType: 'varchar',
    nullable: true,
  })
  technicalHash?: string;

  @Property({ fieldName: 'first_seen_at', columnType: 'timestamptz' })
  firstSeenAt!: Date;

  @Property({ fieldName: 'last_seen_at', columnType: 'timestamptz' })
  lastSeenAt!: Date;

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
