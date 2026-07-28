import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `poll_votes`.
 */
@Entity({ schema: 'community', tableName: 'poll_votes' })
export class PollVotes {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a poll.
   */
  @Property({ fieldName: 'poll_id', type: 'uuid' }) // FK → community.polls
  pollId!: string;

  /**
   * Identificador asociado a poll option.
   */
  @Property({ fieldName: 'poll_option_id', type: 'uuid' }) // FK → community.poll_options
  pollOptionId!: string;

  /**
   * Identificador asociado a voter profile.
   */
  @Property({ fieldName: 'voter_profile_id', type: 'uuid' }) // FK → community.public_profiles
  voterProfileId!: string;

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
