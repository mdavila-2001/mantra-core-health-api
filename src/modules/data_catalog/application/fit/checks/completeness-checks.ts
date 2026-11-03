import type { FitInputs, FitOperation } from '../fit.types';
import {
  answered,
  defineCheck,
  isTable,
  measure,
  noSource,
} from './check-helpers';
import { isRealMethod } from '../fit-routes';

const NO_CONTENT = /(^|\.)(NO_CONTENT|204)$/;

/** Operaciones que son una ruta HTTP real (con o sin contrato OpenAPI): lo que se evalúa acá. */
const rutasReales = (ops: readonly FitOperation[]): FitOperation[] =>
  ops.filter((o) => isRealMethod(o.method));

export const operationWithoutTables = defineCheck({
  id: 'FIT-COM-001',
  dimension: 'COMPLETENESS',
  title:
    'Toda operación declara las tablas que afecta (o por qué no toca ninguna)',
  severity: 'ALTA',
  remediation:
    'Revisar la operación: si toca datos, el generador no resolvió la llamada (`noResuelto` en su ficha); si no toca ninguno, dejar la razón en `sinTablas`.',
  evaluate(i: FitInputs) {
    const { operations } = i;
    if (!operations.ok)
      return noSource('inventario de operaciones', operations);
    return measure(
      rutasReales(operations.value),
      (o) => o.tables > 0 || o.noTablesDeclared,
      (o) => ({
        subject: `${o.method} ${o.route}`,
        detail: `${o.id} no declara tablas ni la razón de no tenerlas`,
      }),
    );
  },
});

export const operationWithoutInputDto = defineCheck({
  id: 'FIT-COM-002',
  dimension: 'COMPLETENESS',
  title: 'Toda operación con cuerpo declara su DTO de entrada',
  severity: 'MEDIA',
  remediation:
    'Tipar el `@Body()` con una clase DTO validada (lista blanca de campos) y anotarla para el contrato; un cuerpo sin DTO no se valida ni se documenta.',
  evaluate(i: FitInputs) {
    const { operations } = i;
    if (!operations.ok)
      return noSource('inventario de operaciones', operations);
    return measure(
      rutasReales(operations.value).filter((o) => o.hasBody),
      (o) => answered(o.bodyDto),
      (o) => ({
        subject: `${o.method} ${o.route}`,
        detail: `${o.id} recibe cuerpo y no declara el DTO de entrada`,
      }),
    );
  },
});

export const operationWithoutOutputDto = defineCheck({
  id: 'FIT-COM-003',
  dimension: 'COMPLETENESS',
  title: 'Toda operación con respuesta declara su DTO de salida',
  severity: 'MEDIA',
  remediation:
    'Anotar el handler con `@ApiResponse({ type: …Dto })`; una respuesta sin DTO queda sin contrato y el cliente la tipa a ciegas. Las respuestas 204 no cuentan.',
  evaluate(i: FitInputs) {
    const { operations } = i;
    if (!operations.ok)
      return noSource('inventario de operaciones', operations);
    return measure(
      rutasReales(operations.value).filter(
        (o) => !(o.httpCode && NO_CONTENT.test(o.httpCode)),
      ),
      (o) => answered(o.responseDto),
      (o) => ({
        subject: `${o.method} ${o.route}`,
        detail: `${o.id} no declara el DTO de salida`,
      }),
    );
  },
});

export const operationWithoutRoles = defineCheck({
  id: 'FIT-COM-004',
  dimension: 'COMPLETENESS',
  title: 'Toda operación no pública declara los roles que la pueden llamar',
  severity: 'MEDIA',
  remediation:
    'Declarar `@Roles(...)` o, si basta con una sesión autenticada, dejarlo escrito en el contrato; hoy es indistinguible de un olvido. La API es la autoridad: la deriva de permisos (`GET /admin/catalog/permission-drift`) lo cruza con los roles sembrados.',
  evaluate(i: FitInputs) {
    const { operations } = i;
    if (!operations.ok)
      return noSource('inventario de operaciones', operations);
    return measure(
      rutasReales(operations.value).filter((o) => !o.isPublic),
      (o) => o.roles.length > 0,
      (o) => ({
        subject: `${o.method} ${o.route}`,
        detail: `${o.id} exige sesión pero ningún rol`,
      }),
    );
  },
});

export const tableWithoutSystemDescription = defineCheck({
  id: 'FIT-COM-005',
  dimension: 'COMPLETENESS',
  title:
    'Toda tabla tiene descripción de sistema (modelo o comentario en la base)',
  severity: 'MEDIA',
  remediation:
    'Documentar la tabla en el modelo (`COMMENT ON TABLE` / diagrama) y regenerar el inventario; el comentario en la base lo recoge el siguiente escaneo.',
  evaluate(i: FitInputs) {
    const { staticTables, liveObjects } = i;
    if (!staticTables.ok && !liveObjects.ok)
      return noSource('catálogo estático y vivo', staticTables);
    // unión de las dos fuentes: una tabla tiene descripción si CUALQUIERA la trae
    const universo = new Map<string, boolean>();
    if (staticTables.ok)
      for (const t of staticTables.value)
        universo.set(`${t.schema}.${t.table}`, answered(t.systemDescription));
    if (liveObjects.ok)
      for (const o of liveObjects.value)
        if (isTable(o.kind)) {
          const clave = `${o.schema}.${o.name}`;
          universo.set(
            clave,
            (universo.get(clave) ?? false) || answered(o.tableComment),
          );
        }
    return measure(
      [...universo.entries()],
      ([, tiene]) => tiene,
      ([clave]) => ({
        subject: clave,
        detail: 'Sin descripción de sistema ni en el modelo ni en la base',
      }),
      {
        staticSourceAvailable: staticTables.ok,
        liveSourceAvailable: liveObjects.ok,
      },
    );
  },
});

export const tableWithoutBusinessCard = defineCheck({
  id: 'FIT-COM-006',
  dimension: 'COMPLETENESS',
  title: 'Toda tabla observada tiene ficha curada con descripción de negocio',
  severity: 'MEDIA',
  remediation:
    'Completar la ficha (`PUT /admin/catalog/objects/:id/annotation`): propósito o definición de negocio, y enviarla a revisión. Aprobarla es otra dimensión (cobertura, `GET /admin/catalog/coverage`).',
  evaluate(i: FitInputs) {
    const { liveObjects } = i;
    if (!liveObjects.ok) return noSource('catálogo vivo', liveObjects);
    return measure(
      liveObjects.value.filter((o) => isTable(o.kind)),
      (o) =>
        o.card !== null &&
        (answered(o.card.purpose) || answered(o.card.definition)),
      (o) => ({
        subject: `${o.schema}.${o.name}`,
        detail:
          o.card === null
            ? 'Sin ficha curada'
            : 'Ficha sin propósito ni definición de negocio',
      }),
    );
  },
});

export const COMPLETENESS_CHECKS = [
  operationWithoutTables,
  operationWithoutInputDto,
  operationWithoutOutputDto,
  operationWithoutRoles,
  tableWithoutSystemDescription,
  tableWithoutBusinessCard,
];
