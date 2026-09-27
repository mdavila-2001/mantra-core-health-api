# Plan — Recordatorios de dosis y exportación .ics de una receta

- Fecha: 2026-09-26 · Repo: `mantra-core-health-api` (rama `pablo/recordatorios-dosis-2026-09-26` desde `origin/test` @ `6b44f0c0`).
- Resultado observable: una receta emitida con posología estructurada produce (a) un aviso in-app al paciente
  en los 15 minutos previos a cada toma, una sola vez por toma, y (b) un archivo iCalendar descargable
  (`GET /clinical/medication-requests/:id/schedule.ics`) que un calendario importa con su recurrencia.
- Techo honesto de este carril: **`TESTED`** (unitarias con `EntityManager` doble). Sin base ni worker en
  ejecución: el parche SQL, el despacho real y la importación del .ics en un cliente de calendario quedan en
  «No cubierto» del REPORTE.

## Hallazgo que condiciona el diseño
`clinical.medication_requests` **no tiene posología estructurada**: sólo `dose_text`, `frequency_text`
(texto libre, «cada 8 horas») y `valid_from`/`valid_to`. No hay `dosageInstruction`/`timing` en la entidad,
ni en el DTO, ni en el front (`clinical.types.ts:454`: «Texto libre del contrato»). Parsear el texto libre
sería inventar la posología; se agrega un subconjunto de FHIR `Timing.repeat` como columnas nuevas.

## Alcance
- IN: `database/SQL/08_clinical/*`, `database/SQL/patches/2026-09-26_v4235_medication_request_timing.sql`,
  `src/modules/clinical/**` (entidades, DTO, repositorios, servicios, controladores, módulo, specs),
  `src/orm/catalog/{indexes,foreign-keys}/clinical.2.*` (tabla nueva), `src/worker/jobs/scheduling/*`
  (job nuevo en el proceso de recordatorios), este directorio.
- OUT: el front (no hay pantalla que capture la posología estructurada; se anota), el sello de la receta
  (`prescription-seal.ts`: el texto firmado sigue siendo `frequency_text`), canales externos (SMS/WhatsApp:
  otro carril), el repo del modelo (el parche nace en la API; reflejarlo en `mantra-core-health-model` queda
  como pedido).
- Decisiones (registradas, no resueltas por conveniencia):
  - D1 · `timesOfDay` y `frequency/period` son **excluyentes**: con los dos a la vez el significado (FHIR
    admite ambos) queda ambiguo para el recordatorio. Confirmar con clínica si hace falta combinarlos.
  - D2 · Ancla de inicio: `timing_start_at`, si no `valid_from`, si no `issued_at`. Sin ninguna → no hay
    cronograma (`NO_START`).
  - D3 · Zona por defecto `America/La_Paz` (−04:00, sin horario de verano). El .ics emite `TZID` +
    `VTIMEZONE` sólo para zonas de desfase fijo; con horario de verano emite UTC y lo documenta.
  - D4 · PRN («según necesidad») y duración 0 no tienen tomas: no hay recordatorios y el .ics responde 422
    (RFC 5545 exige al menos un componente en el calendario).
  - D5 · El job vive en el proceso worker de `scheduling` (el de recordatorios por hora), no en un proceso
    nuevo: evita un contenedor más en el despliegue.
  - D6 · Si la emisión in-app falla, se borra la marca de despacho para reintentar en el siguiente tick
    mientras la toma siga en la ventana (al menos una vez dentro de la ventana, nunca dos veces entregado).

## H1 — La receta guarda su posología estructurada
**CA:** Dada una receta en borrador, cuando se prescribe o edita con `timing`, entonces la fila guarda las
columnas `timing_*` y la lectura del resumen las devuelve; un `timing` incoherente → 400.
**DoD:** microtareas en `HECHO` con las unitarias en verde.

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Parche v4235 + DDL de `08_clinical` (columnas `timing_*`, CHECKs, tabla `medication_reminder_dispatches` con UNIQUE) | idempotente (IF NOT EXISTS / DROP CONSTRAINT IF EXISTS) | revisión del SQL; `grep -c timing_ database/SQL/08_clinical/02_tables.sql` | WRITTEN (sin base: no se aplicó) |
| H1.S1.M2 | Entidades (`MedicationRequests.timing*`, `MedicationReminderDispatches`) + catálogo ORM de la tabla nueva | `tsc` sin errores | `tsc` acotado a 169 raíces (incluye `app.module.ts`); el completo murió por memoria del host, ver REPORTE | HECHO |
| H1.S2.M1 | `MedicationTimingDto` validado (rangos, `HH:mm`, zona IANA, excluyentes) en alta y edición | 25:00 → 400; zona inexistente → 400; PRN + frequency → 400 | `node --experimental-vm-modules node_modules/jest-cli/bin/jest.js medication-timing.dto` | HECHO |
| H1.S2.M2 | Mapeo DTO → columnas en `prescribe`/`editDraft` (sólo DRAFT, como `frequencyText`), copia en `replace`/`renew`, lectura en `MedicationRequestItemDto` | `create` recibe las columnas; el resumen devuelve `timing` | `node --experimental-vm-modules node_modules/jest-cli/bin/jest.js medications.service clinical-read.service` | HECHO |

## H2 — Cronograma y .ics
**CA:** Dada una posología, cuando se pide el cronograma, entonces salen las tomas correctas en la zona del
paciente; dado el .ics, entonces es RFC 5545 (CRLF, plegado, RRULE/UNTIL, VTIMEZONE) y no nombra el fármaco.

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Generador puro `medication-schedule.ts` (luxon) | cada 8 h / 3 horas del día / semanal / PRN / duración 0 / cruce de medianoche UTC / borde de ventana / inválidos | `node --experimental-vm-modules node_modules/jest-cli/bin/jest.js medication-schedule.spec` | HECHO |
| H2.S1.M2 | Constructor `medication-schedule-ics.ts` | estructura, CRLF, plegado ≤ 75 octetos, RRULE, UNTIL, VTIMEZONE, sin fármaco | `node --experimental-vm-modules node_modules/jest-cli/bin/jest.js medication-schedule-ics` | HECHO |
| H2.S2.M1 | `GET /clinical/medication-requests/:id/schedule.ics` con la autorización del PDF (prescriptor o `assertPuedeLeerHistoria`), `?tz=` validado | 200 text/calendar; PRN → 422; sin acceso → 403 | `node --experimental-vm-modules node_modules/jest-cli/bin/jest.js medication-schedule.service clinical-medication-schedule.controller` | HECHO |

## H3 — Recordatorios sin duplicados
**CA:** Dada una toma dentro de los próximos 15 minutos, cuando el worker corre dos veces, entonces el
paciente recibe un solo aviso in-app; sin cuenta no es error; si emitir falla, no rompe el lote.

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | `MedicationRemindersService.dispatchDue` + `INSERT … ON CONFLICT DO NOTHING RETURNING` | segunda pasada no re-emite; sin cuenta → 0 emitidos sin error; `emitInApp` falla → borra la marca | `node --experimental-vm-modules node_modules/jest-cli/bin/jest.js medication-reminders.service` | HECHO |
| H3.S1.M2 | `POST /clinical/internal/medication-reminders/dispatch` (`SYSTEM`/`SYSTEM_WORKER`) | delega con `windowMinutes`/`limit` validados | `node --experimental-vm-modules node_modules/jest-cli/bin/jest.js clinical-medication-schedule.controller` (el spec cubre también `ClinicalInternalController`) | HECHO |
| H3.S2.M1 | `DispatchMedicationRemindersJob` (@Interval 60 s, `runTick`) registrado en `SchedulingWorkerModule` | llama al endpoint con ventana 15 | `node --experimental-vm-modules node_modules/jest-cli/bin/jest.js dispatch-medication-reminders.job` | HECHO |
