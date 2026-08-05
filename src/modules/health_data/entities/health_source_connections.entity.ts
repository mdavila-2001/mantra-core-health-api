import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_source_connections`.
 */
@Entity({ schema: 'health_data', tableName: 'health_source_connections' })
export class HealthSourceConnections {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a health source system.
   */
  @Property({ fieldName: 'health_source_system_id', type: 'uuid' }) // FK → health_data.health_source_systems
  healthSourceSystemId!: string;

  /**
   * Identificador asociado a connection type concept.
   */
  @Property({ fieldName: 'connection_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  connectionTypeConceptId!: string;

  /**
   * Valor de endpoint uri mantenido por la instancia.
   */
  @Property({ fieldName: 'endpoint_uri', columnType: 'varchar' })
  endpointUri!: string;

  /**
   * Identificador asociado a credential.
   */
  @Property({ fieldName: 'credential_id', type: 'uuid', nullable: true }) // FK → integrations.provider_credentials
  credentialId?: string;

  /**
   * Identificador asociado a network policy.
   */
  @Property({ fieldName: 'network_policy_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  networkPolicyId?: string;

  /**
   * Identificador asociado a format concept.
   */
  @Property({ fieldName: 'format_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  formatConceptId?: string;

  /**
   * Valor de poll schedule mantenido por la instancia.
   */
  @Property({
    fieldName: 'poll_schedule',
    columnType: 'varchar',
    nullable: true,
  })
  pollSchedule?: string;

  /**
   * Identificador asociado a cursor strategy concept.
   */
  @Property({
    fieldName: 'cursor_strategy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  cursorStrategyConceptId?: string;

  /**
   * Valor de last success at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_success_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSuccessAt?: Date;

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
