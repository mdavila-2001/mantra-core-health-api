import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `siat_simulated_invoices`.
 */
@Entity({ schema: 'billing', tableName: 'siat_simulated_invoices' })
export class SiatSimulatedInvoices {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a invoice.
   */
  @Property({ fieldName: 'invoice_id', type: 'uuid' }) // FK → billing.invoices
  invoiceId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true })
  encounterId?: string;

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de issuer nit mantenido por la instancia.
   */
  @Property({ fieldName: 'issuer_nit', columnType: 'varchar(20)' })
  issuerNit!: string;

  /**
   * Valor de invoice number mantenido por la instancia.
   */
  @Property({ fieldName: 'invoice_number', columnType: 'int' })
  invoiceNumber!: number;

  /**
   * Valor de cuf mantenido por la instancia.
   */
  @Property({ columnType: 'varchar(200)' })
  cuf!: string;

  /**
   * Valor de cufd mantenido por la instancia.
   */
  @Property({ columnType: 'varchar(200)' })
  cufd!: string;

  /**
   * Valor de issued at text mantenido por la instancia.
   */
  @Property({ fieldName: 'issued_at_text', columnType: 'varchar(23)' })
  issuedAtText!: string;

  /**
   * Valor de cabecera mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb' })
  cabecera!: unknown;

  /**
   * Valor de detalle mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb' })
  detalle!: unknown;

  /**
   * Valor de xml mantenido por la instancia.
   */
  @Property({ columnType: 'text' })
  xml!: string;

  /**
   * Valor de hash archivo mantenido por la instancia.
   */
  @Property({ fieldName: 'hash_archivo', columnType: 'varchar(64)' })
  hashArchivo!: string;

  /**
   * Valor de compressed bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'compressed_bytes', columnType: 'int' })
  compressedBytes!: number;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar(12)' })
  status!: string;

  /**
   * Valor de status at reception mantenido por la instancia.
   */
  @Property({ fieldName: 'status_at_reception', columnType: 'varchar(12)' })
  statusAtReception!: string;

  /**
   * Valor de siat response mantenido por la instancia.
   */
  @Property({ fieldName: 'siat_response', type: 'json', columnType: 'jsonb' })
  siatResponse!: unknown;

  /**
   * Valor de events mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb' })
  events!: unknown;

  /**
   * Valor de simulated mantenido por la instancia.
   */
  @Property({ type: 'boolean', default: true })
  simulated!: boolean;

  /**
   * Valor de siat mode mantenido por la instancia.
   */
  @Property({
    fieldName: 'siat_mode',
    columnType: 'varchar(12)',
    default: 'simulated',
  })
  siatMode: 'simulated' | 'real' = 'simulated';

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
