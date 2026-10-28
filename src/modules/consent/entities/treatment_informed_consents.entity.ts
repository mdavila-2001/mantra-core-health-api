import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';
import type {
  InformedConsentChannel,
  InformedConsentExceptionType,
  InformedConsentGrantedBy,
  InformedConsentTargetType,
} from '../informed-consent.enums';

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
   * A qué se consiente (v4266): `MEDICATION_REQUEST`, `SERVICE_REQUEST`, `REFERRAL`, `PROCEDURE` o `CARE_PLAN`.
   */
  @Property({
    fieldName: 'target_type',
    columnType: 'varchar(24)',
    nullable: true,
  })
  targetType?: InformedConsentTargetType;

  /**
   * Id del objeto consentido (polimórfico, sin FK física; v4266).
   */
  @Property({ fieldName: 'target_id', type: 'uuid', nullable: true })
  targetId?: string;

  /**
   * Instantánea legible de lo consentido (fármaco y dosis, estudio, servicio derivado…).
   */
  @Property({
    fieldName: 'target_label',
    columnType: 'varchar(300)',
    nullable: true,
  })
  targetLabel?: string;

  /**
   * Diagnóstico que motiva el tratamiento.
   */
  @Property({ fieldName: 'diagnosis_text', columnType: 'text', nullable: true })
  diagnosisText?: string;

  /**
   * Naturaleza y objetivo del tratamiento, estudio o derivación.
   */
  @Property({ fieldName: 'purpose_text', columnType: 'text', nullable: true })
  purposeText?: string;

  /**
   * Beneficios esperados.
   */
  @Property({ fieldName: 'benefits_text', columnType: 'text', nullable: true })
  benefitsText?: string;

  /**
   * Riesgos frecuentes y graves / efectos adversos.
   */
  @Property({ fieldName: 'risks_text', columnType: 'text', nullable: true })
  risksText?: string;

  /**
   * Riesgos personalizados (comorbilidades, situación del paciente).
   */
  @Property({
    fieldName: 'personalized_risks_text',
    columnType: 'text',
    nullable: true,
  })
  personalizedRisksText?: string;

  /**
   * Alternativas disponibles.
   */
  @Property({
    fieldName: 'alternatives_text',
    columnType: 'text',
    nullable: true,
  })
  alternativesText?: string;

  /**
   * Consecuencias previsibles de no aceptar.
   */
  @Property({
    fieldName: 'refusal_consequences_text',
    columnType: 'text',
    nullable: true,
  })
  refusalConsequencesText?: string;

  /**
   * Preguntas del paciente y sus respuestas.
   */
  @Property({
    fieldName: 'patient_questions_text',
    columnType: 'text',
    nullable: true,
  })
  patientQuestionsText?: string;

  /**
   * Quién otorga: `PATIENT`, `LEGAL_REPRESENTATIVE`, `GUARDIAN` o `SUBSTITUTE_RELATIVE`.
   */
  @Property({
    fieldName: 'granted_by',
    columnType: 'varchar(24)',
    nullable: true,
  })
  grantedBy?: InformedConsentGrantedBy;

  /**
   * Nombre del representante (obligatorio si no otorga el titular).
   */
  @Property({
    fieldName: 'representative_name',
    columnType: 'varchar(200)',
    nullable: true,
  })
  representativeName?: string;

  /**
   * Documento del representante (CI u otro).
   */
  @Property({
    fieldName: 'representative_document',
    columnType: 'varchar(60)',
    nullable: true,
  })
  representativeDocument?: string;

  /**
   * Parentesco o calidad del representante.
   */
  @Property({
    fieldName: 'representative_relationship',
    columnType: 'varchar(80)',
    nullable: true,
  })
  representativeRelationship?: string;

  /**
   * Por qué no consiente el titular (minoría de edad, incapacidad).
   */
  @Property({
    fieldName: 'incapacity_reason',
    columnType: 'text',
    nullable: true,
  })
  incapacityReason?: string;

  /**
   * Profesional que informa (FK lógica a `profiles.health_practitioner_profiles`).
   */
  @Property({
    fieldName: 'informed_by_profile_id',
    type: 'uuid',
    nullable: true,
  })
  informedByProfileId?: string;

  /**
   * Canal: `IN_PERSON` o `TELEHEALTH`.
   */
  @Property({
    fieldName: 'channel',
    columnType: 'varchar(16)',
    nullable: true,
  })
  channel?: InformedConsentChannel;

  /**
   * Excepción legal al consentimiento: `EMERGENCY`, `PUBLIC_HEALTH_RISK` o `PATIENT_WAIVER`.
   */
  @Property({
    fieldName: 'exception_type',
    columnType: 'varchar(32)',
    nullable: true,
  })
  exceptionType?: InformedConsentExceptionType;

  /**
   * Justificación de la excepción (obligatoria si hay excepción).
   */
  @Property({
    fieldName: 'exception_justification',
    columnType: 'text',
    nullable: true,
  })
  exceptionJustification?: string;

  /**
   * Motivo de la revocación.
   */
  @Property({
    fieldName: 'withdrawal_reason',
    columnType: 'text',
    nullable: true,
  })
  withdrawalReason?: string;

  /**
   * Testigo que no es usuario de la plataforma (enmienda 1).
   */
  @Property({
    fieldName: 'witness_name',
    columnType: 'varchar(200)',
    nullable: true,
  })
  witnessName?: string;

  /**
   * Documento del testigo externo.
   */
  @Property({
    fieldName: 'witness_document',
    columnType: 'varchar(60)',
    nullable: true,
  })
  witnessDocument?: string;

  /**
   * Idioma en que se brindó la información (por defecto lógico `es`).
   */
  @Property({
    fieldName: 'information_language',
    columnType: 'varchar(40)',
    nullable: true,
  })
  informationLanguage?: string;

  /**
   * Asentimiento del menor o de la persona con discapacidad cuando otorga un representante.
   */
  @Property({ fieldName: 'assent_obtained', type: 'boolean', nullable: true })
  assentObtained?: boolean;

  /**
   * Notas sobre el asentimiento.
   */
  @Property({ fieldName: 'assent_notes', columnType: 'text', nullable: true })
  assentNotes?: string;

  /**
   * Constancia de que se informó el derecho a revocar.
   */
  @Property({
    fieldName: 'revocation_right_informed',
    type: 'boolean',
    nullable: true,
  })
  revocationRightInformed?: boolean;

  /**
   * Cuándo se informó a posteriori tras una excepción `EMERGENCY`.
   */
  @Property({
    fieldName: 'post_emergency_informed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  postEmergencyInformedAt?: Date;

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
