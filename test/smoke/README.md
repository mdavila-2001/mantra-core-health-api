# Smoke HTTP

`smoke.int-spec.ts` arranca la aplicación real con `bootstrapTestApp({ reset: true })`, ejecuta una batería base de IAM, Common y Terminology y recorre `ALL_SMOKE` de `registry.ts`. Los casos por dominio y actor están en [`modules/`](./modules/README.md). Cada caso comprueba el status esperado y, cuando declara `expectedCode`, también el código. El runner todavía no comprueba un `reason` de negocio.

## Advertencia de datos

**El arranque ejecuta `TRUNCATE ... RESTART IDENTITY CASCADE` sobre todas las tablas de esquemas de negocio de la base indicada por `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.** El arnés no comprueba en código que la base sea descartable. Corré el smoke únicamente contra una base de prueba aislada, preparada para perder todos sus datos de negocio. No uses una base compartida. El riesgo y la corrección propuesta constan en [SP-01](../../../docs/revision-backend-2026-10-04/transversal/suite-pruebas.md#sp-01--crítico-el-reset-del-smoke-admite-una-base-no-descartable).

También hay que detener los workers conectados a esa misma base: pueden escribir durante el truncado y volver la corrida indeterminista. El comando `corepack yarn smoke --listTests --runInBand` sólo enumera el archivo y no borra datos.

## Estructura y límites

- `registry.ts`: orden de casos por módulo y actor; algunos casos dependen de IDs capturados por otros.
- `smoke-kit.ts`: contrato `SmokeCase`, contexto y expectativas HTTP.
- `smoke.int-spec.ts`: arranque, ejecución y reportes `output.smoke.test.json` / `.csv` en la raíz.
- `modules/*.smoke.ts`: entradas del registro. Los recorridos `paciente`, `medico`, `organizacion` y `administrador` usan tokens de sus actores cuando corresponde.

El smoke no sustituye integración, e2e ni la verificación del contrato de error completo. `expectedCode` es opcional y no hay `expectedReason`; ver [SP-02](../../../docs/revision-backend-2026-10-04/transversal/suite-pruebas.md#sp-02--medio-los-casos-de-error-del-smoke-pueden-aprobar-sin-code-ni-reason).
