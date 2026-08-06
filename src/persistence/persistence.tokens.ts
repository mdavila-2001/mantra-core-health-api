/**
 * Tokens de inyección de la capa de persistencia.
 *
 * Viven en su propio archivo, y no junto a las clases que los consumen, para
 * evitar los ciclos de importación que aparecen en cuanto un proveedor necesita
 * el token de otro que a su vez lo necesita a él.
 */

/** Fuentes de datos ya resueltas desde el entorno (`ResolvedDataSources`). */
export const RESOLVED_DATA_SOURCES = Symbol('RESOLVED_DATA_SOURCES');

/** Estrategia de fallback de lectura (`ReadFallbackStrategy`). */
export const READ_FALLBACK_STRATEGY = Symbol('READ_FALLBACK_STRATEGY');

/** Tabla de enrutado vigente (`RoutingRules`). */
export const ROUTING_RULES = Symbol('ROUTING_RULES');

/** Instancias de MikroORM creadas por la fábrica, para cerrarlas al apagar. */
export const OWNED_ORM_INSTANCES = Symbol('OWNED_ORM_INSTANCES');
