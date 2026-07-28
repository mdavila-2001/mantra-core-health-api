import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pacu_stays`.
 */
@Entity({ schema: 'procedures_perioperative', tableName: 'pacu_stays' })
export class PacuStays {
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
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces
  careSpaceId!: string;

  /**
   * Valor de admitted at mantenido por la instancia.
   */
  @Property({ fieldName: 'admitted_at', columnType: 'timestamptz' })
  admittedAt!: Date;

  /**
   * Valor de discharged at mantenido por la instancia.
   */
  @Property({
    fieldName: 'discharged_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  dischargedAt?: Date;

  /**
   * Identificador asociado a admitted by profile.
   */
  @Property({
    fieldName: 'admitted_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  admittedByProfileId?: string;

  /**
   * Identificador asociado a discharged by profile.
   */
  @Property({
    fieldName: 'discharged_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  dischargedByProfileId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a discharge destination concept.
   */
  @Property({
    fieldName: 'discharge_destination_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dischargeDestinationConceptId?: string;

  /**
   * Valor de discharge criteria met mantenido por la instancia.
   */
  @Property({
    fieldName: 'discharge_criteria_met',
    type: 'boolean',
    nullable: true,
  })
  dischargeCriteriaMet?: boolean;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  notes?: string;

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
