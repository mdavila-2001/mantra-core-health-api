import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'dicomweb_access_logs' })
export class DicomwebAccessLogs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'principal_id', type: 'uuid' })
  principalId!: string;

  @Property({ columnType: 'varchar' })
  operation!: string;

  @Property({ fieldName: 'study_instance_uid', columnType: 'varchar' })
  studyInstanceUid!: string;

  @Property({
    fieldName: 'series_instance_uid',
    columnType: 'varchar',
    nullable: true,
  })
  seriesInstanceUid?: string;

  @Property({
    fieldName: 'sop_instance_uid',
    columnType: 'varchar',
    nullable: true,
  })
  sopInstanceUid?: string;

  @Property({ fieldName: 'purpose_of_use_code', columnType: 'varchar' })
  purposeOfUseCode!: string;

  @Property({ columnType: 'varchar' })
  outcome!: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;
}
