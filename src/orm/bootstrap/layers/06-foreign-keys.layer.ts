import { foreignKeyCatalog, type ForeignKeyTuple } from '../../catalog';
import { shortenIdentifier } from '../identifier';
import type { DdlLayer, DdlLayerContext } from '../ddl-layer.contract';

/**
 * Capa 06: integridad referencial.
 *
 * Contexto imprescindible para entender por qué esta capa existe: las entidades
 * de este proyecto mapean las columnas de clave foránea como `uuid` escalares
 * (`statusConceptId!: string`) y no como relaciones `@ManyToOne`. Es una
 * decisión de arquitectura, no un descuido: con 5993 referencias entre 57
 * módulos, modelarlas como relaciones obligaría a que casi todos los módulos se
 * importasen entre sí, produciría ciclos de importación y convertiría la
 * metadata del ORM en un grafo que hay que resolver entero en cada arranque.
 *
 * El precio de esa decisión es que MikroORM no puede emitir ni una sola clave
 * foránea (por eso `createForeignKeyConstraints: false` en la configuración).
 * Esta capa paga ese precio: declara las 5993 restricciones en el catálogo y las
 * aplica aquí, con lo que la base termina con la misma integridad referencial
 * que tendría un modelo con relaciones, sin el acoplamiento.
 *
 * Va la última de las capas lógicas porque una FK exige que existan las dos
 * tablas, la columna origen y el índice único del destino.
 *
 * Nota sobre `NOT VALID`: las restricciones se añaden validando los datos
 * existentes. En una base ya poblada eso obliga a un escaneo completo de la
 * tabla origen. Se asume conscientemente: una FK que no valida lo que ya hay es
 * una FK que miente sobre el estado del sistema, y el objetivo declarado de este
 * arranque es fidelidad, no velocidad de despliegue.
 */
export const foreignKeysLayer: DdlLayer = {
  order: 6,
  name: 'foreign-keys',
  description:
    'Aplica las claves foráneas del modelo, que las entidades escalares no pueden declarar',

  /**
   * Ejecuta la operación apply.
   *
   * @param context - Valor de context requerido por la operación.
   * @returns Resultado de apply.
   */
  async apply(context: DdlLayerContext) {
    // Una consulta para saber qué restricciones existen ya. Con 5993 FKs, la
    // alternativa (un bloque DO por restricción que capture duplicate_object)
    // costaría 5993 sentencias en cada arranque para no hacer nada.
    // Se trae también el destino real de cada restricción, no sólo su nombre:
    // comprobar únicamente la existencia deja pasar las que apuntan a otra
    // tabla. Ocurrió de verdad —`webhook_delivery_evidence` referenciaba
    // `integrations.webhook_subscriptions` en vez de
    // `integration_contracts.contract_webhook_subscriptions`— y como el nombre
    // ya existía, cada arranque la daba por buena: la entrega de webhooks
    // respondía 500 con una violación de FK y la base mentía sobre su propia
    // integridad, que es justo lo que esta capa existe para impedir.
    const existing = new Map(
      (
        await context.query<{
          /**
           * Esquema de la tabla origen.
           */
          nspname: string; /**
           * Nombre de la restricción.
           */
          conname: string; /**
           * Esquema de la tabla destino.
           */
          target_schema: string; /**
           * Tabla destino.
           */
          target_table: string;
        }>(
          `SELECT n.nspname, c.conname,
                  tn.nspname AS target_schema, tc.relname AS target_table
             FROM pg_constraint c
             JOIN pg_namespace n ON n.oid = c.connamespace
             JOIN pg_class tc ON tc.oid = c.confrelid
             JOIN pg_namespace tn ON tn.oid = tc.relnamespace
            WHERE c.contype = 'f'`,
        )
      ).map((row) => [
        `${row.nspname}.${row.conname}`,
        `${row.target_schema}.${row.target_table}`,
      ]),
    );

    const pending: string[] = [];
    let skipped = 0;
    let repaired = 0;

    for (const [schema, batches] of Object.entries(foreignKeyCatalog)) {
      for (const batch of batches) {
        for (const foreignKey of batch) {
          const name = constraintName(foreignKey);
          const [table, , targetSchema, targetTable] = foreignKey;
          const current = existing.get(`${schema}.${name}`);
          if (current !== undefined) {
            if (current === `${targetSchema}.${targetTable}`) {
              skipped += 1;
              continue;
            }
            // Divergente: se recrea. El DROP va en la misma sentencia que el
            // ADD para que un fallo al validar los datos deje la restricción
            // anterior en su sitio en vez de quedarse sin ninguna.
            context.logger.warn(
              `Clave foránea divergente ${schema}.${name}: apunta a ${current} ` +
                `y el modelo declara ${targetSchema}.${targetTable}; se recrea`,
            );
            pending.push(
              `ALTER TABLE "${schema}"."${table}" DROP CONSTRAINT "${name}"`,
            );
            repaired += 1;
          }
          pending.push(buildAddConstraint(schema, name, foreignKey));
        }
      }
    }

    if (repaired > 0) {
      context.logger.warn(`Claves foráneas divergentes reparadas: ${repaired}`);
    }

    if (pending.length === 0) {
      context.logger.log(
        'Integridad referencial al día: las 5993 claves foráneas ya existen',
      );
      return { applied: 0, skipped, failures: [] };
    }

    context.logger.log(`Claves foráneas a crear: ${pending.length}`);

    const failures: string[] = [];
    let applied = 0;

    for (let i = 0; i < pending.length; i += FK_BATCH_SIZE) {
      const batch = pending.slice(i, i + FK_BATCH_SIZE);
      try {
        await context.execute(
          batch.join(';\n'),
          `claves foráneas ${i + 1}-${i + batch.length}`,
        );
        applied += batch.length;
      } catch (error) {
        // Causa habitual: datos preexistentes que violan la referencia. No debe
        // impedir el arranque, pero sí quedar registrado con precisión para que
        // alguien limpie los datos huérfanos.
        const reason = error instanceof Error ? error.message : String(error);
        failures.push(`lote de FKs ${i + 1}-${i + batch.length}: ${reason}`);
        context.logger.warn(
          `Claves foráneas no aplicadas en un lote: ${reason}`,
        );
      }
    }

    return { applied, skipped, failures };
  },
};

/** Sentencias por lote; mismo compromiso que en la capa de índices. */
const FK_BATCH_SIZE = 50;

/**
 * Nombre canónico de la restricción: `fk_<tabla>_<columna>`.
 *
 * Que sea determinista es lo que permite comprobar la existencia con una
 * consulta al catálogo en vez de comparar definiciones. Coincide además con la
 * convención de nombres del DDL generado desde el modelo, para que una base
 * creada por esta aplicación y otra creada por el generador externo tengan los
 * mismos nombres de restricción y sean diffables entre sí.
 *
 * Se acota a 63 bytes porque PostgreSQL trunca en silencio por encima de ese
 * límite: sin esto, 54 de las 5993 restricciones nunca casaban con lo que
 * devuelve `pg_constraint` y se reintentaban en cada arranque. Ver
 * `shortenIdentifier`.
 */
function constraintName([table, column]: ForeignKeyTuple): string {
  return shortenIdentifier(`fk_${table}_${column}`);
}

/**
 * Compone el ALTER TABLE de una tupla del catálogo.
 *
 * Política de acciones referenciales:
 *   - `ON DELETE RESTRICT`: borrar una fila referenciada debe fallar. En un
 *     sistema clínico y contable, un borrado en cascada silencioso destruiría
 *     evidencia (una consulta, un asiento) sin dejar rastro.
 *   - `ON UPDATE CASCADE`: las PK son uuid y no cambian, así que en la práctica
 *     nunca se dispara; se declara por completitud.
 */
function buildAddConstraint(
  schema: string,
  name: string,
  [table, column, targetSchema, targetTable, targetColumn]: ForeignKeyTuple,
): string {
  return (
    `ALTER TABLE "${schema}"."${table}" ` +
    `ADD CONSTRAINT "${name}" FOREIGN KEY ("${column}") ` +
    `REFERENCES "${targetSchema}"."${targetTable}" ("${targetColumn}") ` +
    'ON DELETE RESTRICT ON UPDATE CASCADE'
  );
}
