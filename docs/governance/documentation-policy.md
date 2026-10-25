# Política de documentación

> Fase 16. Reglas vigentes para mantener este portal — no una aspiración, son las reglas que
> `yarn docs:validate` y `.github/workflows/docs.yml` hacen cumplir mecánicamente.

## Regla central

Ningún cambio a rutas, DTO, entidades, permisos, eventos o configuración se mergea sin actualizar
la documentación asociada — impuesto por la casilla documental de
[`.github/PULL_REQUEST_TEMPLATE.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/.github/PULL_REQUEST_TEMPLATE.md)
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
  `tools/docs/check-doc-coverage.mjs`. El checker solo detecta la forma literal del marcador
  (`TODO:`, `FIXME:`, `TBD`); la palabra "pendiente" como estado de negocio (una cita
  `PENDIENTE`, un pago pendiente) no es un marcador.

## El repo describe lo que existe

La documentación y el código describen el sistema tal como es hoy. El estado del trabajo no se
versiona (regla completa en [`AGENTS.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/AGENTS.md) §2.1):

- Ni planes, ni reportes de sesión, ni tableros de estado, ni secciones «Pendiente», «Próximos
  pasos» o «Falta», ni listas de tareas sin tildar. Tampoco carpetas como `docs/trabajo/` o
  `docs/progress/`.
- Un límite real del sistema se describe en presente («no valida X», «no expone Y») y, si hay
  trabajo previsto, se enlaza el issue.
- El plan y la evidencia de un trabajo van en la descripción del PR. Lo que quedó sin hacer, un
  bug encontrado de paso o una decisión que depende de alguien van a un issue de GitHub en el
  repo que corresponde, y el PR lo enlaza. Los hallazgos de seguridad llevan la etiqueta
  `seguridad`.
- En el código, una limitación intencional se explica en presente y sin `TODO`/`FIXME`; el
  trabajo que falta es un issue, y el comentario puede apuntarlo (`// ver #123`).
- Los checklists de procedimiento (la *Verificación* de la plantilla del PR, los pasos de un
  runbook) sí van: se tildan en cada uso y no describen trabajo pendiente.

`yarn docs:coverage` (`tools/docs/check-doc-coverage.mjs`, parte de `yarn docs:validate`) lo
verifica y falla cuando encuentra alguna de estas cosas:

- `docs/trabajo/`, `docs/progress/` o `docs/tareas/`, o un `PLAN.md`, `REPORTE.md` o
  `PENDIENTES*.md` en cualquier parte del repo;
- un markdown con un encabezado «Pendiente(s)» o «Falta» (como título entero o seguidos de `:`),
  «Próximos pasos», «Por hacer», «Qué sigue», `TODO` o `FIXME`;
- un comentario que empieza con `TODO:` o `FIXME` en `src/**/*.ts`.

Quedan fuera el modelo vendorizado (`database/SQL/`), `.agents/` y `.claude/`, que describen la
regla, y `.github/`, porque la plantilla del PR lleva su checklist. Las listas de tareas sin tildar
no se verifican automáticamente, porque un runbook las usa con razón: las cuida la revisión.

## Ver también

- [Proceso de revisión](review-process.md), [Gestión de cambios](change-management.md).
