import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_set_members`.
 */
@Entity({ schema: 'forms', tableName: 'field_set_members' })
export class FieldSetMembers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a definition set version.
   */
  @Property({ fieldName: 'definition_set_version_id', type: 'uuid' }) // FK → forms.field_definition_set_versions
  definitionSetVersionId!: string;

  /**
   * Identificador asociado a field.
   */
  @Property({ fieldName: 'field_id', type: 'uuid' }) // FK → forms.dynamic_field_definitions
  fieldId!: string;

  /**
   * Identificador asociado a section.
   */
  @Property({ fieldName: 'section_id', type: 'uuid', nullable: true }) // FK → forms.dynamic_field_sections
  sectionId?: string;

  /**
   * Valor de required mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
