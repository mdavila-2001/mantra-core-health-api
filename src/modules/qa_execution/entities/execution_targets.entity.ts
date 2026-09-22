import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Destino aprobado por administración para un entorno de QA: el único lugar al que el runner puede llamar.
 */
@Entity({ schema: 'qa_execution', tableName: 'execution_targets' })
export class ExecutionTargets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** FK → qa_lab.test_environments. Un destino por entorno. */
  @Property({ fieldName: 'environment_id', type: 'uuid' })
  environmentId!: string;

  /** http | https */
  @Property({ fieldName: 'scheme', columnType: 'varchar' })
  scheme!: string;

  /** Host exacto (sin comodines). */
  @Property({ fieldName: 'host', columnType: 'varchar' })
  host!: string;

  /** Puerto exacto. */
  @Property({ fieldName: 'port', columnType: 'int' })
  port!: number;

  /** Prefijos de ruta aprobados. */
  @Property({
    fieldName: 'allowed_path_prefixes',
    type: 'json',
    columnType: 'jsonb',
  })
  allowedPathPrefixes!: unknown;

  /** Autoriza conectar a red privada/loopback (nunca link-local ni metadata). */
  @Property({ fieldName: 'allow_private_network', type: 'boolean' })
  allowPrivateNetwork!: boolean;

  /** Admite POST/PUT/PATCH/DELETE (nunca en producción). */
  @Property({ fieldName: 'allow_mutations', type: 'boolean' })
  allowMutations!: boolean;

  /** Nombre de variable QA_TARGET_*; el valor nunca se guarda. */
  @Property({
    fieldName: 'auth_secret_ref',
    columnType: 'varchar',
    nullable: true,
  })
  authSecretRef?: string;

  /** Cabecera donde va el secreto (por defecto Authorization). */
  @Property({
    fieldName: 'auth_header_name',
    columnType: 'varchar',
    nullable: true,
  })
  authHeaderName?: string;

  /** Tope de peticiones por plan. */
  @Property({ fieldName: 'max_requests', columnType: 'int' })
  maxRequests!: number;

  /** Tope de duración por plan. */
  @Property({ fieldName: 'max_duration_seconds', columnType: 'int' })
  maxDurationSeconds!: number;

  /** Timeout por petición. */
  @Property({ fieldName: 'request_timeout_ms', columnType: 'int' })
  requestTimeoutMs!: number;

  /** Separación mínima entre peticiones. */
  @Property({ fieldName: 'min_interval_ms', columnType: 'int' })
  minIntervalMs!: number;

  /** ACTIVE | DISABLED */
  @Property({ fieldName: 'status', columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** FK → iam.users */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  /** FK → iam.users */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
