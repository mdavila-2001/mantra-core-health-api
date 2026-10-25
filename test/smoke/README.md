# Smoke HTTP

`smoke.int-spec.ts` arranca la aplicación real con `bootstrapTestApp({ reset: true })`, ejecuta una batería base de IAM, Common y Terminology y recorre `ALL_SMOKE` de `registry.ts`. Los casos por dominio y actor están en [`modules/`](./modules/README.md). Cada caso comprueba el status esperado y, cuando declara `expectedCode`, también el código. El runner todavía no comprueba un `reason` de negocio.

## Advertencia de datos

**El arranque ejecuta `TRUNCATE ... RESTART IDENTITY CASCADE` sobre todas las tablas de esquemas de negocio de la base indicada por `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.** Corré el smoke únicamente contra una base de prueba aislada, preparada para perder todos sus datos de negocio. No uses una base compartida.

El arnés (`test/integration/disposable-database.ts`) se niega a borrar si no se cumplen las tres condiciones, y lo hace antes de enviar un solo `TRUNCATE`:

1. `ALLOW_DESTRUCTIVE_DB_RESET=yes` en el entorno (bandera opt-in; cualquier otro valor se rechaza).
2. `DB_HOST` es `localhost`, `127.0.0.1`, `::1` o figura en `TEST_DB_ALLOWED_HOSTS` (lista separada por comas).
3. `DB_NAME` contiene como palabra `test`, `smoke`, `ci`, `tmp`, `scratch` o `disposable` (por ejemplo `mantra_smoke_test`), y el servidor lo confirma con `select current_database()` tras conectar.

La base de desarrollo por defecto (`mantra_redesa_health`) y una base compartida remota quedan rechazadas. Ejemplo:

```bash
ALLOW_DESTRUCTIVE_DB_RESET=yes DB_HOST=127.0.0.1 DB_NAME=mantra_smoke_test corepack yarn smoke
```

Lo mismo rige para cualquier suite que llame a `bootstrapTestApp({ reset: true })`, como `patient-coverage-copays.int-spec.ts`. Los entornos de CI que corran el smoke tienen que darle una base con nombre descartable y la bandera.

También hay que detener los workers conectados a esa misma base: pueden escribir durante el truncado y volver la corrida indeterminista. El comando `corepack yarn smoke --listTests --runInBand` sólo enumera el archivo y no borra datos.

## Estructura y límites

- `registry.ts`: orden de casos por módulo y actor; algunos casos dependen de IDs capturados por otros.
- `smoke-kit.ts`: contrato `SmokeCase`, contexto y expectativas HTTP.
- `smoke.int-spec.ts`: arranque, ejecución y reportes `output.smoke.test.json` / `.csv` en la raíz.
- `modules/*.smoke.ts`: entradas del registro. Los recorridos `paciente`, `medico`, `organizacion` y `administrador` usan tokens de sus actores cuando corresponde.

El smoke no sustituye integración, e2e ni la verificación del contrato de error completo. `expectedCode` es opcional y no hay `expectedReason`, así que un caso de error puede aprobar sin `code` ni `reason`.
