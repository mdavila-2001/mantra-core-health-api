// Ensambla el inventario de endpoints: un registro por operación HTTP.
//
// Las operaciones salen de dos fuentes y el registro dice de cuál (`origen`):
//   CONTRATO          está en `openapi/openapi.json`.
//   CONTRATO_AUSENTE  existe como handler en el código y el contrato no la publica
//                     (decisión D-08 del plan; hallazgo HZ-10). Su cuerpo se lee de
//                     `@Body() dto: X` en vez del contrato.
import fs from 'node:fs';
import path from 'node:path';
import { buildSourceIndex } from './ast.mjs';
import { rutaDelModelo } from './salida.mjs';
import { crearAnalizadorDeDatos } from './datos.mjs';
import {
  casosDeUsoDe,
  leerCasosDeUso,
  leerDominios,
  leerPropositos,
  normalizarRuta,
  numerosDeModulo,
} from './documentos.mjs';
import { createDtoReader } from './dto.mjs';
import {
  explicacionDeNegocio,
  explicacionDeSistema,
  riesgoDe,
} from './explicaciones.mjs';
import { buildHandlerTable, claveDeHandler } from './handlers.mjs';
import {
  loadContract,
  requestBody,
  schemaName,
  schemaType,
} from './openapi.mjs';
import { indexarPruebas, pruebasDe } from './pruebas.mjs';
import { leerGlobales, requerimientosDe } from './requerimientos.mjs';

const NO_RELACIONALES = {
  redis_runtime: 'Redis',
  search_platform: 'OpenSearch',
  document_store: 'MongoDB',
};
const EN_PARAMETRO = { Param: 'path', Query: 'query', Headers: 'header' };
const ENVOLTORIOS = new Set([
  'Promise',
  'Array',
  'Record',
  'Partial',
  'Readonly',
  'Awaited',
]);

function limpiarJsDoc(texto) {
  if (!texto || /^(UC|C)-[\w-]+\.?$/.test(texto)) return null;
  return texto.replace(/\s+/g, ' ').trim() || null;
}

/** `/a/:id/b` → `/a/{id}/b`: una sola notación para mostrar. */
function rutaDeCodigo(ruta) {
  return `/${ruta}`.replace(/:([A-Za-z0-9_]+)/g, '{$1}').replace(/\/+/g, '/');
}

function leerCurado(root) {
  const archivo = path.join(root, 'tools/inventario/curado/sin-tablas.json');
  return fs.existsSync(archivo)
    ? JSON.parse(fs.readFileSync(archivo, 'utf8'))
    : {};
}

/**
 * @param {object} [opciones]
 * @param {string} [opciones.root] - Raíz del repo del API.
 * @param {string} [opciones.modelRoot] - Raíz del repo del modelo (por defecto, el hermano).
 */
export function construirInventarioDeEndpoints({
  root = process.cwd(),
  modelRoot = rutaDelModelo(root),
} = {}) {
  const contract = loadContract(root);
  const index = buildSourceIndex(root);
  const dto = createDtoReader({ contract, index, resolverAlias: true });
  const datos = crearAnalizadorDeDatos(index);
  const globales = leerGlobales(root);
  const { filas, huerfanas } = buildHandlerTable({ root });
  const casosDeUso = leerCasosDeUso(root);
  const propositos = leerPropositos(modelRoot);
  const dominios = leerDominios(root, modelRoot);
  const numeros = numerosDeModulo(root);
  const pruebas = indexarPruebas(root);
  const curado = leerCurado(root);
  const operacionesPorId = new Map(
    contract.operations().map((item) => [item.operation.operationId, item]),
  );

  // alias de contrato de una clase, sólo si el nombre de la clase es único
  const aliasDe = new Map();
  for (const [alias, clave] of index.apiSchemaAliases) {
    const clase = clave.split('#')[1];
    if ((index.classesPorNombre.get(clase) ?? []).length === 1)
      aliasDe.set(clase, alias);
  }
  const esquemaDe = (nombre) => {
    const publicado = aliasDe.get(nombre) ?? nombre;
    return contract.schemas[publicado] ? publicado : null;
  };

  function dtoDeRetorno(tipoRetorno) {
    for (const nombre of tipoRetorno.match(/[A-Z][A-Za-z0-9_]*/g) ?? []) {
      if (ENVOLTORIOS.has(nombre)) continue;
      const publicado = esquemaDe(nombre);
      if (publicado)
        return {
          nombre: publicado,
          ref: { $ref: `#/components/schemas/${publicado}` },
        };
    }
    return null;
  }

  function registro({ origen, metodo, ruta, modulo, operation, handler }) {
    const resultado = handler
      ? datos.deHandler(handler)
      : {
          tablas: [],
          eventos: [],
          trabajos: [],
          noResuelto: [],
          parcial: false,
        };
    const fila = filas.find(
      (item) => item.operationId === operation?.operationId,
    );

    // ---- autenticación y requerimientos
    const publica = handler
      ? handler.isPublic
      : (operation?.security ?? []).length === 0;
    const autenticacion = {
      publica,
      roles: handler?.roles ?? [],
      identidadVerificada: handler?.requiresVerifiedIdentity ?? false,
    };
    const requerimientos = requerimientosDe({
      operation: operation ?? {
        security: publica ? [] : [{ bearer: [] }],
        parameters: [],
      },
      handler,
      globales,
    });

    // ---- parámetros y cuerpo
    const parametros = operation
      ? (operation.parameters ?? []).map((p) => ({
          nombre: p.name,
          en: p.in,
          obligatorio: Boolean(p.required),
          tipo: p.schema ? schemaType(p.schema) : null,
          descripcion: p.description ?? null,
        }))
      : (handler?.parametros ?? [])
          .filter((p) => p.en !== 'Body')
          .map((p) => ({
            nombre: p.nombre,
            en: EN_PARAMETRO[p.en],
            obligatorio: p.en === 'Param' ? true : null,
            tipo: p.tipo,
            descripcion: null,
          }));

    let cuerpo = null;
    if (operation) {
      const body = requestBody(operation);
      if (body.schema)
        cuerpo = {
          contentType: body.contentType,
          obligatorio: body.required,
          dto: schemaName(body.schema) ?? null,
          campos: dto.camposDeDto(body.schema, { modulo }),
          payloadMinimo: dto.payloadMinimo(body.schema),
          payloadCompleto: dto.exampleForSchema(body.schema, 'full'),
        };
    } else {
      const parametroCuerpo = handler?.parametros.find((p) => p.en === 'Body');
      const nombre = parametroCuerpo?.tipo?.match(/[A-Z][A-Za-z0-9_]*/)?.[0];
      const publicado = nombre ? esquemaDe(nombre) : null;
      const ref = publicado
        ? { $ref: `#/components/schemas/${publicado}` }
        : null;
      if (parametroCuerpo)
        cuerpo = {
          contentType: null,
          obligatorio: null,
          dto: nombre ?? null,
          campos: ref ? dto.camposDeDto(ref, { modulo }) : [],
          payloadMinimo: ref ? dto.payloadMinimo(ref) : null,
          payloadCompleto: ref ? dto.exampleForSchema(ref, 'full') : null,
        };
    }

    // ---- respuesta
    const retorno = handler ? dtoDeRetorno(handler.returnType) : null;
    const respuesta = {
      tipoRetorno: handler?.returnType ?? null,
      dto: retorno?.nombre ?? null,
      campos: retorno ? dto.camposDeDto(retorno.ref, { modulo }) : [],
    };

    // ---- explicaciones
    const rutaNormal = normalizarRuta(ruta);
    const ucs = casosDeUsoDe(casosDeUso.get(modulo), metodo, rutaNormal);
    const numero = numeros.get(modulo);
    const codigo = handler
      ? {
          controlador: handler.className,
          handler: handler.methodName,
          fuente: `${handler.source}:${handler.line}`,
        }
      : null;
    const servicios = fila?.servicios ?? [
      ...new Set(
        (handler?.calls ?? [])
          .filter((c) => c.targetClass)
          .map((c) => `${c.targetClass}.${c.method}`),
      ),
    ];

    // ---- tablas: si no hay, por qué
    let sinTablas = null;
    if (!resultado.tablas.length) {
      const id =
        operation?.operationId ??
        `${handler?.className}_${handler?.methodName}`;
      if (curado[id]) sinTablas = curado[id];
      else if (handler && handler.calls.length === 0)
        sinTablas = {
          motivo: 'el handler no invoca ningún servicio',
          fuente: codigo.fuente,
          revision: 'automática',
        };
      else if (NO_RELACIONALES[modulo])
        sinTablas = {
          motivo: `opera sobre ${NO_RELACIONALES[modulo]}, no sobre tablas relacionales`,
          fuente: 'docs/reports/system-inventory.md §2',
          revision: 'automática',
        };
      else
        sinTablas = { motivo: null, fuente: null, revision: 'SIN_DETERMINAR' };
    }

    const negocio = explicacionDeNegocio({
      resumen: operation?.summary || limpiarJsDoc(handler?.jsDoc),
      casosDeUso: ucs,
      proposito: numero ? (propositos.get(numero) ?? null) : null,
      dominio: dominios.get(modulo) ?? null,
    });
    const sistema = explicacionDeSistema({
      metodo,
      ruta,
      codigo,
      autenticacion,
      cuerpo,
      servicios,
      tablas: resultado.tablas,
      eventos: resultado.eventos,
      trabajos: resultado.trabajos,
      sinTablas: sinTablas?.motivo ? sinTablas : null,
      noResuelto: resultado.noResuelto,
    });

    return {
      id:
        operation?.operationId ?? `${handler.className}_${handler.methodName}`,
      origen,
      metodo,
      ruta,
      modulo,
      bloque: dominios.get(modulo)
        ? {
            nombre: dominios.get(modulo).dominio,
            fuente: dominios.get(modulo).fuente,
          }
        : null,
      nombre: operation?.summary || limpiarJsDoc(handler?.jsDoc) || null,
      codigo,
      casosDeUso: ucs.map((u) => ({
        id: u.uc,
        descripcion: u.descripcion,
        fuente: u.fuente,
      })),
      autenticacion,
      httpCode: handler?.httpCode ?? null,
      parametros,
      cuerpo,
      respuesta,
      requerimientos,
      tablas: resultado.tablas,
      sinTablas,
      eventos: resultado.eventos.map(({ tipo, expresion, fuente, via }) => ({
        tipo,
        expresion,
        fuente,
        via,
      })),
      trabajos: resultado.trabajos.map(
        ({ codigo: c, expresion, fuente, via }) => ({
          codigo: c,
          expresion,
          fuente,
          via,
        }),
      ),
      noResuelto: resultado.noResuelto.map(({ llamada, fuente }) => ({
        llamada,
        fuente,
      })),
      cierreParcial: resultado.parcial,
      explicacion: { negocio, sistema },
      riesgo: riesgoDe({ autenticacion, tablas: resultado.tablas }),
      datosPersonales: { estado: 'SIN_FUENTE' },
      pruebas: pruebasDe(pruebas, {
        metodo,
        ruta,
        clase: handler?.className,
        handler: handler?.methodName,
        modulo,
      }),
      flujos: [],
      revision: { estado: 'AUTO_DETECTADA' },
    };
  }

  const endpoints = [];
  for (const fila of filas) {
    const { operation } = operacionesPorId.get(fila.operationId);
    endpoints.push(
      registro({
        origen: 'CONTRATO',
        metodo: fila.metodo,
        ruta: fila.ruta,
        modulo: fila.modulo,
        operation,
        handler: index.controllerMethods.get(claveDeHandler(fila.operationId)),
      }),
    );
  }
  for (const huerfana of huerfanas) {
    const handler = index.controllerMethods.get(huerfana.clave);
    endpoints.push(
      registro({
        origen: 'CONTRATO_AUSENTE',
        metodo: huerfana.metodo ?? 'DESCONOCIDO',
        ruta: rutaDeCodigo(handler.routePath),
        modulo: huerfana.modulo,
        operation: null,
        handler,
      }),
    );
  }
  endpoints.sort(
    (a, b) =>
      a.modulo.localeCompare(b.modulo) ||
      a.ruta.localeCompare(b.ruta) ||
      a.metodo.localeCompare(b.metodo),
  );

  return { endpoints, globales, index, datos, propositos, numeros };
}

/** Cifras para el índice y para las pruebas de integridad. */
export function resumir(endpoints) {
  const cuenta = (clave) =>
    endpoints.reduce(
      (acc, e) => ({ ...acc, [clave(e)]: (acc[clave(e)] ?? 0) + 1 }),
      {},
    );
  return {
    total: endpoints.length,
    porOrigen: cuenta((e) => e.origen),
    porRiesgo: cuenta((e) => e.riesgo.nivel),
    conTablas: endpoints.filter((e) => e.tablas.length).length,
    sinTablasSinDeterminar: endpoints.filter(
      (e) => e.sinTablas?.revision === 'SIN_DETERMINAR',
    ).length,
    sinExplicacionDeNegocio: endpoints.filter(
      (e) => e.explicacion.negocio.estado === 'SIN_FUENTE',
    ).length,
    conPruebas: endpoints.filter((e) => e.pruebas.length).length,
    conRequerimientos: endpoints.filter((e) => e.requerimientos.length).length,
  };
}
