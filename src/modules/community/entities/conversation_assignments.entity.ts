import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Asignación de una conversación a la bandeja del equipo de apoyo de un doctor:
 * quién la tomó, en qué estado está y cuándo vence el plazo. Una por conversación.
 */
@Entity({ schema: 'community', tableName: 'conversation_assignments' })
export class ConversationAssignments {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Organización de la bandeja (la del perfil público del doctor). */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Conversación asignada. */
  @Property({ fieldName: 'conversation_id', type: 'uuid' }) // FK → community.conversations
  conversationId!: string;

  /** Doctor a cuyo nombre se atiende. */
  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  /** Persona de apoyo que la tiene. */
  @Property({ fieldName: 'assigned_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedUserId?: string;

  /** Estado (NEW, TAKEN, WAITING_DOCTOR, RESOLVED). */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Vencimiento del plazo de respuesta. */
  @Property({
    fieldName: 'sla_due_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  slaDueAt?: Date;

  /** Fecha y hora de creación. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Fecha y hora de la última actualización. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** Quien la creó. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /** Quien la actualizó por última vez. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /** Versión de la fila (concurrencia optimista). */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
