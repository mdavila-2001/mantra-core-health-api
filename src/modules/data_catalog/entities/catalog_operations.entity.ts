import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_operations`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_operations' })
export class CatalogOperations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de source code mantenido por la instancia.
   */
  @Property({ fieldName: 'source_code', columnType: 'varchar' })
  sourceCode!: string;

  /**
   * Valor de operation key mantenido por la instancia.
   */
  @Property({ fieldName: 'operation_key', columnType: 'varchar' })
  operationKey!: string;

  /**
   * Valor de http method mantenido por la instancia.
   */
  @Property({ fieldName: 'http_method', columnType: 'varchar' })
  httpMethod!: string;

  /**
   * Valor de route template mantenido por la instancia.
   */
  @Property({ fieldName: 'route_template', columnType: 'varchar' })
  routeTemplate!: string;

  /**
   * Valor de module code mantenido por la instancia.
   */
  @Property({ fieldName: 'module_code', columnType: 'varchar', nullable: true })
  moduleCode?: string;

  /**
   * Valor de controller name mantenido por la instancia.
   */
  @Property({
    fieldName: 'controller_name',
    columnType: 'varchar',
    nullable: true,
  })
  controllerName?: string;

  /**
   * Valor de handler name mantenido por la instancia.
   */
  @Property({
    fieldName: 'handler_name',
    columnType: 'varchar',
    nullable: true,
  })
  handlerName?: string;

  /**
   * Valor de source ref mantenido por la instancia.
   */
  @Property({ fieldName: 'source_ref', columnType: 'varchar', nullable: true })
  sourceRef?: string;

  /**
   * Valor de is public mantenido por la instancia.
   */
  @Property({ fieldName: 'is_public', type: 'boolean' })
  isPublic!: boolean;

  /**
   * Valor de required roles mantenido por la instancia.
   */
  @Property({
    fieldName: 'required_roles',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  requiredRoles?: unknown;

  /**
   * Valor de risk level mantenido por la instancia.
   */
  @Property({ fieldName: 'risk_level', columnType: 'varchar' })
  riskLevel!: string;

  /**
   * Valor de observation status mantenido por la instancia.
   */
  @Property({ fieldName: 'observation_status', columnType: 'varchar' })
  observationStatus!: string;

  /**
   * Valor de technical hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'technical_hash',
    columnType: 'varchar',
    nullable: true,
  })
  technicalHash?: string;

  /**
   * Valor de first seen at mantenido por la instancia.
   */
  @Property({ fieldName: 'first_seen_at', columnType: 'timestamptz' })
  firstSeenAt!: Date;

  /**
   * Valor de last seen at mantenido por la instancia.
   */
  @Property({ fieldName: 'last_seen_at', columnType: 'timestamptz' })
  lastSeenAt!: Date;

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
