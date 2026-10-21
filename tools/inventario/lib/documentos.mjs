// Lectura de los documentos que explican el negocio de cada operación:
//   - la tabla «UC → ruta» del README de cada módulo (`src/modules/<m>/README.md`),
//   - la nota `BUSINESS PURPOSE` del diagrama del módulo en el repo del modelo,
//   - el dominio («Financiero y ERP», …) al que el modelo asigna cada módulo.
// Cada dato conserva el archivo:línea de donde salió; si falta la fuente, falta el dato.
import fs from 'node:fs';
import path from 'node:path';

const VERBOS = /(GET|POST|PUT|PATCH|DELETE)\s+(\/[^`\s]*)/g;

/** `/a/:id/b?x=1`, `/a/{id}/b/` → `/a/{}/b` : lo que permite comparar rutas de fuentes distintas. */
export function normalizarRuta(ruta) {
  return (
    '/' +
    ruta
      .split('?')[0]
      .split('/')
      .filter(Boolean)
      .map((tramo) => (/^(:|\{|\$\{)/.test(tramo) ? '{}' : tramo))
      .join('/')
  );
}

function leer(ruta) {
  try {
    return fs.readFileSync(ruta, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Casos de uso de cada módulo, tal como los declara su README.
 * @returns {Map<string, { uc: string, rutas: {metodo: string, ruta: string}[], descripcion: string, fuente: string }[]>}
 */
export function leerCasosDeUso(root = process.cwd()) {
  const resultado = new Map();
  const modulos = path.join(root, 'src', 'modules');
  for (const modulo of fs.readdirSync(modulos)) {
    const archivo = `src/modules/${modulo}/README.md`;
    const texto = leer(path.join(root, archivo));
    if (!texto) continue;
    const filas = [];
    texto.split('\n').forEach((linea, indice) => {
      const celdas = linea.split('|').map((celda) => celda.trim());
      if (celdas.length < 5) return;
      const [, id, ...resto] = celdas;
      resto.pop(); // lo que hay después de la última barra
      if (!/^[A-Z]{1,3}-?[\w§ .-]*\d[\w§ .-]*$/i.test(id)) return;
      const rutas = [];
      for (const celda of resto)
        for (const coincidencia of celda.matchAll(VERBOS))
          rutas.push({
            metodo: coincidencia[1],
            ruta: normalizarRuta(coincidencia[2]),
          });
      if (!rutas.length) return;
      // la descripción es la celda de texto más larga que no es una ruta
      const descripcion = resto
        .filter(
          (celda) => !VERBOS.test(celda) && !/^`[A-Z_,\s`]+`$/.test(celda),
        )
        .sort((a, b) => b.length - a.length)[0];
      VERBOS.lastIndex = 0;
      if (!descripcion) return;
      filas.push({
        uc: id,
        rutas,
        descripcion: descripcion.replace(/\*\*/g, '').replace(/`/g, ''),
        fuente: `${archivo}:${indice + 1}`,
      });
    });
    if (filas.length) resultado.set(modulo, filas);
  }
  return resultado;
}

/** Filas de un módulo que mencionan esa operación. */
export function casosDeUsoDe(filasDelModulo, metodo, ruta) {
  const buscada = normalizarRuta(ruta);
  return (filasDelModulo ?? []).filter((fila) =>
    fila.rutas.some((item) => item.metodo === metodo && item.ruta === buscada),
  );
}

/**
 * Propósito de negocio de cada módulo: el texto de la nota `BUSINESS PURPOSE` del
 * diagrama, indexado por el número de módulo (`diagram_41_scheduling.puml` → 41).
 * @returns {Map<number, { texto: string, fuente: string }>}
 */
export function leerPropositos(modelRoot) {
  const resultado = new Map();
  const dir = path.join(modelRoot, 'Mantra Core Health Context', 'modules');
  if (!fs.existsSync(dir)) return resultado;
  for (const nombre of fs.readdirSync(dir)) {
    const numero = nombre.match(/^diagram_(\d+)_/)?.[1];
    if (!numero || !nombre.endsWith('.puml')) continue;
    const lineas = leer(path.join(dir, nombre))?.split('\n') ?? [];
    const inicio = lineas.findIndex((linea) => /BUSINESS PURPOSE/.test(linea));
    if (inicio < 0) continue;
    const cuerpo = [];
    for (let i = inicio + 1; i < lineas.length; i++) {
      if (/^\s*end note/.test(lineas[i])) break;
      cuerpo.push(lineas[i].trim());
    }
    const texto = cuerpo.join(' ').replace(/\s+/g, ' ').trim();
    if (texto)
      resultado.set(Number(numero), {
        texto,
        fuente: `Mantra Core Health Context/modules/${nombre}:${inicio + 1}`,
      });
  }
  return resultado;
}

/**
 * Dominio de cada módulo según el modelo. Cruza dos fuentes declaradas:
 *  - `src/orm/catalog/schemas.catalog.ts` del API: carpeta del módulo → número,
 *  - la tabla «Dominio | módulos(NN)» de `docs/architecture/semantic-data-analysis.md`.
 * @returns {Map<string, { dominio: string, numero: number, fuente: string }>} por carpeta.
 */
export function leerDominios(root, modelRoot) {
  const resultado = new Map();
  const catalogo = leer(path.join(root, 'src/orm/catalog/schemas.catalog.ts'));
  const documento = leer(
    path.join(
      modelRoot,
      'Mantra Core Health Context/docs/architecture/semantic-data-analysis.md',
    ),
  );
  if (!catalogo || !documento) return resultado;

  const dominioPorNumero = new Map();
  documento.split('\n').forEach((linea, indice) => {
    const celdas = linea.split('|').map((celda) => celda.trim());
    if (celdas.length < 5 || !/\(\d+\)/.test(celdas[2] ?? '')) return;
    for (const numero of celdas[2].matchAll(/\((\d+)\)/g))
      dominioPorNumero.set(Number(numero[1]), {
        dominio: celdas[1],
        fuente: `Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:${indice + 1}`,
      });
  });

  for (const fila of catalogo.matchAll(
    /\[\s*'([^']+)'\s*,\s*(\d+)\s*,\s*'([^']+)'\s*,\s*\d+\s*\]/g,
  )) {
    const numero = Number(fila[2]);
    const dominio = dominioPorNumero.get(numero);
    if (dominio) resultado.set(fila[3], { numero, ...dominio });
  }
  return resultado;
}

/** Número de módulo de una carpeta, según `schemas.catalog.ts`. */
export function numerosDeModulo(root = process.cwd()) {
  const catalogo =
    leer(path.join(root, 'src/orm/catalog/schemas.catalog.ts')) ?? '';
  const resultado = new Map();
  for (const fila of catalogo.matchAll(
    /\[\s*'([^']+)'\s*,\s*(\d+)\s*,\s*'([^']+)'\s*,\s*\d+\s*\]/g,
  ))
    resultado.set(fila[3], Number(fila[2]));
  return resultado;
}
