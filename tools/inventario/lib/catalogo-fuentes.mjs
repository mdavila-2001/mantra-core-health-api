// Fuentes documentales del catálogo de datos: qué tablas declara append-only el README de cada
// módulo, y los glosarios de la API y del frontend.
import fs from 'node:fs';
import path from 'node:path';

const leer = (archivo) => {
  try {
    return fs.readFileSync(archivo, 'utf8');
  } catch {
    return null;
  }
};

const IDENTIFICADOR = /`([a-z_*][a-z0-9_*]*)`/g;

/**
 * Tablas que el README de un módulo declara append-only o inmutables. Sólo tres formas, todas
 * explícitas; no se deduce por la ausencia de columnas ni por el nombre:
 *   P1  `tabla` (… append-only …)   — el paréntesis que sigue al nombre lo declara
 *   P2  «Append-only (WORM)»: lista de nombres que sigue a la etiqueta
 *   P3  `tabla` — … append-only      — viñeta que lo dice en la misma línea
 * @param {string} root
 * @param {Map<string, Set<string>>} tablasPorModulo - carpeta del módulo → nombres de tabla de sus entidades
 * @returns {Map<string, {fuente: string, forma: string}[]>} `modulo.tabla` → declaraciones
 */
export function leerAppendOnly(root, tablasPorModulo) {
  const resultado = new Map();
  const base = path.join(root, 'src', 'modules');
  for (const modulo of fs.readdirSync(base)) {
    const archivo = `src/modules/${modulo}/README.md`;
    const texto = leer(path.join(root, archivo));
    const propias = tablasPorModulo.get(modulo);
    if (!texto || !propias) continue;
    const lineas = texto.split('\n');
    const declarar = (nombre, indice, forma) => {
      const candidatas = nombre.includes('*')
        ? [...propias].filter((t) =>
            new RegExp(`^${nombre.replaceAll('*', '.*')}$`).test(t),
          )
        : propias.has(nombre)
          ? [nombre]
          : [];
      for (const t of candidatas) {
        const clave = `${modulo}.${t}`;
        const previas = resultado.get(clave) ?? [];
        if (!previas.some((p) => p.fuente === `${archivo}:${indice + 1}`))
          resultado.set(clave, [
            ...previas,
            { fuente: `${archivo}:${indice + 1}`, forma },
          ]);
      }
    };
    lineas.forEach((linea, i) => {
      // P2: etiqueta y su lista (la línea y las que siguen hasta una en blanco o hasta el punto final)
      if (/\*\*Append-only[^*]*\*\*\s*:/i.test(linea)) {
        let j = i;
        let bloque = '';
        while (j < lineas.length && lineas[j].trim()) {
          bloque += ` ${lineas[j]}`;
          j += 1;
          if (/\.\s*$/.test(bloque)) break;
        }
        const despuesDeEtiqueta = bloque.replace(
          /^.*\*\*Append-only[^*]*\*\*\s*:/i,
          '',
        );
        for (const m of despuesDeEtiqueta.matchAll(IDENTIFICADOR))
          declarar(m[1], i, 'LISTA_APPEND_ONLY');
        return;
      }
      // P1: `tabla` (… append-only …)
      for (const m of linea.matchAll(
        /`([a-z_][a-z0-9_]*)`\s*\(([^)]*(?:append-only|WORM|IMMUTABLE)[^)]*)\)/gi,
      ))
        declarar(m[1], i, 'PARENTESIS');
      // P3: viñeta «- `tabla` — … append-only»
      const vineta = linea.match(
        /^\s*[-*]\s+`([a-z_][a-z0-9_]*)`\s+[—-]\s+.*append-only/i,
      );
      if (vineta) declarar(vineta[1], i, 'VINETA');
    });
  }
  return resultado;
}

/**
 * Términos de un glosario en tablas Markdown: la primera celda es el término (entre `**`), la
 * segunda la definición. Si hay más celdas se ignoran.
 * @returns {{termino: string, definicion: string, fuente: string, tablasRelacionadas: string[]}[]}
 */
export function leerGlosario(
  repoRoot,
  archivoRelativo,
  nombreRepo,
  tablasConocidas,
) {
  const texto = leer(path.join(repoRoot, archivoRelativo));
  if (!texto) return [];
  const terminos = [];
  texto.split('\n').forEach((linea, i) => {
    const celdas = linea.split('|').map((c) => c.trim());
    if (celdas.length < 4) return;
    const termino = celdas[1].match(/^\*\*(.+?)\*\*$/)?.[1]?.replace(/`/g, '');
    // los enlaces relativos apuntan al árbol de documentos de origen y acá quedarían rotos: se deja el texto
    const definicion = celdas[2].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    if (!termino || !definicion) return;
    const relacionadas = [
      ...new Set(
        [...definicion.matchAll(/`([a-z_]+\.[a-z_0-9]+)`/g)]
          .map((m) => m[1])
          .filter((t) => tablasConocidas.has(t)),
      ),
    ];
    terminos.push({
      termino,
      definicion,
      fuente: `${nombreRepo}:${archivoRelativo}:${i + 1}`,
      tablasRelacionadas: relacionadas,
    });
  });
  return terminos;
}
