import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `access_review_campaigns`.
 */
@Entity({ schema: 'delegated_access', tableName: 'access_review_campaigns' })
export class AccessReviewCampaigns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a kind concept.
   */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  kindConceptId!: string;

  /**
   * Valor de scope json mantenido por la instancia.
   */
  @Property({ fieldName: 'scope_json', type: 'json', columnType: 'jsonb' })
  scopeJson!: unknown;

  /**
   * Valor de scope schema version mantenido por la instancia.
   */
  @Property({ fieldName: 'scope_schema_version', columnType: 'int' })
  scopeSchemaVersion!: number;

  /**
   * Valor de filters json mantenido por la instancia.
   */
  @Property({
    fieldName: 'filters_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  filtersJson?: unknown;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz' })
  dueAt!: Date;

  /**
   * Valor de grace days mantenido por la instancia.
   */
  @Property({ fieldName: 'grace_days', columnType: 'int', default: 7 })
  graceDays!: number;

  /**
   * Valor de reminder days before json mantenido por la instancia.
   */
  @Property({
    fieldName: 'reminder_days_before_json',
    type: 'json',
    columnType: 'jsonb',
    default: '[7,3,1]',
  })
  reminderDaysBeforeJson!: unknown;

  /**
   * Valor de escalate after days mantenido por la instancia.
   */
  @Property({ fieldName: 'escalate_after_days', columnType: 'int', default: 3 })
  escalateAfterDays!: number;

  /**
   * Identificador asociado a uncertified action concept.
   */
  @Property({ fieldName: 'uncertified_action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  uncertifiedActionConceptId!: string;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  ownerUserId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Valor de launched at mantenido por la instancia.
   */
  @Property({
    fieldName: 'launched_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  launchedAt?: Date;

  /**
   * Valor de closed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

  /**
   * Valor de cancelled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancelled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelledAt?: Date;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
