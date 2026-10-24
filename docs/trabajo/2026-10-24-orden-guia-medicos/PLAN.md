# Plan — Ordenar la guía de médicos por nota y por actividad

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` (este), `mantra-core-health` (front) · Predecesor: P61 de `PENDIENTES-BACKEND.md` del front
- Resultado observable: en `/directory`, el paciente ordena a los 795 médicos por mejor puntuación, más reseñas, más encuentros atendidos, más recetas, más notas clínicas y más documentos, además de A–Z / Z–A.
- Kill-test: `GET /profiles/practitioners` no trae `ratingAverage`, `ratingCount` ni `activity` en cada fila.

## Alcance
- IN: `PractitionerListItemDto` suma `ratingAverage`, `ratingCount` y `activity`; `PractitionerContextPort.directoryStats` las calcula en lote por página; pruebas del servicio.
- OUT: `openapi/openapi.yaml` (ya no tiene el esquema de este listado: se regenera aparte con infraestructura arriba); orden del lado del servidor (la guía se ordena en memoria en el front, que ya trae el padrón entero); índices sobre `created_by_user_id`.
- Ambigüedades registradas:
  - «Todas las estadísticas que se ofrecen»: se toman las cuatro cuentas públicas de la ficha (`activity`) más la nota. Los indicadores de calidad (`quality`) no viajan en la ficha de un tercero en la API, así que no entran. Confirmar con el propietario.
  - La nota sólo cuenta reseñas del perfil público **visible y activo** del médico (mismo criterio que la lectura pública por slug). Confirmar con el propietario.

## H1 — El listado trae las cifras de cada médico
**CA:** Dado un médico con cuenta y reseñas publicadas, cuando se pide `GET /profiles/practitioners`, entonces su fila trae su nota (una decimal), cuántas reseñas y sus cuatro cuentas; uno sin cuenta ni reseñas trae `null`, `0` y ceros.
**DoD:** `yarn test src/modules/profiles` en verde · `yarn typecheck` exit 0 · `yarn eslint` de los archivos tocados sin errores · consulta ejecutada contra PostgreSQL real.
**Estado:** HECHO

### H1.S1 — Lectura en lote
**CA:** Las cifras de una página salen de dos consultas, no de una por fila. **DoD:** adaptador real contra Postgres 16 desechable. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | `directoryStats` en el puerto y el adaptador | Devuelve nota y cuentas; excluye reseñas retiradas, perfiles ocultos y vínculos inactivos | `tsx sqlcheck/check.ts` contra Postgres 16 → DR_A `4.3·3`, `5/3/0/1`; DR_B `null·0`, `2/0/1/0`; DR_C ausente | HECHO |
| H1.S1.M2 | Campos en `PractitionerListItemDto` | `ratingAverage`, `ratingCount`, `activity` declarados con `@ApiProperty` | `yarn typecheck` → exit 0 | HECHO |
| H1.S1.M3 | El servicio los cruza por fila, y una lectura caída no tumba la guía | Fila sin cifras → `null`/`0`/ceros; error → lista igual | `yarn test …profiles-practitioners.service.spec.ts -t listPractitioners` → 9 passed | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| `created_by_user_id` sin índice | Subconsultas lentas con mucho volumen clínico | 50 cuentas por página; se mide en staging y, si hace falta, índice aparte |
| Una lectura de cifras falla | La guía entera caería | `.catch` → ceros y `warn` con la pieza, sin PHI |
