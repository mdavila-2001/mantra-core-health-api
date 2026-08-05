import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `delivery_status_transitions`.
 */
@Entity({ schema: 'messaging', tableName: 'delivery_status_transitions' })
export class DeliveryStatusTransitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a from status concept.
   */
  @Property({
    fieldName: 'from_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  fromStatusConceptId?: string;

  /**
   * Identificador asociado a event type concept.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  /**
   * Identificador asociado a to status concept.
   */
  @Property({ fieldName: 'to_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toStatusConceptId!: string;

  /**
   * Identificador asociado a channel type concept.
   */
  @Property({
    fieldName: 'channel_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  channelTypeConceptId?: string;

  /**
   * Valor de allow late event mantenido por la instancia.
   */
  @Property({ fieldName: 'allow_late_event', type: 'boolean' })
  allowLateEvent!: boolean;

  /**
   * Valor de allow after terminal mantenido por la instancia.
   */
  @Property({ fieldName: 'allow_after_terminal', type: 'boolean' })
  allowAfterTerminal!: boolean;

  /**
   * Valor de precedence mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  precedence!: number;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;
}
