// Lector de las notas de módulo (`Módulos/M<NN> <schema>.md`) de la bóveda SALUD,
// para `generate-schema-descriptions.mjs`.
//
// A diferencia de las notas de entidad, el «Propósito de negocio» de un módulo es
// texto específico (no plantilla). 10 de los 67 módulos no lo traen (M00, M08, M16,
// M17, M18, M21, M33, M34, M65, M66): ahí `business` es `null` y la pantalla lo
// dice; no se inventa un propósito.

const lf = (texto) => texto.replaceAll('\r\n', '\n');

const limpiar = (texto) =>
  texto
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replaceAll('**', '')
    .replace(/\s+/g, ' ')
    .trim();

function metrica(cuerpo, rotulo) {
  const m = new RegExp(`^- ${rotulo}: \\*\\*(\\d+)\\*\\*`, 'm').exec(cuerpo);
  return m ? Number(m[1]) : null;
}

function enlacesDeSeccion(cuerpo, titulo) {
  const bloque = new RegExp(`## ${titulo}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |\\n\\n\\[\\[|\\s*$)`).exec(cuerpo)?.[1] ?? '';
  return [...bloque.matchAll(/^- \[\[M(\d+) /gm)].length;
}

/** Una nota de módulo como datos, o `null` si el archivo no lo es. */
export function parseNotaDeModulo(texto, archivo) {
  const cuerpo = lf(texto);
  const cabecera = /^# Módulo (\d+) · (\S+)\n\n\*\*(.*?)\*\*/m.exec(cuerpo);
  if (!cabecera || !/^M\d+ /.test(archivo)) return null;
  const tags = [...(/^---\n([\s\S]*?)\n---/.exec(cuerpo)?.[1] ?? '').matchAll(/^\s*-\s+(\S+)\s*$/gm)].map((m) => m[1]);
  const schemaTag = tags.find((t) => t.startsWith('schema/'))?.slice(7);
  const dominio = tags.find((t) => t.startsWith('dominio/'))?.slice(8).replaceAll('_', ' ') ?? null;
  const proposito = /## Propósito de negocio\n([\s\S]*?)(?=\n## |\s*$)/.exec(cuerpo)?.[1];
  const entidades = metrica(cuerpo, 'Entidades/tablas');
  const conjuntosDeIndices = metrica(cuerpo, 'Conjuntos de índices');
  return {
    archivo,
    moduleNumber: Number(cabecera[1]),
    moduleCode: cabecera[2],
    // M65 y M66 no traen la etiqueta `schema/…`: el código del encabezado es el schema.
    schema: schemaTag ?? cabecera[2],
    title: limpiar(cabecera[3]),
    domain: dominio,
    business: proposito ? limpiar(proposito) : null,
    entidades,
    vistas: metrica(cuerpo, 'Vistas'),
    conjuntosDeIndices,
    stubs: metrica(cuerpo, 'Stubs de referencia externa'),
    dependeDe: enlacesDeSeccion(cuerpo, 'Depende de'),
    referenciadoPor: enlacesDeSeccion(cuerpo, '(?:← )?Referenciado por'),
  };
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/**
 * La explicación «de sistema» del módulo, armada **sólo con las métricas de la nota**:
 * «Entidades/tablas» incluye los conjuntos de índices (`idxset_*`), por eso las tablas
 * son la resta. Sin métricas no hay frase: devuelve `null`.
 */
export function explicacionDeSistema(m) {
  if (m.entidades === null) return null;
  const indices = m.conjuntosDeIndices ?? 0;
  const partes = [
    `Módulo ${String(m.moduleNumber).padStart(2, '0')} del modelo: ${plural(m.entidades - indices, 'tabla o vista modelada', 'tablas o vistas modeladas')}`,
    ...(indices > 0 ? [plural(indices, 'conjunto de índices', 'conjuntos de índices')] : []),
  ];
  const relaciones = [
    ...(m.dependeDe > 0 ? [`depende de ${plural(m.dependeDe, 'módulo', 'módulos')}`] : []),
    ...(m.referenciadoPor > 0 ? [`lo referencian ${plural(m.referenciadoPor, 'módulo', 'módulos')}`] : []),
  ];
  return `${partes.join(' y ')}${relaciones.length ? `; ${relaciones.join(' y ')}` : ''}.`;
}
