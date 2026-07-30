import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `object_integrity_checks`.
 */
@Entity({ schema: 'object_storage', tableName: 'object_integrity_checks' })
export class ObjectIntegrityChecks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a object version.
   */
  @Property({ fieldName: 'object_version_id', type: 'uuid' })
  objectVersionId!: string;

  /**
   * Valor de check type mantenido por la instancia.
   */
  @Property({ fieldName: 'check_type', columnType: 'varchar' })
  checkType!: string;

  /**
   * Valor de expected hash mantenido por la instancia.
   */
  @Property({ fieldName: 'expected_hash', columnType: 'varchar' })
  expectedHash!: string;

  /**
   * Valor de actual hash mantenido por la instancia.
   */
  @Property({ fieldName: 'actual_hash', columnType: 'varchar' })
  actualHash!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de checked at mantenido por la instancia.
   */
  @Property({ fieldName: 'checked_at', columnType: 'timestamptz' })
  checkedAt!: Date;

  /**
   * Identificador asociado a repair job.
   */
  @Property({ fieldName: 'repair_job_id', type: 'uuid' })
  repairJobId!: string;
}
