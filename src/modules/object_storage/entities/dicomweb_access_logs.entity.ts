import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dicomweb_access_logs`.
 */
@Entity({ schema: 'object_storage', tableName: 'dicomweb_access_logs' })
export class DicomwebAccessLogs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a principal.
   */
  @Property({ fieldName: 'principal_id', type: 'uuid' })
  principalId!: string;

  /**
   * Valor de operation mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  operation!: string;

  /**
   * Valor de study instance uid mantenido por la instancia.
   */
  @Property({ fieldName: 'study_instance_uid', columnType: 'varchar' })
  studyInstanceUid!: string;

  /**
   * Valor de series instance uid mantenido por la instancia.
   */
  @Property({
    fieldName: 'series_instance_uid',
    columnType: 'varchar',
    nullable: true,
  })
  seriesInstanceUid?: string;

  /**
   * Valor de sop instance uid mantenido por la instancia.
   */
  @Property({
    fieldName: 'sop_instance_uid',
    columnType: 'varchar',
    nullable: true,
  })
  sopInstanceUid?: string;

  /**
   * Valor de purpose of use code mantenido por la instancia.
   */
  @Property({ fieldName: 'purpose_of_use_code', columnType: 'varchar' })
  purposeOfUseCode!: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  outcome!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;
}
