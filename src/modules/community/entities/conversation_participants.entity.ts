import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `conversation_participants`.
 */
@Entity({ schema: 'community', tableName: 'conversation_participants' })
export class ConversationParticipants {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a conversation.
   */
  @Property({ fieldName: 'conversation_id', type: 'uuid' }) // FK → community.conversations
  conversationId!: string;

  /**
   * Identificador asociado a participant profile.
   */
  @Property({ fieldName: 'participant_profile_id', type: 'uuid' }) // FK → community.public_profiles
  participantProfileId!: string;

  /**
   * Identificador asociado a role concept.
   */
  @Property({ fieldName: 'role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  roleConceptId!: string;

  /**
   * Valor de joined at mantenido por la instancia.
   */
  @Property({
    fieldName: 'joined_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  joinedAt?: Date;

  /**
   * Identificador asociado a last read message.
   */
  @Property({ fieldName: 'last_read_message_id', type: 'uuid', nullable: true }) // FK → community.direct_messages
  lastReadMessageId?: string;

  /**
   * Valor de muted until mantenido por la instancia.
   */
  @Property({
    fieldName: 'muted_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  mutedUntil?: Date;

  /**
   * Cuándo se mandó la última respuesta automática en esta conversación (F4.7).
   *
   * Es la marca del descanso entre avisos, y vive en la fila del participante
   * **que responde**: eso la hace única por (conversación, perfil) sin una
   * tabla de bitácora que diría lo mismo con un join.
   */
  @Property({
    fieldName: 'last_auto_reply_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastAutoReplyAt?: Date;

  /** Marcada como favorita por este participante (F4.4). */
  @Property({ fieldName: 'is_favorite', type: 'boolean', default: false })
  isFavorite: boolean = false;

  /** Fijada arriba de la bandeja de este participante (F4.4). */
  @Property({ fieldName: 'is_pinned', type: 'boolean', default: false })
  isPinned: boolean = false;

  /** Desde cuándo la archivó este participante; `null` si no está archivada. */
  @Property({
    fieldName: 'archived_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  archivedAt?: Date;

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
