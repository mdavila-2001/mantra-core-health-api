# Política de documentación

> Fase 16. Reglas vigentes para mantener este portal — no una aspiración, son las reglas que
> `yarn docs:validate` y `.github/workflows/docs.yml` hacen cumplir mecánicamente.

## Regla central

Ningún cambio a rutas, DTO, entidades, permisos, eventos o configuración se mergea sin actualizar
la documentación asociada — impuesto por la casilla documental de
[`.github/PULL_REQUEST_TEMPLATE.md`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/.github/PULL_REQUEST_TEMPLATE.md)
y verificado por CI (`.github/workflows/docs.yml`).

## Fuente de verdad por tipo de contenido

| Contenido | Fuente de verdad | Cómo se sincroniza |
|---|---|---|
| Contrato de API | Decoradores `@Api*` en el código | `yarn docs:openapi:generate` (nunca a mano) |
| Contrato de eventos | `asyncapi/asyncapi.yaml` | Mantenido a mano — sin generador automático en esta fase (a diferencia de OpenAPI) |
| Contrato por módulo | `src/modules/<módulo>/README.md` | `yarn docs:modules:sync` (espejo, nunca editar `docs/modules/*.md` directamente) |
| Catálogo de entidades | Bóveda de diseño SALUD + código real | `yarn docs:data:sync` |
| Arquitectura C4 | `structurizr/workspace.dsl` + páginas Markdown | Manual — sin generador automático |
| ADR | `docs/adr/` | Manual, uno por decisión, nunca se edita un ADR aceptado — se reemplaza con uno nuevo que lo referencia |
| Reportes de auditoría (`docs/reports/`) | Snapshots de un momento específico | No se actualizan retroactivamente — un hallazgo superado se marca "Cerrado", no se borra |

## Reglas editoriales (aplicadas en Fase 17)

- Español técnico claro, términos consistentes con el [glosario](../business/glossary.md).
- Cero referencias vagas ("esto", "el sistema") sin contexto — todo hallazgo cita archivo/comando.
- Separar explícitamente comportamiento actual, decisión y recomendación — no mezclar "lo que es"
  con "lo que debería ser" sin decirlo.
- Cero marcadores `TODO`/`FIXME`/`TBD` en contenido final — verificado por
  `tools/docs/check-doc-coverage.mjs`. La palabra "pendiente" describiendo un hallazgo real
  verificado (p. ej. "verificación pendiente") no es un marcador de esta categoría — el checker
  distingue ambos casos explícitamente.

## Ver también

- [Proceso de revisión](review-process.md), [Gestión de cambios](change-management.md).
