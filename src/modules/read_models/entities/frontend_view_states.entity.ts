import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `frontend_view_states`.
 */
@Entity({ schema: 'read_models', tableName: 'frontend_view_states' })
export class FrontendViewStates {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a frontend page view.
   */
  @Property({ fieldName: 'frontend_page_view_id', type: 'uuid' }) // FK → read_models.frontend_page_views
  frontendPageViewId!: string;

  /**
   * Identificador asociado a state type concept.
   */
  @Property({ fieldName: 'state_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateTypeConceptId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de message mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  message!: string;

  /**
   * Valor de illustration key mantenido por la instancia.
   */
  @Property({
    fieldName: 'illustration_key',
    columnType: 'varchar',
    nullable: true,
  })
  illustrationKey?: string;

  /**
   * Valor de recovery action code mantenido por la instancia.
   */
  @Property({
    fieldName: 'recovery_action_code',
    columnType: 'varchar',
    nullable: true,
  })
  recoveryActionCode?: string;

  /**
   * Valor de telemetry event code mantenido por la instancia.
   */
  @Property({
    fieldName: 'telemetry_event_code',
    columnType: 'varchar',
    nullable: true,
  })
  telemetryEventCode?: string;

  /**
   * Valor de retry allowed mantenido por la instancia.
   */
  @Property({ fieldName: 'retry_allowed', type: 'boolean', nullable: true })
  retryAllowed?: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
