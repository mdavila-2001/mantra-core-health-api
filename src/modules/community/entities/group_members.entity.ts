import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `group_members`.
 */
@Entity({ schema: 'community', tableName: 'group_members' })
export class GroupMembers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a group.
   */
  @Property({ fieldName: 'group_id', type: 'uuid' }) // FK → community.groups
  groupId!: string;

  /**
   * Identificador asociado a member profile.
   */
  @Property({ fieldName: 'member_profile_id', type: 'uuid' }) // FK → community.public_profiles
  memberProfileId!: string;

  /**
   * Identificador asociado a member role concept.
   */
  @Property({ fieldName: 'member_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberRoleConceptId!: string;

  /**
   * Identificador asociado a join status concept.
   */
  @Property({ fieldName: 'join_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  joinStatusConceptId!: string;

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
   * Identificador asociado a invited by profile.
   */
  @Property({
    fieldName: 'invited_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → community.public_profiles
  invitedByProfileId?: string;

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
