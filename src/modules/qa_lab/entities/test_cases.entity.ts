import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `test_cases`.
 */
@Entity({ schema: 'qa_lab', tableName: 'test_cases' })
export class TestCases {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a suite.
   */
  @Property({ fieldName: 'suite_id', type: 'uuid' }) // FK → qa_lab.test_suites
  suiteId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a case type concept.
   */
  @Property({ fieldName: 'case_type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  caseTypeConceptId?: string;

  /**
   * Identificador asociado a endpoint.
   */
  @Property({ fieldName: 'endpoint_id', type: 'uuid', nullable: true }) // FK → integrations.integration_endpoints
  endpointId?: string;

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
   * Valor de request path mantenido por la instancia.
   */
  @Property({ fieldName: 'request_path', columnType: 'text', nullable: true })
  requestPath?: string;

  /**
   * Valor de expected http status mantenido por la instancia.
   */
  @Property({
    fieldName: 'expected_http_status',
    columnType: 'int',
    nullable: true,
  })
  expectedHttpStatus?: number;

  /**
   * Valor de setup json mantenido por la instancia.
   */
  @Property({
    fieldName: 'setup_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  setupJson?: unknown;

  /**
   * Valor de teardown json mantenido por la instancia.
   */
  @Property({
    fieldName: 'teardown_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  teardownJson?: unknown;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  /**
   * Valor de is critical mantenido por la instancia.
   */
  @Property({ fieldName: 'is_critical', type: 'boolean', nullable: true })
  isCritical?: boolean;

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
