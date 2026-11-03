import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `unit_visit_request_events`.
 */
@Entity({ schema: 'diagnostic_units', tableName: 'unit_visit_request_events' })
export class UnitVisitRequestEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a unit visit request.
   */
  @Property({ fieldName: 'unit_visit_request_id', type: 'uuid' }) // FK → diagnostic_units.unit_visit_requests (inferida)
  unitVisitRequestId!: string;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  actionConceptId!: string;

  /**
   * Identificador asociado a previous status concept.
   */
  @Property({ fieldName: 'previous_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  previousStatusConceptId!: string;

  /**
   * Identificador asociado a new status concept.
   */
  @Property({ fieldName: 'new_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  newStatusConceptId!: string;

  /**
   * Valor de proposed start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'proposed_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  proposedStartAt?: Date;

  /**
   * Valor de note mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  note?: string;

  /**
   * Identificador asociado a actor user.
   */
  @Property({ fieldName: 'actor_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  actorUserId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;
}
