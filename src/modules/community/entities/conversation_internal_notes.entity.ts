import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Nota interna del equipo sobre una conversación. Nunca la ve el paciente: no
 * viaja en el DTO de mensajes ni en los avisos en tiempo real.
 */
@Entity({ schema: 'community', tableName: 'conversation_internal_notes' })
export class ConversationInternalNotes {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Organización de la bandeja. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Conversación a la que pertenece. */
  @Property({ fieldName: 'conversation_id', type: 'uuid' }) // FK → community.conversations
  conversationId!: string;

  /** Quien la escribió. */
  @Property({ fieldName: 'author_user_id', type: 'uuid' }) // FK → iam.users
  authorUserId!: string;

  /** Texto de la nota. */
  @Property({ fieldName: 'body_text', columnType: 'text' })
  bodyText!: string;

  /** Fecha y hora de creación. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
