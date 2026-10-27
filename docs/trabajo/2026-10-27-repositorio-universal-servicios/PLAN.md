# Plan — Repositorio universal de servicios: buscar e importar, sin alta libre

- Fecha: 2026-10-27 · Repos afectados: `mantra-core-health-api` (este); `mantra-core-health` (front, ver bloqueo) · Predecesor: `docs/seed-research/specialty-services.md` (2026-10-24)
- Resultado observable: un profesional, desde «Mis servicios», **busca** en un repositorio de referencia con todos los servicios conocidos (filtrable por especialidad y fuente) y **importa** los que ofrece a su catálogo con su precio. Ya **no puede inventar** un servicio a mano.
- Kill-test: `POST /billing/service-catalog` con un nombre libre y sin `serviceConceptId` responde 201 → no está hecho.

## Alcance
- IN:
  - API: búsqueda sobre el repositorio (`GET /billing/service-catalog/repository`), importación en lote (`POST /billing/service-catalog/import`), y el alta (`POST /billing/service-catalog`) pasa a exigir un concepto del repositorio.
  - Datos: investigación multi-fuente (agentes en paralelo por grupo de especialidades + fuentes internacionales) y carga de las fuentes nuevas al repositorio por el mismo patrón de `tools/terminology-import/` (sin DDL, ADR-0021).
- OUT: precios de referencia en moneda (la UMA no se convierte; ver `procedure-nomenclature.service.ts`); cambios al modelo `.puml` (especialidades faltantes se **proponen**, no se agregan acá); el arancel boliviano ya sembrado.
- Ambigüedades registradas:
  1. «No se debe permitir crearlo»: ¿aplica también a la administración (`SECURITY_ADMIN`)? Supuesto: **sí**, nadie da de alta texto libre; el servicio interno `CITA_MEDICA` que la API siembra al crear la práctica no pasa por el endpoint y se conserva. Confirmar con producto.
  2. ¿Qué código lleva un servicio importado? Supuesto: `<code_system>:<código de la fuente>` (o el código del concepto si ya trae prefijo), estable y sin choques entre fuentes.
  3. Repo del front `mdavila-2001/mantra-core-health`: el agregado del repo a la sesión fue denegado por el clasificador de permisos → la pantalla queda **BLOQUEADA** hasta que el usuario autorice.

## H1 — La API busca en el repositorio e importa, y el alta libre queda cerrada
**CA:** Dado un profesional en su consultorio propio, cuando busca «ecocardiograma» en el repositorio, entonces recibe los servicios de todas las fuentes cargadas con su especialidad y fuente; cuando importa uno con precio, aparece en su catálogo enlazado al concepto; cuando intenta crear uno sin concepto del repositorio, recibe 400.
**DoD:** `yarn typecheck` exit 0 · `yarn test src/modules/billing` verde · `yarn lint` sin errores nuevos · integración contra Postgres desechable con el repositorio sembrado.
**Estado:** EN CURSO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | `ServiceRepositoryService.search` (texto sin acentos, multi-palabra, especialidad, fuente, paginado) | devuelve sólo conceptos de los conjuntos del repositorio | spec unitario + int-spec | TODO |
| H1.S1.M2 | `GET /billing/service-catalog/repository` | 200 con `items[].specialties[]` y `source` | int-spec | TODO |
| H1.S2.M1 | `POST /billing/service-catalog/import` (lote ≤ 50, idempotente por concepto) | reimportar no duplica | spec + int-spec | TODO |
| H1.S2.M2 | `POST /billing/service-catalog` exige `serviceConceptId` del repositorio | sin concepto → 400; concepto ajeno al repositorio → 400 | spec | TODO |

## H2 — El repositorio cubre todas las especialidades con fuentes verificadas
**CA:** Dada cualquiera de las 63 especialidades del modelo, cuando se filtra el repositorio por ella, entonces hay servicios con fuente citada; las listas de control de los agentes quedan cruzadas contra el repositorio y los huecos, documentados.
**DoD:** loader en dry-run y `--apply` contra Postgres desechable; segunda corrida inserta 0; tabla de cobertura por especialidad en el REPORTE.
**Estado:** EN CURSO (agentes de investigación corriendo)

## H3 — Front «Mis servicios»: buscador + importar
**Estado:** BLOQUEADO (sin acceso al repo del front en esta sesión).

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Licencias de fuentes extranjeras | No se puede redistribuir | Sólo fuentes con licencia verificada; CPT/CDT/SNOMED excluidos |
| El front llama al alta libre | La pantalla actual de «nuevo servicio» devuelve 400 | Documentar el contrato nuevo; H3 |
| Volumen (decenas de miles de conceptos) | Búsqueda lenta | Paginado, `LIMIT`, filtro por conjunto antes del texto |
