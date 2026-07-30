import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_case_comments`.
 */
@Entity({ schema: 'crm', tableName: 'crm_case_comments' })
export class CrmCaseComments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a crm case.
   */
  @Property({ fieldName: 'crm_case_id', type: 'uuid' }) // FK → crm.crm_cases
  crmCaseId!: string;

  /**
   * Valor de comment text mantenido por la instancia.
   */
  @Property({ fieldName: 'comment_text', columnType: 'text' })
  commentText!: string;

  /**
   * Valor de is public mantenido por la instancia.
   */
  @Property({ fieldName: 'is_public', type: 'boolean', nullable: true })
  isPublic?: boolean;

  /**
   * Identificador asociado a author user.
   */
  @Property({ fieldName: 'author_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  authorUserId?: string;

  /**
   * Identificador asociado a attachment file.
   */
  @Property({ fieldName: 'attachment_file_id', type: 'uuid', nullable: true }) // FK → common.files
  attachmentFileId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
