import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'procedures_perioperative', tableName: 'pacu_assessments' })
export class PacuAssessments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pacu_stay_id', type: 'uuid' }) // FK → procedures_perioperative.pacu_stays
  pacuStayId!: string;

  @Property({ fieldName: 'assessed_at', columnType: 'timestamptz' })
  assessedAt!: Date;

  @Property({ fieldName: 'assessed_by_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  assessedByProfileId!: string;

  @Property({ fieldName: 'aldrete_score', columnType: 'int', nullable: true })
  aldreteScore?: number;

  @Property({
    fieldName: 'pain_score',
    columnType: 'numeric(8,3)',
    nullable: true,
  })
  painScore?: string;

  @Property({
    fieldName: 'nausea_score',
    columnType: 'numeric(8,3)',
    nullable: true,
  })
  nauseaScore?: string;

  @Property({
    fieldName: 'sedation_score_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  sedationScoreConceptId?: string;

  @Property({
    fieldName: 'airway_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  airwayStatusConceptId?: string;

  @Property({
    fieldName: 'observations_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  observationsJson?: unknown;

  @Property({
    fieldName: 'criteria_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  criteriaJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
