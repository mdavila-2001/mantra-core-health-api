import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `geofences`.
 */
@Entity({ schema: 'geo', tableName: 'geofences' })
export class Geofences {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a shape type concept.
   */
  @Property({ fieldName: 'shape_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  shapeTypeConceptId!: string;

  /**
   * Valor de geometry json mantenido por la instancia.
   */
  @Property({
    fieldName: 'geometry_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  geometryJson?: unknown;

  /**
   * Valor de radius m mantenido por la instancia.
   */
  @Property({ fieldName: 'radius_m', columnType: 'numeric', nullable: true })
  radiusM?: string;

  /**
   * Valor de center lat mantenido por la instancia.
   */
  @Property({ fieldName: 'center_lat', columnType: 'numeric', nullable: true })
  centerLat?: string;

  /**
   * Valor de center lng mantenido por la instancia.
   */
  @Property({ fieldName: 'center_lng', columnType: 'numeric', nullable: true })
  centerLng?: string;

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
