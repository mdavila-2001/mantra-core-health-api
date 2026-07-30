import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `runbook_versions`.
 */
@Entity({ schema: 'platform_ops', tableName: 'runbook_versions' })
export class RunbookVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a runbook.
   */
  @Property({ fieldName: 'runbook_id', type: 'uuid' }) // FK → platform_ops.runbooks
  runbookId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Valor de content markdown mantenido por la instancia.
   */
  @Property({ fieldName: 'content_markdown', columnType: 'text' })
  contentMarkdown!: string;

  /**
   * Valor de automation definition json mantenido por la instancia.
   */
  @Property({
    fieldName: 'automation_definition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  automationDefinitionJson?: unknown;

  /**
   * Valor de checksum sha256 mantenido por la instancia.
   */
  @Property({
    fieldName: 'checksum_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  checksumSha256?: string;

  /**
   * Identificador asociado a approved by user.
   */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid' }) // FK → iam.users
  approvedByUserId!: string;

  /**
   * Valor de approved at mantenido por la instancia.
   */
  @Property({ fieldName: 'approved_at', columnType: 'timestamptz' })
  approvedAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
