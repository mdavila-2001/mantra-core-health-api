# Plan — Cierre de las subtareas 2.3 y 7.1 del plan de reparto

- Fecha: 2026-09-24 · Repos afectados: `mantra-core-health-api` · Predecesor: `PLAN_REPARTO_TAREAS_ENDER_E_ITZAN.md` (auditoría de cumplimiento del 2026-09-24)
- Resultado observable: el directorio público de profesionales y organizaciones acota por departamento y municipio del catálogo; el alta de paciente con una cédula que otra alta simultánea está registrando responde el 409 de dominio.
- Kill-test: `GET /public/search/organizations?department=<uuid ajeno>` devuelve 200 con el directorio entero en vez de 422.

## Alcance
- IN:
  - 2.3: parámetros `department` y `municipality` en `GET /public/search/practitioners` y `GET /public/search/organizations`; validación contra `VS_BO_DEPARTMENT` / `VS_BO_MUNICIPALITY` y coherencia municipio ⊂ departamento; filtro por la vía SQL.
  - 7.1: cerrojo transaccional por documento en el auto-registro de paciente, antes de comprobar si el documento ya tiene cuenta.
  - Actualizar la columna de estado de `PLAN_REPARTO_TAREAS_ENDER_E_ITZAN.md`.
- OUT:
  - Indexar departamento y municipio en OpenSearch (requiere reindexado): mientras tanto, con esos filtros la búsqueda degrada a SQL, igual que ya hace la especialidad sin rótulo.
  - Frontend (el desplegable en cascada).
  - Que dos cédulas con el mismo número y distinto departamento puedan tener cuenta: el login es el número a secas (`external_subject`). Cambiarlo es una decisión de producto.
  - Auto-registro de profesional y de organización (mismo patrón, fuera del texto de la 7.1).
- Ambigüedades registradas:
  - ¿Se puede pedir `municipality` sin `department`? Supuesto: sí; el municipio ya implica su departamento. Si vienen los dos, tienen que ser coherentes (422 si no). Confirmar con Justin/Pablo.
  - El departamento se reconoce en una dirección por `administrative_area_concept_id` **o** por la sigla del código de su municipio (`SC-…`): hay direcciones con sólo uno de los dos. Supuesto tomado; confirmar con Marcelo (modelo).

## H1 — Filtro territorial en dos pasos (2.3)
**CA:** Dado un directorio con sujetos en distintos departamentos, cuando se pide `department=<LP>` (y opcionalmente `municipality=<LP-…>`), entonces sólo vuelven los de ese departamento/municipio; un concepto ajeno al catálogo o un municipio de otro departamento da 422.
**DoD:** `yarn test src/modules/community` en verde · `yarn typecheck` salida 0 · `yarn lint` sobre los archivos tocados sin errores.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Validar departamento y municipio en el servicio | uuid ajeno → 422; municipio de otro departamento → 422 | spec del servicio | HECHO |
| H1.S1.M2 | Degradar a SQL con filtro territorial | con `department`/`municipality` no se consulta el índice | spec del servicio | HECHO |
| H1.S1.M3 | Filtro SQL en el repositorio | intersecta con los demás filtros de sujeto | spec del repositorio / typecheck | HECHO |
| H1.S1.M4 | Exponer los parámetros en los dos endpoints | `@ApiQuery` + paso al servicio | typecheck | HECHO |

## H2 — Auto-registro de paciente atómico ante la misma cédula (7.1)
**CA:** Dadas dos altas simultáneas con la misma cédula, cuando las dos corren, entonces una crea la cuenta y la otra recibe 409 «Ya existe una cuenta con ese documento de identidad» (hoy: el índice único la rechaza con el 409 genérico).
**DoD:** spec del servicio que verifica que el cerrojo se toma antes de la comprobación · `yarn typecheck` salida 0.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | `pg_advisory_xact_lock` por documento al abrir la transacción | el cerrojo precede a `findLivePasswordBySubject` | spec | HECHO |

## H3 — Plan de reparto al día
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Estados reales en `PLAN_REPARTO_TAREAS_ENDER_E_ITZAN.md` | cada fila cita su PR | revisión del diff | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sin base Postgres levantada, el SQL nuevo no se ejerce | El filtro queda en `TESTED` unitario, no `VERIFIED` | Declararlo en «No cubierto»; el E2E de CI lo cubre al abrir el PR |
| Fusión a `dev` bloqueada por permisos en auto mode | PR queda abierto | Avisar con el comando exacto |
