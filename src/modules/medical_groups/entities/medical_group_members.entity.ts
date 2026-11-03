import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

export const MEDICAL_GROUP_MEMBER_INVITATION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const);

/**
 * Define el tipo de dominio medical group member invitation status.
 */
export type MedicalGroupMemberInvitationStatus =
  (typeof MEDICAL_GROUP_MEMBER_INVITATION_STATUS)[keyof typeof MEDICAL_GROUP_MEMBER_INVITATION_STATUS];

/**
 * Mapea la entidad persistente asociada a `medical_groups.group_members`
 * (FT-21): una fila por cargo/función invitado al grupo. La misma fila sirve
 * de "solicitud enviada" (desde el creador) y "solicitud recibida" (desde el
 * profesional invitado) mientras `invitationStatus` sigue en `PENDING`.
 */
@Entity({ schema: 'medical_groups', tableName: 'group_members' })
export class MedicalGroupMembers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a group.
   */
  @Property({ fieldName: 'group_id', type: 'uuid' }) // FK → medical_groups.groups
  groupId!: string;

  /**
   * Identificador asociado a practitioner profile.
   */
  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  /** Cargo/función dentro del grupo (texto libre — ver known_gaps del carril). */
  @Property({ fieldName: 'role_title', columnType: 'varchar' })
  roleTitle!: string;

  /**
   * Valor de agreed payment amount mantenido por la instancia.
   */
  @Property({ fieldName: 'agreed_payment_amount', columnType: 'numeric' })
  agreedPaymentAmount!: string;

  /**
   * Identificador asociado a agreed payment currency concept.
   */
  @Property({
    fieldName: 'agreed_payment_currency_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  agreedPaymentCurrencyConceptId?: string;

  /** Adicionales de términos y condiciones opcionales para este cargo (AC-21-14). */
  @Property({
    fieldName: 'additional_terms_text',
    columnType: 'text',
    nullable: true,
  })
  additionalTermsText?: string;

  /** El creador del grupo también es un miembro (siempre `ACCEPTED`). */
  @Property({ fieldName: 'is_creator', type: 'boolean' })
  isCreator!: boolean;

  /**
   * Valor de invitation status mantenido por la instancia.
   */
  @Property({ fieldName: 'invitation_status', columnType: 'varchar' })
  invitationStatus!: MedicalGroupMemberInvitationStatus;

  /**
   * Valor de responded at mantenido por la instancia.
   */
  @Property({
    fieldName: 'responded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  respondedAt?: Date;

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
