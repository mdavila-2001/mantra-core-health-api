// Explicación de negocio y de sistema de cada operación, y su nivel de riesgo.
//
// Nada de esto es prosa libre: cada frase sale de un dato con fuente. Si no hay de
// dónde sacar una explicación de negocio, el campo queda `null` y la operación se
// marca `SIN_FUENTE` para que alguien la complete; no se rellena con una frase genérica.

const MAXIMO_NOMBRES = 8;

function lista(nombres) {
  const unicos = [...new Set(nombres)];
  const visibles = unicos.slice(0, MAXIMO_NOMBRES).join(', ');
  return unicos.length > MAXIMO_NOMBRES
    ? `${visibles} y ${unicos.length - MAXIMO_NOMBRES} más`
    : visibles;
}

/** Primera oración completa; si es demasiado larga, se corta en una coma o en un espacio. */
function recortar(texto, maximo = 240) {
  const primera = texto.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? texto;
  if (primera.length <= maximo) return primera;
  const corte = primera.slice(0, maximo);
  const coma = corte.lastIndexOf(', ');
  const hasta = coma > 100 ? coma : corte.lastIndexOf(' ');
  return `${corte.slice(0, hasta).trimEnd()}…`;
}

const plural = (n, singular, plural_) => `${n} ${n === 1 ? singular : plural_}`;

/**
 * @param {object} datos
 * @param {string|null} datos.resumen - `summary` del contrato o JSDoc del handler.
 * @param {{ uc: string, descripcion: string, fuente: string }[]} datos.casosDeUso
 * @param {{ texto: string, fuente: string } | null} datos.proposito - Nota del módulo.
 * @param {{ dominio: string, fuente: string } | null} datos.dominio
 */
export function explicacionDeNegocio({
  resumen,
  casosDeUso,
  proposito,
  dominio,
}) {
  const partes = [];
  const fuentes = [];
  if (resumen) {
    partes.push(`${resumen.replace(/\.$/, '')}.`);
    fuentes.push({ tipo: 'CONTRATO', referencia: 'summary de la operación' });
  }
  for (const caso of casosDeUso) {
    partes.push(
      `Caso de uso ${caso.uc}: ${caso.descripcion.replace(/\.$/, '')}.`,
    );
    fuentes.push({ tipo: 'README', referencia: caso.fuente });
  }
  if (proposito) {
    partes.push(
      `Dentro del módulo (descripción del modelo, en inglés): «${recortar(proposito.texto)}»`,
    );
    fuentes.push({ tipo: 'MODELO', referencia: proposito.fuente });
  }
  if (dominio) {
    partes.push(`Dominio: ${dominio.dominio}.`);
    fuentes.push({ tipo: 'MODELO', referencia: dominio.fuente });
  }
  return partes.length
    ? { estado: 'AUTO_DETECTADA', texto: partes.join(' '), fuentes }
    : { estado: 'SIN_FUENTE', texto: null, fuentes: [] };
}

/**
 * Frase determinista sobre cómo se atiende la operación, armada sólo con datos ya
 * calculados (código, requerimientos, tablas, eventos).
 */
export function explicacionDeSistema({
  metodo,
  ruta,
  codigo,
  autenticacion,
  cuerpo,
  servicios,
  tablas,
  eventos,
  trabajos,
  sinTablas,
  noResuelto,
}) {
  const partes = [];
  partes.push(
    codigo
      ? `\`${metodo} ${ruta}\` la atiende \`${codigo.controlador}.${codigo.handler}\` (${codigo.fuente}).`
      : `\`${metodo} ${ruta}\`: handler no localizado en el código.`,
  );
  partes.push(
    autenticacion.publica
      ? 'Es una ruta pública: no exige token.'
      : autenticacion.roles.length
        ? `Exige sesión con alguno de los roles ${autenticacion.roles.join(', ')}.`
        : 'Exige sesión; el controlador no declara roles.',
  );
  if (cuerpo?.dto)
    partes.push(
      `Valida el cuerpo como \`${cuerpo.dto}\` (${plural(cuerpo.campos.length, 'campo', 'campos')}, ${plural(cuerpo.campos.filter((c) => c.obligatorio).length, 'obligatorio', 'obligatorios')}).`,
    );
  if (servicios.length)
    partes.push(`Delega en ${lista(servicios.map((s) => `\`${s}\``))}.`);

  const porDetalle = (detalle) =>
    tablas
      .filter((t) => t.detalle === detalle)
      .map((t) => `${t.schema}.${t.tabla}`);
  const acciones = [
    ['Crea filas en', porDetalle('CREA').concat(porDetalle('GUARDA'))],
    ['Actualiza', porDetalle('ACTUALIZA')],
    ['Borra de', porDetalle('BORRA')],
    ['Lee', porDetalle('LEE')],
  ].filter(([, nombres]) => nombres.length);
  if (acciones.length)
    partes.push(
      acciones
        .map(([verbo, nombres]) => `${verbo} ${lista(nombres)}.`)
        .join(' '),
    );
  else if (sinTablas)
    partes.push(`No toca tablas relacionales: ${sinTablas.motivo}.`);
  else partes.push('No se determinaron tablas para esta operación.');

  if (eventos.length)
    partes.push(
      `Publica ${lista(eventos.map((e) => e.tipo ?? `un evento calculado (${e.expresion})`))}.`,
    );
  if (trabajos.length)
    partes.push(
      `Encola ${lista(trabajos.map((t) => t.codigo ?? `un trabajo calculado (${t.expresion})`))}.`,
    );
  if (noResuelto.length)
    partes.push(
      `Hay ${plural(noResuelto.length, 'llamada', 'llamadas')} cuyo destino depende de un dato en tiempo de ejecución y no se ${noResuelto.length === 1 ? 'siguió' : 'siguieron'}.`,
    );
  return { estado: 'AUTO_DETECTADA', texto: partes.join(' ') };
}

/**
 * Riesgo según lo que la operación hace y cómo se protege. No usa datos personales
 * ni financieros: el modelo no los clasifica por columna (ver hallazgo HZ-18).
 *
 *   ALTO   pública y escribe · borra · escribe estando autenticada sin roles en el
 *          controlador.
 *   MEDIO  escribe, con roles declarados.
 *   BAJO   sólo lee, o no toca tablas.
 */
export function riesgoDe({ autenticacion, tablas }) {
  const escribe = tablas.some(
    (t) => t.operacion === 'ESCRIBE' || t.operacion === 'BORRA',
  );
  const borra = tablas.some((t) => t.operacion === 'BORRA');
  const razones = [];
  if (autenticacion.publica && escribe)
    razones.push('Ruta pública que escribe en la base');
  if (borra) razones.push('Borra filas');
  if (escribe && !autenticacion.publica && !autenticacion.roles.length)
    razones.push('Escribe y el controlador no declara roles');
  if (razones.length) return { nivel: 'ALTO', razones };
  if (escribe)
    return {
      nivel: 'MEDIO',
      razones: ['Escribe en la base, con roles declarados'],
    };
  return {
    nivel: 'BAJO',
    razones: [tablas.length ? 'Sólo lee' : 'No toca tablas relacionales'],
  };
}
