import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'inpatient_census_adjustments' })
export class InpatientCensusAdjustments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'census_day_id', type: 'uuid' }) // FK (destino no resuelto)
  censusDayId!: string;

  @Property({ fieldName: 'field_code', columnType: 'varchar' })
  fieldCode!: string;

  @Property({ fieldName: 'previous_value', columnType: 'int' })
  previousValue!: number;

  @Property({ fieldName: 'new_value', columnType: 'int' })
  newValue!: number;

  @Property({ fieldName: 'reason_text', columnType: 'text' })
  reasonText!: string;

  @Property({ fieldName: 'entry_ref_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  entryRefId?: string;

  @Property({ fieldName: 'adjusted_by_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  adjustedByUserId!: string;

  @Property({ fieldName: 'request_id', columnType: 'varchar', nullable: true })
  requestId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
