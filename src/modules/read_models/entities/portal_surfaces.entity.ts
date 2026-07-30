import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `portal_surfaces`.
 */
@Entity({ schema: 'read_models', tableName: 'portal_surfaces' })
export class PortalSurfaces {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de portal code mantenido por la instancia.
   */
  @Property({ fieldName: 'portal_code', columnType: 'varchar' })
  portalCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a portal type concept.
   */
  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  portalTypeConceptId!: string;

  /**
   * Identificador asociado a audience role value set.
   */
  @Property({
    fieldName: 'audience_role_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  audienceRoleValueSetId?: string;

  /**
   * Valor de tenant scoped mantenido por la instancia.
   */
  @Property({ fieldName: 'tenant_scoped', type: 'boolean', nullable: true })
  tenantScoped?: boolean;

  /**
   * Valor de patient scoped mantenido por la instancia.
   */
  @Property({ fieldName: 'patient_scoped', type: 'boolean', nullable: true })
  patientScoped?: boolean;

  /**
   * Valor de default route mantenido por la instancia.
   */
  @Property({
    fieldName: 'default_route',
    columnType: 'varchar',
    nullable: true,
  })
  defaultRoute?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
