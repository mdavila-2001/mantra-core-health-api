import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `code_systems`.
 */
@Entity({ schema: 'terminology', tableName: 'code_systems' })
export class CodeSystems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a source.
   */
  @Property({ fieldName: 'source_id', type: 'uuid' }) // FK → terminology.terminology_sources
  sourceId!: string;

  /**
   * Valor de internal code mantenido por la instancia.
   */
  @Property({ fieldName: 'internal_code', columnType: 'varchar' })
  internalCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de canonical url mantenido por la instancia.
   */
  @Property({ fieldName: 'canonical_url', columnType: 'text' })
  canonicalUrl!: string;

  /**
   * Valor de oid mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  oid?: string;

  /**
   * Identificador asociado a content type concept.
   */
  @Property({
    fieldName: 'content_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  contentTypeConceptId?: string;

  /**
   * Valor de case sensitive mantenido por la instancia.
   */
  @Property({ fieldName: 'case_sensitive', type: 'boolean', nullable: true })
  caseSensitive?: boolean;

  /**
   * Valor de supports composition mantenido por la instancia.
   */
  @Property({
    fieldName: 'supports_composition',
    type: 'boolean',
    nullable: true,
  })
  supportsComposition?: boolean;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  stateConceptId?: string;

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
