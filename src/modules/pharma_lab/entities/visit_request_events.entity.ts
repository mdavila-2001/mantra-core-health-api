import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Traza append-only de toda transición de una solicitud de visita: aceptación,
 * rechazo, propuesta de horario, pedido de información, reprogramación y
 * cancelación (spec 5380 «registrar toda modificación y cancelación»).
 *
 * Guarda estado anterior y nuevo para que la bitácora sea legible sin
 * reconstruir la máquina de estados desde cero.
 */
@Entity({ schema: 'pharma_lab', tableName: 'visit_request_events' })
export class VisitRequestEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Solicitud afectada.
   */
  @Property({ fieldName: 'visit_request_id', type: 'uuid' }) // FK → pharma_lab.visit_requests
  visitRequestId!: string;

  /**
   * Acción ejecutada.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /**
   * Estado antes de la acción.
   */
  @Property({ fieldName: 'previous_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  previousStatusConceptId!: string;

  /**
   * Estado después de la acción.
   */
  @Property({ fieldName: 'new_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  newStatusConceptId!: string;

  /**
   * Horario propuesto, cuando la acción es «proponer otro horario».
   */
  @Property({
    fieldName: 'proposed_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  proposedStartAt?: Date;

  /**
   * Nota o motivo de quien ejecuta la acción.
   */
  @Property({ columnType: 'text', nullable: true })
  note?: string;

  /**
   * Quién ejecutó la acción.
   */
  @Property({ fieldName: 'actor_user_id', type: 'uuid' }) // FK → iam.users
  actorUserId!: string;

  /**
   * Momento en que ocurrió.
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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
