import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'medication_requests' })
export class MedicationRequests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({ fieldName: 'medication_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  medicationConceptId!: string;

  @Property({
    fieldName: 'substance_atc_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  substanceAtcConceptId?: string;

  @Property({ fieldName: 'intent_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  intentConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'prescriber_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  prescriberProfileId?: string;

  @Property({ fieldName: 'dose_text', columnType: 'varchar', nullable: true })
  doseText?: string;

  @Property({ fieldName: 'route_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  routeConceptId?: string;

  @Property({
    fieldName: 'frequency_text',
    columnType: 'varchar',
    nullable: true,
  })
  frequencyText?: string;

  @Property({
    fieldName: 'quantity_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  quantityDecimal?: string;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

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
  @Property({ fieldName: 'issued_at', columnType: 'timestamptz', nullable: true })
  issuedAt?: Date;

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
  @Property({ fieldName: 'replaced_by_request_id', type: 'uuid', nullable: true })
  replacedByRequestId?: string;

  /** Receta de la que ESTA es renovación (copia). FK → medication_requests.id */
  @Property({
    fieldName: 'renewed_from_request_id',
    type: 'uuid',
    nullable: true,
  })
  renewedFromRequestId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
