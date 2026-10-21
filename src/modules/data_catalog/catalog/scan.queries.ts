/**
 * Consultas de introspección de `pg_catalog`. Sólo `SELECT`: el escaneo corre en una transacción
 * READ ONLY y nunca modifica lo que observa.
 *
 * Se excluyen los schemas del sistema, los de extensiones con prefijo `_` (p. ej. Timescale) y las
 * particiones (se cataloga la tabla padre).
 */

const FILTRO_DE_OBJETOS = `
  c.relkind in ('r', 'p', 'v', 'm', 'f')
  and not c.relispartition
  and n.nspname !~ '^pg_'
  and n.nspname <> 'information_schema'
  and n.nspname !~ '^_'
`;

export const SQL_OBJETOS = `
select n.nspname as schema_name,
       c.relname as object_name,
       case c.relkind when 'r' then 'TABLE' when 'p' then 'PARTITIONED_TABLE' when 'v' then 'VIEW'
                      when 'm' then 'MATERIALIZED_VIEW' when 'f' then 'FOREIGN_TABLE' end as object_kind,
       obj_description(c.oid, 'pg_class') as table_comment,
       case when c.reltuples >= 0 and c.relkind in ('r', 'p', 'm') then c.reltuples::bigint::text end as estimated_rows,
       case when c.relkind in ('r', 'p', 'm') then pg_total_relation_size(c.oid)::text end as total_bytes,
       c.oid::int8 as oid
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where ${FILTRO_DE_OBJETOS}
 order by 1, 2`;

export const SQL_COLUMNAS = `
select c.oid::int8 as oid,
       a.attname as column_name,
       a.attnum::int as ordinal,
       format_type(a.atttypid, a.atttypmod) as native_type,
       not a.attnotnull as is_nullable,
       pg_get_expr(d.adbin, d.adrelid) as default_expression,
       a.attidentity <> '' as is_identity,
       a.attgenerated <> '' as is_generated,
       col_description(c.oid, a.attnum) as column_comment
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
 where ${FILTRO_DE_OBJETOS}
 order by 1, 3`;

/** Claves primarias y restricciones únicas de una sola columna. */
export const SQL_CLAVES = `
select con.conrelid::int8 as oid,
       con.contype::text as kind,
       a.attname as column_name,
       cardinality(con.conkey) as width
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  join lateral unnest(con.conkey) as k(attnum) on true
  join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum
 where con.contype in ('p', 'u') and ${FILTRO_DE_OBJETOS}`;

export const SQL_CLAVES_FORANEAS = `
select con.conrelid::int8 as oid,
       con.conname as constraint_name,
       (select array_agg(a.attname order by k.ord) from unnest(con.conkey) with ordinality k(attnum, ord)
          join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum) as source_columns,
       tn.nspname as target_schema,
       tc.relname as target_table,
       (select array_agg(a.attname order by k.ord) from unnest(con.confkey) with ordinality k(attnum, ord)
          join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k.attnum) as target_columns
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_class tc on tc.oid = con.confrelid
  join pg_namespace tn on tn.oid = tc.relnamespace
 where con.contype = 'f' and ${FILTRO_DE_OBJETOS}`;

export const SQL_VERSION = `select current_setting('server_version') as engine_version`;
