# Plan — El catálogo de razones de `emit()`

- **Fecha:** 2026-09-20 · **Persona:** Justin · **Línea:** B · **Corte:** `dev`
- **Origen:** el contrato `AgendaNoticePort v1.0.0` de Ender deja un `DECISION_REQUIRED`
  con mi nombre: *«Reintentabilidad de un fallo de `emit()` — el diseño de idempotencia de
  Justin, con el catálogo de razones que decida crear»*
  (`VERSION-ESTABLE.md` §5), apoyado en su §9: **`skippedReason` es texto libre, no un
  código estable**.

## El problema, en una línea

Hoy nadie —ni una persona ni un `if`— puede distinguir **«falló la red, reintentá»** de
**«este destinatario no tiene cuenta, no insistas»**: las dos vuelven como prosa en el mismo
campo. Es exactamente lo que hizo que HALL-02 pasara inadvertido toda una noche, y lo que
vuelve indecidible Q-06.

## Lo que este trabajo NO hace

- **No cambia lo que la API devuelve.** El contrato es `v1.0.0` y su dueño es Ender: tocar el
  tipo de `skippedReason` sin él sería romper el artefacto que este mismo carril fijó.
- **No implementa reintentos ni durabilidad.** Eso es Q-06 y es de negocio.
- **No toca los puertos hermanos** (`practitioner-access-notice`, `affiliation-notice`), que
  tienen el mismo defecto y otros dueños. Se nombran, no se tocan.

## H1 — Fijar qué razones existen hoy, sin inventar ninguna

**CA:** el catálogo cubre **todas** las razones que el código produce, y ninguna que no produzca.
**DoD:** `yarn test --testPathPatterns=agenda-notice-reason` en verde.

| ID | Microtarea | CA | DoD |
|---|---|---|---|
| H1.S1.M1 | Inventariar las 10 razones literales de la relación (5 in-app, 4 correo, 1 chat) con archivo y línea | Cada una con su ruta | el catálogo cita la línea |
| H1.S1.M2 | Darle a cada una un **código estable** y su clasificación `reintentable` / `terminal` / `no-es-fallo` | Las tres clases justificadas por el código, no por opinión | ídem |
| H1.S1.M3 | Traducir texto → código sin tocar el adaptador (`codigoDeRazon`) | Toda razón viva mapea a exactamente un código | prueba unitaria |

## H2 — Que el catálogo se entere si alguien agrega una razón nueva

**CA:** una razón nueva sin código **rompe una prueba**, no pasa desapercibida.
**DoD:** la prueba falla si se agrega un literal al adaptador y no al catálogo (kill-test).

| ID | Microtarea | CA | DoD |
|---|---|---|---|
| H2.S1.M1 | Prueba que lee el **fuente** de los dos adaptadores y exige que cada literal esté en el catálogo | Falla con el literal nuevo | kill-test ejecutado |
| H2.S1.M2 | Kill-test: agregar una razón falsa y ver el rojo; quitarla y ver el verde | Las dos salidas pegadas | evidencia |

## H3 — Entregarle a Ender lo que su contrato pide

**CA:** la propuesta de `v1.1.0` está escrita en términos de su ficha, no de mi código.
**DoD:** documento con la tabla de códigos, la clasificación y el impacto en compatibilidad.

| ID | Microtarea | CA | DoD |
|---|---|---|---|
| H3.S1.M1 | `CATALOGO-DE-RAZONES.md`: tabla de códigos, clase, texto actual y qué debería hacer el consumidor | Las 10 filas | documento |
| H3.S1.M2 | Cómo entraría al contrato sin romperlo (campo nuevo opcional, no cambio de tipo) | Compatibilidad hacia atrás explícita | ídem |

## Estado final (2026-09-20)

**7 / 7 microtareas en `HECHO`.** Se calcula, no se estima. Ver [REPORTE.md](./REPORTE.md).

| ID | Estado | Evidencia |
|---|---|---|
| H1.S1.M1 | `HECHO` | `CATALOGO-DE-RAZONES.md` §2 — las 10 razones con su punto de emisión |
| H1.S1.M2 | `HECHO` | `agenda-notice-reason.catalog.ts` · 8/8 pruebas |
| H1.S1.M3 | `HECHO` | ídem (`razonDeTexto`, `esReintentable`) |
| H2.S1.M1 | `HECHO` | las 3 pruebas de «fidelidad contra el código» |
| H2.S1.M2 | `HECHO` | `evidencia/h2-kill-test.txt` — rojo con la razón falsa, verde sin ella |
| H3.S1.M1 | `HECHO` | `CATALOGO-DE-RAZONES.md` |
| H3.S1.M2 | `HECHO` | ídem §5 — campo nuevo opcional, minor, compatible hacia atrás |

> **Desvío:** el plan preveía 6 microtareas. `H1.S1.M3` se partió al ejecutarla — traducir a código
> y clasificar reintentabilidad son dos observaciones, no una.
