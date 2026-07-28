import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_schema_migrations`.
 */
@Entity({ schema: 'forms', tableName: 'field_schema_migrations' })
export class FieldSchemaMigrations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a definition set.
   */
  @Property({ fieldName: 'definition_set_id', type: 'uuid' }) // FK → forms.field_definition_sets
  definitionSetId!: string;

  /**
   * Identificador asociado a from version.
   */
  @Property({ fieldName: 'from_version_id', type: 'uuid' }) // FK → forms.field_definition_set_versions
  fromVersionId!: string;

  /**
   * Identificador asociado a to version.
   */
  @Property({ fieldName: 'to_version_id', type: 'uuid' }) // FK → forms.field_definition_set_versions
  toVersionId!: string;

  /**
   * Identificador asociado a migration type concept.
   */
  @Property({ fieldName: 'migration_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  migrationTypeConceptId!: string;

  /**
   * Valor de transformation expression mantenido por la instancia.
   */
  @Property({
    fieldName: 'transformation_expression',
    columnType: 'text',
    nullable: true,
  })
  transformationExpression?: string;

  /**
   * Valor de validation expression mantenido por la instancia.
   */
  @Property({
    fieldName: 'validation_expression',
    columnType: 'text',
    nullable: true,
  })
  validationExpression?: string;

  /**
   * Valor de rollback expression mantenido por la instancia.
   */
  @Property({
    fieldName: 'rollback_expression',
    columnType: 'text',
    nullable: true,
  })
  rollbackExpression?: string;

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
