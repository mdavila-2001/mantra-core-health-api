/**
 * Identidad del módulo ante la capa de persistencia.
 *
 * Vive en un archivo propio, y no junto a los proveedores que la usan, para
 * romper un ciclo de importación real: el cableado importa el adaptador y el
 * adaptador necesita el nombre del módulo. Con la constante en el mismo archivo
 * que los proveedores, ese ciclo hace que `SCHEDULING_MODULE` se evalúe antes de
 * estar inicializada y el módulo entero falla al cargar.
 */

/**
 * Nombre del módulo tal y como lo conocen la tabla de enrutado y el flag
 * `PERSISTENCE_PORTS_MODULES`.
 *
 * Es una constante y no una cadena suelta porque la usan tres sitios -el
 * proveedor de sesión, el adaptador y el servicio- y una errata en cualquiera
 * de ellos dejaría al módulo enrutado por la regla por defecto sin que nada
 * fallara.
 */
export const SCHEDULING_MODULE = 'scheduling';
