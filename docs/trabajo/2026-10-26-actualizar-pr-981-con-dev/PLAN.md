# Plan — Actualizar PR #981 con dev

- Fecha: 2026-10-26 · Repos afectados: mantra-core-health-api · Predecesor: PR #981 (REQ-16-035)
- Resultado observable: la rama `claude/cobro-relacion-de-cuidado` incluye `dev` sin conflictos y sus pruebas dirigidas siguen en verde.
- Kill-test: `git merge origin/dev` con conflictos, o `jest src/modules/insurance src/modules/authz src/architecture` en rojo tras el merge.

## Alcance
- IN: merge de `origin/dev` en la rama del PR; resolver conflictos solo si los hay; correr tsc y jest dirigidos; push.
- OUT: lógica de la puerta, TREATMENT, alta de relación desde agenda/check-in/encuentro (decisión de producto abierta en el cuerpo del PR). El PR sigue en borrador.
- Ambigüedades registradas: el PR no tiene reseñas ni comentarios; "corregir" se interpretó como "actualizar con dev" (confirmado por el usuario). A confirmar con mdavila-2001 si esperaba otra cosa.

## H1 — Rama al día con dev
**CA:** Dado el PR #981 detrás de `dev`, cuando se fusiona `dev`, entonces la rama queda sin conflictos y las pruebas dirigidas pasan.
**DoD:** comandos de las microtareas, salida pegada en REPORTE.md.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Merge de origin/dev | Merge sin conflictos | `git merge origin/dev` → exit 0 | HECHO |
| H1.S1.M2 | Typecheck | tsc sin errores | `yarn tsc --noEmit` → exit 0 | HECHO |
| H1.S1.M3 | Pruebas dirigidas | Suites en verde | `yarn jest src/modules/insurance src/modules/authz src/architecture` → exit 0 | HECHO |
| H1.S1.M4 | Push | Rama publicada | `git push -u origin claude/cobro-relacion-de-cuidado` → exit 0 | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| node_modules ausente / Node distinto | No se pueden correr pruebas | Instalar con yarn; si no es posible, declarar BLOQUEADO |
| Conflictos en insurance | Cambia el diff | Resolver conservando ambas intenciones y registrar en REPORTE |
