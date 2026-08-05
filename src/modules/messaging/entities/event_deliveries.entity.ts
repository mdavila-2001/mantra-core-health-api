import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `event_deliveries`.
 */
@Entity({ schema: 'messaging', tableName: 'event_deliveries' })
export class EventDeliveries {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a domain event.
   */
  @Property({ fieldName: 'domain_event_id', type: 'uuid' }) // FK → messaging.domain_events
  domainEventId!: string;

  /**
   * Identificador asociado a subscription.
   */
  @Property({ fieldName: 'subscription_id', type: 'uuid' }) // FK → payments.subscriptions
  subscriptionId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  /**
   * Valor de handled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'handled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  handledAt?: Date;

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
