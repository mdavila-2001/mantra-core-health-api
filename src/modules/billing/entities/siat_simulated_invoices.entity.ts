import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'siat_simulated_invoices' })
export class SiatSimulatedInvoices {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'invoice_id', type: 'uuid' }) // FK → billing.invoices (inferida)
  invoiceId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true })
  encounterId?: string;

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices (inferida)
  practiceId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' })
  patientProfileId!: string;

  @Property({ fieldName: 'issuer_nit', columnType: 'varchar(20)' })
  issuerNit!: string;

  @Property({ fieldName: 'invoice_number', columnType: 'int' })
  invoiceNumber!: number;

  @Property({ columnType: 'varchar(200)' })
  cuf!: string;

  @Property({ columnType: 'varchar(200)' })
  cufd!: string;

  @Property({ fieldName: 'issued_at_text', columnType: 'varchar(23)' })
  issuedAtText!: string;

  @Property({ type: 'json', columnType: 'jsonb' })
  cabecera!: unknown;

  @Property({ type: 'json', columnType: 'jsonb' })
  detalle!: unknown;

  @Property({ columnType: 'text' })
  xml!: string;

  @Property({ fieldName: 'hash_archivo', columnType: 'varchar(64)' })
  hashArchivo!: string;

  @Property({ fieldName: 'compressed_bytes', columnType: 'int' })
  compressedBytes!: number;

  @Property({ columnType: 'varchar(12)' })
  status!: string;

  @Property({ fieldName: 'status_at_reception', columnType: 'varchar(12)' })
  statusAtReception!: string;

  @Property({ fieldName: 'siat_response', type: 'json', columnType: 'jsonb' })
  siatResponse!: unknown;

  @Property({ type: 'json', columnType: 'jsonb' })
  events!: unknown;

  @Property({ type: 'boolean', default: true })
  simulated!: boolean;

  @Property({
    fieldName: 'siat_mode',
    columnType: 'varchar(12)',
    default: 'simulated',
  })
  siatMode!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
