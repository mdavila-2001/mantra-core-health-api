import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'scheduling', tableName: 'booking_policies' })
export class BookingPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'min_notice_minutes',
    columnType: 'int',
    nullable: true,
  })
  minNoticeMinutes?: number;

  @Property({
    fieldName: 'max_advance_days',
    columnType: 'int',
    nullable: true,
  })
  maxAdvanceDays?: number;

  @Property({
    fieldName: 'cancellation_window_minutes',
    columnType: 'int',
    nullable: true,
  })
  cancellationWindowMinutes?: number;

  @Property({
    fieldName: 'no_show_fee_amount',
    columnType: 'numeric',
    nullable: true,
  })
  noShowFeeAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'allow_overbooking', type: 'boolean', nullable: true })
  allowOverbooking?: boolean;

  @Property({
    fieldName: 'max_active_per_patient',
    columnType: 'int',
    nullable: true,
  })
  maxActivePerPatient?: number;

  @Property({
    fieldName: 'hold_ttl_seconds',
    columnType: 'int',
    nullable: true,
  })
  holdTtlSeconds?: number;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
