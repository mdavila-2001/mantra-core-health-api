import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'cash_registers' })
export class CashRegisters {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true })
  careSpaceId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  code?: string;

  @Property({ columnType: 'varchar', nullable: true })
  name?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid', nullable: true })
  statusConceptId?: string;

  @Property({
    fieldName: 'currency_code',
    columnType: 'char(3)',
    nullable: true,
  })
  currencyCode?: string;

  @Property({
    fieldName: 'last_opened_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastOpenedAt?: Date;

  @Property({
    fieldName: 'last_closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastClosedAt?: Date;

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
