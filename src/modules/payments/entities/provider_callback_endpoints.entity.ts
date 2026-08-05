import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_callback_endpoints`.
 */
@Entity({ schema: 'payments', tableName: 'provider_callback_endpoints' })
export class ProviderCallbackEndpoints {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a gateway connection.
   */
  @Property({ fieldName: 'gateway_connection_id', type: 'uuid' }) // FK → payments.gateway_connections
  gatewayConnectionId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de callback path mantenido por la instancia.
   */
  @Property({ fieldName: 'callback_path', columnType: 'varchar' })
  callbackPath!: string;

  /**
   * Identificador asociado a verification method concept.
   */
  @Property({ fieldName: 'verification_method_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationMethodConceptId!: string;

  /**
   * Identificador asociado a verification secret.
   */
  @Property({
    fieldName: 'verification_secret_id',
    type: 'uuid',
    nullable: true,
  }) // FK → system_ops.encryption_keys
  verificationSecretId?: string;

  /**
   * Valor de allowed source cidrs json mantenido por la instancia.
   */
  @Property({
    fieldName: 'allowed_source_cidrs_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  allowedSourceCidrsJson?: unknown;

  /**
   * Valor de replay window seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'replay_window_seconds',
    columnType: 'int',
    nullable: true,
  })
  replayWindowSeconds?: number;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
