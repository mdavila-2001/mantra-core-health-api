import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_proofs` (C-01).
 *
 * El comprobante que el paciente sube para pagar una consulta: contra el QR
 * bancario estático de la sede o declarando efectivo. El médico lo acepta o lo
 * rechaza con motivo. El cargo de la consulta es el encuentro: no existe
 * `billing.charges`, por eso la referencia es `encounter_id`.
 */
@Entity({ schema: 'billing', tableName: 'payment_proofs' })
export class PaymentProofs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Encuentro que hace de cargo de la consulta.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters
  encounterId!: string;

  /**
   * Tenant dueño del encuentro.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Paciente que presenta el comprobante.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Sede cuyo QR bancario se usó, cuando se conoce.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  /**
   * Método declarado: PM_QR_TRANSFER o PM_CASH.
   */
  @Property({ fieldName: 'method_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  methodConceptId!: string;

  /**
   * Imagen del comprobante; obligatoria cuando el método es QR.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Monto declarado en unidades menores de `currency`.
   */
  @Property({ fieldName: 'amount_minor', type: 'bigint' })
  amountMinor!: string;

  /**
   * Moneda ISO 4217 del monto.
   */
  @Property({ columnType: 'varchar' })
  currency!: string;

  /**
   * Estado: PROOF_PENDING_REVIEW → PROOF_ACCEPTED | PROOF_REJECTED.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Motivo del rechazo; obligatorio cuando el estado es PROOF_REJECTED.
   */
  @Property({
    fieldName: 'rejection_reason',
    columnType: 'text',
    nullable: true,
  })
  rejectionReason?: string;

  /**
   * Usuario que aceptó o rechazó.
   */
  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  reviewedByUserId?: string;

  /**
   * Momento de la revisión.
   */
  @Property({
    fieldName: 'reviewed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reviewedAt?: Date;

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
