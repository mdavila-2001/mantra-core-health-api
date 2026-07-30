import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `anesthesia_plans`.
 */
@Entity({ schema: 'procedures_perioperative', tableName: 'anesthesia_plans' })
export class AnesthesiaPlans {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a procedure case.
   */
  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  /**
   * Identificador asociado a anesthesiologist profile.
   */
  @Property({ fieldName: 'anesthesiologist_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  anesthesiologistProfileId!: string;

  /**
   * Identificador asociado a anesthesia type concept.
   */
  @Property({ fieldName: 'anesthesia_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  anesthesiaTypeConceptId!: string;

  /**
   * Identificador asociado a technique concept.
   */
  @Property({ fieldName: 'technique_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  techniqueConceptId?: string;

  /**
   * Identificador asociado a airway plan concept.
   */
  @Property({
    fieldName: 'airway_plan_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  airwayPlanConceptId?: string;

  /**
   * Valor de monitoring plan json mantenido por la instancia.
   */
  @Property({
    fieldName: 'monitoring_plan_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  monitoringPlanJson?: unknown;

  /**
   * Valor de medications plan json mantenido por la instancia.
   */
  @Property({
    fieldName: 'medications_plan_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  medicationsPlanJson?: unknown;

  /**
   * Valor de fluids plan json mantenido por la instancia.
   */
  @Property({
    fieldName: 'fluids_plan_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  fluidsPlanJson?: unknown;

  /**
   * Valor de blood products plan json mantenido por la instancia.
   */
  @Property({
    fieldName: 'blood_products_plan_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  bloodProductsPlanJson?: unknown;

  /**
   * Valor de postoperative analgesia plan text mantenido por la instancia.
   */
  @Property({
    fieldName: 'postoperative_analgesia_plan_text',
    columnType: 'text',
    nullable: true,
  })
  postoperativeAnalgesiaPlanText?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de approved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

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
