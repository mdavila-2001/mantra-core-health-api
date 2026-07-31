import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `medication_requests`.
 */
@Entity({ schema: 'clinical', tableName: 'medication_requests' })
export class MedicationRequests {
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
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  /**
   * Identificador asociado a medication concept.
   */
  @Property({ fieldName: 'medication_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  medicationConceptId!: string;

  /**
   * Identificador asociado a substance atc concept.
   */
  @Property({
    fieldName: 'substance_atc_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  substanceAtcConceptId?: string;

  /**
   * Identificador asociado a intent concept.
   */
  @Property({ fieldName: 'intent_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  intentConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a prescriber profile.
   */
  @Property({
    fieldName: 'prescriber_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  prescriberProfileId?: string;

  /**
   * Valor de dose text mantenido por la instancia.
   */
  @Property({ fieldName: 'dose_text', columnType: 'varchar', nullable: true })
  doseText?: string;

  /**
   * Identificador asociado a route concept.
   */
  @Property({ fieldName: 'route_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  routeConceptId?: string;

  /**
   * Valor de frequency text mantenido por la instancia.
   */
  @Property({
    fieldName: 'frequency_text',
    columnType: 'varchar',
    nullable: true,
  })
  frequencyText?: string;

  /**
   * Valor de quantity decimal mantenido por la instancia.
   */
  @Property({
    fieldName: 'quantity_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  quantityDecimal?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  // --- Inmutabilidad / máquina de estados de receta (REDESA CAN-RX-001..004) ---
  // El modelo no traía columnas de relación entre recetas; se añaden aquí (self-FK
  // lógicas → clinical.medication_requests.id, mismo patrón que
  // procedures.parent_procedure_id) para encadenar corrección/renovación.

  /** Instante en que la receta se selló (DRAFT → ISSUED); a partir de aquí es inmutable. */
  @Property({
    fieldName: 'issued_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  issuedAt?: Date;

  /**
   * Clave de idempotencia de la EMISIÓN (CAN §6). Un reintento de `issue` con la
   * misma clave devuelve la receta ya emitida (replay) sin re-emitir. Nula si se
   * emitió sin clave. UNIQUE parcial (donde no es nula) en la migración.
   */
  @Property({
    fieldName: 'issue_idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  issueIdempotencyKey?: string;

  // --- Firma de receta (REDESA D-05 / CAN-RX, aditivo, fail-safe) -------------
  // La receta no traía columnas de firma; se añaden nullable. Una receta sin
  // firmar tiene ambas en NULL. La emisión solo las exige cuando una política
  // parametrizable vigente (clinical.prescription_signature_policies) lo requiere.

  /** Instante de la firma de la receta (nulo = sin firmar). */
  @Property({
    fieldName: 'signed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signedAt?: Date;

  /** Usuario que firmó la receta. FK → iam.users */
  @Property({ fieldName: 'signed_by_user_id', type: 'uuid', nullable: true })
  signedByUserId?: string;

  /** Motivo de INVALIDATED/REPLACED (obligatorio al invalidar/reemplazar). */
  @Property({
    fieldName: 'status_reason_text',
    columnType: 'varchar',
    nullable: true,
  })
  statusReasonText?: string;

  /** Receta a la que ESTA sustituye (esta es la corrección). FK → medication_requests.id */
  @Property({ fieldName: 'replaces_request_id', type: 'uuid', nullable: true })
  replacesRequestId?: string;

  /** Receta que sustituye a ESTA (esta quedó REPLACED). FK → medication_requests.id */
  @Property({
    fieldName: 'replaced_by_request_id',
    type: 'uuid',
    nullable: true,
  })
  replacedByRequestId?: string;

  /** Receta de la que ESTA es renovación (copia). FK → medication_requests.id */
  @Property({
    fieldName: 'renewed_from_request_id',
    type: 'uuid',
    nullable: true,
  })
  renewedFromRequestId?: string;

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
