import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `alert_rules`.
 */
@Entity({ schema: 'observability', tableName: 'alert_rules' })
export class AlertRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de metric mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  metric!: string;

  /**
   * Valor de comparator mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  comparator!: string;

  /**
   * Valor de threshold mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  threshold!: string;

  /**
   * Valor de for seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'for_seconds', columnType: 'int' })
  forSeconds!: number;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  severityConceptId!: string;

  /**
   * Valor de enabled mantenido por la instancia.
   */
  @Property({ type: 'boolean' })
  enabled!: boolean;

  /**
   * Valor de module code mantenido por la instancia.
   */
  @Property({ fieldName: 'module_code', columnType: 'varchar', nullable: true })
  moduleCode?: string;

  /**
   * Valor de route template mantenido por la instancia.
   */
  @Property({
    fieldName: 'route_template',
    columnType: 'varchar',
    nullable: true,
  })
  routeTemplate?: string;

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
