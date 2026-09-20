# Reporte — El catálogo de razones de `emit()`

- **Fecha:** 2026-09-20 · **Plan:** [PLAN.md](./PLAN.md) · **Rama:** `justin/2026-09-20-catalogo-razones-emit`
- **Peldaño de evidencia alcanzado:** `TESTED`. Son pruebas unitarias sobre código que **no cambia
  comportamiento** —el catálogo no lo consume nadie todavía— así que no hay runtime que observar
  y no corresponde declarar `VERIFIED`.
- **Avance:** **7 / 7 microtareas** en `HECHO` (100 %, calculado).
- **Entregable para Ender:** [CATALOGO-DE-RAZONES.md](./CATALOGO-DE-RAZONES.md)

## Completado

| ID | Qué se logró (observable) | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Las **10** razones de la relación, inventariadas con archivo y punto de emisión | lectura + `grep -rn skippedReason src` | PASS · tabla en `CATALOGO-DE-RAZONES.md` §2 |
| H1.S1.M2 | Cada una con **código estable** y clase (`retryable` / `terminal` / `not-a-failure`) | `yarn test --testPathPatterns=agenda-notice-reason` | PASS · 8/8 |
| H1.S1.M3 | `razonDeTexto()` traduce texto → código sin tocar el adaptador | ídem | PASS |
| H2.S1.M1 | Prueba que lee el **fuente** de los dos adaptadores y exige que todo literal esté catalogado | ídem | PASS |
| H2.S1.M2 | **Kill-test ejecutado**: razón falsa → 2 pruebas en rojo; revertida → 8/8 | ídem, con y sin la inyección | PASS · `evidencia/h2-kill-test.txt` |
| H3.S1.M1 | Documento para Ender con la tabla, la clasificación y el porqué de cada clase | — (documento) | PASS · `CATALOGO-DE-RAZONES.md` |
| H3.S1.M2 | Cómo entra al contrato **sin romperlo**: campo nuevo opcional, minor, no cambio de tipo | — (documento) | PASS · §5 del mismo |

### Verificación

```text
yarn typecheck                                     exit=0
yarn lint --max-warnings=0                         exit=0
yarn test --testPathPatterns=agenda-notice-reason  8 passed, 8 total   exit=0
yarn test --testPathPatterns=scheduling            21 suites · 491 pruebas · exit=0
```

## Lo que más importa de este trabajo

**La convención no se inventó acá.** Buscar antes de crear (regla 96.1) encontró que
`skippedReason` **ya se usa como código estable** en otros dos módulos del repositorio:
`AGENT_NOT_ACTIVE` en `context-collection.service.ts:281` y `SUITE_NOT_ACTIVE` /
`NO_ACTIVE_CASES` en `qa-catalog.service.ts:505-570`. Los tres puertos de avisos son la
**excepción**, no la regla. Eso convierte la propuesta en «alinear», no en «introducir un estilo
nuevo», y es lo que la hace barata de aceptar.

**El catálogo tiene un detector de deriva, y se demostró que muerde.** Sin él sería una foto que
envejece en silencio —justo el defecto que vino a corregir—. Con una razón falsa inyectada en el
adaptador:

```text
+ Array [
+   "una razon que nadie catalogo",
Expected: 10   Received: 11
Tests: 2 failed, 6 passed
```

Revertida la inyección, `8 passed`. Salida completa en `evidencia/h2-kill-test.txt`.

## A medias

Ninguna.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| Emitir el código desde el puerto (`skippedReasonCode`) | `BLOQUEADO` | **Ender.** Es su contrato; §7 del documento le pide una de tres respuestas y con cualquiera cierro |
| Clasificación definitiva de `EMIT_FAILED` | `BLOQUEADO` | **Q-06, negocio.** Hoy va `retryable` por asimetría de costos, y así está declarado |

## Evidencia

| Archivo | Qué contiene |
|---|---|
| `evidencia/h2-kill-test.txt` | El kill-test del detector: verde → rojo con el texto exacto → verde |
| `CATALOGO-DE-RAZONES.md` | El entregable: 10 códigos, 3 clases, y cómo entra al contrato |
| `src/modules/scheduling/ports/agenda-notice-reason.catalog.ts` | El catálogo |
| `…/agenda-notice-reason.catalog.spec.ts` | Las 8 pruebas, 3 de ellas de fidelidad contra el fuente |

## No cubierto

- **Nadie consume el catálogo todavía.** Es deliberado: consumirlo desde el adaptador cambia lo
  que la API devuelve, y eso es el contrato de Ender. Por eso el peldaño es `TESTED` y no `VERIFIED`.
- **Los dos puertos hermanos** (`practitioner-access-notice`, `affiliation-notice`) tienen el mismo
  defecto y sus propias razones. Quedan **anotados, no tocados**: son de otros dueños (regla 00 §3.2).
- **Una supresión con texto escrito en la base** (`suppressionReason`) no mapea a ningún código:
  `razonDeTexto()` devuelve `null` a propósito en vez de adivinar. Está documentado en el propio
  catálogo y en el spec.

## Desvíos del plan

1. **El plan preveía 6 microtareas y salieron 7.** `H1.S1.M3` se partió al escribirla: traducir
   texto → código y clasificar reintentabilidad son dos observaciones distintas y el DoD no podía
   ser uno solo.
2. **`__dirname` no existe** en este runner (jest en modo ESM): la primera versión del spec murió
   con `ReferenceError`. Se resolvió con `process.cwd()`, que es lo que ya hacía
   `src/orm/catalog/profiles-fileid.contract.spec.ts` — patrón del repositorio, no invención.

## Riesgos residuales

- **El detector de deriva lee el fuente con una expresión regular.** Si alguien escribe una razón
  de una forma que la expresión no contempla (por ejemplo armando el string con una variable), el
  detector no la ve y el catálogo queda incompleto sin avisar. El fusible «lee de verdad los dos
  fuentes» acota el daño —detecta que el conteo cambió— pero no lo elimina.
- **El mapa por texto es frágil por naturaleza**, y es exactamente lo que el documento propone
  eliminar: existe sólo mientras el contrato no emita el código. Es un puente, no una casa.

## Decisiones y ambigüedades

| ID | Qué | Supuesto tomado | A quién confirmárselo |
|---|---|---|---|
| **DEC-04** | Códigos en inglés y mayúsculas | Ninguno: es el patrón vivo del repositorio, citado con archivo y línea | — |
| **DEC-05** | El catálogo no se consume desde el adaptador | Tocar la salida sin su dueño sería romper el contrato que este mismo carril fijó por versión | Ender |
| **AMB-06** (nueva) | ¿`EMIT_FAILED` es reintentable? | **Sí, a falta de información**, por asimetría de costos: reintentar un fallo permanente cuesta un intento; perder uno transitorio cuesta el aviso y —HALL-09— no deja rastro | Negocio (Q-06) |
