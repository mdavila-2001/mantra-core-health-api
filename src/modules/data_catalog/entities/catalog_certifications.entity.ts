import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_certifications`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_certifications' })
export class CatalogCertifications {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de target kind mantenido por la instancia.
   */
  @Property({ fieldName: 'target_kind', columnType: 'varchar' })
  targetKind!: string;

  /**
   * Identificador asociado a object.
   */
  @Property({ fieldName: 'object_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  objectId?: string;

  /**
   * Identificador asociado a read model definition.
   */
  @Property({
    fieldName: 'read_model_definition_id',
    type: 'uuid',
    nullable: true,
  }) // FK → read_models.read_model_definitions (inferida)
  readModelDefinitionId?: string;

  /**
   * Identificador asociado a report definition.
   */
  @Property({ fieldName: 'report_definition_id', type: 'uuid', nullable: true }) // FK → reporting.report_definitions (inferida)
  reportDefinitionId?: string;

  /**
   * Valor de kpi code mantenido por la instancia.
   */
  @Property({ fieldName: 'kpi_code', columnType: 'varchar', nullable: true })
  kpiCode?: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de basis json mantenido por la instancia.
   */
  @Property({ fieldName: 'basis_json', type: 'json', columnType: 'jsonb' })
  basisJson!: unknown;

  /**
   * Identificador asociado a requested by user.
   */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  requestedByUserId!: string;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /**
   * Identificador asociado a certified by user.
   */
  @Property({ fieldName: 'certified_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  certifiedByUserId?: string;

  /**
   * Valor de certified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'certified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  certifiedAt?: Date;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  /**
   * Identificador asociado a revoked by user.
   */
  @Property({ fieldName: 'revoked_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  revokedByUserId?: string;

  /**
   * Valor de revoked at mantenido por la instancia.
   */
  @Property({
    fieldName: 'revoked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  revokedAt?: Date;

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

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
