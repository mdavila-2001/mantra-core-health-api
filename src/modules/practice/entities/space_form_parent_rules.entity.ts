import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `space_form_parent_rules`.
 */
@Entity({ schema: 'practice', tableName: 'space_form_parent_rules' })
export class SpaceFormParentRules {
  /**
   * Identificador asociado a parent form concept.
   */
  @PrimaryKey({ fieldName: 'parent_form_concept_id', type: 'uuid' })
  parentFormConceptId: string = randomUUID();

  /**
   * Identificador asociado a child form concept.
   */
  @PrimaryKey({ fieldName: 'child_form_concept_id', type: 'uuid' })
  childFormConceptId: string = randomUUID();

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
