# Proceso de revisión

> Fase 16.

## Revisión de código con impacto documental

1. El autor marca la [casilla documental](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/.github/PULL_REQUEST_TEMPLATE.md)
   correspondiente y ejecuta la sincronización relevante (`yarn docs:modules:sync`,
   `yarn docs:data:sync`, `yarn docs:openapi:generate`, según aplique).
2. `.github/workflows/docs.yml` verifica mecánicamente: build, pruebas unitarias, contrato
   OpenAPI regenerado sin errores de Redocly, AsyncAPI válido, cobertura documental, enlaces
   internos, y `mkdocs build --strict`.
3. El revisor humano confirma que la casilla marcada corresponde al cambio real — CI verifica
   *que* la documentación es válida, no *que* sea la documentación correcta para el cambio.
4. `.github/CODEOWNERS` (ver [ownership](ownership.md), con marcadores pendientes de completar)
   determina qué área debe revisar cambios en zonas críticas (autorización, datos, contrato de
   API).

## Revisión de un ADR nuevo

Un ADR se propone con estado `Propuesto`, se discute, y pasa a `Aceptado` (o `Rechazado`) — nunca
se edita un ADR ya `Aceptado` para cambiar la decisión: un cambio de decisión es un ADR nuevo que
referencia y reemplaza al anterior (marcándolo `Reemplazado`).

## Revisión de cambios al contrato OpenAPI/AsyncAPI

Todo cambio que afecte `openapi/openapi.yaml` (generado, no editado a mano) pasa por la detección
de breaking changes de CI (`.github/workflows/docs.yml` — comparación contra la rama base). Un
cambio incompatible detectado no bloquea automáticamente el merge en esta fase (el proyecto no
tiene versionado de API, ver [ADR-0011](../adr/ADR-0011-sin-versionado-api.md)) — genera una
advertencia que el revisor humano debe evaluar explícitamente.

## Ver también

- [Política de documentación](documentation-policy.md), [Gestión de cambios](change-management.md).
