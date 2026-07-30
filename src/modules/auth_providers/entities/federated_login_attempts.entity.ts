import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `federated_login_attempts`.
 */
@Entity({ schema: 'auth_providers', tableName: 'federated_login_attempts' })
export class FederatedLoginAttempts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a provider.
   */
  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → auth_providers.identity_providers
  providerId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  /**
   * Valor de external subject mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_subject',
    columnType: 'varchar',
    nullable: true,
  })
  externalSubject?: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  /**
   * Identificador asociado a failure reason concept.
   */
  @Property({
    fieldName: 'failure_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  failureReasonConceptId?: string;

  /**
   * Valor de ip mantenido por la instancia.
   */
  @Property({ columnType: 'inet', nullable: true })
  ip?: string;

  /**
   * Valor de user agent mantenido por la instancia.
   */
  @Property({ fieldName: 'user_agent', columnType: 'varchar', nullable: true })
  userAgent?: string;

  /**
   * Identificador asociado a request.
   */
  @Property({ fieldName: 'request_id', columnType: 'varchar', nullable: true })
  requestId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

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
