import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `account_lockouts`.
 */
@Entity({ schema: 'iam', tableName: 'account_lockouts' })
export class AccountLockouts {
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
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  /**
   * Valor de failed attempts mantenido por la instancia.
   */
  @Property({ fieldName: 'failed_attempts', columnType: 'int', nullable: true })
  failedAttempts?: number;

  /**
   * Valor de locked at mantenido por la instancia.
   */
  @Property({
    fieldName: 'locked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lockedAt?: Date;

  /**
   * Valor de locked until mantenido por la instancia.
   */
  @Property({
    fieldName: 'locked_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  lockedUntil?: Date;

  /**
   * Valor de unlocked at mantenido por la instancia.
   */
  @Property({
    fieldName: 'unlocked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  unlockedAt?: Date;

  /**
   * Identificador asociado a unlocked by user.
   */
  @Property({ fieldName: 'unlocked_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  unlockedByUserId?: string;

  /**
   * Valor de source ip mantenido por la instancia.
   */
  @Property({ fieldName: 'source_ip', columnType: 'varchar', nullable: true })
  sourceIp?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
