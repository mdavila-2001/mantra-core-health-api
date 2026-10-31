import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Campaña de certificación de accesos (revisión periódica, recertificación, tras un cambio, dirigida o de remediación).
 */
@Entity({ schema: 'delegated_access', tableName: 'access_review_campaigns' })
export class AccessReviewCampaigns {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `name`. */
  @Property({ fieldName: 'name', columnType: 'varchar' })
  name!: string;

  /** Columna `kind_concept_id`. */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  kindConceptId!: string;

  /** Columna `scope_json`. */
  @Property({ fieldName: 'scope_json', type: 'json', columnType: 'jsonb' })
  scopeJson!: unknown;

  /** Columna `scope_schema_version`. */
  @Property({ fieldName: 'scope_schema_version', columnType: 'int' })
  scopeSchemaVersion!: number;

  /** Columna `filters_json`. */
  @Property({
    fieldName: 'filters_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  filtersJson?: unknown;

  /** Columna `due_at`. */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz' })
  dueAt!: Date;

  /** Columna `grace_days`. */
  @Property({ fieldName: 'grace_days', columnType: 'int', default: 7 })
  graceDays: number = 7;

  /** Columna `reminder_days_before_json`. */
  @Property({
    fieldName: 'reminder_days_before_json',
    type: 'json',
    columnType: 'jsonb',
    default: '[7,3,1]',
  })
  reminderDaysBeforeJson: unknown = [7, 3, 1];

  /** Columna `escalate_after_days`. */
  @Property({ fieldName: 'escalate_after_days', columnType: 'int', default: 3 })
  escalateAfterDays: number = 3;

  /** Columna `uncertified_action_concept_id`. */
  @Property({ fieldName: 'uncertified_action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  uncertifiedActionConceptId!: string;

  /** Columna `owner_user_id`. */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Columna `launched_at`. */
  @Property({
    fieldName: 'launched_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  launchedAt?: Date;

  /** Columna `closed_at`. */
  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

  /** Columna `cancelled_at`. */
  @Property({
    fieldName: 'cancelled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelledAt?: Date;

  /** Columna `created_at`. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Columna `updated_at`. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** Columna `created_by_user_id`. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /** Columna `updated_by_user_id`. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /** Versión usada para controlar actualizaciones concurrentes. */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
