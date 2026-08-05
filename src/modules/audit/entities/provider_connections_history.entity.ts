import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_connections_history`.
 */
@Entity({ schema: 'audit', tableName: 'provider_connections_history' })
export class ProviderConnectionsHistory {
  /**
   * Identificador asociado a history.
   */
  @PrimaryKey({ fieldName: 'history_id', type: 'uuid' })
  historyId: string = randomUUID();

  /**
   * Identificador asociado a provider connection.
   */
  @Property({ fieldName: 'provider_connection_id', type: 'uuid' }) // FK → integrations.provider_connections
  providerConnectionId!: string;

  /**
   * Valor de revision no mantenido por la instancia.
   */
  @Property({ fieldName: 'revision_no', columnType: 'int' })
  revisionNo!: number;

  /**
   * Identificador asociado a operation concept.
   */
  @Property({ fieldName: 'operation_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  operationConceptId!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  /**
   * Valor de data snapshot mantenido por la instancia.
   */
  @Property({ fieldName: 'data_snapshot', type: 'json', columnType: 'jsonb' })
  dataSnapshot!: unknown;

  /**
   * Identificador asociado a changed by user.
   */
  @Property({ fieldName: 'changed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  changedByUserId?: string;

  /**
   * Identificador asociado a change reason concept.
   */
  @Property({
    fieldName: 'change_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  changeReasonConceptId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
