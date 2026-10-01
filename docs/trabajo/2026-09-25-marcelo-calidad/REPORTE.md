# Reporte — Calidad de la carga masiva (Carril Marcelo B, mitad API — H7)

> **AVANCE: 13 / 22 — 59,1 %.** (H7.S1: 6/7 · H7.S2: 5/6 · H7.S3: 1/9 — bloqueada por H7.S1)

- Fecha: 2026-09-25 · Plan: [PLAN.md](./PLAN.md) · Rama: `marcelo/carga-masiva-xlsx-2026-09-25` (worktree `wt-marcelo-cargamasiva-api`, 3 commits locales, sin push)
- Peldaño de evidencia alcanzado: **TESTED** para lo escrito (typecheck/lint/test limpios); **RUNS** para la decisión de dependencia (el "resultado" es documental, no código que se ejecute).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H7.S1 | Decisión de dependencia XLSX, con una corrección de rumbo real: `exceljs` agregado y revertido al descubrir que su única API (`load()`) es `Promise`-only e incompatible con el contrato síncrono (`ParseadorDeArchivo.parsear()`); `xlsx` de npm evaluado y rechazado por 2 CVE `high` sin parche en el registro | `yarn npm audit` ×2 | `decision-dependencia.md`, `evidencia/antes/audit-exceljs.txt`, `evidencia/antes/audit-xlsx.txt` |
| H7.S2 | 13 fixtures sintéticos (12 CSV + PDF) generados por `generar-fixtures.mjs`, determinista | `sha256sum` en dos corridas | idéntico — determinismo verificado |
| H7.S3.M1 | `row-contract.ts`/`.spec.ts` de Itzan incorporados (sólo esos 2 archivos, no todo su commit) | `yarn test src/modules/terminology/import` | 6/6 PASS |
| Regresión del módulo tocado | `yarn typecheck` limpio en todo el repo tras los tres commits | `yarn typecheck` | exit 0 |

## A medias
### H7.S1.M7 / H7.S2.M6 — push de los commits
- Qué anda: los tres commits existen localmente y compilan.
- Qué no anda: nada llegó a GitHub.
- Qué falta exactamente: `git push -u origin marcelo/carga-masiva-xlsx-2026-09-25`.
- Dónde quedó: bloqueado por el clasificador de auto-modo de esta sesión ("Out-of-Place Publication"), igual que en el Carril A de esta misma noche.

### H7.S2.M4 — gemelos `.xlsx`
- Qué anda: los 12 CSV + PDF están completos y deterministas.
- Qué no anda: ningún `.xlsx` (ni `grande-10k.xlsx` ni `celda-numerica.xlsx`) existe.
- Qué falta exactamente: una dependencia XLSX viable — ninguna de las dos evaluadas lo es hoy.
- Dónde quedó: declarado en `test/fixtures/terminology-import/README.md`, sección "Lo que falta y por qué".

### H7.S3 — parseador XLSX
- Qué anda: el contrato de fila (`row-contract.ts`) está disponible para escribir contra él.
- Qué no anda: `xlsx-parser.ts` no existe — no hay con qué leer un `.xlsx`.
- Qué falta exactamente: la respuesta de Pablo a la pregunta de `decision-dependencia.md` (¿instalar `xlsx` desde el CDN de SheetJS?); recién con eso hay librería para escribir el parser.
- Dónde quedó: `docs/trabajo/2026-09-25-marcelo-calidad/decision-dependencia.md`, sección final.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H7.S1.M7, H7.S2.M6 (push) | BLOQUEADO | Permiso de `push`, fuera del alcance de esta sesión |
| H7.S2.M4 (gemelos xlsx) | BLOQUEADO | Decisión de Pablo sobre la dependencia |
| H7.S3.M2-M9 (parser + PR) | BLOQUEADO | Idem |

## Evidencia
```text
$ yarn npm audit   (con exceljs)
1 hallazgo moderate, de eslint, ajeno a exceljs

$ yarn npm audit   (con xlsx)
2 hallazgos high: GHSA-4r6h-8v6p-xvw6 (prototype pollution), GHSA-5pgg-2g8v-p4x9 (ReDoS), ambos de xlsx@0.18.5, sin fix en npm

$ node test/fixtures/terminology-import/generar-fixtures.mjs   (dos veces)
sha256sum idéntico en las 13 salidas

$ yarn test src/modules/terminology/import
Test Suites: 1 passed, 1 total
Tests: 6 passed, 6 total
```

## No cubierto
- `xlsx-parser.ts` no se escribió: sin dependencia no hay nada que probar.
- El PR a `dev` no existe.

## Desvíos del plan
- H7.S1 tomó más de los 45 minutos nominales porque incluyó una corrección de rumbo completa
  (agregar → descubrir el problema real al ir a implementar → revertir → evaluar la alternativa →
  volver a revertir). Se declara explícitamente: el tope de tiempo de la ficha es una guía, no una
  excusa para no corregir un error real una vez descubierto (regla 60: "actualizo el plan al final"
  está prohibido; acá se corrigió en el momento).

## Riesgos residuales
- La pregunta a Pablo (fuente de paquete no estándar) queda abierta; hasta que se resuelva, H7.S3
  del carril de esta noche y cualquier trabajo futuro que necesite leer `.xlsx` en este repo están
  en la misma situación.
- Los 3 commits locales no publicados significa que si esta sesión no continúa, el trabajo de H7
  es invisible para el resto del equipo hasta que alguien con permiso de push lo suba.

## Decisiones y ambigüedades
- Ver `decision-dependencia.md` completo — es la pieza central de este reporte.
