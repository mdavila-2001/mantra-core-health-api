import { Injectable, Logger } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { schemaCatalog } from '../catalog';
import {
  formatFidelityReport,
  summarizeByKind,
  type FidelityReport,
  type SchemaDrift,
} from './fidelity-report';

/** Fila de `information_schema.columns` que interesa comparar. */
interface DatabaseColumn {
  /**
   * Valor de table schema mantenido por la instancia.
   */
  table_schema: string;
  /**
   * Valor de table name mantenido por la instancia.
   */
  table_name: string;
  /**
   * Valor de column name mantenido por la instancia.
   */
  column_name: string;
  /**
   * Valor de is nullable mantenido por la instancia.
   */
  is_nullable: 'YES' | 'NO';
  /**
   * Valor de column default mantenido por la instancia.
   */
  column_default: string | null;
}

/**
 * Verificación de fidelidad entre la metadata del ORM y la base real.
 *
 * Se ejecuta al final del arranque, después de materializar el DDL. En un
 * sistema donde el DDL lo inyecta la propia aplicación podría parecer redundante
 * -si acabo de crear las tablas, ¿cómo van a no coincidir?-, pero no lo es: la
 * capa de tablas trabaja en modo seguro y, por diseño, hay cambios que se niega
 * a aplicar (estrechar un tipo, volver obligatoria una columna que tiene nulos).
 * Esos son exactamente los casos que esta verificación saca a la luz: lo que el
 * arranque no pudo arreglar solo y necesita una migración revisada.
 *
 * Coste: dos consultas al catálogo de PostgreSQL y una comparación en memoria
 * sobre unas 15 000 columnas. Del orden de decenas de milisegundos, una sola vez
 * por arranque.
 */
@Injectable()
export class SchemaFidelityService {
  /**
   * Valor de logger mantenido por la instancia.
   */
  private readonly logger = new Logger(SchemaFidelityService.name);

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Valor de orm requerido por la operación.
   */
  constructor(private readonly orm: MikroORM) {}

  /** Verifica y deja el resultado en el log con el nivel adecuado. */
  async verifyAndReport(): Promise<FidelityReport> {
    const report = await this.verify();
    const text = formatFidelityReport(report);

    if (report.drift.length === 0) {
      this.logger.log(text);
    } else {
      // Advertencia y no error: el servicio puede operar con deriva parcial (las
      // tablas no afectadas funcionan). Convertirlo en fallo de arranque sería
      // correcto en un entorno regulado y es una decisión de despliegue, no del
      // componente; por eso el informe se devuelve además de registrarse.
      this.logger.warn(text);
    }

    return report;
  }

  /** Compara la metadata descubierta contra `information_schema`. */
  async verify(): Promise<FidelityReport> {
    const startedAt = Date.now();
    const connection = this.orm.em.getConnection();
    const schemas = schemaCatalog.map(([schema]) => schema);

    // Una única lectura para todas las columnas de los 57 schemas del modelo.
    // Consultar tabla por tabla serían 1159 viajes de ida y vuelta.
    // Los nombres de schema salen del catálogo del propio código, nunca de una
    // entrada externa, así que interpolarlos no abre superficie de inyección.
    // Se interpolan en vez de pasarlos como parámetro porque el driver expande
    // un array de parámetros en marcadores posicionales, no en un literal de
    // array de PostgreSQL, y `= ANY(?)` no admite esa expansión.
    const schemaList = schemas.map((schema) => `'${schema}'`).join(', ');
    const columns = await connection.execute<DatabaseColumn[]>(
      `SELECT table_schema, table_name, column_name, is_nullable, column_default
         FROM information_schema.columns
        WHERE table_schema IN (${schemaList})`,
      [],
      'all',
    );

    // Índice por tabla: "schema.tabla" -> Map(columna -> fila).
    const byTable = new Map<string, Map<string, DatabaseColumn>>();
    for (const column of columns) {
      const key = `${column.table_schema}.${column.table_name}`;
      let table = byTable.get(key);
      if (!table) {
        table = new Map();
        byTable.set(key, table);
      }
      table.set(column.column_name, column);
    }

    const drift: SchemaDrift[] = [];
    // `getAll()` devuelve un Map, no un objeto: recorrerlo con Object.values da
    // cero entidades en silencio y el informe saldría vacío y engañoso.
    const metadata = this.orm.getMetadata().getAll();
    let entities = 0;

    for (const meta of metadata.values()) {
      // Se ignoran entidades abstractas y embebidas: no tienen tabla propia.
      if (meta.abstract || meta.embeddable || !meta.tableName) continue;
      entities += 1;

      const schema = meta.schema ?? 'public';
      const key = `${schema}.${meta.tableName}`;
      const dbColumns = byTable.get(key);

      if (!dbColumns) {
        drift.push({
          kind: 'tabla-ausente',
          schema,
          table: meta.tableName,
          detail: `la entidad ${meta.className} está mapeada pero la tabla no existe`,
        });
        continue;
      }

      this.compareColumns(meta, schema, dbColumns, drift);
    }

    return {
      entities,
      tablesInDatabase: byTable.size,
      drift,
      byKind: summarizeByKind(drift),
      tookMs: Date.now() - startedAt,
    };
  }

  /**
   * Compara las columnas de una entidad con las de su tabla.
   *
   * Se comprueban tres cosas y deliberadamente no una cuarta: no se comparan
   * tipos SQL. La razón es que la equivalencia de tipos entre la metadata y
   * `information_schema` está llena de sinónimos (`int4`/`integer`,
   * `varchar`/`character varying`, `timestamptz`/`timestamp with time zone`) y
   * una comparación textual produciría cientos de falsos positivos que
   * enterrarían las diferencias reales. La divergencia de tipos la detecta la
   * capa de tablas, que sí compara con las reglas del dialecto.
   */
  private compareColumns(
    meta: {
      /**
       * Valor de class name mantenido por la instancia.
       */
      className: string;
      /**
       * Valor de table name mantenido por la instancia.
       */
      tableName: string;
      /**
       * Valor de props mantenido por la instancia.
       */
      props: readonly MappedProp[];
    },
    schema: string,
    dbColumns: Map<string, DatabaseColumn>,
    drift: SchemaDrift[],
  ): void {
    const mapped = new Set<string>();

    for (const prop of meta.props) {
      // Propiedades sin persistencia (getters, relaciones inversas) no tienen columna.
      if (prop.persist === false || !prop.fieldNames?.length) continue;

      for (const fieldName of prop.fieldNames) {
        mapped.add(fieldName);
        const dbColumn = dbColumns.get(fieldName);

        if (!dbColumn) {
          drift.push({
            kind: 'columna-ausente',
            schema,
            table: meta.tableName,
            column: fieldName,
            detail: `${meta.className}.${prop.name} no tiene columna en la tabla`,
          });
          continue;
        }

        const dbNullable = dbColumn.is_nullable === 'YES';
        const entityNullable = prop.nullable === true;

        // Una columna que la base exige y la entidad marca opcional produce un
        // INSERT sin valor y un error 23502 en tiempo de escritura. El caso
        // inverso es benigno (la entidad es más estricta que la base), así que
        // solo se reporta el que rompe.
        if (!dbNullable && entityNullable && dbColumn.column_default === null) {
          drift.push({
            kind: 'obligatoriedad-divergente',
            schema,
            table: meta.tableName,
            column: fieldName,
            detail:
              `la base la exige (NOT NULL sin default) y ${meta.className}.${prop.name} ` +
              'la declara opcional',
          });
        }
      }
    }

    // Columnas obligatorias que la entidad ni siquiera conoce: cualquier INSERT
    // hecho por el ORM las omitirá y fallará.
    for (const [name, column] of dbColumns) {
      if (mapped.has(name)) continue;
      if (column.is_nullable === 'YES' || column.column_default !== null)
        continue;
      drift.push({
        kind: 'columna-obligatoria-no-mapeada',
        schema,
        table: meta.tableName,
        column: name,
        detail: `la tabla exige "${name}" y ninguna propiedad de ${meta.className} la mapea`,
      });
    }
  }
}

/** Forma mínima de una propiedad de la metadata que este servicio necesita leer. */
interface MappedProp {
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de field names mantenido por la instancia.
   */
  fieldNames?: string[];
  /**
   * Valor de nullable mantenido por la instancia.
   */
  nullable?: boolean;
  /**
   * Valor de persist mantenido por la instancia.
   */
  persist?: boolean;
}
