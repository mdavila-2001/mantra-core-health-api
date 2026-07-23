import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'crm_case_comments' })
export class CrmCaseComments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'crm_case_id', type: 'uuid' }) // FK → crm.crm_cases
  crmCaseId!: string;

  @Property({ fieldName: 'comment_text', columnType: 'text' })
  commentText!: string;

  @Property({ fieldName: 'is_public', type: 'boolean', nullable: true })
  isPublic?: boolean;

  @Property({ fieldName: 'author_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  authorUserId?: string;

  @Property({ fieldName: 'attachment_file_id', type: 'uuid', nullable: true }) // FK → common.files
  attachmentFileId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
