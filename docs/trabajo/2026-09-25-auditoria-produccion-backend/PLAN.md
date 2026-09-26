# Plan — Auditoría estricta de producción del backend

- Fecha: 2026-09-25. Repositorio: mantra-core-health-api. Predecesor: inspección inicial interrumpida, sin resultados de typecheck verificables.
- Base: dev, 4dcaa27961588444bcfdeb4cbe8a3aa2d1b71650; worktree inicialmente limpio.
- Resultado observable: informe reproducible de riesgos de producción, acciones priorizadas y límites de evidencia.
- Kill-test: un hallazgo sin ubicación/camino causal o un gate declarado aprobado sin salida invalida el informe.

## Alcance

- IN: código y configuración del backend, auth, autorización, aislamiento, persistencia, concurrencia, entradas/salidas, workers, observabilidad, despliegue, dependencias y gates locales.
- Escrituras: exclusivamente este directorio de documentación/evidencia; artefactos de herramientas de diagnóstico cuando sean necesarios. No corregir producto.
- OUT: frontend, despliegues, modificaciones de datos existentes, publicación de PR, pruebas destructivas, cargas sobre servicios existentes.
- Supuestos: se audita HEAD local de dev, no una imagen de producción identificada. No se presume que .env local represente producción. Infraestructura y bases existentes no se alteran. Sin PHI ni secretos en evidencia.
- Skills: code-quality-audit, secure-code-review, qa-evidence-reporting.

## H1 — Diagnóstico sustentado

**CA:** Dado el backend local, cuando se audita, entonces cada conclusión distingue código, ejecución y cobertura pendiente.
**DoD:** REPORTE.md con referencias, salidas literales y no cubierto.
**Estado:** HECHO — auditoría entregada; producto NO-GO, sin correcciones aplicadas.

### H1.S1 — Línea base y gates

**CA:** Dada la revisión, cuando se ejecutan herramientas, entonces se registra versión y resultado real.
**DoD:** comandos identificados y salida/exit code conservados.
**Estado:** HECHO — resultados reales registrados, incluidos gates fallidos.

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Fijar inventario | Dado HEAD, al inventariar, entonces queda identificada la revisión | git status -sb y git log -1 → SHA y estado | HECHO |
| H1.S1.M2 | Ejecutar typecheck | Dado TS, al comprobar, entonces se conoce el resultado | yarn typecheck y yarn build → exit 0 tras instalación inmutable | HECHO |
| H1.S1.M3 | Ejecutar lint | Dado código, al analizar, entonces se conoce el resultado | yarn lint --max-warnings=0 → exit 1, 19 errores y 1 advertencia | HECHO |
| H1.S1.M4 | Ejecutar unitarios | Dadas las suites, al ejecutarlas, entonces se registran fallos/pases | yarn test:cov --maxWorkers=1 → 8639 pass, 1 skip; exit 1 por cobertura | HECHO |
| H1.S1.M5 | Auditar dependencias | Dado lockfile, al consultar avisos, entonces se distingue riesgo de bloqueo de consulta | yarn npm audit --all --recursive --environment production --json → exit 0, sin avisos | HECHO |

### H1.S2 — Caminos de riesgo

**CA:** Dado un posible defecto, cuando se informa, entonces existe evidencia del camino causal.
**DoD:** lectura dirigida mediante rg/Get-Content y reproducciones sintéticas locales donde proceda.
**Estado:** HECHO — alcance y límites documentados.

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H1.S2.M1 | Revisar auth y autorización | Dado acceso sensible, al revisar, entonces quedan controles y defectos localizados | F01–F04 + reproducciones AUD-01/02/05/08/09 | HECHO |
| H1.S2.M2 | Revisar integridad y efectos | Dada mutación, al revisar, entonces se conoce atomicidad e idempotencia en caminos seleccionados | F07 + AUD-07; revisión dirigida de transacciones y workers | HECHO |
| H1.S2.M3 | Revisar privacidad y entradas | Dados bordes, al revisar, entonces se localizan filtraciones/validación | F05/F08 + AUD-04/06; revisión de validación e integraciones | HECHO |
| H1.S2.M4 | Revisar despliegue y CI | Dado artefacto, al revisar, entonces se identifican gates y riesgos operativos | F02/F06/F09 + AUD-03 + sondas + metadatos CI; guardrails/OpenAPI | HECHO |
| H1.S2.M5 | Entregar informe | Dada evidencia, al informar, entonces hay prioridades, acciones, responsables sugeridos y límites | REPORTE.md + EVIDENCIA.md + scripts/logs reproducibles | HECHO |

## Cierre

10/10 microtareas de auditoría completadas. Esto mide entrega del diagnóstico, NO corrección ni aprobación del producto. Dictamen NO-GO. Se preservaron código/configuración/lockfile y datos existentes. No cubierto: integración real, RLS real, E2E, carga/recuperación, infraestructura de producción, duplicación/ciclos exhaustivos y frontend; detalle en REPORTE.md.

Cambios al plan: cobertura con un worker en lugar de unitarios simples; build, lint OpenAPI, guardrails, nueve reproducciones sintéticas y consulta de metadatos CI añadidos como verificaciones pertinentes de sólo lectura del producto. No se ejecutaron pruebas de integración que requieren modificar servicios/bases existentes.

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Dependencias instaladas distintas del lock | Gates no representativos del artefacto | Registrar versiones y separar fallo ambiental de producto |
| Sin entorno aislado de integración | No demostrar persistencia real | No ejecutar resets sobre bases existentes; declarar cobertura pendiente |
| Repo amplio | No certificar cada endpoint individual | Mapear superficie y priorizar caminos de mayor impacto |
| Test runner costoso | Agotamiento de recursos | Un solo runner, serial; monitorear terminación |

## H2 — Publicar la auditoría por solicitud posterior del usuario

**CA:** Dada la auditoría entregada, cuando se publica, entonces existe un commit acotado y un PR hacia `dev`, sin modificaciones funcionales.
**DoD:** `git show --stat` y `gh pr view --json url,headRefOid,baseRefName,isDraft` identifican los artefactos publicados.
**Estado:** EN CURSO

### H2.S1 — Commit y PR documental

**CA:** Dado el SHA auditado, cuando la base remota avanzó, entonces el informe conserva su alcance histórico y el PR contiene sólo documentación y diagnósticos.
**DoD:** `git diff origin/dev...HEAD --name-only` queda limitado a este directorio; PR draft hasta CI verde.
**Estado:** EN CURSO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Preparar publicación | Dadas las evidencias, al revisar, entonces son legibles y no contienen credenciales detectadas | Inspección y escaneo local: 0 coincidencias de credenciales; 12 archivos normalizados a UTF-8 | HECHO |
| H2.S1.M2 | Crear commit | Dado el contenido revisado, al versionar, entonces queda sólo en rama propia | `git show --stat HEAD` → commit documental | TODO |
| H2.S1.M3 | Abrir PR | Dada la rama publicada, al crear PR, entonces apunta a dev y declara límites | `gh pr view --json url,headRefOid,baseRefName,isDraft` → URL/base/head/draft | TODO |

Autorización posterior: el usuario pidió explícitamente commit y PR; esto amplía el OUT original sólo para esa publicación. No autoriza merge ni despliegue. Base remota observada al publicar: `52a696b34e56511cf7d67a7549a443f8b0740c29`; evidencia de auditoría permanece en `4dcaa27961588444bcfdeb4cbe8a3aa2d1b71650`.
