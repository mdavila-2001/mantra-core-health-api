# Reporte - H6 API: organizacion, clinica extendida y contrato de calidad (BR-28/29/30)

- Fecha: 2026-09-26 - Plan: PLAN.md (este mismo directorio) - Rama: legion/test-h6-organizacion-calidad
- Peldano de evidencia alcanzado: VERIFIED para lo tocado (Postgres real efimero + API real levantada + curl +
  test:integration con dos tenants). TESTED para lo que solo corrio en unitarios. BLOQUEADO/NO CUBIERTO para el
  resto, sin inflar el peldano.
- Avance: H1 (3/3 microtareas priorizadas) - H2 (3/3 microtareas priorizadas, con 1 correccion de seguridad
  adicional) - H3 (2/4: request-id y regeneracion de OpenAPI; N+1 y CI quedaron fuera)

El detalle completo, con IDs, comandos y salidas literales, esta en
docs/progress/evidence/lane-M7-h6/REPORT.md (mismo contenido exigido por el encargo del reparto, que pide el
reporte en esa ruta especifica). Esta version es el espejo corto que exige AGENTS.md de este repo.

## Completado

Ver docs/progress/evidence/lane-M7-h6/REPORT.md seccion "Completado": 3 lecturas de BR-28 (role-assignments,
delegated-permission-sets, profiles/credentials), 3 lecturas de BR-29 (referrals/me, patient-coverages/me,
billing invoices+patient-statements), request-id (TX-14) de punta a punta, OpenAPI regenerado (TX-23), y una
correccion de seguridad (IDOR en billing) encontrada y cerrada en la misma sesion.

## A medias

Ver la misma seccion del reporte largo: CV-13 (3 de 6 hubs) y CV-10/CV-11 (API lista, front pendiente).

## Pendiente

TX-24 (CI, bloqueado por infraestructura), TX-25 (suite real e2e, bloqueado por RAM/tiempo), TX-27 (N+1, no
cubierto), CV-25 (geo, investigado y no implementado), AG-44 residuo 2 (pedido a M1, DDL).
