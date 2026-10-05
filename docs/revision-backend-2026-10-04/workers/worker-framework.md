# Revisión: marco común de workers

- Fecha: 2026-10-05. Base: `origin/dev` `02af1e09`.
- Cobertura leída: los 24 entrypoints `src/worker-*.ts`, `src/worker/bootstrap.ts`, `run-tick.util.ts`, `worker-health.registry.ts`, `worker-health.server.ts`, `worker-lifecycle.service.ts`, `worker.env.ts`, `system-api-client.service.ts`, sus specs, scripts de `package.json` y declaración de workers en ambos Compose. No se auditaron en profundidad los 24 directorios `src/worker/jobs/*`; son unidades separadas. No se arrancaron procesos ni servicios externos.

## 1. Resumen ejecutivo

Hallazgos confirmados: **0 críticos, 1 alto, 1 medio, 1 bajo**. La sonda de diagnóstico publica un texto de error no saneado en una interfaz de red sin autenticación; un fallo de unidad anidada puede dejar el tick raíz como exitoso; cuatro entrypoints carecen de scripts `start:worker:*` aunque Docker Compose los arranca directamente. No se atribuye fuga clínica observada ni job perdido observado: son consecuencias posibles del flujo de código. La batería unitaria dirigida terminó con `33 passed, 1 skipped`, `173 passed, 1 skipped` (exit 0).

## 2. Mapa del marco

`bootstrapWorker` crea un contexto Nest por dominio, valida entorno, configura plazo del tick, hooks de apagado y sonda HTTP (`src/worker/bootstrap.ts:58-146`). Cada job programado llama a `runTick`, que evita solapamientos **dentro del proceso**, propaga `AbortSignal`, registra salud y absorbe el error para conservar el scheduler (`run-tick.util.ts:89-176`). `WorkerLifecycleService` bloquea ticks nuevos y espera los que están en vuelo al recibir apagado (`worker-lifecycle.service.ts:60-92`). `SystemApiClient` llama a la API con token de sistema, timeout, reintentos sólo para operaciones idempotentes, bulkhead y circuito (`system-api-client.service.ts:137-229`). `worker-health.server.ts` expone `GET /health`, `/liveness`, `/readiness` y `/status` en el puerto configurado.

| Grupo | Entry points verificados | Inicio en `package.json` |
|---|---:|---:|
| Todos los dominios | 24 | 20 scripts de producción |
| Sin script `start:worker:*` | `files`, `lakehouse`, `time_series`, `vector_rag` | Docker Compose usa `node dist/src/worker-*.js` para los cuatro. |

Los 24 entrypoints usan `bootstrapWorker`. La diferencia entre exclusión en memoria por proceso y lock entre réplicas debe revisarse en cada job; el marco común no ofrece lock distribuido universal. El README de [`src/worker/`](../../../src/worker/README.md) contiene el inventario de 24 procesos.

## 3. Hallazgos y verificación adversarial

### WF-01 — Alto: `/status` entrega mensajes de error no saneados por una sonda abierta

- **Evidencia:** `worker-health.registry.ts:81-94,149-175` toma `error.message`, lo recorta a 300 caracteres y lo guarda como `lastError`; `snapshot()` devuelve la lista de ticks (`242-259`). `worker-health.server.ts:85` escucha por defecto en `0.0.0.0`; `105-140` atiende `GET /status` sin autenticación y devuelve el snapshot. `run-tick.util.ts:157-173` pasa el error original al registro. Si un job lanza un error que incluya datos clínicos, el texto queda accesible por la red alcanzable del worker. El estado también expone PID, memoria y circuitos.
- **Impacto/escenario:** exposición potencial de texto sensible y diagnóstico interno a quien alcance el puerto del contenedor. No se demostró un error real con PHI ni que el puerto esté publicado en el host; la conclusión se limita a ausencia de redacción/autenticación en el proceso.
- **Refutación:** los Compose usan el puerto para healthcheck local y no publican `9100` al host en los servicios muestreados; eso reduce el alcance externo, pero no añade autenticación ni impide acceso desde otros servicios de la red. `worker-health.server.spec.ts:75-84` prueba que `/status` responde 200, sin prueba de sanitización.
- **Plan:** (1) hacer que la sonda escuche por defecto `127.0.0.1`, que satisface el healthcheck local; (2) retirar `lastError` del snapshot accesible por HTTP o sustituirlo por códigos estables sin payload, conservando detalles en el log protegido; (3) comprobar configuración de redes, puertos y consumidores externos; (4) añadir pruebas HTTP sin credencial desde otra interfaz y de errores con cadena sintética sensible. Archivos: `worker-health.server.ts`, `worker-health.registry.ts` y specs. Sin DDL. Esfuerzo M, **Ola 0**.

### WF-02 — Medio: una unidad anidada fallida deja la salud del tick raíz en `ok`

- **Evidencia:** `run-tick.util.ts:94-96` envía llamadas anidadas a `runNestedUnit`; `187-205` absorbe su error y sólo lo escribe en log/span. El padre llega al fin de `runRootTick` y llama `workerHealth.tickFinished(operation, 'ok')` (`145-156`). `worker-health.registry.ts:166-169` reinicia `consecutiveFailures` al recibir `ok`. Esto ocurre en el job real `read_models/read-model-reconciliation.job.ts:65-93` y en `promotions/expire-points.job.ts:44-57`.
- **Impacto/escenario:** si falla `reconcileOne` o `expireProgram` pero el bucle continúa, `/status` muestra éxito y cero fallos consecutivos para ese tick. El error sigue en log/span y el siguiente intervalo puede reintentar; por eso no se afirma pérdida permanente de trabajo.
- **Refutación:** el comportamiento de absorber errores por elemento es intencional para continuar el lote; lo que falta es un resultado agregado fiel. La prueba `run-tick.util.spec.ts` cubre fallos raíz, pero no demuestra que la salud raíz refleje fallos anidados.
- **Plan:** (1) llevar contador de fallos anidados en el contexto raíz; (2) al terminar el lote, marcar resultado parcial/fallido sin abortar el procesamiento de otros elementos; (3) mantener la traza individual y decidir si readiness debe degradar después de fallos persistentes; (4) cubrir un lote con un fallo y otro éxito. Archivos: `tick-context.ts`, `run-tick.util.ts`, `worker-health.registry.ts`, specs. Sin DDL. Riesgo: alertas existentes pueden cambiar de frecuencia al contar fallos antes invisibles. Esfuerzo M, **Ola 1**.

### WF-03 — Bajo: cuatro workers no tienen comando Yarn propio

- **Evidencia:** hay 24 archivos `src/worker-*.ts`, pero `package.json` sólo define 20 scripts `start:worker:*` de producción. Faltan `files`, `lakehouse`, `time_series` y `vector_rag`. `docker-compose.yml:665-677,1139-1191` sí declara esos procesos con `node dist/src/worker-*.js`.
- **Impacto/escenario:** la operación manual uniforme por Yarn y la tabla de scripts de despliegue no cubren los cuatro. No se afirma que esos workers estén apagados en Docker.
- **Refutación:** el entrypoint y el comando directo existen; no hay rotura del despliegue local probada. El hallazgo es de ergonomía y contrato de scripts.
- **Plan:** añadir pares `start:worker:<dominio>` y `:dev` para los cuatro, validar rutas compiladas y documentar el comando real por ambiente. Archivo: `package.json` y README; no DDL. Esfuerzo S, **Ola 3**.

## 4. Plan de cuatro pruebas por hallazgo

| ID | Punto | Tipo/spec | Preparación, entrada y resultado esperado |
|---|---|---|---|
| WF-01 | Correcto | unit `src/worker/worker-health.server.spec.ts` | Sonda en loopback; `/health` local responde 200 sin texto de error. |
| WF-01 | Límite | unit mismo spec | Error sintético con mensaje de 300 caracteres; `/status` omite `lastError` y conserva estado/código. |
| WF-01 | Error | integración aislada mismo spec | Intento desde interfaz no loopback; conexión rechazada. |
| WF-01 | Falla catalogada | unit mismo spec | Tick lanza `OperationTimeoutError`; registro guarda código de clase estable, no mensaje ni PHI. HttpStatus/ErrorCode/reason HTTP no aplican: la sonda no es API de negocio y la propuesta evita emitir contenido clínico. |
| WF-02 | Correcto | unit `src/worker/run-tick.util.spec.ts` | Dos unidades anidadas exitosas; tick raíz `ok`, cero fallos. |
| WF-02 | Límite | unit mismo spec | Una unidad anidada falla y la siguiente se ejecuta; raíz termina `failed` o `partial` según contrato propuesto; ambas unidades se contabilizan. |
| WF-02 | Error | unit mismo spec | Todas las unidades fallan; raíz no aparece `ok`, `consecutiveFailures=1`. |
| WF-02 | Falla catalogada | unit mismo spec | `SystemApiClient` recibe respuesta API `HttpStatus.UNPROCESSABLE_ENTITY`, `ErrorCode.PRECONDITION_FAILED`, `details.reason` exacto catalogado por el módulo dueño; la unidad marca error sin propagar PHI al snapshot. El reason concreto se fija en el informe del módulo, no se inventa aquí. |
| WF-03 | Correcto | CLI `package.json` | `corepack yarn start:worker:files --help` resuelve el script (sin arrancar servicios en el gate); cuatro comandos presentes. |
| WF-03 | Límite | estática `package.json` | Todos los 24 entrypoints se comparan con los 24 scripts y no hay extras. |
| WF-03 | Error | build | Un entrypoint sin salida compilada falla en gate de manifest. |
| WF-03 | Falla catalogada | estática | No aplica HttpStatus/ErrorCode/reason: falta de script es un error de build/operación, no una ruta HTTP ni fallo de job. El gate falla con identificador estable `WORKER_SCRIPT_MISSING` propuesto. |

## 5. Matriz de procesos, rutas y jobs del marco

| Superficie | Correcto | Límite | Error | Falla catalogada |
|---|---|---|---|---|
| `bootstrapWorker` | Entorno válido arranca contexto y sonda | Puerto 0 deshabilita sonda | Variables inválidas rechazan arranque | Error de configuración estable local; sin contrato HTTP. |
| `runTick` raíz | Un tick se ejecuta | Solapamiento se marca `skipped` | Timeout aborta señal y marca `timeout` | Excepción del job conserva código/status/reason de API y se registra sin PHI. |
| `runTick` anidado | Procesa todas las unidades | Una falla y otras siguen | Lote con todas fallas no declara éxito | Cada error de API mantiene HttpStatus/ErrorCode/reason del dominio sin exponer payload. |
| `GET /health`, `/liveness` | 200 en proceso vivo | Tick colgado 503 | Método distinto 405 | No son endpoints de dominio; no usan ErrorCode/reason. |
| `GET /readiness` | 200 si listo | Dependencia con circuito abierto 503 | Antes de arranque 503 | No es API de negocio; reasons de sonda son diagnósticos, no catálogo HTTP. |
| `GET /status` | Snapshot operativo local | Error largo truncado | Red externa no accede tras corrección | No emite mensaje de error arbitrario. |
| `SystemApiClient` | GET y POST autenticados | GET reintenta con presupuesto | POST no idempotente no reintenta | La API devuelve status+code+reason del dominio; `toWorkerError` necesita contrato de error revisado por `catalogo-errores`. |

Las cadencias, entradas, salidas, locks distribuidos y razones de error de cada job se documentan en sus unidades `workers/<job>.md`; este marco no permite inferirlas para los 24.

## 6. Catálogo de errores

No se crea un reason de negocio para las sondas ni para scripts de CLI. `WORKER_SCRIPT_MISSING` es identificador de gate **propuesto**, no `ErrorCode` de API. Para llamadas a la API, `SystemApiClient.toWorkerError` (`system-api-client.service.ts:273-296`) crea `HttpException` con `{path,status,body,transient}` o `{path,message}` y no garantiza `details.reason` propio; la corrección transversal del catálogo de errores debe decidir el contrato antes de cambiarlo. `OperationTimeoutError` y otros errores del kernel se preservan como excepciones HTTP, pero no se expone su mensaje por `/status`.

## 7. Olas y esfuerzo

| Ola | Hallazgo | Esfuerzo | Dependencia |
|---|---|---|---|
| 0 | WF-01 | M | Redacción de snapshot y comprobación de clientes de la sonda. |
| 1 | WF-02 | M | Semántica acordada de lote parcial. |
| 3 | WF-03 | S | Ninguna; validar rutas compiladas. |

## 8. Trabajo pendiente de integrar y límites

Los commits ajenos enumerados en el plan no se verificaron contra esta rama; ninguno se toma como protección ya desplegada. No se auditó cada job ni la red efectiva de producción. Se ejecutaron sólo tests unitarios dirigidos sin modificar código; un spec opt-in permanece omitido según su precondición.

## 9. Evidencia

```text
corepack yarn test --runInBand --silent src/worker
exit 0
Test Suites: 1 skipped, 33 passed, 33 of 34 total
Tests:       1 skipped, 173 passed, 174 total
```

Inventario reproducible: `rg --files src | rg '^src/worker-[^/]*\\.ts$'` devuelve 24; inspección de `package.json` con Node enumera 20 scripts `start:worker:*` de producción. El test prueba el comportamiento actual, no la mitigación propuesta.
