import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tool_registry`.
 */
@Entity({ schema: 'platform_ops', tableName: 'tool_registry' })
export class ToolRegistry {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

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
   * Identificador asociado a tool type concept.
   */
  @Property({ fieldName: 'tool_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toolTypeConceptId!: string;

  /**
   * Valor de vendor mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  vendor?: string;

  /**
   * Valor de current version mantenido por la instancia.
   */
  @Property({
    fieldName: 'current_version',
    columnType: 'varchar',
    nullable: true,
  })
  currentVersion?: string;

  /**
   * Valor de purpose mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  purpose?: string;

  /**
   * Valor de homepage url mantenido por la instancia.
   */
  @Property({
    fieldName: 'homepage_url',
    columnType: 'varchar',
    nullable: true,
  })
  homepageUrl?: string;

  /**
   * Valor de is approved mantenido por la instancia.
   */
  @Property({ fieldName: 'is_approved', type: 'boolean', nullable: true })
  isApproved?: boolean;

  /**
   * Identificador asociado a approved by user.
   */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
