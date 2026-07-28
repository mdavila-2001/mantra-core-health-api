import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `integration_endpoints`.
 */
@Entity({ schema: 'integrations', tableName: 'integration_endpoints' })
export class IntegrationEndpoints {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a provider.
   */
  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → integrations.external_providers
  providerId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de operation mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  operation!: string;

  /**
   * Identificador asociado a http method concept.
   */
  @Property({
    fieldName: 'http_method_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  httpMethodConceptId?: string;

  /**
   * Valor de path mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  path?: string;

  /**
   * Valor de request schema json mantenido por la instancia.
   */
  @Property({
    fieldName: 'request_schema_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  requestSchemaJson?: unknown;

  /**
   * Valor de response schema json mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_schema_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  responseSchemaJson?: unknown;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  version!: string;

  /**
   * Valor de timeout ms mantenido por la instancia.
   */
  @Property({ fieldName: 'timeout_ms', columnType: 'int', nullable: true })
  timeoutMs?: number;

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
