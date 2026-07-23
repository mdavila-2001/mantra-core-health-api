import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'asset_depreciations' })
export class AssetDepreciations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'asset_id', type: 'uuid' }) // FK → accounting.assets
  assetId!: string;

  @Property({ fieldName: 'fiscal_period_id', type: 'uuid' }) // FK → accounting.fiscal_periods
  fiscalPeriodId!: string;

  @Property({ columnType: 'numeric' })
  amount!: string;

  @Property({
    fieldName: 'book_value_after',
    columnType: 'numeric',
    nullable: true,
  })
  bookValueAfter?: string;

  @Property({ fieldName: 'transaction_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  transactionId?: string;

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
