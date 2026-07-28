import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_definition_localizations`.
 */
@Entity({ schema: 'forms', tableName: 'field_definition_localizations' })
export class FieldDefinitionLocalizations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a field.
   */
  @Property({ fieldName: 'field_id', type: 'uuid' }) // FK → forms.dynamic_field_definitions
  fieldId!: string;

  /**
   * Identificador asociado a language concept.
   */
  @Property({ fieldName: 'language_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  languageConceptId!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  label?: string;

  /**
   * Valor de help text mantenido por la instancia.
   */
  @Property({ fieldName: 'help_text', columnType: 'text', nullable: true })
  helpText?: string;

  /**
   * Valor de placeholder mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  placeholder?: string;

  /**
   * Valor de validation message mantenido por la instancia.
   */
  @Property({
    fieldName: 'validation_message',
    columnType: 'varchar',
    nullable: true,
  })
  validationMessage?: string;

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
