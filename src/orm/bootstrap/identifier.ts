import { createHash } from 'node:crypto';

/**
 * Normalización de identificadores al límite de PostgreSQL.
 *
 * PostgreSQL trunca en silencio cualquier identificador que pase de 63 bytes
 * (`NAMEDATALEN - 1`). No avisa: acepta el nombre largo y guarda el corto.
 *
 * El síntoma que esto produjo en este proyecto, y que motivó el módulo: la capa
 * de claves foráneas consultaba `pg_constraint` y comparaba con el nombre
 * completo del catálogo. Para 54 restricciones con nombres de más de 63
 * caracteres -por ejemplo
 * `fk_conversion_event_delivery_attempts_server_conversion_event_id`- la
 * comparación nunca casaba, así que en cada arranque se creían faltantes y se
 * intentaban crear de nuevo, fallando con "constraint already exists". Un bucle
 * silencioso de trabajo inútil más dos avisos por arranque.
 *
 * La solución no es truncar sin más: dos nombres largos pueden compartir los
 * primeros 63 caracteres y colisionar. Se conserva un prefijo legible y se le
 * añade un sufijo derivado del nombre completo, que es determinista (el mismo
 * nombre da siempre el mismo resultado, arranque tras arranque y máquina tras
 * máquina) y prácticamente libre de colisiones.
 */

/** Longitud máxima de un identificador en PostgreSQL con la compilación por defecto. */
export const MAX_IDENTIFIER_LENGTH = 63;

/** Caracteres del sufijo de desambiguación. */
const HASH_LENGTH = 8;

/**
 * Devuelve un identificador que PostgreSQL no truncará.
 *
 * Los nombres que ya caben se devuelven intactos, que es el caso de la inmensa
 * mayoría: así el nombre de un índice sigue siendo el que declara el modelo y se
 * puede rastrear desde un plan de ejecución hasta la nota de la bóveda.
 *
 * @example
 * shortenIdentifier('fk_sessions_user_id')
 * // -> 'fk_sessions_user_id'  (sin cambios)
 *
 * shortenIdentifier('fk_conversion_event_delivery_attempts_server_conversion_event_id')
 * // -> 'fk_conversion_event_delivery_attempts_server_conve_1f4a9c07'
 */
export function shortenIdentifier(name: string): string {
  if (Buffer.byteLength(name, 'utf8') <= MAX_IDENTIFIER_LENGTH) {
    return name;
  }

  const digest = createHash('sha1')
    .update(name)
    .digest('hex')
    .slice(0, HASH_LENGTH);
  const prefixLength = MAX_IDENTIFIER_LENGTH - HASH_LENGTH - 1;
  return `${name.slice(0, prefixLength)}_${digest}`;
}
