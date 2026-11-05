import { isRealMethod, routeKey } from '../fit-routes';
import type { FitInputs, FitOperation, FitRoute } from '../fit.types';
import { defineCheck, measure, noSource } from './check-helpers';

/** Rutas reales (sin `ALL`): las que el inventario debe conocer. */
export function realRoutes(routes: readonly FitRoute[]): Map<string, FitRoute> {
  const mapa = new Map<string, FitRoute>();
  for (const r of routes)
    if (isRealMethod(r.method)) mapa.set(routeKey(r.method, r.template), r);
  return mapa;
}

/**
 * Operaciones del inventario que son una ruta HTTP real, estén o no en el contrato OpenAPI
 * (`CONTRATO_AUSENTE` es una ruta del código que el contrato aún no publica: el inventario la
 * conoce, y es otro hallazgo, `FIT-RUT-004`). Quedan fuera los métodos auxiliares que el generador
 * confundió con un handler (verbo `DESCONOCIDO`).
 */
export function knownOperations(
  ops: readonly FitOperation[],
): Map<string, FitOperation> {
  const mapa = new Map<string, FitOperation>();
  for (const o of ops)
    if (isRealMethod(o.method)) mapa.set(routeKey(o.method, o.route), o);
  return mapa;
}

export const routeWithoutOperation = defineCheck({
  id: 'FIT-RUT-001',
  dimension: 'ROUTES',
  title: 'Toda ruta HTTP del código está en el inventario de operaciones',
  severity: 'ALTA',
  remediation:
    'Regenerar el inventario (`yarn inventario:endpoints`) y, si la ruta sigue sin aparecer, revisar que su controlador esté registrado y documentado en el contrato.',
  evaluate(i: FitInputs) {
    const { routes, operations } = i;
    if (!routes.ok) return noSource('rutas del código', routes);
    if (!operations.ok)
      return noSource('inventario de operaciones', operations);
    const enCodigo = realRoutes(routes.value);
    const enInventario = knownOperations(operations.value);
    return measure(
      [...enCodigo.entries()],
      ([clave]) => enInventario.has(clave),
      ([clave, ruta]) => ({
        subject: clave,
        detail: `${ruta.controller}.${ruta.handler} existe en el código y no está en el inventario`,
      }),
    );
  },
});

export const operationWithoutRoute = defineCheck({
  id: 'FIT-RUT-002',
  dimension: 'ROUTES',
  title:
    'Toda operación del inventario corresponde a una ruta real (sin huérfanas)',
  severity: 'ALTA',
  remediation:
    'Regenerar el inventario; si la operación sigue ahí, la ruta se borró o cambió de plantilla: la importación la marcará `NOT_OBSERVED`.',
  evaluate(i: FitInputs) {
    const { routes, operations } = i;
    if (!routes.ok) return noSource('rutas del código', routes);
    if (!operations.ok)
      return noSource('inventario de operaciones', operations);
    const enCodigo = realRoutes(routes.value);
    const enInventario = knownOperations(operations.value);
    return measure(
      [...enInventario.entries()],
      ([clave]) => enCodigo.has(clave),
      ([clave, op]) => ({
        subject: clave,
        detail: `La operación ${op.id} no tiene ruta en el código desplegado`,
      }),
    );
  },
});

export const inventoryNonRouteEntries = defineCheck({
  id: 'FIT-RUT-003',
  dimension: 'ROUTES',
  title:
    'El inventario sólo lista rutas reales (sin métodos auxiliares con verbo desconocido)',
  severity: 'MEDIA',
  remediation:
    'Corregir el generador (`tools/inventario/endpoints.mjs`) para que un método de controlador sin decorador HTTP no se registre como operación.',
  evaluate(i: FitInputs) {
    const { operations } = i;
    if (!operations.ok)
      return noSource('inventario de operaciones', operations);
    return measure(
      operations.value,
      (o) => isRealMethod(o.method),
      (o) => ({
        subject: o.id,
        detail: `Entrada con verbo ${o.method} (origen ${o.origin}): no es una ruta HTTP`,
      }),
    );
  },
});

export const routeWithoutContract = defineCheck({
  id: 'FIT-RUT-004',
  dimension: 'ROUTES',
  title: 'Toda ruta del inventario está publicada en el contrato OpenAPI',
  severity: 'MEDIA',
  remediation:
    'Documentar el controlador para Swagger (`@ApiTags`, `@ApiOperation`, `@ApiResponse`) y regenerar `openapi/openapi.json`; una ruta real que el contrato no publica no la ve ningún consumidor.',
  evaluate(i: FitInputs) {
    const { operations } = i;
    if (!operations.ok)
      return noSource('inventario de operaciones', operations);
    return measure(
      [...knownOperations(operations.value).values()],
      (o) => o.origin === 'CONTRATO',
      (o) => ({
        subject: `${o.method} ${o.route}`,
        detail: `${o.id} existe en el código y el contrato OpenAPI no la publica (origen ${o.origin})`,
      }),
    );
  },
});

export const ROUTE_CHECKS = [
  routeWithoutOperation,
  operationWithoutRoute,
  inventoryNonRouteEntries,
  routeWithoutContract,
];
