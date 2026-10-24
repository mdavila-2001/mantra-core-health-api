# Reporte — Vademécum de farmacología clínica (monografías por ATC 5)

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Ramas: `justin/seed-clinical-pharmacology` (PR contra `dev`, sin mergear), mismo commit en `claude/fervent-galileo-t68vaj`
- Peldaño de evidencia alcanzado: `TESTED` en general; el cargador llegó a `VERIFIED` en un Postgres 16 desechable con una ficha real (no con el corpus, que no se pudo descargar)
- Avance: 15 HECHO / 25 microtareas = **60 %** (3 A MEDIAS, 7 BLOQUEADO)

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | La monografía por secciones cabe en `concept_properties` sin DDL | `grep -n -i unique database/SQL/03_terminology/04_indexes.sql` | ningún índice único sobre `concept_properties` |
| H1.S1.M2 | Ramas hermanas comprobadas | `git branch -r \| grep -E "seed-(diseases\|drug-treatments)"` | vacío: no existen |
| H2.S1.M1, H2.S1.M2, H2.S1.M5 | Secciones literales, normalizador CIMA, plan de carga | `node --test tools/terminology-import/clinical-pharmacology/test/*.test.mjs` | ver evidencia/05: 90/90 en las tres suites |
| H2.S3.M1 | Armado sin red | `node …/build-monographs.mjs` | evidencia/01: exit 0; universo 483, 0 monografías (sin datos clínicos descargados) |
| H2.S3.M2 | Carga idempotente | `node …/load-clinical-pharmacology.mjs` ×2 | evidencia/06: 1.ª 5/3/4/14/1; 2.ª 0/0/0/0/0 |
| H2.S3.M3 | Cobertura | `node …/coverage-report.mjs` | evidencia/02 |
| H2.S3.M4 | Validación de enlaces | `node …/validate-links.mjs` | evidencia/07: map J01CE09 → vademecum; N02BE01 informado sin monografía |
| H2.S3.M5 | Empaquetado de lo normalizado | `node …/pack-data.mjs` | evidencia/04 + `data/MANIFEST.json` |
| H3.S1.M1 | Pasada 0 (fuentes del repo) | build + coverage | universo 483 ATC 5 (LINAME 482, vademecum 483) |
| H4.S1.M2 | Registro de pasadas | — | `docs/seed-research/clinical-pharmacology.md` |
| H4.S1.M3 | Gates | `yarn typecheck`, `yarn lint`, jest dirigido | evidencia/08–10: exit=0, exit=0, 21/21 |
| H4.S1.M4 | PR | — | https://github.com/mdavila-2001/mantra-core-health-api/pull/679 |
| H4.S1.M5 | Plan y reporte | — | este directorio |

## A medias

### H2.S1.M3 — Normalizador openFDA
- Qué anda: selección de la etiqueta de referencia (conjunto exacto de UNII, vía, Rx antes que OTC, effective_time) y una fila por campo con su cita; probado con objetos de forma sintética.
- Qué no anda: no se probó contra una partición real de `download.open.fda.gov`.
- Qué falta exactamente: bajar una partición, guardar 2–3 etiquetas reales como fixture y correr las pruebas contra ellas.
- Dónde quedó: `lib/openfda.mjs`, `test/openfda-rxnorm.test.mjs`.

### H2.S1.M4 — Parsers RxNav
- Qué anda: parsers defensivos (forma desconocida → vacío); el puente exige UNII para todos los ingredientes.
- Qué no anda: no se validaron con respuestas reales; en particular, no se confirmó que `idtype=ATC` esté soportado.
- Qué falta exactamente: correr `fetch-rxnorm.mjs --limit-atc 5` y guardar las respuestas como fixture.
- Dónde quedó: `lib/rxnorm.mjs`, `fetch-rxnorm.mjs`.

### H4.S1.M1 — Licencias
- Qué anda: cada fuente tiene su licencia escrita en `SOURCES.md` (la de CIMA, ya citada en el repo desde 2026-09-30).
- Qué no anda: ninguna licencia se reverificó en esta sesión (403 a todos los hosts).
- Qué falta exactamente: abrir cada página citada en `SOURCES.md` y marcarla verificada con fecha.
- Dónde quedó: `tools/terminology-import/clinical-pharmacology/SOURCES.md`.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S2.M1 `fetch-cima` | BLOQUEADO | Habilitar `cima.aemps.es` en Network access del entorno |
| H2.S2.M2 `fetch-rxnorm` | BLOQUEADO | Habilitar `rxnav.nlm.nih.gov` |
| H2.S2.M3 `fetch-openfda` | BLOQUEADO | Habilitar `api.fda.gov` y `download.open.fda.gov` |
| H3.S1.M2–M4 pasadas 1–6 | BLOQUEADO | Lo anterior + `dailymed.nlm.nih.gov`, `www.ema.europa.eu`, `www.minsalud.gob.bo` |
| H3.S2.M1 enlace con ramas hermanas | BLOQUEADO | Que existan `justin/seed-drug-treatments` y `justin/seed-diseases` |

## Evidencia

Salidas literales en [`evidencia/`](./evidencia/). Extractos:

```
# 05-node-test.txt
# tests 90
# pass 90
# fail 0

# 06-postgres-carga-e-idempotencia.txt (RESUMEN, corrida 1 y 2)
"concepts": 5, "designations": 3, "relationships": 4, "prunedProperties": 0, "properties": 14, "vademecumMaps": 1
"concepts": 0, "designations": 0, "relationships": 0, "prunedProperties": 0, "properties": 0, "vademecumMaps": 0

# 07-postgres-version-nueva-y-enlaces.txt
ficha con fecha +1 día:  "prunedProperties": 2, "properties": 2
vuelta al original:      "prunedProperties": 2, "properties": 2
concept_properties final: 14
textSha256 guardado:      7bfea730b6eec5ce0a0c0193503cb7c23f083c2dd0d99973480cf3eb528e8084
sha256 del texto fuente:  7bfea730b6eec5ce0a0c0193503cb7c23f083c2dd0d99973480cf3eb528e8084

# 08-typecheck.txt / 09-lint.txt
exit=0 / exit=0

# 10-jest-dirigidos.txt
Tests:       21 passed, 21 total
```

## No cubierto

- `yarn build`, `yarn test` completo, `yarn docs:validate` y `yarn docs:build` no se corrieron (no hay cambios en `src/` ni en el contrato).
- La carga se probó con UN medicamento real (CIMA 15419, secciones 4.1 y 4.3). El volumen real (miles de ATC 5, ~16 secciones cada uno, HTML + texto en jsonb) no se midió: tamaño y tiempo de carga desconocidos.
- `fetch-*.mjs` nunca corrieron. El respaldo de CIMA «documento completo → secciones sueltas» supone que `docSegmentado/contenido/1` sin `seccion` devuelve todas las secciones (lo dice el comentario del corte S3; no se observó en esta sesión).
- La base desechable se armó con conceptos internos mínimos (no con el seed de la API) y sin las FK diferidas a `iam`.

## Desvíos del plan

- El plan se escribió después del código (ver la nota en PLAN.md).
- Orden nueva del propietario, recibida a mitad de camino vía la sesión «Mejora de seeders médicos»: subir lo normalizado comprimido en `data/`. Se agregó `pack-data.mjs`; hoy `data/` sólo tiene metas y cobertura, porque no hay monografías.
- La orden de iterar con `/loop` hasta saturar no se ejecutó: cada iteración habría sido otro 403. Tampoco se le pudo responder a esa sesión (la sesión no puede enviar mensajes a otras).
- Para instalar dependencias se reemplazó `xlsx` por la versión de npm **sólo localmente** (cdn.sheetjs.com bloqueado); `package.json` y `yarn.lock` se restauraron sin cambios.

## Riesgos residuales

- Si `idtype=ATC` de RxNav no resuelve como se espera, openFDA no aporta nada: el puente queda vacío (no se adivinan códigos), pero la cobertura en inglés sería 0.
- HTML y texto se guardan juntos por sección: puede duplicar el tamaño. Decidir después de medir.
- Un consumidor que muestre estas propiedades a pacientes expondría la posología (4.2).

## Decisiones y ambigüedades

- Concepto por código ATC de los 5 niveles en el code system `clinical-pharmacology`, versión única `1`; la versión real de cada documento va en cada sección.
- Nombres ATC: los de la AEMPS; sin nombre de fuente, `display` = código (no se inventa).
- LINAME no se duplica en propiedades: ya está en `vademecum.liname_presentations` y se enlaza por `concept_maps`.
- Ambigüedades 1–4 del plan siguen abiertas para confirmar con Justin y el propietario.
