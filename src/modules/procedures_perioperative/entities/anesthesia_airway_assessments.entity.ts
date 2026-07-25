import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'anesthesia_airway_assessments',
})
export class AnesthesiaAirwayAssessments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'anesthesia_plan_id', type: 'uuid' }) // FK → procedures_perioperative.anesthesia_plans
  anesthesiaPlanId!: string;

  @Property({ fieldName: 'assessed_at', columnType: 'timestamptz' })
  assessedAt!: Date;

  @Property({ fieldName: 'assessed_by_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  assessedByProfileId!: string;

  @Property({
    fieldName: 'mallampati_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  mallampatiConceptId?: string;

  @Property({
    fieldName: 'mouth_opening_mm',
    columnType: 'numeric(8,2)',
    nullable: true,
  })
  mouthOpeningMm?: string;

  @Property({
    fieldName: 'thyromental_distance_mm',
    columnType: 'numeric(8,2)',
    nullable: true,
  })
  thyromentalDistanceMm?: string;

  @Property({
    fieldName: 'neck_mobility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  neckMobilityConceptId?: string;

  @Property({
    fieldName: 'dentition_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dentitionStatusConceptId?: string;

  @Property({
    fieldName: 'difficult_airway_expected',
    type: 'boolean',
    nullable: true,
  })
  difficultAirwayExpected?: boolean;

  @Property({
    fieldName: 'rescue_plan_text',
    columnType: 'text',
    nullable: true,
  })
  rescuePlanText?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
