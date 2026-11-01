import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `conversation_internal_notes`.
 */
@Entity({ schema: 'community', tableName: 'conversation_internal_notes' })
export class ConversationInternalNotes {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a conversation.
   */
  @Property({ fieldName: 'conversation_id', type: 'uuid' }) // FK → community.conversations (inferida)
  conversationId!: string;

  /**
   * Identificador asociado a author user.
   */
  @Property({ fieldName: 'author_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  authorUserId!: string;

  /**
   * Valor de body text mantenido por la instancia.
   */
  @Property({ fieldName: 'body_text', columnType: 'text' })
  bodyText!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
