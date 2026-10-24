// MCH-025 · detector de cambios incompatibles del contrato OpenAPI.
//
// Reemplaza el paso que corría `npx --yes @redocly/cli diff`: bajaba la CLI
// fuera del lockfile en cada corrida y el subcomando `diff` no existe en la
// versión de Redocly CLI que el repositorio trae (2.43.2) — el paso siempre
// terminaba en warning, nunca en rojo. Este archivo no depende de nada fuera
// del lockfile: sólo `node:fs`/`node:path` y JSON.parse.
//
// Compara dos documentos OpenAPI (`--base` el de la rama destino, `--head` el
// que generó este PR) y busca cinco formas de romper un cliente que ya
// integró el contrato base:
//
//   1. una ruta u operación que existía y desapareció;
//   2. un código de respuesta documentado que desapareció de una operación
//      que sigue existiendo;
//   3. un campo nuevo obligatorio en el cuerpo de un request (o un parámetro
//      que pasó de opcional a obligatorio);
//   4. una propiedad que desapareció del cuerpo de una respuesta;
//   5. un cambio de tipo en una propiedad o parámetro que sigue existiendo.
//
// Un cambio detectado hace fallar el proceso (`process.exitCode = 1`) salvo
// que esté en la lista de excepciones explícitas — y ahí también hace falta
// una nota de migración, no sólo un "aprobado". Un error de uso, un archivo
// que no existe o un JSON inválido NUNCA se interpreta como "no hay cambios
// incompatibles": salen por `process.exitCode = 2`, un código distinto del
// de "sí hay cambios" para que quien lea el log no confunda un fallo de la
// herramienta con un contrato limpio.
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Sigue un `$ref` de `components/schemas` hasta un esquema concreto, y
 * aplana un `allOf` en un único objeto con `properties`/`required` fusionados.
 * No es un resolutor de JSON Schema completo — sólo lo que hace falta para
 * decidir si una propiedad existe y de qué tipo es, que es lo único que estos
 * contratos generados necesitan comparar.
 *
 * @param doc - Documento OpenAPI completo (para resolver `$ref`).
 * @param schema - El esquema a resolver, o `undefined`.
 * @param seen - Refs ya visitados, para no entrar en un ciclo.
 * @returns Un esquema plano con `properties`/`required`/`type` cuando aplica.
 */
export function resolveSchema(doc, schema, seen = new Set()) {
  if (!schema || typeof schema !== 'object') return {};

  if (typeof schema.$ref === 'string') {
    if (seen.has(schema.$ref)) return {};
    seen.add(schema.$ref);
    const nombre = schema.$ref.split('/').pop();
    const objetivo = doc?.components?.schemas?.[nombre];
    return resolveSchema(doc, objetivo, seen);
  }

  if (Array.isArray(schema.allOf)) {
    return schema.allOf.reduce(
      (acumulado, parte) => {
        const resuelto = resolveSchema(doc, parte, seen);
        return {
          ...acumulado,
          ...resuelto,
          properties: { ...acumulado.properties, ...resuelto.properties },
          required: [
            ...new Set([...(acumulado.required ?? []), ...(resuelto.required ?? [])]),
          ],
        };
      },
      { properties: {}, required: [] },
    );
  }

  return schema;
}

/** El esquema `application/json` de un requestBody u una respuesta, o `undefined`. */
function jsonSchemaOf(contenedor) {
  return contenedor?.content?.['application/json']?.schema;
}

/**
 * El "tipo" comparable de un esquema ya resuelto: `type` si está declarado,
 * o el nombre del primer `$ref` sin resolver como aproximación (dos esquemas
 * que apuntan a DTOs con nombre distinto se tratan como tipos distintos).
 */
function tipoComparable(schemaResuelto, schemaCrudo) {
  if (schemaResuelto?.type) return schemaResuelto.type;
  if (typeof schemaCrudo?.$ref === 'string') return schemaCrudo.$ref;
  if (Array.isArray(schemaResuelto?.enum)) return `enum(${schemaResuelto.enum.join('|')})`;
  return undefined;
}

const METODOS_HTTP = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

/**
 * Compara el requestBody de una misma operación entre base y head.
 *
 * @returns Hallazgos de campos nuevos obligatorios o cambios de tipo.
 */
function compararRequestBody(docBase, opBase, docHead, opHead, path, method) {
  const hallazgos = [];
  const crudoBase = jsonSchemaOf(opBase.requestBody);
  const crudoHead = jsonSchemaOf(opHead.requestBody);
  if (!crudoHead) return hallazgos; // Nunca hubo o ya no hay cuerpo: nada que romper acá.

  const base = resolveSchema(docBase, crudoBase);
  const head = resolveSchema(docHead, crudoHead);
  const requeridosBase = new Set(base.required ?? []);
  const requeridosHead = new Set(head.required ?? []);

  for (const campo of requeridosHead) {
    if (!requeridosBase.has(campo)) {
      hallazgos.push({
        kind: 'new_required_request_field',
        method,
        path,
        detail: campo,
      });
    }
  }

  const propiedadesBase = base.properties ?? {};
  const propiedadesHead = head.properties ?? {};
  for (const [campo, esquemaHead] of Object.entries(propiedadesHead)) {
    const esquemaBase = propiedadesBase[campo];
    if (!esquemaBase) continue; // Campo nuevo y opcional: no rompe a nadie.
    const tipoBase = tipoComparable(resolveSchema(docBase, esquemaBase), esquemaBase);
    const tipoHead = tipoComparable(resolveSchema(docHead, esquemaHead), esquemaHead);
    if (tipoBase && tipoHead && tipoBase !== tipoHead) {
      hallazgos.push({
        kind: 'changed_type',
        method,
        path,
        detail: `request.${campo}: ${tipoBase} -> ${tipoHead}`,
      });
    }
  }
  return hallazgos;
}

/** Compara los parámetros (query/path/header) de una misma operación. */
function compararParametros(opBase, opHead, path, method) {
  const hallazgos = [];
  const porClave = (lista) =>
    new Map((lista ?? []).map((p) => [`${p.in}:${p.name}`, p]));
  const paramsBase = porClave(opBase.parameters);
  const paramsHead = porClave(opHead.parameters);

  for (const [clave, paramHead] of paramsHead) {
    const paramBase = paramsBase.get(clave);
    const eraRequerido = paramBase?.required === true;
    const esRequerido = paramHead.required === true;
    if (esRequerido && !eraRequerido) {
      hallazgos.push({
        kind: 'new_required_request_field',
        method,
        path,
        detail: `parámetro ${clave}`,
      });
    }
    if (paramBase) {
      const tipoBase = paramBase.schema?.type;
      const tipoHead = paramHead.schema?.type;
      if (tipoBase && tipoHead && tipoBase !== tipoHead) {
        hallazgos.push({
          kind: 'changed_type',
          method,
          path,
          detail: `parámetro ${clave}: ${tipoBase} -> ${tipoHead}`,
        });
      }
    }
  }
  return hallazgos;
}

/** Compara los `responses` de una misma operación: códigos y cuerpos. */
function compararResponses(docBase, opBase, docHead, opHead, path, method) {
  const hallazgos = [];
  const responsesBase = opBase.responses ?? {};
  const responsesHead = opHead.responses ?? {};

  for (const [status, responseBase] of Object.entries(responsesBase)) {
    const responseHead = responsesHead[status];
    if (!responseHead) {
      hallazgos.push({ kind: 'removed_response', method, path, detail: status });
      continue;
    }

    const crudoBase = jsonSchemaOf(responseBase);
    const crudoHead = jsonSchemaOf(responseHead);
    if (crudoBase && !crudoHead) {
      hallazgos.push({
        kind: 'removed_response_property',
        method,
        path,
        detail: `${status}: se perdió el cuerpo application/json`,
      });
      continue;
    }
    if (!crudoBase || !crudoHead) continue;

    const base = resolveSchema(docBase, crudoBase);
    const head = resolveSchema(docHead, crudoHead);
    const propiedadesBase = base.properties ?? {};
    const propiedadesHead = head.properties ?? {};

    for (const [campo, esquemaBase] of Object.entries(propiedadesBase)) {
      const esquemaHead = propiedadesHead[campo];
      if (!esquemaHead) {
        hallazgos.push({
          kind: 'removed_response_property',
          method,
          path,
          detail: `${status}.${campo}`,
        });
        continue;
      }
      const tipoBase = tipoComparable(resolveSchema(docBase, esquemaBase), esquemaBase);
      const tipoHead = tipoComparable(resolveSchema(docHead, esquemaHead), esquemaHead);
      if (tipoBase && tipoHead && tipoBase !== tipoHead) {
        hallazgos.push({
          kind: 'changed_type',
          method,
          path,
          detail: `response ${status}.${campo}: ${tipoBase} -> ${tipoHead}`,
        });
      }
    }
  }
  return hallazgos;
}

/**
 * Compara dos documentos OpenAPI y devuelve todos los cambios incompatibles
 * detectados. No lanza: un documento sin `paths` se trata como vacío, no
 * como error (el error de archivo/JSON se valida antes, en `loadDocument`).
 *
 * @param docBase - El contrato de la rama destino.
 * @param docHead - El contrato que generó este candidato.
 * @returns La lista de hallazgos, cada uno con un `id` estable.
 */
export function diffOpenApi(docBase, docHead) {
  const hallazgos = [];
  const pathsBase = docBase.paths ?? {};
  const pathsHead = docHead.paths ?? {};

  for (const [path, operacionesBase] of Object.entries(pathsBase)) {
    const operacionesHead = pathsHead[path];
    for (const method of METODOS_HTTP) {
      const opBase = operacionesBase[method];
      if (!opBase) continue;
      const opHead = operacionesHead?.[method];
      if (!opHead) {
        hallazgos.push({ kind: 'removed_operation', method, path, detail: undefined });
        continue;
      }
      hallazgos.push(
        ...compararRequestBody(docBase, opBase, docHead, opHead, path, method),
        ...compararParametros(opBase, opHead, path, method),
        ...compararResponses(docBase, opBase, docHead, opHead, path, method),
      );
    }
  }

  return hallazgos.map((hallazgo) => ({
    ...hallazgo,
    id: idDe(hallazgo),
  }));
}

/** El id estable de un hallazgo: lo que se copia a la lista de excepciones. */
function idDe(hallazgo) {
  const metodo = hallazgo.method.toUpperCase();
  const base = `${hallazgo.kind}:${metodo} ${hallazgo.path}`;
  return hallazgo.detail ? `${base}:${hallazgo.detail}` : base;
}

/**
 * Separa los hallazgos entre los que quedan aprobados por una excepción
 * explícita (con su nota de migración) y los que siguen bloqueando.
 *
 * Una excepción sin `migrationNote` no cuenta como aprobación válida: es el
 * caso que MCH-025-AC03 pide ("una ruptura aprobada se documenta ... con su
 * nota de migración"), así que se ignora y el hallazgo sigue bloqueando.
 *
 * @param hallazgos - Lo que devolvió `diffOpenApi`.
 * @param excepciones - El contenido crudo del archivo de excepciones.
 * @returns `{ bloqueantes, aprobados }`.
 */
export function applyExceptions(hallazgos, excepciones) {
  const validas = new Map(
    (excepciones ?? [])
      .filter(
        (excepcion) =>
          typeof excepcion?.id === 'string' &&
          typeof excepcion?.migrationNote === 'string' &&
          excepcion.migrationNote.trim().length > 0 &&
          typeof excepcion?.reason === 'string' &&
          excepcion.reason.trim().length > 0,
      )
      .map((excepcion) => [excepcion.id, excepcion]),
  );

  const bloqueantes = [];
  const aprobados = [];
  for (const hallazgo of hallazgos) {
    const excepcion = validas.get(hallazgo.id);
    if (excepcion) aprobados.push({ ...hallazgo, excepcion });
    else bloqueantes.push(hallazgo);
  }
  return { bloqueantes, aprobados };
}

/**
 * Lee y parsea un documento OpenAPI. Cualquier problema (archivo ausente,
 * JSON inválido, no es un objeto) lanza — nunca devuelve un documento vacío
 * en silencio, porque un documento vacío diría "no hay cambios" y eso es
 * justo lo que MCH-025-AC02 prohíbe.
 */
export function loadDocument(path) {
  if (!existsSync(path)) {
    throw new Error(`No existe el archivo de contrato: ${path}`);
  }
  const crudo = readFileSync(path, 'utf8');
  let doc;
  try {
    doc = JSON.parse(crudo);
  } catch (error) {
    throw new Error(`${path} no es JSON válido: ${error.message}`);
  }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error(`${path} no es un documento OpenAPI (objeto JSON esperado)`);
  }
  return doc;
}

/** Igual que `loadDocument`, pero para el archivo opcional de excepciones. */
export function loadExceptions(path) {
  if (!path) return [];
  if (!existsSync(path)) return [];
  const crudo = readFileSync(path, 'utf8');
  let excepciones;
  try {
    excepciones = JSON.parse(crudo);
  } catch (error) {
    throw new Error(`${path} no es JSON válido: ${error.message}`);
  }
  if (!Array.isArray(excepciones)) {
    throw new Error(`${path} debe ser un array de excepciones`);
  }
  return excepciones;
}

function parseArgs(argv) {
  const args = { base: undefined, head: undefined, exceptions: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const actual = argv[i];
    if (actual === '--base') args.base = argv[++i];
    else if (actual === '--head') args.head = argv[++i];
    else if (actual === '--exceptions') args.exceptions = argv[++i];
    else throw new Error(`Argumento no reconocido: ${actual}`);
  }
  if (!args.base || !args.head) {
    throw new Error('Uso: check-breaking.mjs --base <openapi.json> --head <openapi.json> [--exceptions <archivo.json>]');
  }
  return args;
}

function imprimirHallazgo(hallazgo) {
  const detalle = hallazgo.detail ? ` — ${hallazgo.detail}` : '';
  return `  [${hallazgo.kind}] ${hallazgo.method.toUpperCase()} ${hallazgo.path}${detalle}\n    id: ${hallazgo.id}`;
}

/**
 * Punto de entrada de la CLI. Separado de `main()` de más abajo sólo para
 * que las pruebas unitarias puedan invocarlo con argumentos arbitrarios sin
 * tocar `process.argv`/`process.exit`.
 *
 * @returns El código de salida: 0 sin rupturas, 1 con rupturas bloqueantes,
 *   2 si el propio chequeo no pudo correr (uso inválido, archivo ausente,
 *   JSON corrupto). Nunca confundir 2 con 0: un chequeo que no corrió no es
 *   un contrato limpio.
 */
export function run(argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`::error::${error.message}`);
    return 2;
  }

  let docBase;
  let docHead;
  let excepciones;
  try {
    docBase = loadDocument(args.base);
    docHead = loadDocument(args.head);
    excepciones = loadExceptions(args.exceptions);
  } catch (error) {
    console.error(`::error::${error.message}`);
    return 2;
  }

  const hallazgos = diffOpenApi(docBase, docHead);
  const { bloqueantes, aprobados } = applyExceptions(hallazgos, excepciones);

  if (aprobados.length > 0) {
    console.log(`${aprobados.length} cambio(s) incompatible(s) con excepción aprobada:`);
    for (const hallazgo of aprobados) {
      console.log(imprimirHallazgo(hallazgo));
      console.log(`    excepción: ${hallazgo.excepcion.reason}`);
      console.log(`    migración: ${hallazgo.excepcion.migrationNote}`);
    }
  }

  if (bloqueantes.length === 0) {
    console.log('Sin cambios incompatibles no aprobados en el contrato OpenAPI.');
    return 0;
  }

  console.error(`::error::${bloqueantes.length} cambio(s) incompatible(s) del contrato OpenAPI sin excepción:`);
  for (const hallazgo of bloqueantes) {
    console.error(imprimirHallazgo(hallazgo));
  }
  console.error(
    '\nSi la ruptura está aprobada, agregar una entrada con el `id` de arriba, ' +
      '`reason` y `migrationNote` al archivo de excepciones (--exceptions).',
  );
  return 1;
}

// `pathToFileURL` (y no una interpolación manual) porque en Windows
// `process.argv[1]` puede llegar relativo (`tools/openapi/check-breaking.mjs`)
// o con separadores `\`, y una comparación de texto contra `import.meta.url`
// —siempre una URL absoluta— fallaba en silencio: el script se importaba bien
// pero nunca corría como CLI, ni fallaba ni imprimía nada.
const esEjecutadoDirectamente =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (esEjecutadoDirectamente) {
  process.exitCode = run(process.argv.slice(2));
}
