# Ejecutar pruebas

> Comandos reales de `package.json`, resultados de referencia en `docs/reports/baseline.md` §5.

| Comando | Qué ejecuta | Resultado de referencia (2026-07-30) |
|---|---|---|
| `yarn test` | Unitarias (Jest, mocks — sin infraestructura real) | 380 suites, 3768 tests, 100% verde |
| `yarn test:integration` | Integración (`ORM_SCHEMA_SYNC=off`, Postgres/Mongo/Redis/OpenSearch reales vía `docker-compose.yml`) | 19 suites (1 opt-in con `RLS_TEST=1`), 118 tests, 100% verde |
| `yarn smoke` | Smoke tests (`test/jest-smoke.json`) | No ejecutado en esta fase |
| `yarn test:e2e` | End-to-end (`test/jest-e2e.json`) | No ejecutado en esta fase |
| `yarn test:cov` | Cobertura unitaria | — |
| `yarn test:cov:merged` | Cobertura unitaria + integración fusionada | — |

## Prerrequisito para `yarn test:integration`

Además de Postgres/MongoDB/Redis/OpenSearch (`docker-compose.yml`), la suite
`worker-provider-adapter-swap.int-spec.ts` necesita `mock-provider-server` real accesible en
`http://localhost:4100` (`MOCK_PROVIDER_BASE_URL` en `.env`) — levantarlo suelto
(`cd mock-provider-server && yarn start:dev`) o vía el `docker-compose.yml` principal, que ya lo
declara como servicio. Sin él, sólo esa suite falla; el resto de la integración no lo necesita.

## Advertencia conocida

`yarn test` reporta *"A worker process has failed to exit gracefully"* — un handle no liberado
(temporizador o conexión) en algún test o código bajo prueba. No afecta el resultado (exit 0).
Registrado como `TEST-002` en `docs/governance/traceability-matrix.md`; investigar con
`--detectOpenHandles` si se prioriza.

## Analizadores propios del proyecto

Además de Jest, el repositorio tiene analizadores estáticos propios:

```bash
yarn alovida:guardrails   # gobierno de dominios: aislamiento, huérfanos, políticas de acceso
yarn alovida:coverage     # inventario cuantitativo: entidades, endpoints, controllers
yarn orm:audit           # fidelidad del catálogo ORM contra graphify-out/fidelity-audit.json
```
