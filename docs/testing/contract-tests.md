# Pruebas de contrato

> Fase 15. **No se identificó una capa de pruebas de contrato dedicada** en el repositorio —
> verificación automática de que la respuesta real de un endpoint cumple el schema declarado en
> `openapi/openapi.yaml`.

## Lo más cercano que existe

- El propio contrato se **genera desde el código** (`tools/openapi/generate-openapi.mjs`, ver
  [notas de generación](../reports/openapi-generation-notes.md)), lo cual garantiza que la
  *forma* declarada (nombres de campo, tipos de DTO) coincide con el código en el momento de
  generar — pero no verifica que la *respuesta en runtime* de cada uno de los 841 endpoints
  cumpla ese schema contra datos reales.
- `class-validator`/`ValidationPipe` garantiza que las *requests* entrantes cumplen el DTO
  (rechaza lo que no cumple) — es validación de entrada, no prueba de contrato de salida.

## Brecha real

Ninguna de las 841 operaciones tiene una prueba automatizada que confirme "esta respuesta real
cumple exactamente el schema que el cliente espera" — el plan maestro (§14) lo exige como
validación documental automatizada ("Los ejemplos cumplen el esquema"). No implementado.

## Qué se necesita

1. Herramienta de pruebas de contrato (p. ej. Dredd, Schemathesis, o pruebas E2E que validen
   contra el JSON Schema del OpenAPI generado).
2. Integrarla en CI (ver Fase 16).

## Ver también

- [Estrategia de pruebas](strategy.md), [notas de generación de OpenAPI](../reports/openapi-generation-notes.md).
