# Reporte — TAREA-41 F3.0–F3.2: medición, identidad MONDO y HPO (puro, sin carga)

- Fecha: 2026-10-26 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `justin/l41-f3-hpo-identity-dev`, `justin/l41-f3-hpo-identity-test`
- Peldaño de evidencia alcanzado: `TESTED` (tests dirigidos en verde, gates en 0). No `VERIFIED`: no
  hubo carga en Postgres.
- Avance: 21 / 21 microtareas HECHO (100 %). El alcance excluye la carga; lo que falta para la carga
  está en «Pendiente».

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | 9 fuentes con URL, versión, SHA-256 y licencia | `sha256sum` sobre archivos re-bajados | 4/4 SHA comprobados = volumes.md |
| H1.S1.M2 | Conteos HPO y MONDO después de filtros | recuento independiente (`evidencia/fuentes-recontadas.txt`) | idénticos a volumes.md |
| H1.S1.M3 | Veredicto: 279 012 < 800 000, sin relleno | `grep 'por debajo' volumes.md` | presente |
| H2.S1.M1–M5 | Identidad MONDO, reuso CIE-10, conflictos, duplicados | `node --test …` | 7/7 ok |
| H3.S1.M1–M7 | HPO → filas bulk-copy SYMPTOM | `node --test …` | 10/10 ok |
| H3.S1.M8 | Recorte babelon con fuente y líneas | comparación línea a línea | ok=12 bad=0 |
| H4.S1.M1–M4 | install, tests, typecheck, lint | ver Evidencia | salida 0 en los cuatro |
| H4.S2.M1 | Push y dos PR (dev, test) sin merge | `git push`, GitHub | ver descripción de los PR |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| Carga real de HPO con `bulkLoadRelationships` | TODO (fuera de alcance) | Base viva con el glosario y el catálogo #688 cargados |
| Resolver `sex_concept_id` (615 filas con sexo) | TODO | Ids de los conceptos MALE/FEMALE en la base |
| Decidir los 21 conflictos de identidad | TODO | Revisión humana de `volumes.conflicts.json` |
| Meta de 800 000 relaciones | BLOQUEADO | Decisión del propietario: con F3.0–F3.3 se proyectan 279 012 |
| Orphanet como cargador (F3.3), F3.4–F3.6 | TODO | Siguientes fases de la lane |

## Evidencia
`evidencia/gates.txt` (salida literal de los cuatro gates) y `evidencia/fuentes-recontadas.txt`. Recorte:

```
$ node --test "tools/terminology-import/test/**/*.test.mjs"
# tests 88
# pass 87
# fail 0
# skipped 1      ← «paridad SQL» de bulk-copy: SKIP sin Postgres, preexistente, no tocado
TEST_EXIT=0
$ corepack yarn typecheck   → TC_EXIT=0
$ corepack yarn lint        → LINT_EXIT=0
$ corepack yarn install --immutable → ➤ YN0000: · Done in 2s 315ms  (INSTALL_EXIT=0)
```

## No cubierto
- `measure-sources.mjs` no se re-ejecutó entero en esta sesión: las cifras de Orphanet y las que
  dependen del glosario (1984 reusos, 21 conflictos, tasas de duplicados 2,83 % / 0,36 %) vienen de la
  corrida del agente anterior (`volumes.json`), no se reprodujeron aquí.
- `corepack yarn lint` sólo cubre `{src,apps,libs,test}/**/*.ts`; los `.mjs` de `tools/` no pasan por ESLint.
- Ninguna fila se insertó en Postgres: la aceptación real por `bulkLoadRelationships` no está probada.

## Desvíos del plan
- El código lo escribió un agente anterior (commit interrumpido) antes de que existiera este PLAN.md;
  el plan se escribió al retomar y describe ese trabajo más lo agregado en esta sesión.
- El comando pedido `node --test tools/terminology-import/test/` falla en Node v22.22.0 (MODULE_NOT_FOUND
  al pasar un directorio); se usó el glob equivalente del script `test:terminology-import`.

## Riesgos residuales
- Proyección 279 012 relaciones: muy por debajo de 800 000.
- 844 filas HPOA con enfermedad sin grupo MONDO no se cargan (no se inventa identidad).
- `ONSET_AGE_DAYS` está copiado de las definiciones de hp.obo 2026-09-01; si HPO cambia una
  definición, hay que actualizar la tabla a mano.

## Decisiones y ambigüedades
- «Aprobada» en babelon = `OFFICIAL` (el archivo real sólo trae ese estado: 19 932 filas). Confirmar con
  el propietario del glosario.
- HPO sin PMID → T3 `COLLABORATIVE_KNOWLEDGE`. Confirmar con el propietario de TAREA-41.
- ORPHA dentro de HPOA se salta: Orphanet entra directo en F3.3, para no contar dos veces la misma fuente.
