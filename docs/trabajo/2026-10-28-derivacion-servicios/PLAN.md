# Plan — Derivación a servicio específico de otro profesional u organización (con tipo)

- Fecha: 2026-10-28 · Repos afectados: mantra-core-health-api (`src/`, `openapi/`, `docs/trabajo/`) · Predecesor: UC-18-07 / UC-18-08 / CV-10 (referrals ya existentes)
- Resultado observable: en la consulta, un clínico busca un profesional u organización destino, elige uno de sus servicios activos y un tipo de derivación (tratamiento, consulta, estudio diagnóstico, procedimiento, segunda opinión); la API valida y persiste, y las lecturas devuelven tipo, servicio y nombres legibles.
- Kill-test: `POST /referrals` con un `targetServiceCatalogId` de otra organización que `targetTenantId` responde 201 (debería ser 422).

## Alcance
- IN: `src/modules/clinical_ext/**` (DTO, entidad, repositorio, servicio, controlador, conceptos, módulo, specs), `openapi/` si el generador corre, este directorio de trabajo.
- OUT: `database/` (lo espeja el agente del modelo), frontend, otros módulos (sólo se reutilizan sus repositorios/servicios exportados).
- Ambigüedades registradas:
  - A1. «Activo» para un servicio destino de un profesional: `service_catalog.is_active = true` **y** oferta `OFFERING_ACTIVE`. Supuesto tomado; confirmar con producto.
  - A2. Búsqueda de profesionales: no hay método de búsqueda por nombre reutilizable (el directorio público sólo cubre perfiles publicados en `community.public_profiles`). Se consulta `profiles.health_practitioner_profiles` ⋈ `profiles.persons` (tablas existentes) y los nombres salen de `findPractitionerNames`. Confirmar si debe acotarse a verificados.
  - A3. Organizaciones: `TenantsRepository.searchPage` acotado a `TENANT_ACTIVE`; incluye todo tipo de tenant.
  - A4. `currency` = código del concepto de moneda (`terminology.catalog_concepts.code`), `null` si no hay.
  - A5. Duplicado: mismo encuentro + mismo destino (profesional, o servicio si no hay profesional) + misma especialidad/servicio + mismo tipo. Si no hay datos para comparar, no se bloquea (comportamiento previo).
  - A6. Con `RLS_ENFORCE=true`, `practice.practices` de otro tenant no es visible: la derivación del tenant desde el servicio y el listado de servicios de otra organización pueden degradar. Riesgo residual, no se resuelve acá.

## H1 — Derivación con tipo y servicio destino validado
**CA:** Dado un clínico, cuando crea una derivación con tipo y servicio de un destino, entonces se persiste con `referral_type_concept_id` y `target_service_catalog_id`; servicios ajenos al destino, inactivos o inexistentes y derivaciones sin destino se rechazan.
**DoD:** `yarn test src/modules/clinical_ext/services/referrals.service.spec.ts` verde; `yarn typecheck` exit 0; eslint de archivos tocados exit 0.
**Estado:** HECHO

### H1.S1 — Dominio y persistencia
| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Conceptos REF_TYPE_* en CEXT | `CEXT.REFERRAL_TYPE_TREATMENT` existe y entra en `CLINICAL_EXT_CONCEPT_SEEDS` | `yarn typecheck` → exit 0 | HECHO |
| H1.S1.M2 | Columnas nuevas en entidad + repo create | entidad mapea `referral_type_concept_id`, `target_service_catalog_id` | `yarn typecheck` → exit 0 | HECHO |
| H1.S1.M3 | DTO `referralType` / `targetServiceCatalogId` | `IsIn` sobre los 5 códigos | spec de servicio verde | HECHO |
| H1.S1.M4 | Validación servicio/destino + destino obligatorio + tipo por defecto | tests: tipo persistido, mismatch 422, sin destino 422, 404 inexistente | spec de servicio verde | HECHO |

## H2 — Lecturas de apoyo para elegir destino
**CA:** Dado un clínico, cuando busca «car» con kind=ORGANIZATION, entonces recibe `{items:[{kind,id,displayName,tenantId,subtitle}]}` (≤20); cuando pide los servicios de un destino recibe sólo activos con la forma del contrato.
**DoD:** specs de controlador y servicio verdes.
**Estado:** A MEDIAS (OpenAPI no regenerado)

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | `GET /referrals/targets` | q<2 → 422; devuelve items mapeados | spec verde | HECHO |
| H2.S1.M2 | `GET /referrals/target-services` | práctica/oferta → items; sin parámetro → 422 | spec verde | HECHO |
| H2.S1.M3 | Listados enriquecidos (`referralType`, `targetServiceCatalogId`, `targetDisplayName`, `targetServiceName`) | campos previos intactos | spec verde | HECHO |
| H2.S1.M4 | OpenAPI regenerado | `openapi/openapi.json` incluye las rutas | `yarn docs:openapi:generate` (requiere DB) | BLOQUEADO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Columnas aún no en la base | 500 en runtime hasta aplicar el parche del modelo | coordinación con agente del modelo |
| OpenAPI exige Postgres arriba | no se regenera | se declara no ejecutado |
| RLS cross-tenant (A6) | listado vacío en modo estricto | reportado |
