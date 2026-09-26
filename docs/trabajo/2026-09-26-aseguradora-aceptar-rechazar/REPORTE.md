# REPORTE — La aseguradora acepta y rechaza (por ítem)

Peldaño alcanzado: **VERIFIED** en la API (camino real HTTP → PostgreSQL →
recarga). La regresión es parcial: ver «No ejecutado».

| Hito | Estado | Evidencia |
|---|---|---|
| H1 modelo v4.2.31 | VERIFIED | Patch aplicado dos veces sobre PG16 16.13 con `apply_all` + `apply_deferred` de HEAD. La segunda pasada dice «already exists, skipping». El diff DDL ↔ `information_schema` queda vacío. |
| H2 decidir por ítem | TESTED + VERIFIED | Nuevos casos de `prior-auth-linked.service.spec.ts`: parcial, cinco casos de 422, aseguradora ajena y derivación. Además, el caso de integración. |
| H3 bandeja | TESTED + VERIFIED | `prior-auth-read.service.spec.ts` (5 casos). La consulta `findIdsForCarrier` se ejecutó en PG16 con dos aseguradoras: aísla por aseguradora y filtra por estado. |
| H4 extremo a extremo | VERIFIED | `evidencia/integracion-copagos.txt` (9/9, incluido el caso nuevo) y `evidencia/filas-persistidas.txt` (global PARTIAL, una fila APPROVED y una DENIED con la cláusula). |
| H5 contrato | RUNS | `check-breaking`: «Sin cambios incompatibles». `redocly lint`: válido. |

Totales: `yarn test src/modules/insurance` da 29 suites y 434 pruebas en verde
(`evidencia/unitarias-insurance.txt`). `yarn lint` sobre el módulo queda limpio.
`yarn typecheck` sólo falla en
`docs/trabajo/2026-09-25-auditoria-produccion-backend/reproducciones.spec.ts`,
un archivo ajeno a este cambio.

## Decisiones y supuestos (a confirmar con el dueño del producto)
- **Todo o nada por ítem.** Cada ítem se decide exactamente una vez en una sola
  determinación, y una solicitud ya determinada no admite otra (422, regla que
  ya existía). La re-determinación queda fuera.
- **Aprobado por omisión = lo solicitado.** Aprobar sin importe aprueba el
  monto y la cantidad pedidos. No se admite aprobar más de lo pedido.
- **Solicitudes genéricas** (sin pedido vinculado) siguen decidiéndose con los
  roles históricos BILLING/FINANCE; la bandeja las lista con `origin: GENERIC`.
  Una aseguradora OWNER/ADMIN sin esos roles recibe 403 al decidirlas. No se
  amplió el permiso: es una decisión de producto.
- **Tope de la bandeja: 200** filas, las más recientes. No hay paginación por cursor.

## No ejecutado / limitaciones
- `yarn install --immutable` falla en este entorno porque `xlsx` viene de
  cdn.sheetjs.com (403 del proxy). Se instaló con `xlsx@0.18.5` de npm **sólo
  en local**; `package.json` y `yarn.lock` se restauraron sin cambios.
- `jest-integration.json` no resuelve `./harness.js` → `.ts`, y el spec de
  copagos exige Node ≥ 24.9. Se corrió con Node 24.21 y un `moduleNameMapper`
  temporal (fuera del repo). Problemas previos, no arreglados aquí.
- `orm:audit` falla igual con y sin este cambio (no encuentra la bóveda del modelo).
- Suite de integración completa: no ejecutada; sólo el spec de copagos.
