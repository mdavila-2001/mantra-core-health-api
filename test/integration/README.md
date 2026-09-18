# Pruebas de integración

Estas pruebas ejercen módulos reales de NestJS y, según el spec, PostgreSQL,
MongoDB, Redis, OpenSearch o proveedores HTTP. El comando base es determinista:

```bash
yarn test:integration --ci --runInBand
```

Requiere los servicios locales de `docker-compose.yml`, pero no descarga
catálogos masivos, no llama proveedores reales y no aplica RLS por defecto.
`harness.ts` firma un token `SUPERADMIN` con el tenant seed determinista; los
tests fail-closed disponen además de un token intencionalmente sin membresías.

## Cobertura base

| Spec                                       | Dependencia ejercida                       |
| ------------------------------------------ | ------------------------------------------ |
| `audit-worm.int-spec.ts`                   | Triggers WORM de PostgreSQL                |
| `common.int-spec.ts`                       | API y persistencia del módulo Common       |
| `document-store.int-spec.ts`               | MongoDB real y aislamiento por tenant      |
| `iam.int-spec.ts`                          | Flujos IAM y sesiones                      |
| `observability.int-spec.ts`                | Trazas, privacidad y propagación outbox    |
| `outbox-relay-race.int-spec.ts`            | Concurrencia PostgreSQL con dos conexiones |
| `redis-runtime.int-spec.ts`                | Redis real, TTL, locks y namespacing       |
| `search-platform.int-spec.ts`              | OpenSearch real y aislamiento por tenant   |
| `seed.int-spec.ts`                         | Seeds idempotentes mínimos                 |
| `terminology.int-spec.ts`                  | API y persistencia de Terminology          |
| `vademecum.int-spec.ts`                    | Seed SQL versionado de vademécum           |
| `worker-provider-adapter-swap.int-spec.ts` | Adapter fallback sin proveedor configurado |
| `hardening/mch-003.int-spec.ts`            | Pagos sin gateway: estados y doble cargo   |

## Suites opt-in

Las siguientes pruebas se omiten a menos que se declare su prerrequisito. Una
omisión no representa un resultado aprobado del proveedor o dataset: el job de
CI/staging que posea esos recursos debe activar y conservar su propia evidencia.

| Variable                           | Habilita                                                             | Prerrequisito                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `TERMINOLOGY_DATASET_TESTS=1`      | `loinc`, `ndc`, `hcpcs`, `icd10cm`, `nucc`, `rxterms`, `rxnorm-full` | Todos los importadores correspondientes ya ejecutados contra la misma DB; salida a NLM/openFDA para los spot-checks en vivo |
| `MOCK_PROVIDER_INTEGRATION_TEST=1` | llamada HTTP real de `worker-provider-adapter-swap`                  | `mock-provider-server` escuchando en `localhost:4100`, con tasa de fallo 0                                                  |
| Credenciales Google completas      | `google-email-provider.int-spec.ts`                                  | OAuth/client id, secret, refresh token y destinatario de prueba                                                             |
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

## Criterios de mantenimiento

- Toda dependencia de red, credencial, dataset precargado o mutación destructiva
  debe tener una bandera opt-in documentada; el comando base nunca debe fallar
  por un prerrequisito implícito.
- Las rutas con tenant deben probar el caso permitido y al menos un caso
  fail-closed sin membresía o con tenant contradictorio.
- Los fixtures deben usar rutas y seeds versionados dentro del repositorio.
- Un test omitido no se presenta como evidencia aprobada en informes de
  producción.
