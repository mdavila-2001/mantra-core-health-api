import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `audit_log`.
 */
@Entity({ schema: 'audit', tableName: 'audit_log' })
export class AuditLog {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a branch.
   */
  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  /**
   * Valor de action mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  action!: string;

  /**
   * Valor de entity mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  entity!: string;

  /**
   * Identificador asociado a entity.
   */
  @Property({ fieldName: 'entity_id', type: 'uuid', nullable: true })
  entityId?: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  /**
   * Valor de ip mantenido por la instancia.
   */
  @Property({ columnType: 'inet', nullable: true })
  ip?: string;

  /**
   * Identificador asociado a device.
   */
  @Property({ fieldName: 'device_id', type: 'uuid', nullable: true }) // FK → iam.devices
  deviceId?: string;

  /**
   * Valor de previous hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'previous_hash',
    columnType: 'varchar',
    nullable: true,
  })
  previousHash?: string;

  /**
   * Valor de record hash mantenido por la instancia.
   */
  @Property({ fieldName: 'record_hash', columnType: 'varchar' })
  recordHash!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
