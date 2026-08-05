import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_concepts`.
 */
@Entity({ schema: 'terminology', tableName: 'catalog_concepts' })
export class CatalogConcepts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a code system version.
   */
  @Property({ fieldName: 'code_system_version_id', type: 'uuid' }) // FK → terminology.code_system_versions
  codeSystemVersionId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de display mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  display!: string;

  /**
   * Valor de definition mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  definition?: string;

  /**
   * Valor de abstract mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  abstract?: boolean;

  /**
   * Valor de selectable mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  selectable?: boolean;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  /**
   * Identificador asociado a replaced by concept.
   */
  @Property({
    fieldName: 'replaced_by_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  replacedByConceptId?: string;

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
