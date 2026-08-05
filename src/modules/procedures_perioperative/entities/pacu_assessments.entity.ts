import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pacu_assessments`.
 */
@Entity({ schema: 'procedures_perioperative', tableName: 'pacu_assessments' })
export class PacuAssessments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pacu stay.
   */
  @Property({ fieldName: 'pacu_stay_id', type: 'uuid' }) // FK → procedures_perioperative.pacu_stays
  pacuStayId!: string;

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
   * Valor de aldrete score mantenido por la instancia.
   */
  @Property({ fieldName: 'aldrete_score', columnType: 'int', nullable: true })
  aldreteScore?: number;

  /**
   * Valor de pain score mantenido por la instancia.
   */
  @Property({
    fieldName: 'pain_score',
    columnType: 'numeric(8,3)',
    nullable: true,
  })
  painScore?: string;

  /**
   * Valor de nausea score mantenido por la instancia.
   */
  @Property({
    fieldName: 'nausea_score',
    columnType: 'numeric(8,3)',
    nullable: true,
  })
  nauseaScore?: string;

  /**
   * Identificador asociado a sedation score concept.
   */
  @Property({
    fieldName: 'sedation_score_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  sedationScoreConceptId?: string;

  /**
   * Identificador asociado a airway status concept.
   */
  @Property({
    fieldName: 'airway_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  airwayStatusConceptId?: string;

  /**
   * Valor de observations json mantenido por la instancia.
   */
  @Property({
    fieldName: 'observations_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  observationsJson?: unknown;

  /**
   * Valor de criteria json mantenido por la instancia.
   */
  @Property({
    fieldName: 'criteria_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  criteriaJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
