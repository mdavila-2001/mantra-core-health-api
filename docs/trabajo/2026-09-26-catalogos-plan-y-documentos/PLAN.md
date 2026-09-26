# Plan — BR-16: Plan de cuidados, plantillas de nota y documentos del expediente

- Fecha: 2026-09-26 · Repos afectados: `mch-legion-api` (este) — `mch-legion-model` **no
  disponible en este carril** (sin worktree instalado; ver bloqueo) · Predecesor: ninguno
- Resultado observable: la clase de actividad de un plan de cuidados sigue mostrándose después de
  recargar el expediente.
- Kill-test: crear un plan con una actividad, recargar `GET /charts/patients/:id/chart` → si
  `activityConceptId` no está, CL-26 no está.

## Alcance
- IN: `chart/dto/chart-read.dto.ts` (`CarePlanActivityItemDto.activityConceptId`),
  `chart/services/chart-read.service.ts` (mapeo).
- OUT — **bloqueado, no evitado**:
  - **CL-25 (catalogos de plan/documento) y la parte del modelo de CL-24**: exigen tres value sets
    nuevos en la bóveda (`SALUD/Patch v4.x/Value sets/`) + `gen_seeds.py` del repo
    **`mch-legion-model`**, que **no está instalado como worktree en esta máquina** (el encargo de
    M7 sólo trae `mch-legion-api` y `mch-legion-front`). Sin el repo del modelo no hay dónde crear
    la nota de value set ni correr el generador — y "no inventar códigos" (regla 00 §1) prohíbe
    simular los uuid5 a mano. **Pedido a M1**: instalar el worktree de `mch-legion-model` en
    `M7-Legion`, o asignar esta pieza a quien ya lo tenga.
  - **CL-24 (cardinalidad y ayuda de plantillas):** `ChartTemplateFieldDto` cuelga de
    `forms.dynamic_field_definitions`/`field_definition_localizations` (`cardinalityMin/Max`,
    `helpText`), que son del módulo `forms` — la línea de "formularios" que el reparto asigna a M3.
    Aunque `chart-templates.service.ts` vive en `chart` y no en `forms`, lee directamente esas
    entidades: tocarlas mientras M3 trabaja en paralelo sobre el mismo módulo (BR-13 ya lo hace,
    según los comentarios del propio repo) es el riesgo de conflicto exacto que el reparto pide
    evitar. **Se prioriza no pisar a M3** sobre cerrar esta pieza: queda `NO CUBIERTO`, no
    `DESCARTADO`.
  - **CL-34 (mock filtra plantillas por especialidad):** revisado — **la API ya filtra
    correctamente** (`chart-templates.repository.ts:184-190`, `specialtyConceptId` en el `where`
    cuando se manda). El defecto es sólo del mock/front (`clinical.handlers.ts:699` no lee
    `specialtyId` de la query). Nada que tocar en la API; queda para el hito de front.
  - **CL-36 (visibilidad del documento):** revisado — **la API ya lo acepta**
    (`chart-documents.service.ts:93-95`, `patientVisibilityConceptId`/`confidentialityConceptId`
    con default `VISIBILITY_PROVIDER_ONLY`/`DOC_CONFIDENTIALITY_NORMAL`). El defecto es que
    `document-block.ts` (front) no los manda. Nada que tocar en la API.

## H1 — La clase de actividad se relee (CL-26)
**CA:** Dado un plan creado con una actividad de clase «Estudio», cuando se recarga el expediente,
entonces la actividad sigue mostrando «Estudio».
**Estado:** HECHO

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H1.M1 | `activityConceptId` en `CarePlanActivityItemDto` | `yarn typecheck` limpio | HECHO |
| H1.M2 | Mapeo en `chart-read.service.ts` | `yarn test -- chart-read.service` (4/4 en verde) | HECHO |

## Riesgos y bloqueos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sin `mch-legion-model` | CL-25 y la mitad de CL-24 no se pueden cerrar desde este carril | Pedido a M1 en el reporte |
| `chart-templates.service.ts` toca entidades de `forms` (M3) | Riesgo de conflicto si se completa CL-24 | No se toca; se declara `NO CUBIERTO` |
