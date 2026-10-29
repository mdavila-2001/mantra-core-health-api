# Pruebas de integración

Estas pruebas ejercen módulos reales de NestJS y, según el spec, PostgreSQL,
MongoDB, Redis, OpenSearch o proveedores HTTP. El comando base es determinista:

```bash
yarn test:integration --ci --runInBand
```

Requiere los servicios locales de `docker-compose.yml`, pero no descarga
catálogos masivos, no llama proveedores reales y no aplica RLS por defecto.

Requiere además `dist/` compilado (`yarn build`): las globs de entidades de
`buildOrmConfig()` apuntan a `dist/`, y con `dist/` vacío MikroORM no descubre
ninguna (`lane16-patient-invoice-flow`, que inicia el ORM por su cuenta, no
encuentra con qué probar).

Las suites que llaman a `bootstrapTestApp({ reset: true })`
(`patient-coverage-copays` y el smoke) vacían los esquemas
de negocio de la base indicada: exigen `ALLOW_DESTRUCTIVE_DB_RESET=yes`, un host
local o de `TEST_DB_ALLOWED_HOSTS` y un `DB_NAME` descartable (`test`, `smoke`,
`ci`, `tmp`, `scratch` o `disposable` como palabra). Sin las tres condiciones se
niegan antes de enviar un solo `TRUNCATE`; el detalle está en
[`disposable-database.ts`](./disposable-database.ts) y en el
[README del smoke](../smoke/README.md).
`harness.ts` firma un token `SUPERADMIN` con el tenant seed determinista; los
tests fail-closed disponen además de un token intencionalmente sin membresías.

## Cobertura base

| Spec                                       | Dependencia ejercida                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit-worm.int-spec.ts`                   | Triggers WORM de PostgreSQL                                                                                                                                                                                                                                                                                                           |
| `common.int-spec.ts`                       | API y persistencia del módulo Common                                                                                                                                                                                                                                                                                                  |
| `document-store.int-spec.ts`               | MongoDB real y aislamiento por tenant                                                                                                                                                                                                                                                                                                 |
| `iam.int-spec.ts`                          | Flujos IAM y sesiones                                                                                                                                                                                                                                                                                                                 |
| `lane16-patient-invoice-flow.int-spec.ts`  | Cotización, factura al paciente, objeción y pausa del cobro con PostgreSQL real; concurrencia con dos conexiones. Crea sus propios padres y deja historial permanente en `audit.*`: se niega a correr si la base no es desechable (nombre con `test`/`ci`/`tmp`/`scratch`/`smoke`/`disposable`, o `ALLOW_PERMANENT_TEST_RESIDUE=yes`) |
| `observability.int-spec.ts`                | Trazas, privacidad y propagación outbox                                                                                                                                                                                                                                                                                               |
| `outbox-relay-race.int-spec.ts`            | Concurrencia PostgreSQL con dos conexiones                                                                                                                                                                                                                                                                                            |
| `redis-runtime.int-spec.ts`                | Redis real, TTL, locks y namespacing                                                                                                                                                                                                                                                                                                  |
| `search-platform.int-spec.ts`              | OpenSearch real y aislamiento por tenant                                                                                                                                                                                                                                                                                              |
| `seed.int-spec.ts`                         | Seeds idempotentes mínimos                                                                                                                                                                                                                                                                                                            |
| `terminology.int-spec.ts`                  | API y persistencia de Terminology                                                                                                                                                                                                                                                                                                     |
| `vademecum.int-spec.ts`                    | Seed SQL versionado de vademécum                                                                                                                                                                                                                                                                                                      |
| `worker-provider-adapter-swap.int-spec.ts` | Adapter fallback sin proveedor configurado                                                                                                                                                                                                                                                                                            |
| `hardening/mch-003.int-spec.ts`            | Pagos sin gateway: estados y doble cargo                                                                                                                                                                                                                                                                                              |
| `hardening/mch-005.int-spec.ts`            | Refresh concurrente: un único sucesor                                                                                                                                                                                                                                                                                                 |

## Suites opt-in

Las siguientes pruebas se omiten a menos que se declare su prerrequisito. Una
omisión no representa un resultado aprobado del proveedor o dataset: el job de
CI/staging que posea esos recursos debe activar y conservar su propia evidencia.

| Variable                           | Habilita                                                             | Prerrequisito                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `TERMINOLOGY_DATASET_TESTS=1`      | `loinc`, `ndc`, `hcpcs`, `icd10cm`, `nucc`, `rxterms`, `rxnorm-full` | Todos los importadores correspondientes ya ejecutados contra la misma DB; salida a NLM/openFDA para los spot-checks en vivo |
| `MOCK_PROVIDER_INTEGRATION_TEST=1` | llamada HTTP real de `worker-provider-adapter-swap`                  | `mock-provider-server` escuchando en `localhost:4100`, con tasa de fallo 0                                                  |
| Credenciales Google completas      | `google-email-provider.int-spec.ts`                                  | OAuth/client id, secret, refresh token y destinatario de prueba                                                             |
| `SURVEYS_IT_DB_URL`                | `surveys-encuesta-base.int-spec.ts`                                  | PostgreSQL **desechable** (nombre con `test`/`it`/`ci`/`tmp`/`scratch`/`disposable`/`smoke`); recrea `surveys`, `scheduling`, `billing`, `practice` y `profiles` desde `database/SQL` sin las FK entre esquemas |
| `DATA_CATALOG_IT_DB_URL`           | `data-catalog.int-spec.ts`                                           | PostgreSQL **desechable** (crea schemas de fixtures, aplica el patch v4.2.19 y altera tablas); ver cabecera del spec        |
| `SURVEYS_INSIGHTS_IT=1` | `surveys-insights.int-spec.ts` | PostgreSQL **desechable** (`DB_NAME` con `test`/`ci`/`tmp`/`scratch`/`smoke`/`disposable`) con el DDL de `surveys` y `scheduling`; usuario superusuario (desactiva las FK al cargar sus filas) |
| `RLS_TEST=1`                       | `rls.int-spec.ts`                                                    | rol runtime real sin `BYPASSRLS`; modifica políticas del esquema                                                            |

Para una base local desechable, RLS puede crear temporalmente el login de prueba
y revocarlo al finalizar:

```bash
RLS_TEST=1 RLS_TEST_BOOTSTRAP_LOCAL_ROLE=1 \
  yarn test:integration --runInBand test/integration/rls.int-spec.ts
```

No se debe ejecutar esa variante contra una base compartida. En staging o
producción se proporcionan `DB_APP_USER` y `DB_APP_PASSWORD` reales y se omite
`RLS_TEST_BOOTSTRAP_LOCAL_ROLE`.

## Limpieza, residuo permanente y prerrequisitos de entorno

- **`audit.audit_log` es WORM** (`trg_forbid_mutation`) y tiene FK a
  `directory.tenants` y a `iam.users`: un tenant o una cuenta que generó
  auditoría no se puede borrar, y ni el trigger ni la FK se tocan desde una
  prueba. Las cuentas se anonimizan (como en UC-01-12). Un tenant fijado por la
  bitácora queda como residuo permanente, y `deleteRegisteredOrganizations` sólo
  lo admite en una base descartable (`assertPermanentResidueTarget`: host local y
  nombre con `test`, `ci`, `tmp`, `scratch`, `smoke` o `disposable`, o
  `ALLOW_PERMANENT_TEST_RESIDUE=yes`); sobre una base compartida falla nombrando
  la tabla WORM. Las suites que registran organizaciones
  (`insurance-campaigns`, `insurance-plan-administration`, ...) quedan sujetas a
  esa regla; para no acumular residuo, usá una base nueva por corrida.
- La primera corrida sobre una base vacía ejecuta la cadena de seeds del
  arranque (minutos, hasta ~15 con la máquina cargada): pasá
  `--testTimeout=900000`. Las siguientes ya la encuentran sembrada.
- `agenda-mensajeria-relacion` (H2.S1.M1) verifica con `git merge-base
--is-ancestor` que un commit de septiembre sea ancestro de `HEAD`: necesita el
  historial completo (`git fetch --unshallow`); en un clon superficial da un
  falso rojo.
- `insurance-campaigns` ya no exige el catálogo ICD-10-CM importado: crea (y
  borra al final) un concepto `I10` sintético si el real no está
  (`icd10-fixture.ts`).

## Criterios de mantenimiento

- Toda dependencia de red, credencial, dataset precargado o mutación destructiva
  debe tener una bandera opt-in documentada; el comando base nunca debe fallar
  por un prerrequisito implícito.
- Las rutas con tenant deben probar el caso permitido y al menos un caso
  fail-closed sin membresía o con tenant contradictorio.
- Los fixtures deben usar rutas y seeds versionados dentro del repositorio.
- Un test omitido no se presenta como evidencia aprobada en informes de
  producción.
