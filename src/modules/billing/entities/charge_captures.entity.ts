import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `charge_captures`.
 */
@Entity({ schema: 'billing', tableName: 'charge_captures' })
export class ChargeCaptures {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices (inferida)
  practiceId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles (inferida)
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters (inferida)
  encounterId?: string;

  /**
   * Identificador asociado a source kind concept.
   */
  @Property({ fieldName: 'source_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  sourceKindConceptId!: string;

  /**
   * Identificador asociado a source ref.
   */
  @Property({ fieldName: 'source_ref_id', type: 'uuid' })
  sourceRefId!: string;

  /**
   * Valor de service date mantenido por la instancia.
   */
  @Property({ fieldName: 'service_date', columnType: 'date' })
  serviceDate!: Date;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces (inferida)
  careSpaceId?: string;

  /**
   * Identificador asociado a bed category concept.
   */
  @Property({
    fieldName: 'bed_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  bedCategoryConceptId?: string;

  /**
   * Identificador asociado a space tariff.
   */
  @Property({ fieldName: 'space_tariff_id', type: 'uuid', nullable: true }) // FK → billing.space_tariffs (inferida)
  spaceTariffId?: string;

  /**
   * Identificador asociado a service catalog.
   */
  @Property({ fieldName: 'service_catalog_id', type: 'uuid', nullable: true }) // FK → billing.service_catalog (inferida)
  serviceCatalogId?: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  quantity!: string;

  /**
   * Valor de unit price mantenido por la instancia.
   */
  @Property({
    fieldName: 'unit_price',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  unitPrice?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  currencyConceptId?: string;

  /**
   * Identificador asociado a cost center.
   */
  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers (inferida)
  costCenterId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Identificador asociado a invoice line.
   */
  @Property({ fieldName: 'invoice_line_id', type: 'uuid', nullable: true }) // FK → billing.invoice_lines (inferida)
  invoiceLineId?: string;

  /**
   * Valor de void reason mantenido por la instancia.
   */
  @Property({ fieldName: 'void_reason', columnType: 'varchar', nullable: true })
  voidReason?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
