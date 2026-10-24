# Plan — Desbloquear arranque de API para route-health

- Fecha: 2026-10-15 · Repos afectados: `mantra-core-health-api` · Predecesor: CORR-36 frontend, PR #1106
- Resultado observable: API de desarrollo inicia y responde `GET /health`; el barrido Playwright `carril-19-route-health` completa sus cuatro actores sin el error de dependencias del módulo de liquidaciones.
- Kill-test: compilar/arrancar el módulo falla porque `InsurancePatientSettlementModule` ofrece servicios sin registrar sus repositorios requeridos (`LinkedOrderDataRepository` y `InsurancePatientAccountRepository`).

## Alcance
- IN: registrar `LinkedOrderDataRepository` e `InsurancePatientAccountRepository` como providers del módulo aislado de liquidaciones; agregar prueba de wiring; arrancar con `ORM_SCHEMA_SYNC=off`; correr route-health apuntando a la API local.
- OUT: tocar el API worktree original, sus cambios sin commitear, DDL/modelo, `.env`, esquema o datos persistentes; corregir otros problemas detectados en el barrido; cambiar código frontend.
- Ambigüedades registradas: ninguna. El usuario autorizó explícitamente ampliar el alcance para corregir el bloqueo de API.

## H1 — La API puede iniciar y el barrido de rutas se ejecuta
**CA:** Dado el módulo de liquidaciones, cuando Nest resuelve sus providers, entonces crea los servicios con sus repositorios; cuando se levanta la API en desarrollo, `/health` responde 2xx y Playwright completa el barrido de cuatro actores.
**DoD:** spec dirigido, lint, typecheck, build, `DOTENV_CONFIG_PATH=../mantra-core-health-api/.env NODE_OPTIONS='-r dotenv/config' ORM_SCHEMA_SYNC=off PORT=3000 corepack yarn start:prod` + `curl http://127.0.0.1:3000/health` → 200; route-health con API real y actores sintéticos locales → 4/4.
**Estado:** A MEDIAS

### H1.S1 — Corregir el wiring mínimo del módulo
**CA:** Dado que el módulo ofrece los servicios de liquidación, cuando Nest construye el módulo, entonces encuentra `LinkedOrderDataRepository` e `InsurancePatientAccountRepository`.
**DoD:** test dirigido del graph de providers y prueba de arranque de la API.
**Estado:** A MEDIAS

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Agregar plan y documentar el fallo de inicio | El plan precede a los cambios de código | `test -f docs/trabajo/2026-10-15-route-health-api-startup/PLAN.md` → PASS | HECHO |
| H1.S1.M2 | Registrar los repositorios faltantes y proteger el wiring con un spec | El módulo declara ambos repositorios requeridos por los servicios | spec dirigido → PASS | HECHO |
| H1.S1.M3 | Verificar lint, tipos y compilación | Los cambios pasan lint, typecheck y build | `corepack yarn eslint ...` + `corepack yarn typecheck` + `corepack yarn build` → exit 0 | HECHO |
| H1.S1.M4 | Iniciar API y comprobar health | La API inicia y `/health` devuelve 2xx | `DOTENV_CONFIG_PATH=../mantra-core-health-api/.env NODE_OPTIONS='-r dotenv/config' ORM_SCHEMA_SYNC=off PORT=3000 corepack yarn start:prod` + `curl http://127.0.0.1:3000/health` → HTTP 200 | HECHO |
| H1.S1.M5 | Correr route-health con API y actores locales | Los cuatro recorridos llegan al final | Playwright con `--workers=1` → 4/4 PASS | BLOQUEADO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| API worktree original contiene cambios sin commitear de otra tarea | Pisar o ejecutar cambios ajenos | Trabajar en un worktree nuevo sobre `origin/dev`; no editar el árbol original |
| Arranque con entorno local puede sincronizar el esquema o escribir datos | Efecto fuera del alcance | Forzar `ORM_SCHEMA_SYNC=off`; usar únicamente el alta sintética que el test prescribe |
| El barrido puede descubrir defectos ajenos a CORR-36 | Alcance abierto | Registrar; no arreglar en este slice sin nueva autorización |

## Resultado
- H1.S1.M1–M4: HECHO; H1.S1.M5: BLOQUEADO (4/5 microtareas; 80%).
- Desvío: además de `LinkedOrderDataRepository`, el wiring detectó que también faltaba `InsurancePatientAccountRepository`; ambos se registraron y quedaron cubiertos por el spec del módulo.
- El servidor inicia y `/health` devuelve HTTP 200. Los servicios locales de Postgres y Redis no están disponibles; Docker no está corriendo y no se levantó para evitar carga adicional de memoria/disco.
- No se usó ni se creó un actor; el barrido no se ejecutó porque los servicios de persistencia y Redis no están disponibles.
