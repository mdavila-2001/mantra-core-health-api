import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `marketing_segments`.
 */
@Entity({ schema: 'marketing', tableName: 'segments' })
export class MarketingSegments {
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
   * Identificador asociado a segment type concept.
   */
  @Property({ fieldName: 'segment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  segmentTypeConceptId!: string;

  /**
   * Valor de definition json mantenido por la instancia.
   */
  @Property({
    fieldName: 'definition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  definitionJson?: unknown;

  /**
   * Identificador asociado a source read model.
   */
  @Property({ fieldName: 'source_read_model_id', type: 'uuid', nullable: true }) // FK → read_models.read_model_definitions
  sourceReadModelId?: string;

  /**
   * Valor de estimated size mantenido por la instancia.
   */
  @Property({ fieldName: 'estimated_size', type: 'bigint', nullable: true })
  estimatedSize?: string;

  /**
   * Valor de last refreshed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_refreshed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRefreshedAt?: Date;

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
