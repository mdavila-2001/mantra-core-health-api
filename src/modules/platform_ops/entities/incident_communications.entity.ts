import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `incident_communications`.
 */
@Entity({ schema: 'platform_ops', tableName: 'incident_communications' })
export class IncidentCommunications {
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
   * Identificador asociado a communication type concept.
   */
  @Property({ fieldName: 'communication_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  communicationTypeConceptId!: string;

  /**
   * Identificador asociado a audience concept.
   */
  @Property({ fieldName: 'audience_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  audienceConceptId!: string;

  /**
   * Valor de published at mantenido por la instancia.
   */
  @Property({ fieldName: 'published_at', columnType: 'timestamptz' })
  publishedAt!: Date;

  /**
   * Identificador asociado a published by user.
   */
  @Property({ fieldName: 'published_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  publishedByUserId?: string;

  /**
   * Valor de message text mantenido por la instancia.
   */
  @Property({ fieldName: 'message_text', columnType: 'text' })
  messageText!: string;

  /**
   * Valor de channel reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'channel_reference',
    columnType: 'varchar',
    nullable: true,
  })
  channelReference?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
