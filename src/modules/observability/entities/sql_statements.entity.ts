import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'observability', tableName: 'sql_statements' })
export class SqlStatements {
  @PrimaryKey({ fieldName: 'query_hash', columnType: 'varchar(12)' })
  queryHash!: string;

  @Property({ fieldName: 'statement_class', columnType: 'varchar' })
  statementClass!: string;

  @Property({ fieldName: 'normalized_sql', columnType: 'text', nullable: true })
  normalizedSql?: string;

  @Property({
    fieldName: 'primary_table',
    columnType: 'varchar',
    nullable: true,
  })
  primaryTable?: string;

  @Property({ fieldName: 'first_seen_at', columnType: 'timestamptz' })
  firstSeenAt!: Date;

  @Property({ fieldName: 'last_seen_at', columnType: 'timestamptz' })
  lastSeenAt!: Date;

  @Property({ fieldName: 'is_slow_ever', type: 'boolean' })
  isSlowEver!: boolean;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
