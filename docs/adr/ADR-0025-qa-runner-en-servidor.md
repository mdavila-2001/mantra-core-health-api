# ADR-0025: QA Lab ejecuta en el servidor, con destinos aprobados y aprobación ligada al plan

## Estado
Aceptado (2026-09-18). Incremento 3 del portal administrativo. Desvío declarado de
[ADR-0021](ADR-0021-fuente-unica-de-ddl.md) igual que [ADR-0024](ADR-0024-portal-admin-catalogo-de-datos.md).

## Contexto

El módulo 36 (`qa_lab`) tenía el modelo completo —entornos, suites, casos, aserciones, corridas,
evidencia inmutable, defectos— pero **no ejecutaba nada**:

- `POST /qa/runs/:runId/cases/:caseId/execute` guarda lo que el cliente *dice* haber enviado y
  recibido. El portal era el runner: el trabajo dependía de la pestaña abierta y la evidencia era
  una afirmación del navegador.
- `evaluateResult` **no evaluaba**: `verdictFor` daba por aprobada toda aserción con valor
  esperado, sin mirar la respuesta. Una aserción `status = 500` contra una respuesta 200 "pasaba".
- `finalizeRun` marcaba PASSED una corrida sin ningún caso ejecutado.

## Decisiones

1. **Plano de ejecución propio (módulo 68 `qa_execution`) que orquesta el 36.** La evidencia se
   escribe con `executeCase` / `evaluateResult` / `finalizeRun`; no hay un camino paralelo.
2. **Destino aprobado por entorno** (`execution_targets`): esquema + host + puerto exactos y
   prefijos de ruta. Lo configura `QA_ADMIN`/`SECURITY_ADMIN`, no quien ejecuta. Producción nunca
   admite mutaciones.
3. **Guarda SSRF en el cliente HTTP**: se valida la URL normalizada, se resuelve el DNS, se valida
   **cada** dirección (basta una prohibida para bloquear) y la conexión se **fija** a la IP
   validada (anti-rebinding). Link-local/metadata cloud, multicast y reservadas: nunca. Privada y
   loopback: sólo si el destino lo autoriza. Redirecciones no se siguen. Tope de 1 MiB y timeout.
4. **Plan con hash** (suite+versión, destino, pasos con método/URL/hash del cuerpo, límites). El
   servidor recorta los límites pedidos, nunca los eleva. Producción, mutaciones o red privada
   ⇒ requiere aprobación.
5. **Aprobación = registro, no texto**: del hash vigente, con vencimiento (5–240 min), por una
   identidad distinta de quien pidió (también para `SUPERADMIN`). Si al ejecutar el plan ya no
   coincide (la suite o el destino cambiaron), no se ejecuta (`PLAN_DRIFT`). Una aprobación
   vencida devuelve el plan a `PENDING_APPROVAL`.
6. **Credenciales por referencia**: sólo variables `QA_TARGET_*` (nunca `DB_PASSWORD` ni otro
   secreto de la plataforma). Se inyectan en memoria y se redactan por completo antes de
   persistir. Las cabeceras sensibles que traiga un caso se descartan.
7. **Worker perdido ⇒ no se reintenta.** Si el lease vence con el plan en marcha, el siguiente
   reclamo lo cierra `INFRA_ERROR / WORKER_LOST`: repetir podría duplicar mutaciones ya hechas.
8. **Evaluación real de aserciones** (`qa_lab/domain/assertion-evaluator.ts`): STATUS, JSON_PATH
   (restringido: `$.campo`, `[i]`, `["clave"]`, sin comodines ni filtros), HEADER y LATENCY con
   operadores cerrados, guardando valor observado y motivo. Sin `eval`, sin regex del usuario.
   El camino heredado (ejecuciones reportadas por el cliente) conserva su comportamiento pero su
   evidencia dice `DECLARATIVE_ONLY: … no es un oráculo`.
9. **Una corrida sin ningún caso aprobado no pasa.**

## Fuera de alcance (declarado)

- **Carga/estrés**: el runner es funcional y secuencial (concurrencia 1). El preflight lo dice
  (`loadTesting: NOT_SUPPORTED`).
- **Journeys con extracción de variables** entre pasos y pasos de navegador.
- **Artefactos binarios** (HAR, capturas) del runner; la evidencia son los payloads del 36.
- **SSE** de progreso: la bitácora (`plan_events`) se consulta por polling.

## Consecuencias

- El worker `qa_lab` ejecuta además `QaPlanRunTickJob` (cada 5 s).
- Suites existentes cuyos casos no declaran método y ruta no son ejecutables por el runner
  (`CASE_NOT_EXECUTABLE` en el preflight).
- Verificación: `test/integration/qa-execution.int-spec.ts` (PostgreSQL + servidor HTTP reales,
  afirma que los planes bloqueados/cancelados/con deriva no envían ni una petición).
