# Resiliencia y preparación para producción

Fecha de corte: **2026-08-06**. Alcance: la API (57 módulos, 852 endpoints) y los
20 procesos worker (30 jobs programados).

Este directorio documenta el trabajo de endurecimiento (*hardening*) del backend:
qué se auditó, qué se encontró, qué se corrigió, qué queda pendiente y cómo se
opera el sistema cuando algo falla.

## Índice

| Documento | Qué contiene |
| --- | --- |
| [00-auditoria.md](00-auditoria.md) | Auditoría integral. Hallazgos con evidencia en código, no supuestos. |
| [01-matriz-de-riesgos.md](01-matriz-de-riesgos.md) | Catálogo de riesgos: impacto, detección, reproducción, mitigación. |
| [02-catalogo-de-errores.md](02-catalogo-de-errores.md) | Todos los códigos de error del contrato, con su origen y su acción. |
| [03-fmea-y-arbol-de-fallos.md](03-fmea-y-arbol-de-fallos.md) | FMEA por componente y árbol de fallos de los tres eventos cabecera. |
| [04-chaos-engineering.md](04-chaos-engineering.md) | Experimentos de caos: hipótesis, procedimiento y criterio de éxito. |
| [05-recuperacion-y-continuidad.md](05-recuperacion-y-continuidad.md) | Plan de recuperación ante desastres y de continuidad operativa. |
| [06-checklists.md](06-checklists.md) | Listas de verificación Production Ready, SRE, DevOps y QA. |
| [07-manual-de-incidentes.md](07-manual-de-incidentes.md) | Manual de operación: qué mirar, qué significa y qué hacer. |

Documentación relacionada que **no** se duplica aquí:

- Trazas, métricas y SLO: [`docs/observability/`](../observability/).
- Despliegue, escalado y rollback: [`docs/operations/`](../operations/).
- El kernel de resiliencia en código: [`src/common/resilience/`](../../src/common/resilience/).

## Qué cambió, en una página

El sistema ya tenía piezas maduras —trazas distribuidas en los 21 procesos, RLS
validado contra base real, WORM, outbox transaccional, 4 088 pruebas—. Lo que no
tenía era **defensa frente al comportamiento de sus propias dependencias bajo
estrés**. Los cinco huecos, y lo que se hizo con cada uno:

### 1. Los ticks de los workers se solapaban consigo mismos

`@Interval` de `@nestjs/schedule` es un `setInterval`: no espera a que termine la
ejecución anterior. Con el relevo del outbox cada 5 s y un plazo HTTP de 30 s, una
API lenta producía **seis copias del mismo tick** operando sobre las mismas filas.

`runTick` —el único punto por el que pasan los 30 jobs— ahora aplica exclusión
mutua por operación y **descarta** la ejecución solapada en vez de encolarla.
Encolarla habría garantizado que la cola creciera al ritmo de la degradación.

### 2. Un tick colgado era invisible e irrecuperable

No había plazo de tick ni forma de observarlo desde fuera: los workers son
procesos sin servidor HTTP, así que Docker sólo podía comprobar que el PID
existía. Un tick bloqueado dejaba el contenedor en `Up 6 hours` con cero trabajo
hecho.

Ahora hay tres capas: plazo con **cancelación real** (la señal llega hasta axios
vía `AsyncLocalStorage`, sin tocar la firma de los 30 jobs), un registro de salud
por proceso, y una sonda HTTP (`/health`, `/readiness`, `/status`) cableada al
`healthcheck` de los 20 servicios de `docker-compose.yml`.

### 3. Nada protegía a la API de sus 20 clientes

Sin cortacircuitos ni mamparo, un minuto de caída de la API significaba cientos
de sockets colgados por proceso y una avalancha de trabajo represado en cuanto
volvía —que la tumbaba otra vez—.

`SystemApiClient` lleva ahora mamparo, cortacircuitos, reintento con jitter
completo y plazo recortado al presupuesto del tick. Las lecturas se reintentan;
las escrituras **no**, salvo que el job declare que son idempotentes.

### 4. La muerte y el apagado del proceso no dejaban rastro

No había manejadores de `uncaughtException` ni `unhandledRejection` en ninguno de
los 21 procesos, y ningún plazo sobre el apagado. Un contenedor podía reiniciarse
en bucle sin dejar una línea indexable de por qué, y un `SIGTERM` cuyo drenaje se
atascaba terminaba en un `SIGKILL` mudo a los 10 s.

Ver [`src/common/runtime/`](../../src/common/runtime/) y el drenaje de ticks en
`WorkerLifecycleService`.

### 5. Todo error de base de datos era un `500 INTERNAL`

`AllExceptionsFilter.integrityViolation` estaba escrito pero `normalize()` **nunca
lo llamaba**: código muerto. Una clave foránea inexistente —error del cliente,
perfectamente accionable— y un interbloqueo —transitorio, se cura reintentando—
llegaban los dos como el mismo 500 opaco.

Ver el hallazgo A-01 en [la auditoría](00-auditoria.md).

## Estado

Lo que **está hecho y verificado** por pruebas automatizadas está marcado ✅ en
cada documento. Lo que está **diseñado pero pendiente de validar en un entorno
real** está marcado 🟡, y lo que requiere una decisión o un insumo que no está en
este repositorio, 🔵. La distinción se mantiene deliberadamente: un plan de
recuperación que no se ha ensayado nunca no es un plan de recuperación.
