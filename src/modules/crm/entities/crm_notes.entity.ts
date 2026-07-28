import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_notes`.
 */
@Entity({ schema: 'crm', tableName: 'crm_notes' })
export class CrmNotes {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a crm activity.
   */
  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  /**
   * Valor de note text mantenido por la instancia.
   */
  @Property({ fieldName: 'note_text', columnType: 'text' })
  noteText!: string;

  /**
   * Valor de is private mantenido por la instancia.
   */
  @Property({ fieldName: 'is_private', type: 'boolean', nullable: true })
  isPrivate?: boolean;

  /**
   * Valor de is pinned mantenido por la instancia.
   */
  @Property({ fieldName: 'is_pinned', type: 'boolean', nullable: true })
  isPinned?: boolean;

  /**
   * Identificador asociado a document file.
   */
  @Property({ fieldName: 'document_file_id', type: 'uuid', nullable: true }) // FK → common.files
  documentFileId?: string;

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
