# Plan — Auditoría de fallos de integración por datos locales

- Fecha: 2026-10-11 · Repos afectados: `mantra-core-health-api` · Predecesor: handoff `CODEX-HANDOFF-2026-10-10.md`, tarea 2.5
- Resultado observable: el PR documenta cuáles fallos de integración corresponden a datos locales o expectativas desactualizadas, y qué queda bloqueado.
- Kill-test: si las consultas de sólo lectura no confirman que falta `I10` y que anatomía tiene 16 miembros, no se atribuyen los 400 ni los conteos a datos.

## Alcance
- IN: documentar la corrida autorizada de los tres specs, las comprobaciones de sólo lectura y la falla WORM del cleanup.
- OUT: cargar semillas, editar tests/código productivo, borrar tenants o tocar `audit.audit_log`.
- Ambigüedades registradas: la carga idempotente de CIE-10 modifica la base local; el handoff indica que requiere autorización explícita. Se asume no autorizada hasta confirmación del propietario.

## H1 — Clasificar los fallos y dejar evidencia reproducible
**CA:** Dado el resultado de los tres specs y las consultas de sólo lectura, cuando se revise el reporte, entonces cada fallo queda clasificado o marcado como pendiente con su evidencia.
**DoD:** inspección del diff, `git diff --check` → salida vacía/código 0; crear PR contra la base correspondiente; no repetir los specs que escriben datos sintéticos.
**Estado:** HECHO

### H1.S1 — Registrar resultados de la corrida autorizada
**CA:** Los tres specs y sus fallos observados están descritos sin alterar las aserciones ni ocultar fallos. **DoD:** incorporar la salida disponible de Jest y los resultados previamente observados; no ejecutar de nuevo.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Documentar 3 suites, 11 fallos y 19 pruebas aprobadas | El reporte refleja el resultado de la corrida autorizada | `git diff --check` → código 0 | HECHO |
| H1.S1.M2 | Clasificar ausencia de `I10`, conteo anatómico y fallback español | El reporte vincula cada caso a evidencia observada | `git diff --check` → código 0 | HECHO |
| H1.S1.M3 | Documentar residuo sintético protegido por WORM | Se indica que el cleanup falló y que `audit_log` quedó intacto | `git diff --check` → código 0 | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| No se puede limpiar el tenant sintético por una FK desde `audit.audit_log` | El tenant permanece local | No modificar la bitácora WORM; escalar el diseño del harness en la tarea ya asignada a otra sesión |
| Falta `I10` en el catálogo local | Los specs de seguros responden 400 | Solicitar autorización separada antes de ejecutar la carga idempotente CIE-10-ES |
