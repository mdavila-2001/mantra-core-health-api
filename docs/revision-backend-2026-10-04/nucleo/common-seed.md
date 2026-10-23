# Revisión de núcleo `common-seed` — ALOVIDA

Fecha: 2026-10-05. Revisión documental; no se modificó runtime.

## 1. Alcance y cobertura real

Se revisaron el orquestador, CLI, flags, catálogos y los 27 specs de
`src/common/seed`. No se levantó PostgreSQL ni se ejecutó un seed real en una
base descartable.

## 2. Resumen ejecutivo

| Severidad | Hallazgos | Lente |
|---|---:|---|
| Alta | 1 | Dominio, disponibilidad |
| Media | 1 | Pruebas y contrato operativo |
| Crítica / baja | 0 / 0 | — |

## 3. Mapa verificado

| Superficie | Evidencia | Comportamiento |
|---|---|---|
| Arranque | `src/common/seed/seed-bootstrap.service.ts:206-218` | Ejecuta seed si está habilitado. |
| Cadena | `...seed-bootstrap.service.ts:229-265,276-485` | Conceptos primero; luego core y content. |
| Flags | `src/common/seed/seed-boot.env.ts:27-38` | Booleanos, ambos `true` por defecto. |
| CLI | `src/seed-cli.ts:21-29` | Llama la cadena una vez. |

## 4. Hallazgos confirmados

### SEED-01 — Alta — Un seed core fallido deja que la aplicación termine el bootstrap

`runStep` captura toda excepción y devuelve `failed: true`
(`src/common/seed/seed-bootstrap.service.ts:500-533`). El bucle continúa
(`:251-265`) y `onApplicationBootstrap` no relanza (`:206-218`). Incluso el
fallo del catálogo inicial sólo retorna un resumen (`:236-249`). Un rol o
catálogo core ausente puede dejar HTTP atendiendo sin sus precondiciones.

**Veredicto adversarial:** confirmado. El resumen y el log existen, pero no hay
gate de readiness o excepción que detenga el arranque. No hay evidencia de una
incidencia productiva concreta.

**Plan:** distinguir `core` de `content`; terminar con error tras el resumen si
falla cualquiera core y permitir degradación sólo explícita de content. Añadir
sonda de versión de seed para despliegues con `SEED_ON_BOOT=false`.

| Caso | Spec/proceso propuesto | Resultado esperado |
|---|---|---|
| Correcto | unit, todos los core resuelven | bootstrap resuelve; `failed=0`. |
| Límite | unit, falla un content | degradación explícita; proceso disponible. |
| Error | integración, falla un core | no inicia HTTP. |
| Falla catalogada | e2e `/readiness`, core ausente | `503 / DEPENDENCY_UNAVAILABLE / SYSTEM_SEED_CORE_INCOMPLETE`. |

### SEED-02 — Media — No hay regresión de la política de fallo de toda la cadena

Los specs ejercen datasets y servicios, pero no una matriz de fallo para cada
descriptor core/content ni la conexión del resumen con readiness. La única
conducta transversal actual es el log de `runStep`
(`seed-bootstrap.service.ts:516-531`).

**Veredicto adversarial:** confirmado como hueco de prueba, no defecto de datos.
Hay pruebas de idempotencia de seeders individuales, insuficientes para el
orquestador.

**Plan:** fixtures de paso exitoso/fallido, pruebas para catálogo inicial, core,
content y flags, más integración con base temporal y segunda corrida.

| Caso | Spec/proceso propuesto | Resultado esperado |
|---|---|---|
| Correcto | unit, todos los descriptors | orden y resumen estable. |
| Límite | integración, segunda corrida | cero duplicados. |
| Error | integración, dependencia FK ausente | rollback del paso; no listo si core. |
| Falla catalogada | e2e con core faltante | `503 / DEPENDENCY_UNAVAILABLE / SYSTEM_SEED_CORE_INCOMPLETE`. |

## 5. Pruebas por hallazgo

Las dos tablas anteriores contienen los cuatro casos por hallazgo. Los tests
nuevos deben afirmar status, `ErrorCode` y `reason`, sin datasets, credenciales
ni contenido clínico en salida.

## 6. Matriz de pruebas de la unidad completa

| Método | Correcto | Límite | Error | Falla catalogada |
|---|---|---|---|---|
| `loadSeedBootEnv` | flags válidos | vacío/default | booleano inválido | configuración segura de arranque |
| `run` | cadena core | segunda corrida | dependencia ausente | `503/DEPENDENCY_UNAVAILABLE/SYSTEM_SEED_CORE_INCOMPLETE` |
| `onApplicationBootstrap` | seed habilitado | content apagado | core fallido | mismo reason, sin HTTP listo |
| `seed:boot` | una cadena | hook apagado | base inaccesible | salida no cero sanitizada |

## 7. Catálogo de errores

Crear `SYSTEM_SEED_CORE_INCOMPLETE` para `503 / DEPENDENCY_UNAVAILABLE`. Los
`throw new Error` de validación interna de catálogos, por ejemplo
`affiliation-catalogs-seed.service.ts:143-154`, permanecen como diagnóstico de
bootstrap sanitizado, no como respuesta HTTP.

## 8. Olas y esfuerzo

| Ola | Hallazgo | Esfuerzo |
|---|---|---|
| 0 | SEED-01: gate core/content | M |
| 1 | SEED-02: fixtures e integración | M |

## 9. Trabajo pendiente de integrar y verificación

El plan externo menciona trabajo de seeds en `6a362e8e` y `b74203f3`; no está
en esta rama y debe contrastarse antes de corregir. Evidencia ejecutada:
`corepack yarn test --runInBand --silent src/common/seed`: **27 suites, 245
tests aprobados**. Jest emitió advertencias de imports JSON sin atributo, no
fallos de prueba.
