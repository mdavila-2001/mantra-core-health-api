# Ejecutar pruebas

> Comandos reales de `package.json`, resultados de referencia en `docs/reports/baseline.md` §5.

| Comando | Qué ejecuta | Resultado de referencia |
|---|---|---|
| `yarn test` | Unitarias (Jest, mocks — sin infraestructura real) | 548 suites (1 saltada), 5 983 tests, 662 s, 100% verde (2026-08-25) |
| `yarn test:integration` | Integración (`ORM_SCHEMA_SYNC=off`, Postgres/Mongo/Redis/OpenSearch reales vía `docker-compose.yml`) | 19 suites (1 opt-in con `RLS_TEST=1`), 118 tests, 100% verde (2026-07-30) |
| `yarn smoke` | Smoke tests (`test/jest-smoke.json`) | No ejecutado en esta fase |
| `yarn test:e2e` | End-to-end (`test/jest-e2e.json`) | No ejecutado en esta fase |
| `yarn test:cov` | Cobertura unitaria | — |
| `yarn test:cov:merged` | Cobertura unitaria + integración fusionada | — |

Todos llevan `--experimental-vm-modules` menos `yarn test:e2e`, cuya configuración
(`test/jest-e2e.json`) no declara `extensionsToTreatAsEsm` y corre en CommonJS a propósito.
No está en CI y su único spec es el `app.e2e-spec.ts` del andamiaje.

## Prerrequisito para `yarn test:integration`

Además de Postgres/MongoDB/Redis/OpenSearch (`docker-compose.yml`), la suite
`worker-provider-adapter-swap.int-spec.ts` necesita `mock-provider-server` real accesible en
`http://localhost:4100` (`MOCK_PROVIDER_BASE_URL` en `.env`) — levantarlo suelto
(`cd mock-provider-server && yarn start:dev`) o vía el `docker-compose.yml` principal, que ya lo
declara como servicio. Sin él, sólo esa suite falla; el resto de la integración no lo necesita.

## Advertencia: corré los scripts, nunca el binario suelto

Las pruebas corren en **modo ESM** (`extensionsToTreatAsEsm` en la config de Jest, `.swcrc`
con `module.type: es6`) y por eso cada script agrega `node --experimental-vm-modules`. Sin ese
flag Jest cae a CommonJS y **toda** suite que importe —aunque sea transitivamente—
`@mikro-orm/postgresql`, que es ESM puro, muere con:

```
SyntaxError: Unexpected token 'export'
    at node_modules/@mikro-orm/postgresql/index.js:1
```

El error apunta a `node_modules` y parece un problema de dependencias: es de invocación.

- **Sirve:** `yarn test [ruta]`, `yarn test:integration`, `yarn test:cov` y `yarn jest [ruta]`
  (hay un script `jest` que inyecta el flag, justamente para que la forma corta no falle).
- **Sigue roto:** `npx jest`, `yarn run -B jest`, `./node_modules/.bin/jest` — saltean los
  scripts y llegan al binario pelado. Si necesitás uno de esos, prefijá
  `NODE_OPTIONS=--experimental-vm-modules` (sintaxis POSIX: en PowerShell es
  `$env:NODE_OPTIONS='--experimental-vm-modules'` en una sentencia aparte).

## Advertencia conocida

`yarn test` reporta *"A worker process has failed to exit gracefully"* — un handle no liberado
(temporizador o conexión) en algún test o código bajo prueba. No afecta el resultado (exit 0).
Registrado como `TEST-002` en `docs/governance/traceability-matrix.md`; investigar con
`--detectOpenHandles` si se prioriza.

## Analizadores propios del proyecto

Además de Jest, el repositorio tiene analizadores estáticos propios:

```bash
yarn redesa:guardrails   # gobierno de dominios: aislamiento, huérfanos, políticas de acceso
yarn redesa:coverage     # inventario cuantitativo: entidades, endpoints, controllers
yarn orm:audit           # fidelidad del catálogo ORM contra graphify-out/fidelity-audit.json
```
