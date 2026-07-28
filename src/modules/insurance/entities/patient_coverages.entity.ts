import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `patient_coverages`.
 */
@Entity({ schema: 'insurance', tableName: 'patient_coverages' })
export class PatientCoverages {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a insurance plan.
   */
  @Property({ fieldName: 'insurance_plan_id', type: 'uuid' }) // FK → insurance.insurance_plans
  insurancePlanId!: string;

  /**
   * Identificador asociado a insurance broker.
   */
  @Property({ fieldName: 'insurance_broker_id', type: 'uuid', nullable: true }) // FK → insurance.insurance_brokers
  insuranceBrokerId?: string;

  /**
   * Identificador asociado a employer group.
   */
  @Property({ fieldName: 'employer_group_id', type: 'uuid', nullable: true }) // FK → insurance.employer_groups
  employerGroupId?: string;

  /**
   * Valor de member identifier mantenido por la instancia.
   */
  @Property({ fieldName: 'member_identifier', columnType: 'varchar' })
  memberIdentifier!: string;

  /**
   * Valor de policy identifier mantenido por la instancia.
   */
  @Property({
    fieldName: 'policy_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  policyIdentifier?: string;

  /**
   * Valor de coverage order mantenido por la instancia.
   */
  @Property({ fieldName: 'coverage_order', columnType: 'int', nullable: true })
  coverageOrder?: number;

  /**
   * Identificador asociado a relationship to subscriber concept.
   */
  @Property({
    fieldName: 'relationship_to_subscriber_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  relationshipToSubscriberConceptId?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'date', nullable: true })
  effectiveFrom?: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_to', columnType: 'date', nullable: true })
  effectiveTo?: Date;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
