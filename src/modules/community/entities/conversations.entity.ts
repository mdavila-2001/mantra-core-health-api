import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `conversations`.
 */
@Entity({ schema: 'community', tableName: 'conversations' })
export class Conversations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a conversation type concept.
   */
  @Property({ fieldName: 'conversation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  conversationTypeConceptId!: string;

  /**
   * Identificador asociado a group.
   */
  @Property({ fieldName: 'group_id', type: 'uuid', nullable: true }) // FK → community.groups
  groupId?: string;

  /**
   * Valor de last message at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_message_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastMessageAt?: Date;

  /**
   * Valor de message count mantenido por la instancia.
   */
  @Property({ fieldName: 'message_count', columnType: 'int', nullable: true })
  messageCount?: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
