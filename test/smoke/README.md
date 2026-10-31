# Smoke HTTP

`smoke.int-spec.ts` arranca la aplicación real con `bootstrapTestApp({ reset: true })`, ejecuta una batería base de IAM, Common y Terminology y recorre `ALL_SMOKE` de `registry.ts`. Los casos por dominio y actor están en [`modules/`](./modules/README.md). Cada caso comprueba el status esperado y, cuando los declara, también el `expectedCode` y el `expectedReason` de negocio (el `reason` del cuerpo del error). Un caso puede mandar encabezados propios con `headers` (p. ej. `X-Forwarded-For`).

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

## Gobierno de accesos (Hospital Piloto)

`modules/support_staff_governance.smoke.ts` siembra el Hospital Piloto con `psql` DENTRO de la corrida (el smoke vacía la
base al arrancar) y lo recorre con tokens reales. Necesita `GOVERNANCE_DEMO_DIR` apuntando a `salud-db/demo` del modelo
(archivos `04-hospital-piloto.sql`, `07-gobierno-hospital-piloto.sql` y, si existe, `09-agenda-chat-piloto.sql`) y
`psql` en el `PATH`; sin la variable el módulo no se registra. `fixtures/support_staff_governance.fixture.sql` agrega lo que
el demo no debe traer (la regla de red del bucle local; la cita A4 en N102, el vínculo de Nora posterior a la compuerta de ingreso, Ana con
recertificación el 2026-11-23 y el nombre de tabla de las agendas ya vienen en el demo). Reloj del escenario:
martes 2026-11-03 10:30 (La Paz); el módulo reemplaza `Date` por una subclase con desplazamiento (los temporizadores siguen
reales) y lo devuelve al final. `SMOKE_ONLY=governance` corre solo ese módulo; `GOV_DUMP=<archivo>` vuelca cada respuesta
aceptada para armar afirmaciones nuevas.

```bash
GOVERNANCE_DEMO_DIR=../mantra-core-health-model/salud-db/demo ALLOW_DESTRUCTIVE_DB_RESET=yes DB_HOST=127.0.0.1 DB_NAME=mantra_smoke_test corepack yarn smoke
```

El arnés vacía la base con `TRUNCATE ... CASCADE`; desde el v4.2.73 la bitácora `access_decision_log` lleva un disparador `BEFORE TRUNCATE` que lo prohíbe también al dueño, así que `resetBusinessData` fija `session_replication_role = replica` (solo superusuario) en SU sesión antes de vaciar. Es el único TRUNCATE legítimo: una base descartable.

`modules/support_staff_governance_seg1.smoke.ts` agrega, dentro del módulo de gobierno, un caso HTTP por cada hallazgo ALTO de la revisión de seguridad (ronda 1); cada caso falla si se revierte su arreglo.

`modules/support_staff_governance_seg2.smoke.ts` hace lo mismo para la ronda 2: V-3 (ampliar un átomo crítico ya concedido —de un servicio a toda la organización o prorrogando su vigencia— es 202 `GRANT_CHANGE` y la base no cambia hasta aprobar), N-1 (`GET /approvals/pending` trae el permiso completo), N-2 (si quien pidió dejó de ser administrador, aprobar es 409 `FOUR_EYES_PAYLOAD_INVALID`), N-8 (condición sobre `audit.activity.*` es 422) y N-9 (un delegado sin `team.grants.revoke` no obtiene revocación por vencimiento). Los hallazgos que necesitan transacciones reales (V-4, N-5, N-3) están en `test/integration/governance-seg-ronda2.int-spec.ts` (opt-in con `SEG2_TEST=1`).

## Estructura y límites

- `registry.ts`: orden de casos por módulo y actor; algunos casos dependen de IDs capturados por otros.
- `smoke-kit.ts`: contrato `SmokeCase`, contexto y expectativas HTTP.
- `smoke.int-spec.ts`: arranque, ejecución y reportes `output.smoke.test.json` / `.csv` en la raíz.
- `modules/*.smoke.ts`: entradas del registro. Los recorridos `paciente`, `medico`, `organizacion` y `administrador` usan tokens de sus actores cuando corresponde.

El smoke no sustituye integración, e2e ni la verificación del contrato de error completo. `expectedCode` y `expectedReason` son opcionales, así que un caso de error que no los declare puede aprobar sin `code` ni `reason`.
