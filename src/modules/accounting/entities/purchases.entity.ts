import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'purchases' })
export class Purchases {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ fieldName: 'transaction_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  transactionId?: string;

  @Property({ fieldName: 'vendor_id', type: 'uuid', nullable: true }) // FK → billing.vendors (inferida)
  vendorId?: string;

  @Property({ fieldName: 'bill_id', type: 'uuid', nullable: true }) // FK → billing.bills
  billId?: string;

  @Property({ fieldName: 'purchase_date', columnType: 'date' })
  purchaseDate!: Date;

  @Property({ columnType: 'numeric', nullable: true })
  subtotal?: string;

  @Property({ fieldName: 'tax_total', columnType: 'numeric', nullable: true })
  taxTotal?: string;

  @Property({ columnType: 'numeric', nullable: true })
  total?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
