import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `facility_typology_rules`.
 */
@Entity({ schema: 'practice', tableName: 'facility_typology_rules' })
export class FacilityTypologyRules {
  /**
   * Identificador asociado a typology concept.
   */
  @PrimaryKey({ fieldName: 'typology_concept_id', type: 'uuid' })
  typologyConceptId: string = randomUUID();

  /**
   * Identificador asociado a space function concept.
   */
  @PrimaryKey({ fieldName: 'space_function_concept_id', type: 'uuid' })
  spaceFunctionConceptId: string = randomUUID();

  /**
   * Identificador asociado a rule concept.
   */
  @Property({ fieldName: 'rule_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  ruleConceptId!: string;

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
