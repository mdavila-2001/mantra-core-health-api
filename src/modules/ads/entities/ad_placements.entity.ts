import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_placements`.
 */
@Entity({ schema: 'ads', tableName: 'ad_placements' })
export class AdPlacements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad set.
   */
  @Property({ fieldName: 'ad_set_id', type: 'uuid' }) // FK → ads.ad_sets
  adSetId!: string;

  /**
   * Identificador asociado a platform concept.
   */
  @Property({ fieldName: 'platform_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  platformConceptId!: string;

  /**
   * Identificador asociado a position concept.
   */
  @Property({ fieldName: 'position_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  positionConceptId!: string;

  /**
   * Identificador asociado a device concept.
   */
  @Property({ fieldName: 'device_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  deviceConceptId?: string;

  /**
   * Valor de is enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'is_enabled', type: 'boolean', nullable: true })
  isEnabled?: boolean;

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
