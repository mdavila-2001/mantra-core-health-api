# Reglas de negocio transversales

> Fase 9. Reglas que aplican a los 60 módulos por igual, verificadas en código — no una lista de
> buenas intenciones. Las reglas específicas de cada dominio viven en
> [el módulo correspondiente](../modules/index.md) (`domain-rules` real = el README del módulo).

## 1. Auditoría obligatoria en toda entidad

Toda entidad de negocio incluye campos de auditoría compartidos (`createdBy()`, `touch()` en
`src/common/persistence/audit-fields.ts`) — los dos nodos de mayor y cuarto mayor centralidad de
todo el grafo de dependencias (738 y 484 usos respectivamente,
[graphify-audit.md](../reports/graphify-audit.md) §7). No es opcional por módulo.

## 2. Bloqueo optimista (`row_version`)

Toda tabla del modelo lleva una columna `row_version` (`version: true` en MikroORM). Dos
escrituras concurrentes sobre la misma fila se detectan (`PreconditionFailedException`, 353 usos
en el código) en vez de pisarse silenciosamente — crítico en un dominio donde una escritura
perdida puede ser una dosis de medicación o un cobro duplicado.

## 3. Aislamiento de dominio verificable

Un módulo no accede a repositorios/entidades de otro dominio directamente — se verifica
mecánicamente con `tools/redesa/coverage-report.mjs` (`DIRECT_CROSS_DOMAIN_ACCESS`). Única
excepción conocida y aceptada: `billing → practice`, de solo lectura y deliberadamente estrecha
(`ARCH-001`, [matriz de trazabilidad](../governance/traceability-matrix.md)).

## 4. Terminología gobernada, no enums de código

Los valores cerrados del dominio (estados, tipos, categorías clínicas y administrativas) se
resuelven contra `terminology.catalog_concepts` vía columnas `*_concept_id`. Regla explícita del
proyecto: **no inventar enums de TypeScript** para estos campos — un valor nuevo es un `INSERT`
en el catálogo, gobernado, no una migración de esquema ni un despliegue de código.

## 5. Mutaciones sin ambigüedad de autorización

Todo endpoint mutante (`POST`/`PUT`/`PATCH`/`DELETE`) debe declarar explícitamente `@Roles(...)`
o `@Public()` — no puede quedar protegido solo implícitamente por el guard JWT global sin una
decisión de autorización explícita. Verificado: **0** endpoints mutantes sin esta política
(`ORPHAN_ENDPOINT` en `tools/redesa/coverage-report.mjs`).

## 6. Acceso a PHI: rol Y alcance clínico, no rol O alcance

Ver [autorización](../api/authorization.md) §"PDP clínico aditivo" — la regla completa con el
sistema de rangos de acción (`READ`/`WRITE`/`DELETE`) contra nivel de grant.

## 7. Consentimiento como control activo, no solo un registro

El módulo `consent` no es un log de casillas marcadas: retirar un consentimiento
(`POST /consent/consents/{id}/withdraw`) **dispara re-evaluación de accesos** activos, y aplicar
una restricción de privacidad (`POST /consent/privacy-restrictions`) afecta directamente el RLS
clínico. Las bases legales de procesamiento son versionadas (una nueva *supersede* a la
anterior, no la reemplaza) y la evidencia de consentimiento es append-only e inmutable — no se
puede editar ni borrar un consentimiento históricamente otorgado, solo revocarlo hacia adelante.

## 8. Idempotencia donde el negocio la exige, no en todas partes

No hay un mecanismo genérico transversal — se implementa por dominio donde el riesgo de duplicar
una operación es real (pagos, emisión de solicitudes de medicación). Ver
[convenciones de API](../api/conventions.md) §"Idempotencia".

## 9. Errores de negocio con código estable, mensaje para humanos

Los servicios lanzan subclases semánticas de `DomainException`, nunca excepciones genéricas sin
tipar. El cliente debe ramificar sobre `code`, nunca sobre el texto de `message`. Ver
[modelo de error](../api/error-model.md).

## 10. Entidades generadas, nunca editadas a mano

Las 1 186 entidades se producen con `python salud-db/gen_entities.py` desde los `.puml` del
modelo canónico —la misma fuente que el DDL—, y el JSDoc lo rellena `yarn docs:tsdoc` en una
pasada aparte que respeta la prosa escrita a mano. Si algo no cuadra, se corrige el modelo y
se regenera — no se parchea la entidad TypeScript directamente (fuente:
`src/modules/README.md`, [ADR-0022](../adr/ADR-0022-generacion-de-entidades.md)).
