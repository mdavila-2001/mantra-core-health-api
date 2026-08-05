import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_study_components`.
 */
@Entity({
  schema: 'diagnostic_units',
  tableName: 'diagnostic_study_components',
})
export class DiagnosticStudyComponents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a parent offering.
   */
  @Property({ fieldName: 'parent_offering_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_study_offerings
  parentOfferingId!: string;

  /**
   * Identificador asociado a component offering.
   */
  @Property({ fieldName: 'component_offering_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_study_offerings
  componentOfferingId!: string;

  /**
   * Identificador asociado a component role concept.
   */
  @Property({ fieldName: 'component_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  componentRoleConceptId!: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  quantity?: string;

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
