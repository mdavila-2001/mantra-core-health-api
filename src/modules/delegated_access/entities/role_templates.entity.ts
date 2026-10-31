import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Plantilla de rol de apoyo (acciones por defecto). `tenant_id` nulo = plantilla de plataforma.
 */
@Entity({ schema: 'delegated_access', tableName: 'role_templates' })
export class RoleTemplates {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /** Columna `code`. */
  @Property({ fieldName: 'code', columnType: 'varchar' })
  code!: string;

  /** Columna `name`. */
  @Property({ fieldName: 'name', columnType: 'varchar' })
  name!: string;

  /** Columna `default_actions_json`. */
  @Property({
    fieldName: 'default_actions_json',
    type: 'json',
    columnType: 'jsonb',
  })
  defaultActionsJson!: unknown;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Columna `version_number`. */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /** Columna `created_at`. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Columna `updated_at`. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** Versión usada para controlar actualizaciones concurrentes. */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  /** Columna `created_by_user_id`. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /** Columna `updated_by_user_id`. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /** Mapa `átomo → condición v1` que reciben por omisión las concesiones nuevas de la plantilla. */
  @Property({
    fieldName: 'default_conditions_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  defaultConditionsJson?: unknown;

  /** Techo de la plantilla: arreglo de átomos o `prefijo.*`; nulo = sin techo propio. */
  @Property({
    fieldName: 'ceiling_actions_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  ceilingActionsJson?: unknown;
}
