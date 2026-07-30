import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `anesthesia_airway_assessments`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'anesthesia_airway_assessments',
})
export class AnesthesiaAirwayAssessments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a anesthesia plan.
   */
  @Property({ fieldName: 'anesthesia_plan_id', type: 'uuid' }) // FK → procedures_perioperative.anesthesia_plans
  anesthesiaPlanId!: string;

  /**
   * Valor de assessed at mantenido por la instancia.
   */
  @Property({ fieldName: 'assessed_at', columnType: 'timestamptz' })
  assessedAt!: Date;

  /**
   * Identificador asociado a assessed by profile.
   */
  @Property({ fieldName: 'assessed_by_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  assessedByProfileId!: string;

  /**
   * Identificador asociado a mallampati concept.
   */
  @Property({
    fieldName: 'mallampati_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  mallampatiConceptId?: string;

  /**
   * Valor de mouth opening mm mantenido por la instancia.
   */
  @Property({
    fieldName: 'mouth_opening_mm',
    columnType: 'numeric(8,2)',
    nullable: true,
  })
  mouthOpeningMm?: string;

  /**
   * Valor de thyromental distance mm mantenido por la instancia.
   */
  @Property({
    fieldName: 'thyromental_distance_mm',
    columnType: 'numeric(8,2)',
    nullable: true,
  })
  thyromentalDistanceMm?: string;

  /**
   * Identificador asociado a neck mobility concept.
   */
  @Property({
    fieldName: 'neck_mobility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  neckMobilityConceptId?: string;

  /**
   * Identificador asociado a dentition status concept.
   */
  @Property({
    fieldName: 'dentition_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dentitionStatusConceptId?: string;

  /**
   * Valor de difficult airway expected mantenido por la instancia.
   */
  @Property({
    fieldName: 'difficult_airway_expected',
    type: 'boolean',
    nullable: true,
  })
  difficultAirwayExpected?: boolean;

  /**
   * Valor de rescue plan text mantenido por la instancia.
   */
  @Property({
    fieldName: 'rescue_plan_text',
    columnType: 'text',
    nullable: true,
  })
  rescuePlanText?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
