import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `observation_reference_ranges`.
 */
@Entity({ schema: 'clinical', tableName: 'observation_reference_ranges' })
export class ObservationReferenceRanges {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a observation.
   */
  @Property({ fieldName: 'observation_id', type: 'uuid' }) // FK → clinical.observations
  observationId!: string;

  /**
   * Identificador asociado a observation component.
   */
  @Property({
    fieldName: 'observation_component_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.observation_components
  observationComponentId?: string;

  /**
   * Valor de low value mantenido por la instancia.
   */
  @Property({ fieldName: 'low_value', columnType: 'numeric', nullable: true })
  lowValue?: string;

  /**
   * Valor de high value mantenido por la instancia.
   */
  @Property({ fieldName: 'high_value', columnType: 'numeric', nullable: true })
  highValue?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  /**
   * Identificador asociado a type concept.
   */
  @Property({ fieldName: 'type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  typeConceptId?: string;

  /**
   * Identificador asociado a applies to concept.
   */
  @Property({
    fieldName: 'applies_to_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  appliesToConceptId?: string;

  /**
   * Valor de age low years mantenido por la instancia.
   */
  @Property({
    fieldName: 'age_low_years',
    columnType: 'numeric',
    nullable: true,
  })
  ageLowYears?: string;

  /**
   * Valor de age high years mantenido por la instancia.
   */
  @Property({
    fieldName: 'age_high_years',
    columnType: 'numeric',
    nullable: true,
  })
  ageHighYears?: string;

  /**
   * Valor de text mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  text?: string;

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
