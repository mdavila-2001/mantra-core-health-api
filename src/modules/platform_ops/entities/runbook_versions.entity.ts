import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'runbook_versions' })
export class RunbookVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'runbook_id', type: 'uuid' }) // FK → platform_ops.runbooks
  runbookId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'content_markdown', columnType: 'text' })
  contentMarkdown!: string;

  @Property({
    fieldName: 'automation_definition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  automationDefinitionJson?: unknown;

  @Property({
    fieldName: 'checksum_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  checksumSha256?: string;

  @Property({ fieldName: 'approved_by_user_id', type: 'uuid' }) // FK → iam.users
  approvedByUserId!: string;

  @Property({ fieldName: 'approved_at', columnType: 'timestamptz' })
  approvedAt!: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
