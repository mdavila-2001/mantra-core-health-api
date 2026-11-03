# Seguridad de dependencias

> Fase 13. Resultado real de `yarn audit`, ejecutado en Fase 0 — ver
> [línea base](../reports/baseline.md) §3.3 para el detalle completo.

## Resultado

| Severidad | Cantidad |
|---|---:|
| Critical | 0 |
| High | 16 |
| Moderate | 0 |
| Low | 0 |

Sobre **1073 dependencias totales**.

## Causa raíz — una sola, no 16 independientes

Las 16 advertencias `high` provienen todas de `brace-expansion@<=5.0.7`
(CVE-2026-14257, GHSA-mh99-v99m-4gvg — denegación de servicio por expansión de patrones glob no
acotada), alcanzada exclusivamente a través de **dependencias de desarrollo**
(`eslint`, `jest`, `@testcontainers/postgresql`).

## Por qué se acepta el riesgo

Sin ruta de alcance a las `dependencies` de producción (`package.json`) — el vector de explotación
requiere pasar entrada de atacante a `expand()`/patrones glob de `minimatch`, algo que ocurre en
herramientas de build/test, no en código servido a clientes externos. Riesgo residual `MEDIUM`,
**aceptado** (`SEC-003` en [matriz de trazabilidad](../governance/traceability-matrix.md)).

## Proceso de auditoría de dependencias

`.github/workflows/docs.yml` corre `yarn npm audit --all --recursive --environment production`
como paso bloqueante: audita las dependencias de runtime, no las de desarrollo.

## Ver también

- [Línea base](../reports/baseline.md) §3.3
- [Gestión de cambios](../governance/change-management.md)
