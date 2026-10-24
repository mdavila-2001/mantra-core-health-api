// Cruce contrato OpenAPI ↔ código: una fila por operación HTTP con su handler.
// Es la base del inventario de endpoints; los pasos siguientes (tablas, eventos,
// DTO) cuelgan de estas filas.
import { buildSourceIndex } from './ast.mjs';
import { loadContract } from './openapi.mjs';

/**
 * Cómo quedó resuelta la delegación del handler al servicio:
 *  - `SERVICIO`: al menos una llamada `this.<dependencia>.<método>()` cuya clase
 *    destino se conoce por el constructor.
 *  - `SIN_LLAMADAS`: el handler no invoca nada sobre una dependencia inyectada.
 *  - `NO_RESUELTA`: invoca dependencias pero ninguna se puede ligar a una clase.
 */
export const DELEGACION = {
  SERVICIO: 'SERVICIO',
  SIN_LLAMADAS: 'SIN_LLAMADAS',
  NO_RESUELTA: 'NO_RESUELTA',
};

function delegacionDe(calls) {
  if (!calls.length) return DELEGACION.SIN_LLAMADAS;
  return calls.some((call) => call.targetClass)
    ? DELEGACION.SERVICIO
    : DELEGACION.NO_RESUELTA;
}

/**
 * @param {object} options
 * @param {string} [options.root] - Raíz del repositorio de la API.
 * @param {string[]} [options.modulos] - Filtra por módulo (carpeta de `src/modules`).
 * @returns {{ filas: object[], huerfanas: object[] }} `huerfanas` son handlers de
 *   controlador que no corresponden a ninguna operación del contrato.
 */
export function buildHandlerTable({ root = process.cwd(), modulos } = {}) {
  const { operations } = loadContract(root);
  const { controllerMethods } = buildSourceIndex(root);
  const quiere = modulos?.length ? new Set(modulos) : null;

  const filas = [];
  const usados = new Set();
  for (const { route, method, operation } of operations()) {
    const clave = operation.operationId.split('__')[0];
    const handler = controllerMethods.get(clave);
    const modulo =
      handler?.moduleName ?? operation.tags?.[0] ?? 'sin-clasificar';
    if (quiere && !quiere.has(modulo)) continue;
    if (handler) usados.add(clave);

    const llamadas = handler?.calls ?? [];
    filas.push({
      operationId: operation.operationId,
      metodo: method.toUpperCase(),
      ruta: route,
      modulo,
      encontrado: Boolean(handler),
      controlador: handler?.className ?? null,
      handler: handler?.methodName ?? null,
      fuente: handler ? `${handler.source}:${handler.line}` : null,
      roles: handler?.roles ?? [],
      publica: handler
        ? handler.isPublic
        : (operation.security ?? []).length === 0,
      httpCode: handler?.httpCode ?? null,
      identidadVerificada: handler?.requiresVerifiedIdentity ?? false,
      delegacion: handler ? delegacionDe(llamadas) : null,
      servicios: [
        ...new Set(
          llamadas
            .filter((call) => call.targetClass)
            .map((call) => `${call.targetClass}.${call.method}`),
        ),
      ],
      sinResolver: [
        ...new Set(
          llamadas
            .filter((call) => !call.targetClass)
            .map((call) => `this.${call.property}.${call.method}`),
        ),
      ],
    });
  }

  const huerfanas = [];
  for (const [clave, handler] of controllerMethods) {
    if (usados.has(clave)) continue;
    if (quiere && !quiere.has(handler.moduleName)) continue;
    huerfanas.push({
      clave,
      modulo: handler.moduleName,
      metodo: handler.httpVerb ?? null,
      ruta: `/${handler.routePath}`,
      fuente: `${handler.source}:${handler.line}`,
      excluidaDelContrato: handler.decorators.some((nombre) =>
        ['ApiExcludeEndpoint', 'ApiExcludeController'].includes(nombre),
      ),
    });
  }
  return { filas, huerfanas };
}

/** Resumen por módulo para los informes de cobertura. */
export function resumenPorModulo(filas) {
  const porModulo = new Map();
  for (const fila of filas) {
    const resumen = porModulo.get(fila.modulo) ?? {
      modulo: fila.modulo,
      operaciones: 0,
      encontradas: 0,
      [DELEGACION.SERVICIO]: 0,
      [DELEGACION.SIN_LLAMADAS]: 0,
      [DELEGACION.NO_RESUELTA]: 0,
    };
    resumen.operaciones += 1;
    if (fila.encontrado) {
      resumen.encontradas += 1;
      resumen[fila.delegacion] += 1;
    }
    porModulo.set(fila.modulo, resumen);
  }
  return [...porModulo.values()].sort((a, b) =>
    a.modulo.localeCompare(b.modulo),
  );
}
