# TAREA-41 F3.7 — Alcanzabilidad

Apilado sobre F3.6 (mantra-core-health-api#1107/#1108) → F3.5 → F3.4 → F3.3.

## Qué hay
- `lib/glossary-es/reachability.mjs`: la definición y la consulta (SQL **de solo lectura**, versionada), el resumen y el informe.
- `measure-reachability.mjs`: la corre contra la base y escribe `reachability.md`/`.json`; sale con código 1 si los huérfanos superan la meta (sirve de candado contra repetir el defecto R-4).
- `test/f3-reachability.test.mjs` (5 pruebas: aritmética, 15 % exacto no pasa, sin escrituras en el SQL).

## Definición (la ficha no la fija; se documenta)
**Alcanzable** = es origen o destino de una fila de `concept_relationships` (lo que lee el vecindario, incluida la jerarquía `REL_IS_A`) **o** es miembro incluido de un value set (la faceta con que el glosario agrupa por categoría y etiqueta). **Huérfano** = ninguna de las dos. Los mapas a otros sistemas (`concept_maps`) no cuentan: se informan aparte (`Huérfanos con mapa`).

## Resultado (rung 5 — base LOCAL, 2026-10-29)
**81 326 conceptos · 7 984 huérfanos = 9,82 %** (meta < 15 %): **dentro de la meta** (`evidencia/reachability.md`).

Por qué la cifra necesita matices:
1. **La base local no es el universo final.** Tiene 81 326 conceptos (MONDO sin los otros 11 sistemas del catálogo, 12 051 fichas CIE-10-ES de unas 100 000 del glosario). La metrica se debe **repetir sobre la base completa y sobre el VPS** antes de darla por cumplida.
2. **Sistemas fuera de la meta**, que conviene separar:
   - Internos (`mantra-core-internal` 30,35 %, `SALUD_CORE` 46,09 %, `CODE_SYSTEMS_01` 91,67 %): estados, idiomas y enums del sistema, no conocimiento clínico; su "orfandad" no es el defecto R-4. Son 3 580 de los 7 984 huérfanos.
   - **`vademecum`: 483 conceptos, 100 % huérfanos** (sin relación ni faceta). Es el hallazgo accionable: se cargó y nada lo lee por este camino.
   - **`mondo`: 3 921 huérfanos (14,16 %)**, apenas bajo la meta: nodos de catálogo sin jerarquía `REL_IS_A` ni evidencia (sólo 20 tienen mapa).
3. Excluyendo los sistemas internos: 70 403 conceptos, 4 404 huérfanos = **6,26 %**.
4. **HPO 0 huérfanos** porque la evidencia de F3.2–F3.3 los cubre a todos (19 894); ese resultado depende de que esas cargas sigan en la base.

## Límites
- Sólo mide la base local; no se midió el VPS.
- "Faceta" es una interpretación (value sets). Si el producto cuenta otras facetas (p. ej. etiquetas del front), la métrica debe ampliarse.
- No se borró ni cargó nada: sólo mide. Qué hacer con `vademecum` y los nodos MONDO aislados lo decide el propietario.
