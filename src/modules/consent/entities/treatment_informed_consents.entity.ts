import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `treatment_informed_consents`.
 */
@Entity({ schema: 'consent', tableName: 'treatment_informed_consents' })
export class TreatmentInformedConsents {
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
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters
  encounterId!: string;

  /**
   * Identificador asociado a procedure code concept.
   */
  @Property({
    fieldName: 'procedure_code_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  procedureCodeConceptId?: string;

  /**
   * Valor de information version mantenido por la instancia.
   */
  @Property({
    fieldName: 'information_version',
    columnType: 'varchar',
    nullable: true,
  })
  informationVersion?: string;

  /**
   * Identificador asociado a interpreter user.
   */
  @Property({ fieldName: 'interpreter_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  interpreterUserId?: string;

  /**
   * Identificador asociado a witness user.
   */
  @Property({ fieldName: 'witness_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  witnessUserId?: string;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de signed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'signed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signedAt?: Date;

  /**
   * Valor de withdrawn at mantenido por la instancia.
   */
  @Property({
    fieldName: 'withdrawn_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  withdrawnAt?: Date;

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
