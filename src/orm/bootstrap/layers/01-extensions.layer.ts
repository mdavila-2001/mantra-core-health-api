import { extensionCatalog } from '../../catalog';
import type { DdlLayer, DdlLayerContext } from '../ddl-layer.contract';

/**
 * Capa 01: extensiones de PostgreSQL.
 *
 * Va primero porque una extensión aporta tipos y funciones que el DDL posterior
 * usa. Si `vector` no está instalada, `CREATE TABLE vector_rag.vector_embeddings
 * (embedding vector, ...)` falla con "type vector does not exist", un error que
 * no sugiere en absoluto que lo que falta es una extensión.
 *
 * Tolerancia a fallos: instalar una extensión requiere privilegios que el
 * usuario de la aplicación no siempre tiene (típico en PostgreSQL gestionado).
 * Las extensiones marcadas como no obligatorias registran el fallo y la
 * secuencia continúa; las capas que dependen de ellas lo detectan y se saltan
 * su parte, en vez de tumbar el arranque entero por una capacidad opcional.
 */
export const extensionsLayer: DdlLayer = {
  order: 1,
  name: 'extensions',
  description:
    'Instala las extensiones de PostgreSQL de las que dependen tipos y operadores del modelo',

  /**
   * Ejecuta la operación apply.
   *
   * @param context - Valor de context requerido por la operación.
   * @returns Resultado de apply.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async apply(context: DdlLayerContext) {
    // Una sola consulta al catálogo en vez de un CREATE EXTENSION por extensión:
    // así el caso normal (todas ya instaladas) cuesta un único viaje de ida y
    // vuelta a la base, no uno por extensión.
    const installed = new Set(
      (
        await context.query<{
          /**
           * Valor de extname mantenido por la instancia.
           */
          extname: string;
        }>('SELECT extname FROM pg_extension')
      ).map((row) => row.extname),
    );

    const failures: string[] = [];
    let applied = 0;
    let skipped = 0;

    for (const extension of extensionCatalog) {
      if (installed.has(extension.name)) {
        skipped += 1;
        continue;
      }

      try {
        await context.execute(
          `CREATE EXTENSION IF NOT EXISTS "${extension.name}"`,
          `extensión ${extension.name}`,
        );
        applied += 1;
        context.logger.log(
          `Extensión "${extension.name}" instalada (${extension.purpose})`,
        );
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        const detail = `extensión "${extension.name}" no instalada: ${reason}`;

        if (extension.required) {
          // Obligatoria: no tiene sentido seguir creando tablas que no se van a
          // poder declarar. Se propaga para que el arranque falle aquí y ahora.
          throw new Error(detail);
        }

        failures.push(detail);
        context.logger.warn(
          `${detail}. Queda deshabilitada la capacidad: ${extension.purpose}`,
        );
      }
    }

    return { applied, skipped, failures };
  },
};
