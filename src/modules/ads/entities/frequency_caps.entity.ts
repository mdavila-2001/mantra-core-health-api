import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `frequency_caps`.
 */
@Entity({ schema: 'ads', tableName: 'frequency_caps' })
export class FrequencyCaps {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a scope concept.
   */
  @Property({ fieldName: 'scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scopeConceptId!: string;

  /**
   * Identificador asociado a scope ref.
   */
  @Property({ fieldName: 'scope_ref_id', type: 'uuid' })
  scopeRefId!: string;

  /**
   * Valor de max impressions mantenido por la instancia.
   */
  @Property({ fieldName: 'max_impressions', columnType: 'int' })
  maxImpressions!: number;

  /**
   * Identificador asociado a time window concept.
   */
  @Property({ fieldName: 'time_window_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  timeWindowConceptId!: string;

  /**
   * Valor de window count mantenido por la instancia.
   */
  @Property({ fieldName: 'window_count', columnType: 'int', nullable: true })
  windowCount?: number;

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
