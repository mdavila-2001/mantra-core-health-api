import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_lineage_edges`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_lineage_edges' })
export class CatalogLineageEdges {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de source kind mantenido por la instancia.
   */
  @Property({ fieldName: 'source_kind', columnType: 'varchar' })
  sourceKind!: string;

  /**
   * Valor de source ref mantenido por la instancia.
   */
  @Property({ fieldName: 'source_ref', columnType: 'varchar' })
  sourceRef!: string;

  /**
   * Valor de target kind mantenido por la instancia.
   */
  @Property({ fieldName: 'target_kind', columnType: 'varchar' })
  targetKind!: string;

  /**
   * Valor de target ref mantenido por la instancia.
   */
  @Property({ fieldName: 'target_ref', columnType: 'varchar' })
  targetRef!: string;

  /**
   * Valor de edge kind mantenido por la instancia.
   */
  @Property({ fieldName: 'edge_kind', columnType: 'varchar' })
  edgeKind!: string;

  /**
   * Valor de origin mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  origin!: string;

  /**
   * Valor de confidence mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  confidence?: string;

  /**
   * Valor de is official mantenido por la instancia.
   */
  @Property({ fieldName: 'is_official', type: 'boolean', default: false })
  isOfficial!: boolean;

  /**
   * Identificador asociado a approved by user.
   */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  approvedByUserId?: string;

  /**
   * Valor de approved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

  /**
   * Valor de observation status mantenido por la instancia.
   */
  @Property({ fieldName: 'observation_status', columnType: 'varchar' })
  observationStatus!: string;

  /**
   * Valor de first seen at mantenido por la instancia.
   */
  @Property({ fieldName: 'first_seen_at', columnType: 'timestamptz' })
  firstSeenAt!: Date;

  /**
   * Valor de last seen at mantenido por la instancia.
   */
  @Property({ fieldName: 'last_seen_at', columnType: 'timestamptz' })
  lastSeenAt!: Date;

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
