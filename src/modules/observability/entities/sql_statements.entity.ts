import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `sql_statements`.
 */
@Entity({ schema: 'observability', tableName: 'sql_statements' })
export class SqlStatements {
  /**
   * Valor de query hash mantenido por la instancia.
   */
  @PrimaryKey({ fieldName: 'query_hash', columnType: 'varchar(12)' })
  queryHash!: string;

  /**
   * Valor de statement class mantenido por la instancia.
   */
  @Property({ fieldName: 'statement_class', columnType: 'varchar' })
  statementClass!: string;

  /**
   * Valor de normalized sql mantenido por la instancia.
   */
  @Property({ fieldName: 'normalized_sql', columnType: 'text', nullable: true })
  normalizedSql?: string;

  /**
   * Valor de primary table mantenido por la instancia.
   */
  @Property({
    fieldName: 'primary_table',
    columnType: 'varchar',
    nullable: true,
  })
  primaryTable?: string;

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
   * Valor de is slow ever mantenido por la instancia.
   */
  @Property({ fieldName: 'is_slow_ever', type: 'boolean' })
  isSlowEver!: boolean;

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
