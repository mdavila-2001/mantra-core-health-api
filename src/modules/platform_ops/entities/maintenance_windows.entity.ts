import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `maintenance_windows`.
 */
@Entity({ schema: 'platform_ops', tableName: 'maintenance_windows' })
export class MaintenanceWindows {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de starts at mantenido por la instancia.
   */
  @Property({ fieldName: 'starts_at', columnType: 'timestamptz' })
  startsAt!: Date;

  /**
   * Valor de ends at mantenido por la instancia.
   */
  @Property({ fieldName: 'ends_at', columnType: 'timestamptz' })
  endsAt!: Date;

  /**
   * Valor de recurrence rule mantenido por la instancia.
   */
  @Property({
    fieldName: 'recurrence_rule',
    columnType: 'text',
    nullable: true,
  })
  recurrenceRule?: string;

  /**
   * Valor de affected services json mantenido por la instancia.
   */
  @Property({
    fieldName: 'affected_services_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  affectedServicesJson?: unknown;

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
