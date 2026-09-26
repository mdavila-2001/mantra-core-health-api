import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `allergy_intolerances`.
 */
@Entity({ schema: 'clinical', tableName: 'allergy_intolerances' })
export class AllergyIntolerances {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Encuentro en el que se detectó la alergia (P26 / CL-01). Nullable: hay
   * alergias declaradas fuera de una atención, igual que en `conditions`.
   *
   * Columna pendiente en el modelo (`diagram_08_clinical.puml`): la agrega M1
   * junto con `ix_allergy_intolerances_encounter_id`; ver
   * `docs/trabajo/2026-09-26-m3-api-clinica/REPORTE.md` §«Pedidos a M1».
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  /**
   * Identificador asociado a substance concept.
   */
  @Property({ fieldName: 'substance_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  substanceConceptId!: string;

  /**
   * Identificador asociado a type concept.
   */
  @Property({ fieldName: 'type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  typeConceptId?: string;

  /**
   * Identificador asociado a category concept.
   */
  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

  /**
   * Identificador asociado a criticality concept.
   */
  @Property({
    fieldName: 'criticality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  criticalityConceptId?: string;

  /**
   * Identificador asociado a clinical status concept.
   */
  @Property({
    fieldName: 'clinical_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  clinicalStatusConceptId?: string;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({
    fieldName: 'verification_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  verificationStatusConceptId?: string;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;

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
