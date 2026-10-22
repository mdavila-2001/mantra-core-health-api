import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `quotations` (FT-24 — Creación de
 * cotizaciones). Congela (snapshot) el nombre del servicio y las condiciones
 * ofertadas al momento de crear la cotización: si el catálogo cambia después,
 * la cotización ya emitida no se ve afectada.
 */
@Entity({ schema: 'billing', tableName: 'quotations' })
export class Quotations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador del profesional que arma la cotización.
   */
  @Property({ fieldName: 'created_by_practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  createdByPractitionerProfileId!: string;

  /**
   * Fecha de atención sobre la que se cotiza.
   */
  @Property({ fieldName: 'attention_date', columnType: 'date' })
  attentionDate!: Date;

  /**
   * Cita asociada, opcional. Sin FK dura: `scheduling` no participa del
   * modelo canónico de `billing` y una referencia obligatoria crearía un
   * anillo de datos entre módulos.
   */
  @Property({ fieldName: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId?: string;

  /**
   * Servicio del catálogo cotizado.
   */
  @Property({ fieldName: 'service_catalog_id', type: 'uuid' }) // FK → billing.service_catalog
  serviceCatalogId!: string;

  /**
   * Nombre del servicio, copiado del catálogo al momento de crear la
   * cotización (snapshot para trazabilidad).
   */
  @Property({ fieldName: 'service_name_snapshot', columnType: 'varchar' })
  serviceNameSnapshot!: string;

  /**
   * Precio ofrecido al paciente; editable respecto del precio de catálogo.
   */
  @Property({ fieldName: 'offered_price', columnType: 'numeric' })
  offeredPrice!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Cantidad de cuotas del plan de pagos ofrecido.
   */
  @Property({ fieldName: 'payment_plan_installment_count', columnType: 'int' })
  paymentPlanInstallmentCount!: number;

  /**
   * Anticipo: lo que se paga el día de la atención, entre 0 y el precio ofrecido. Sin interés (v4.2.18).
   */
  @Property({ fieldName: 'down_payment_amount', columnType: 'numeric' })
  downPaymentAmount!: string;

  /**
   * Frecuencia con que se armó el cronograma: `WEEKLY`, `BIWEEKLY` o `MONTHLY`. Sólo el punto de partida: cada cuota guarda su propia fecha.
   */
  @Property({ fieldName: 'payment_frequency', columnType: 'varchar' })
  paymentFrequency!: string;

  /**
   * Fecha hasta la que la oferta es válida.
   */
  @Property({ fieldName: 'valid_until', columnType: 'date' })
  validUntil!: Date;

  /**
   * Estado de la cotización (reusa los conceptos `STATE_*` de terminology).
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
