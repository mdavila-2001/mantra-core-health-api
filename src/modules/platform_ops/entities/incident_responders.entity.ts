import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `incident_responders`.
 */
@Entity({ schema: 'platform_ops', tableName: 'incident_responders' })
export class IncidentResponders {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a health incident.
   */
  @Property({ fieldName: 'health_incident_id', type: 'uuid' }) // FK → platform_ops.health_incidents
  healthIncidentId!: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /**
   * Identificador asociado a responder role concept.
   */
  @Property({ fieldName: 'responder_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  responderRoleConceptId!: string;

  /**
   * Valor de joined at mantenido por la instancia.
   */
  @Property({ fieldName: 'joined_at', columnType: 'timestamptz' })
  joinedAt!: Date;

  /**
   * Valor de left at mantenido por la instancia.
   */
  @Property({ fieldName: 'left_at', columnType: 'timestamptz', nullable: true })
  leftAt?: Date;

  /**
   * Valor de acknowledged at mantenido por la instancia.
   */
  @Property({
    fieldName: 'acknowledged_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acknowledgedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
