import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `practitioner_admission_events`: la
 * bitácora APPEND-ONLY de una admisión (v4.2.67). La base rechaza UPDATE y
 * DELETE, así que esta entidad no tiene versión ni auditoría de edición.
 */
@Entity({ schema: 'profiles', tableName: 'practitioner_admission_events' })
export class PractitionerAdmissionEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Admisión a la que pertenece el evento.
   */
  @Property({ fieldName: 'admission_id', type: 'uuid' }) // FK (destino no resuelto)
  admissionId!: string;

  /**
   * Qué ocurrió.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  eventTypeConceptId!: string;

  /**
   * Estado de la admisión antes del evento.
   */
  @Property({
    fieldName: 'from_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  fromStatusConceptId?: string;

  /**
   * Estado de la admisión después del evento.
   */
  @Property({ fieldName: 'to_status_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  toStatusConceptId?: string;

  /**
   * Clase de ficha a la que se refiere el evento.
   */
  @Property({ fieldName: 'item_type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  itemTypeConceptId?: string;

  /**
   * Ficha a la que se refiere el evento.
   */
  @Property({ fieldName: 'item_id', type: 'uuid', nullable: true })
  itemId?: string;

  /**
   * Requisito del catálogo al que se refiere el evento.
   */
  @Property({ fieldName: 'requirement_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  requirementId?: string;

  /**
   * Fuente consultada, cuando el evento verifica un ítem.
   */
  @Property({
    fieldName: 'verification_source_uri',
    columnType: 'text',
    nullable: true,
  })
  verificationSourceUri?: string;

  /**
   * Código estructurado del motivo.
   */
  @Property({
    fieldName: 'reason_code_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  reasonCodeConceptId?: string;

  /**
   * Motivo declarado por quien actuó.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /**
   * Quién actuó (la cuenta de sistema en las acciones automáticas).
   */
  @Property({ fieldName: 'actor_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  actorUserId?: string;

  /**
   * Rol con el que actuó (SECURITY_ADMIN, ADMISSIONS_APPROVER, SYSTEM…).
   */
  @Property({
    fieldName: 'actor_role_code',
    columnType: 'varchar',
    nullable: true,
  })
  actorRoleCode?: string;

  /**
   * Petición HTTP que originó el evento.
   */
  @Property({ fieldName: 'request_id', type: 'uuid', nullable: true })
  requestId?: string;

  /**
   * Cuándo ocurrió.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;
}
