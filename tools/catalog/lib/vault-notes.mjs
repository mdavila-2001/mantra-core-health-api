// Lector de las notas de entidad (`E <schema>.<tabla>.md`) y de clave foránea
// (`FK <schema>.<tabla>.<columna>.md`) de la bóveda SALUD, para el importador del
// catálogo de datos (`import-vault-annotations.mjs`).
//
// ## Qué es y qué no es este texto
//
// Las secciones «Negocio / Ejemplo concreto / Por qué no debe eliminarse /
// Sistema» las **genera una herramienta** a partir de plantillas por módulo y por
// tipo de tabla: medido sobre las 2 601 notas, 111 variantes de «Negocio» cubren
// 2 580 textos. No son la justificación que escribió una persona. Por eso:
//
//  - se importan como borrador `IMPORTED_VAULT`, nunca aprobado ni enviado;
//  - cada campo que sale de una plantilla se declara como pregunta abierta
//    («redactar la justificación real»);
//  - «plantilla» no se decide por una lista a mano: un texto es plantilla si, una
//    vez quitado lo que varía (nombre de la tabla, enlaces, números, código),
//    se repite en `UMBRAL_PLANTILLA` notas o más. Una justificación escrita por
//    una persona no se repite palabra por palabra en tres tablas.

/** Repeticiones, ya normalizado el texto, a partir de las cuales es plantilla. */
export const UMBRAL_PLANTILLA = 3;

const SECCIONES = {
  Negocio: 'business',
  'Ejemplo concreto': 'example',
  'Por qué no debe eliminarse del modelo': 'existence',
  Sistema: 'system',
};

/** Quita finales de línea de Windows: la bóveda está guardada con CRLF. */
const lf = (texto) => texto.replaceAll('\r\n', '\n');

/** `[[M01 iam|01 · iam]]` → `01 · iam`; `[[X]]` → `X`; sin negritas ni espacios de más. */
export function limpiar(texto) {
  return texto
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replaceAll('**', '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** El nombre del archivo `E <schema>.<tabla>.md` → `{ schema, table }` o `null`. */
export function nombreDeEntidad(archivo) {
  const m = /^E ([^.]+)\.(.+)\.md$/.exec(archivo);
  return m ? { schema: m[1], table: m[2] } : null;
}

/** El nombre del archivo `FK <schema>.<tabla>.<columna>.md` → `{ schema, table, column }` o `null`. */
export function nombreDeFk(archivo) {
  const m = /^FK ([^.]+)\.(.+)\.([^.]+)\.md$/.exec(archivo);
  return m ? { schema: m[1], table: m[2], column: m[3] } : null;
}

function etiquetas(texto) {
  const bloque = /^---\n([\s\S]*?)\n---/.exec(texto)?.[1] ?? '';
  return bloque
    .split('\n')
    .map((linea) => /^\s*-\s+(\S+)\s*$/.exec(linea)?.[1])
    .filter(Boolean);
}

function enlaces(texto, titulo) {
  const bloque = new RegExp(`## ${titulo}\\n([\\s\\S]*?)(?=\\n## |\\n*$)`).exec(texto)?.[1] ?? '';
  return [...bloque.matchAll(/\[\[E ([^.\]|]+)\.([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map((m) => ({
    schema: m[1],
    table: m[2],
  }));
}

/**
 * Una nota de entidad como datos. `texto` es el contenido del archivo y
 * `archivo` su nombre (sin carpeta). Devuelve `null` si no es una nota de entidad.
 */
export function parseNotaDeEntidad(texto, archivo) {
  const nombre = nombreDeEntidad(archivo);
  if (!nombre) return null;
  const cuerpo = lf(texto);
  const tags = etiquetas(cuerpo);
  const secciones = {};
  const patron =
    /\*\*(Negocio|Ejemplo concreto|Por qué no debe eliminarse del modelo|Sistema):\*\*\s*([\s\S]*?)(?=\n\n\*\*[A-ZÁÉÍÓÚ]|\n\n## |\s*$)/g;
  for (const m of cuerpo.matchAll(patron)) secciones[SECCIONES[m[1]]] = m[2].trim();

  const tipo = tags.find((t) => t.startsWith('tipo/'))?.slice(5) ?? null;
  const modulo = tags.find((t) => t.startsWith('modulo/'))?.slice(7) ?? null;
  const dominio = tags.find((t) => t.startsWith('dominio/'))?.slice(8).replaceAll('_', ' ') ?? null;
  const materializada = tags.includes('materialized');
  return {
    ...nombre,
    archivo,
    tags,
    tipo,
    modulo,
    dominio,
    /** Los conjuntos de índices describen índices, no tablas del catálogo. */
    esConjuntoDeIndices: tipo === 'index_set',
    esVista: tipo === 'view' || materializada,
    raw: secciones,
    refiereA: enlaces(cuerpo, 'Relaciona con →'),
    referenciadaPor: enlaces(cuerpo, '← Referenciada por'),
  };
}

/** Una nota de clave foránea como datos, o `null` si el archivo no lo es. */
export function parseNotaDeFk(texto, archivo) {
  const nombre = nombreDeFk(archivo);
  if (!nombre) return null;
  const cuerpo = lf(texto);
  const bloque = /## Apunta a →\n([\s\S]*?)(?=\n## |\n*$)/.exec(cuerpo)?.[1] ?? '';
  const destinos = [...bloque.matchAll(/^- \[\[E ([^.\]|]+)\.([^\]|]+)(?:\|[^\]]*)?\]\](?:\s+_\(([^)]*)\)_)?/gm)].map(
    (m) => ({ schema: m[1], table: m[2], basis: m[3]?.trim() ?? null }),
  );
  return { ...nombre, archivo, destinos, sinDestino: destinos.length === 0 };
}

/** El texto sin lo que varía entre tablas: lo que queda es la plantilla. */
export function huella(texto, tabla) {
  const nombre = new RegExp(`(?<![A-Za-z0-9_])${tabla.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9_])`, 'g');
  return limpiar(texto)
    .replace(nombre, '<T>')
    .replace(/`[^`]*`/g, '<C>')
    .replace(/\d+/g, '<N>')
    .toLowerCase();
}

/**
 * Cuenta, sobre todas las notas, cuántas veces aparece cada texto ya normalizado.
 * `esPlantilla` consulta ese conteo.
 */
/**
 * Esqueletos que la herramienta generadora repite aunque el módulo sea tan chico
 * que ningún texto llegue a repetirse `UMBRAL_PLANTILLA` veces. Se miden sobre la
 * bóveda real: el texto escrito por una persona (p. ej. el módulo `audio_assets`)
 * no los usa.
 */
const ESQUELETOS = {
  // El texto generado siempre cita su módulo con un enlace `[[M43 ads|43 · ads]]`.
  business: /m[óo]dulo \[\[M\d+/,
  example: /^En la operaci[óo]n diaria relacionada con/,
  existence: /^(Si esta tabla se eliminara, el negocio perder[ií]a el registro mismo de|No se elimina porque, aunque no guarda datos de negocio)/,
};

export function indicePlantillas(notas) {
  const conteo = new Map();
  for (const nota of notas) {
    for (const [campo, texto] of Object.entries(nota.raw)) {
      const clave = `${campo}|${huella(texto, nota.table)}`;
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    }
  }
  return {
    esPlantilla(nota, campo) {
      const texto = nota.raw[campo];
      if (texto === undefined) return false;
      if (ESQUELETOS[campo]?.test(texto)) return true;
      return (conteo.get(`${campo}|${huella(texto, nota.table)}`) ?? 0) >= UMBRAL_PLANTILLA;
    },
  };
}

const PREGUNTA = {
  definition: 'Texto de plantilla generado por la bóveda: redactar qué es esta tabla para el negocio.',
  purpose: 'Texto de plantilla generado por la bóveda: dar un ejemplo concreto de uso real.',
  existenceRationale: 'Texto de plantilla generado por la bóveda: redactar por qué hace falta esta tabla y qué se pierde sin ella.',
};

const MAX_NARRATIVA = 4000;
const recortar = (texto, max) => (texto.length <= max ? texto : `${texto.slice(0, max - 1)}…`);

/**
 * El parche de ficha que el importador envía: Negocio → `definition`, Ejemplo →
 * `purpose`, Por qué no debe eliminarse → `existenceRationale`. «Sistema» no tiene
 * campo propio: viaja como evidencia (ver {@link evidenciaDeNota}).
 *
 * Cada campo que sale de una plantilla agrega una pregunta abierta. Nunca incluye
 * `submit`: una importación se queda en borrador.
 */
export function parcheDeFicha(nota, plantillas, { changeReason }) {
  const campos = [
    ['definition', 'business'],
    ['purpose', 'example'],
    ['existenceRationale', 'existence'],
  ];
  const parche = { origin: 'IMPORTED_VAULT', changeReason };
  const preguntas = [];
  for (const [campoFicha, campoNota] of campos) {
    const texto = nota.raw[campoNota];
    if (texto === undefined) continue;
    parche[campoFicha] = recortar(limpiar(texto), MAX_NARRATIVA);
    if (plantillas.esPlantilla(nota, campoNota)) {
      preguntas.push({ field: campoFicha, question: PREGUNTA[campoFicha] });
    }
  }
  if (preguntas.length > 0) parche.openQuestions = preguntas;
  return parche;
}

/** Cuántos de los tres campos de negocio salen de una plantilla. */
export function camposDePlantilla(nota, plantillas) {
  return ['business', 'example', 'existence'].filter((campo) => plantillas.esPlantilla(nota, campo));
}

/** La evidencia `VAULT_NOTE` de una nota de entidad: la ruta y, de excerpt, la parte «Sistema». */
export function evidenciaDeNota(nota, { carpeta = 'SALUD/Entidades', sourceRevision }) {
  return {
    kind: 'VAULT_NOTE',
    reference: `${carpeta}/${nota.archivo}`,
    ...(nota.raw.system === undefined ? {} : { excerpt: recortar(limpiar(nota.raw.system), 2000) }),
    sourceRevision,
  };
}

/** La evidencia `VAULT_NOTE` de una nota de clave foránea: a dónde apunta y con qué criterio. */
export function evidenciaDeFk(fk, { carpeta = 'SALUD/FK', sourceRevision }) {
  const destinos = fk.destinos
    .map((d) => `${d.schema}.${d.table}${d.basis ? ` (${d.basis})` : ''}`)
    .join(' · ');
  return {
    kind: 'VAULT_NOTE',
    reference: `${carpeta}/${fk.archivo}`,
    excerpt: fk.sinDestino ? 'La bóveda no declara el destino de esta clave foránea.' : `Apunta a → ${destinos}`,
    sourceRevision,
  };
}
