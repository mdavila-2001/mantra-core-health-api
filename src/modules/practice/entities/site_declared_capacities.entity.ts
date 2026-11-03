import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `site_declared_capacities`.
 */
@Entity({ schema: 'practice', tableName: 'site_declared_capacities' })
export class SiteDeclaredCapacities {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

  /**
   * Identificador asociado a capacity kind concept.
   */
  @Property({ fieldName: 'capacity_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  capacityKindConceptId!: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  quantity!: number;

  /**
   * Valor de as of mantenido por la instancia.
   */
  @Property({ fieldName: 'as_of', columnType: 'date' })
  asOf!: Date;

  /**
   * Valor de resolution number mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolution_number',
    columnType: 'varchar',
    nullable: true,
  })
  resolutionNumber?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
