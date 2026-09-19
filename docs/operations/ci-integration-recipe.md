# La suite de integración completa en CI (MCH-026)

**Desde:** 2026-09-19 · **Workflow:** `.github/workflows/docs.yml`, paso "Suite de integración
completa (MCH-026)".

## Qué corre y por qué ahí

Antes, el único paso de integración del workflow era un filtro de un solo archivo:

```bash
yarn test:integration --testPathPatterns=postgres-privileges
```

Las otras 93 suites (`test/integration/**/*.int-spec.ts`) no se ejecutaban en ningún merge — sólo
en la máquina de quien se acordara de correrlas antes de abrir el PR. Un módulo desconectado, una FK
rota, o RLS mal aplicada con el rol de aplicación real podían llegar a `dev` sin que nada lo
marcara, porque las unitarias corren contra repositorios simulados y no lo detectan.

El paso nuevo agrega:

```bash
yarn test:integration --ci
```

**Va después de "Materializar el esquema — DDL versionado de `database/`"**: ese paso aplica, con
el mismo `docker/db-init/init-postgres.sh` y la misma imagen que `postgres-init` de docker-compose,
el DDL de `database/SQL` (y las extensiones de `database/NoSQL`) sobre el Postgres efímero de
`services:`. Hasta 2026-09-19 esta página decía que lo materializaba "Generar contrato", pero ese
paso corre con `ORM_SCHEMA_SYNC=off` y no crea ninguna tabla: la primera corrida real de la suite
(run 35450632863) murió en la siembra con `relation "terminology.terminology_sources" does not
exist`.

También va después de "Aprovisionar roles de aplicación PostgreSQL" y de "Pruebas de privilegios",
que se dejan intactos: son la verificación específica de que el rol de aplicación (no el
superusuario `mantra`) no puede escribir más de lo que le corresponde (§54, MCH-026-AC02). La suite
completa no reemplaza esa prueba dirigida — la complementa.

## Por qué completa y no un subconjunto

`dev` y `master` no exigen ningún check obligatorio (`required_status_checks` vacío, ver
`LEEME-PRIMERO.md` del paquete de hardening) — así que este workflow es, en la práctica, el único
gate que existe. Recortar la suite de integración a un subconjunto "rápido" para PRs dejaría
exactamente el hueco que esta ficha vino a cerrar: un módulo roto que el subconjunto no cubre
llegaría a `dev` igual de invisible que antes.

**Si en un runner real el tiempo o el costo de Actions la vuelve impracticable por PR** —el
proyecto ya se quedó sin minutos de Actions una vez, ver `ci-runner-self-hosted.md`—, la salida
documentada (no aplicada en esta ficha) es:

- Completa contra `dev` (en un `push` o un cron), y
- Un subconjunto explícito y justificado en cada PR — por ejemplo, `test/integration/hardening/`
  (las regresiones de seguridad del plan de endurecimiento) más los módulos que el diff del PR
  toca.

No se aplicó ese recorte acá por dos motivos: (1) no hay evidencia medida de que la suite completa
sea impracticable —el runner de Actions está caído desde el 18/09 (ver PR #424) y no se pudo
cronometrar una corrida real—, y (2) cambiar los triggers o la estructura de jobs de este workflow
es justo lo que el PR #424 (volver a runners hospedados) tiene en danza; agregar un segundo trigger
o un segundo job en paralelo lo pisaría. Si se mide una corrida real y resulta impracticable, el
recorte de arriba queda listo para aplicar en un PR aparte.

## Cómo correrla fuera de CI

En el host, si `argon2` carga bien:

```bash
corepack yarn test:integration --ci
```

Si no (bloqueo del binario nativo en Windows — ver `LEEME-PRIMERO.md`), dentro de un contenedor
Linux con el repositorio montado y la red del stack local:

```bash
docker run --rm --network mantra-redesa-network \
  -e NODE_OPTIONS=--max-old-space-size=6144 \
  -e DB_HOST=mantra-redesa-postgres-1 -e DB_PORT=5432 \
  -e MONGODB_URI=mongodb://mantra-redesa-mongodb-1:27017/mantra_redesa_health_document_store \
  -e REDIS_HOST=mantra-redesa-redis-1 \
  -e OPENSEARCH_NODE=http://mantra-redesa-opensearch-1:9200 \
  -e MINIO_ENDPOINT=mantra-redesa-minio-1 \
  -e MIKRO_ORM_CLI_ALWAYS_ALLOW_TS=true \
  -v "$PWD:/app" -v mch-int-node-modules:/app/node_modules -w /app node:24 \
  bash -c "corepack enable && yarn install --immutable && yarn test:integration --ci"
```

Ver `.env.example` para el resto de las variables (contraseñas, buckets) que el paso de CI fija
como literales porque la base es efímera y muere con el runner — no son secretos.
