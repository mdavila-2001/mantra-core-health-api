import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `quality_issue_events`.
 */
@Entity({ schema: 'data_catalog', tableName: 'quality_issue_events' })
export class QualityIssueEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a issue.
   */
  @Property({ fieldName: 'issue_id', type: 'uuid' }) // FK (destino no resuelto)
  issueId!: string;

  /**
   * Valor de event kind mantenido por la instancia.
   */
  @Property({ fieldName: 'event_kind', columnType: 'varchar' })
  eventKind!: string;

  /**
   * Identificador asociado a run.
   */
  @Property({ fieldName: 'run_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  runId?: string;

  /**
   * Identificador asociado a actor user.
   */
  @Property({ fieldName: 'actor_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  actorUserId?: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  reason?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
