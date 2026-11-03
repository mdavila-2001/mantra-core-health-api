import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `referrals`.
 */
@Entity({ schema: 'clinical_ext', tableName: 'referrals' })
export class Referrals {
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
   * Identificador asociado a source encounter.
   */
  @Property({ fieldName: 'source_encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  sourceEncounterId?: string;

  /**
   * Identificador asociado a referring profile.
   */
  @Property({ fieldName: 'referring_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  referringProfileId?: string;

  /**
   * Identificador asociado a target profile.
   */
  @Property({ fieldName: 'target_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  targetProfileId?: string;

  /**
   * Identificador asociado a target tenant.
   */
  @Property({ fieldName: 'target_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  targetTenantId?: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  specialtyConceptId?: string;

  /**
   * Identificador asociado a service request.
   */
  @Property({ fieldName: 'service_request_id', type: 'uuid', nullable: true }) // FK → clinical.service_requests
  serviceRequestId?: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /**
   * Identificador asociado a priority concept.
   */
  @Property({ fieldName: 'priority_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  priorityConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Tipo de derivación (tratamiento, consulta, estudio, procedimiento,
   * segunda opinión). Concepto `CEXT.REFERRAL_TYPE_*`.
   */
  @Property({
    fieldName: 'referral_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  referralTypeConceptId?: string;

  /**
   * Servicio puntual del destino al que se deriva.
   */
  @Property({
    fieldName: 'target_service_catalog_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  targetServiceCatalogId?: string;

  /**
   * Valor de valid until mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_until', columnType: 'date', nullable: true })
  validUntil?: Date;

  /**
   * Valor de responded at mantenido por la instancia.
   */
  @Property({
    fieldName: 'responded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  respondedAt?: Date;

  /**
   * Sede u organización médica destino (FK → directory.branches).
   */
  @Property({ fieldName: 'target_branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  targetBranchId?: string;

  /**
   * Doctor u organización destino fuera de la plataforma.
   */
  @Property({
    fieldName: 'target_external_name',
    columnType: 'varchar(200)',
    nullable: true,
  })
  targetExternalName?: string;

  /**
   * Contacto del destino externo.
   */
  @Property({
    fieldName: 'target_external_contact',
    columnType: 'varchar(200)',
    nullable: true,
  })
  targetExternalContact?: string;

  /**
   * Servicio específico pedido.
   */
  @Property({
    fieldName: 'requested_service_text',
    columnType: 'varchar(500)',
    nullable: true,
  })
  requestedServiceText?: string;

  /**
   * Servicio codificado (FK → terminology.catalog_concepts).
   */
  @Property({
    fieldName: 'requested_service_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  requestedServiceConceptId?: string;

  /**
   * Diagnóstico presuntivo o definitivo.
   */
  @Property({ fieldName: 'diagnosis_text', columnType: 'text', nullable: true })
  diagnosisText?: string;

  /**
   * Resumen clínico.
   */
  @Property({
    fieldName: 'clinical_summary',
    columnType: 'text',
    nullable: true,
  })
  clinicalSummary?: string;

  /**
   * Tratamiento realizado antes de derivar.
   */
  @Property({
    fieldName: 'treatment_given_text',
    columnType: 'text',
    nullable: true,
  })
  treatmentGivenText?: string;

  /**
   * Consentimiento informado asociado (FK → consent.treatment_informed_consents).
   */
  @Property({ fieldName: 'informed_consent_id', type: 'uuid', nullable: true }) // FK → consent.treatment_informed_consents
  informedConsentId?: string;

  /**
   * Motivo del rechazo del destino.
   */
  @Property({ fieldName: 'reject_reason', columnType: 'text', nullable: true })
  rejectReason?: string;

  /**
   * Contrarreferencia: lo que el destino devuelve.
   */
  @Property({
    fieldName: 'counter_referral_text',
    columnType: 'text',
    nullable: true,
  })
  counterReferralText?: string;

  /**
   * Cuándo se registró la contrarreferencia.
   */
  @Property({
    fieldName: 'counter_referral_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  counterReferralAt?: Date;

  /**
   * ¿El paciente se traslada físicamente? (v4274)
   */
  @Property({ fieldName: 'transfer_required', type: 'boolean', nullable: true })
  transferRequired?: boolean;

  /**
   * Medio de transporte (CHECK ck_referrals_transport_mode).
   */
  @Property({
    fieldName: 'transport_mode',
    columnType: 'varchar(24)',
    nullable: true,
  })
  transportMode?: string;

  /**
   * Placa o identificación de la unidad, o el detalle de OTHER.
   */
  @Property({
    fieldName: 'transport_detail',
    columnType: 'varchar(200)',
    nullable: true,
  })
  transportDetail?: string;

  /**
   * Familiar o acompañante.
   */
  @Property({
    fieldName: 'companion_name',
    columnType: 'varchar(200)',
    nullable: true,
  })
  companionName?: string;

  /**
   * Parentesco del acompañante.
   */
  @Property({
    fieldName: 'companion_relationship',
    columnType: 'varchar(80)',
    nullable: true,
  })
  companionRelationship?: string;

  /**
   * Teléfono del acompañante.
   */
  @Property({
    fieldName: 'companion_phone',
    columnType: 'varchar(40)',
    nullable: true,
  })
  companionPhone?: string;

  /**
   * Personal de salud que acompaña.
   */
  @Property({
    fieldName: 'escort_professional_name',
    columnType: 'varchar(200)',
    nullable: true,
  })
  escortProfessionalName?: string;

  /**
   * Rol del personal de salud que acompaña.
   */
  @Property({
    fieldName: 'escort_professional_role',
    columnType: 'varchar(80)',
    nullable: true,
  })
  escortProfessionalRole?: string;

  /**
   * Estado del paciente al salir (STABLE, UNSTABLE, CRITICAL).
   */
  @Property({
    fieldName: 'departure_condition',
    columnType: 'varchar(16)',
    nullable: true,
  })
  departureCondition?: string;

  /**
   * Momento de la toma de signos vitales.
   */
  @Property({
    fieldName: 'vitals_recorded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  vitalsRecordedAt?: Date;

  /**
   * Presión sistólica (mmHg), 40–300.
   */
  @Property({
    fieldName: 'vital_systolic_bp',
    columnType: 'smallint',
    nullable: true,
  })
  vitalSystolicBp?: number;

  /**
   * Presión diastólica (mmHg), 20–200, menor que la sistólica.
   */
  @Property({
    fieldName: 'vital_diastolic_bp',
    columnType: 'smallint',
    nullable: true,
  })
  vitalDiastolicBp?: number;

  /**
   * Frecuencia cardiaca (lpm), 20–300.
   */
  @Property({
    fieldName: 'vital_heart_rate',
    columnType: 'smallint',
    nullable: true,
  })
  vitalHeartRate?: number;

  /**
   * Frecuencia respiratoria (rpm), 4–80.
   */
  @Property({
    fieldName: 'vital_respiratory_rate',
    columnType: 'smallint',
    nullable: true,
  })
  vitalRespiratoryRate?: number;

  /**
   * Temperatura (°C), 30.0–45.0.
   */
  @Property({
    fieldName: 'vital_temperature_c',
    columnType: 'numeric(4,1)',
    nullable: true,
  })
  vitalTemperatureC?: string;

  /**
   * Saturación de oxígeno (%), 50–100.
   */
  @Property({
    fieldName: 'vital_oxygen_saturation',
    columnType: 'smallint',
    nullable: true,
  })
  vitalOxygenSaturation?: number;

  /**
   * Escala de Glasgow, 3–15.
   */
  @Property({
    fieldName: 'vital_glasgow',
    columnType: 'smallint',
    nullable: true,
  })
  vitalGlasgow?: number;

  /**
   * Se avisó al receptor antes de salir.
   */
  @Property({
    fieldName: 'receiver_contacted',
    type: 'boolean',
    nullable: true,
  })
  receiverContacted?: boolean;

  /**
   * Quién recibió el aviso.
   */
  @Property({
    fieldName: 'receiver_contact_name',
    columnType: 'varchar(200)',
    nullable: true,
  })
  receiverContactName?: string;

  /**
   * Cuándo se avisó al receptor.
   */
  @Property({
    fieldName: 'receiver_contacted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receiverContactedAt?: Date;

  /**
   * Salida del paciente.
   */
  @Property({
    fieldName: 'departed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  departedAt?: Date;

  /**
   * Llegada del paciente (la registra el destino).
   */
  @Property({
    fieldName: 'arrived_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  arrivedAt?: Date;

  /**
   * Estado del paciente al llegar (STABLE, UNSTABLE, CRITICAL, DECEASED).
   */
  @Property({
    fieldName: 'arrival_condition',
    columnType: 'varchar(16)',
    nullable: true,
  })
  arrivalCondition?: string;

  /**
   * Observaciones de la llegada.
   */
  @Property({ fieldName: 'arrival_notes', columnType: 'text', nullable: true })
  arrivalNotes?: string;

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
