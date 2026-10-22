// Lógica del importador de la bóveda al catálogo de datos. Separada del CLI para
// poder probarla con una API simulada (`import-vault.test.mjs`).
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  camposDePlantilla,
  evidenciaDeFk,
  evidenciaDeNota,
  indicePlantillas,
  parcheDeFicha,
  parseNotaDeEntidad,
  parseNotaDeFk,
} from './vault-notes.mjs';

/** Los primeros 12 caracteres del sha256 del contenido: la «revisión» de una nota. */
export const revisionDe = (texto) => `sha256:${createHash('sha256').update(texto).digest('hex').slice(0, 12)}`;

/** Lee todas las notas de entidad y de FK de la bóveda. */
export function cargarBoveda(raiz) {
  const leer = (carpeta, parser) =>
    readdirSync(join(raiz, carpeta))
      .map((archivo) => {
        const texto = readFileSync(join(raiz, carpeta, archivo), 'utf8');
        const nota = parser(texto, archivo);
        return nota ? { ...nota, revision: revisionDe(texto.replaceAll('\r\n', '\n')) } : null;
      })
      .filter(Boolean);
  const entidades = leer('Entidades', parseNotaDeEntidad);
  const fks = leer('FK', parseNotaDeFk);
  return { entidades, fks, plantillas: indicePlantillas(entidades) };
}

const cuenta = (items, clave) =>
  items.reduce((acc, item) => {
    const k = clave(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

/** Qué hay en la bóveda, sin tocar ninguna API. */
export function resumir({ entidades, fks, plantillas }, { schemas } = {}) {
  const filtro = (n) => !schemas || schemas.includes(n.schema);
  const tablas = entidades.filter((n) => !n.esConjuntoDeIndices && filtro(n));
  const conPlantilla = tablas.map((n) => camposDePlantilla(n, plantillas).length);
  return {
    notasDeEntidad: entidades.filter(filtro).length,
    conjuntosDeIndices: entidades.filter((n) => n.esConjuntoDeIndices && filtro(n)).length,
    tablasYVistas: tablas.length,
    textoPropio: tablas.filter((_, i) => conPlantilla[i] === 0).length,
    soloPlantilla: tablas.filter((n, i) => conPlantilla[i] > 0 && conPlantilla[i] >= ['business', 'example', 'existence'].filter((c) => c in n.raw).length).length,
    notasDeFk: fks.filter(filtro).length,
    fkSinDestino: fks.filter((f) => filtro(f) && f.sinDestino).length,
    fkPorCriterio: cuenta(
      fks.filter((f) => filtro(f) && !f.sinDestino),
      (f) => f.destinos[0].basis ?? 'sin criterio',
    ),
    porSchema: cuenta(tablas, (n) => n.schema),
  };
}

/** Cliente mínimo de la API: JSON, con el error HTTP legible. */
export function crearApi({ base, token, fetchFn = globalThis.fetch }) {
  async function pedir(metodo, ruta, cuerpo) {
    const respuesta = await fetchFn(`${base}${ruta}`, {
      method: metodo,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
    });
    const texto = await respuesta.text();
    let datos = null;
    try {
      datos = texto ? JSON.parse(texto) : null;
    } catch {
      datos = { message: texto.slice(0, 200) };
    }
    return { status: respuesta.status, ok: respuesta.ok, datos };
  }
  return { pedir };
}

/** Todos los objetos de un schema del catálogo: `nombre → id`, recorriendo el cursor. */
export async function objetosDelSchema(api, schema) {
  const mapa = new Map();
  let cursor;
  do {
    const ruta = `/admin/catalog/objects?schema=${encodeURIComponent(schema)}&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const { ok, status, datos } = await api.pedir('GET', ruta);
    if (!ok) throw new Error(`GET objects ${schema}: HTTP ${status}`);
    for (const item of datos.items) mapa.set(item.objectName, item.id);
    cursor = datos.nextCursor ?? undefined;
  } while (cursor);
  return mapa;
}

const RAZONES_HUMANAS = new Set(['MANUAL_REVISION_EXISTS', 'REVIEW_ALREADY_STARTED']);
const razonDe = (datos) => datos?.details?.violations?.[0]?.reason ?? datos?.violations?.[0]?.reason ?? null;

/** Escribe la ficha de un objeto. Devuelve `creada | actualizada | sinCambios | respetaLoHumano`. */
async function escribirFicha(api, objectId, parche) {
  for (let intento = 0; intento < 2; intento += 1) {
    const actual = await api.pedir('GET', `/admin/catalog/objects/${objectId}`);
    if (!actual.ok) throw new Error(`GET object: HTTP ${actual.status}`);
    const previa = actual.datos.annotation;
    const resp = await api.pedir('PUT', `/admin/catalog/objects/${objectId}/annotation`, {
      ...parche,
      expectedVersion: previa?.version ?? 0,
    });
    if (resp.ok) {
      if (!previa) return 'creada';
      return resp.datos.currentRevisionNo === previa.currentRevisionNo ? 'sinCambios' : 'actualizada';
    }
    if (resp.status === 409 && intento === 0) continue; // el segundo escritor: se relee y se reintenta una vez
    if (resp.status === 422 && RAZONES_HUMANAS.has(razonDe(resp.datos))) return 'respetaLoHumano';
    throw new Error(`PUT annotation: HTTP ${resp.status} ${razonDe(resp.datos) ?? resp.datos?.message ?? ''}`.trim());
  }
  throw new Error('PUT annotation: conflicto repetido');
}

/**
 * Importa al catálogo las notas de los `schemas` indicados. Nunca envía a
 * revisión, nunca aprueba, y no pisa lo que una persona ya escribió o revisó (la
 * API lo impide; acá sólo se cuenta). Repetirlo no duplica nada.
 */
export async function importar(api, boveda, { schemas, limite = Infinity, conFk = true, revisionPorNota = true, log = () => undefined }) {
  const total = {
    fichasCreadas: 0,
    fichasActualizadas: 0,
    fichasSinCambios: 0,
    fichasRespetaLoHumano: 0,
    evidenciasDeNota: 0,
    evidenciasDeFk: 0,
    fkSinColumna: 0,
    notasSinObjeto: [],
    errores: [],
  };
  const fksPorTabla = new Map();
  for (const fk of boveda.fks) {
    const clave = `${fk.schema}.${fk.table}`;
    fksPorTabla.set(clave, [...(fksPorTabla.get(clave) ?? []), fk]);
  }

  let procesadas = 0;
  for (const schema of schemas) {
    const objetos = await objetosDelSchema(api, schema);
    const notas = boveda.entidades.filter((n) => n.schema === schema && !n.esConjuntoDeIndices);
    for (const nota of notas) {
      if (procesadas >= limite) return total;
      const objectId = objetos.get(nota.table);
      if (!objectId) {
        total.notasSinObjeto.push(`${schema}.${nota.table}`);
        continue;
      }
      procesadas += 1;
      try {
        const parche = parcheDeFicha(nota, boveda.plantillas, {
          changeReason: `Importado de SALUD/Entidades/${nota.archivo} (${nota.revision})`,
        });
        const resultado = await escribirFicha(api, objectId, parche);
        if (resultado === 'creada') total.fichasCreadas += 1;
        else if (resultado === 'actualizada') total.fichasActualizadas += 1;
        else if (resultado === 'sinCambios') total.fichasSinCambios += 1;
        else total.fichasRespetaLoHumano += 1;

        const ev = await api.pedir('POST', `/admin/catalog/objects/${objectId}/evidence`, evidenciaDeNota(nota, { sourceRevision: revisionPorNota ? nota.revision : undefined }));
        if (!ev.ok) throw new Error(`POST evidence: HTTP ${ev.status}`);
        total.evidenciasDeNota += 1;

        const fksDeLaTabla = conFk ? (fksPorTabla.get(`${schema}.${nota.table}`) ?? []) : [];
        if (fksDeLaTabla.length > 0) {
          const columnas = await api.pedir('GET', `/admin/catalog/objects/${objectId}/columns`);
          if (!columnas.ok) throw new Error(`GET columns: HTTP ${columnas.status}`);
          const idDeColumna = new Map(columnas.datos.items.map((c) => [c.columnName, c.id]));
          for (const fk of fksDeLaTabla) {
            const columnId = idDeColumna.get(fk.column);
            if (!columnId) {
              total.fkSinColumna += 1;
              continue;
            }
            const r = await api.pedir('POST', `/admin/catalog/columns/${columnId}/evidence`, evidenciaDeFk(fk, { sourceRevision: fk.revision }));
            if (!r.ok) throw new Error(`POST column evidence: HTTP ${r.status}`);
            total.evidenciasDeFk += 1;
          }
        }
      } catch (error) {
        total.errores.push(`${schema}.${nota.table}: ${error.message}`);
      }
      if (procesadas % 50 === 0) log(`… ${procesadas} tablas`);
    }
  }
  return total;
}

/** Entra con correo y contraseña y devuelve el token de acceso. */
export async function iniciarSesion({ base, email, password, fetchFn = globalThis.fetch }) {
  const api = crearApi({ base, fetchFn });
  const { ok, status, datos } = await api.pedir('POST', '/iam/auth/login', { email, password });
  if (!ok) throw new Error(`Login: HTTP ${status}`);
  return datos.accessToken;
}
