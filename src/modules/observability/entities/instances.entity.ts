import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `instances`.
 */
@Entity({ schema: 'observability', tableName: 'instances' })
export class Instances {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de kind mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  kind!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de build commit mantenido por la instancia.
   */
  @Property({
    fieldName: 'build_commit',
    columnType: 'varchar',
    nullable: true,
  })
  buildCommit?: string;

  /**
   * Valor de build version mantenido por la instancia.
   */
  @Property({
    fieldName: 'build_version',
    columnType: 'varchar',
    nullable: true,
  })
  buildVersion?: string;

  /**
   * Valor de host hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'host_hash',
    columnType: 'varchar(64)',
    nullable: true,
  })
  hostHash?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de last seen at mantenido por la instancia.
   */
  @Property({ fieldName: 'last_seen_at', columnType: 'timestamptz' })
  lastSeenAt!: Date;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de last snapshot json mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  lastSnapshotJson?: unknown;

  /**
   * Valor de expected mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  expected?: boolean;

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
