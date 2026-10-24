# Reporte — Vademécum de farmacología clínica (monografías por ATC 5)

- Fecha: 2026-10-24 (actualizado 18:40 UTC) · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/seed-clinical-pharmacology`
- PRs:
  - Mergeados en `dev`: #679, #705 y #710 (pasada 1).
  - Este estado (pasadas 2–5): PR_NUEVO, sin mergear.
- Peldaño de evidencia alcanzado:
  - **`VERIFIED`** para la carga del corpus de la pasada 5 en un Postgres 16 desechable: filas,
    tamaño, idempotencia, integridad del texto (sha256) y enlaces a `vademecum`.
  - **`TESTED`** para el resto. No llega a `REGRESSION_VERIFIED`:
    - Las pasadas 6 y 7 siguen descargando.
    - No se cargó en la base real del stack.
    - La suite Jest completa no se corrió; sólo la dirigida.
- Avance: **35 HECHO / 40 microtareas = 87,5 %** (35 ÷ 40). Quedan 4 EN CURSO y 1 TODO.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1–M2 | La monografía cabe sin DDL; ramas hermanas comprobadas | `grep` sobre el DDL; `git ls-remote` | sin índice único en `concept_properties`; `seed-drug-treatments` ya en `dev` |
| H2.S1.M1–M9 | Normalizadores CIMA, openFDA, GSRS, RxNav, EMA, DailyMed (SPL) y eEML, todos con datos **reales** | `node --test …/clinical-pharmacology/test/*.test.mjs` | 28/28 |
| H2.S2.M1–M5, M7 | Descargas CIMA (referencias + maestra ATC), RxNav, openFDA, GSRS, EMA y eEML | fetchers con `NODE_USE_ENV_PROXY=1` | metas con URL, sha256 y fecha; eEML 1 132/1 132, 0 fallos |
| H2.S3.M1 | Armado | `build-monographs.mjs` | 2 709 monografías, 69 067 secciones (evidencia/19) |
| H2.S3.M2 | Carga idempotente a escala | `load-clinical-pharmacology.mjs` ×2 en base nueva | 3 773 / 3 757 / 3 759 / 90 102 / 425 → 0 (evidencia/21) |
| H2.S3.M3–M4 | Cobertura y enlaces | `coverage-report.mjs`, `validate-links.mjs` | evidencia/20 y 21 |
| H2.S3.M5 | Datos normalizados en git | `pack-data.mjs` | `data/`: 4 partes de monografías (24–40 MB gz), MANIFEST con sha256 |
| H2.S3.M6 | NDJSON > 512 MB | test `ndjsonLines` + `coverage-report.mjs` | verde; 549 MB leídos |
| H3.S1.M1–M7 | Pasadas 0–5 medidas | build por pasada con `--no-*` | ver tabla de pasadas |
| H3.S2.M1 | Enlace con `drug-treatments` por código | `python3 -I evidencia/22-enlace-drug-treatments.py` | 3 032 de 4 842 fármacos (12 008 de 18 032 afirmaciones) llegan a una monografía |
| H4.S1.M1 | Licencias leídas en su página | lectura 2026-10-24 | AEMPS, openFDA, RxNav, EMA, eEML, NLM |
| H4.S1.M2 | Registro de pasadas | — | `docs/seed-research/clinical-pharmacology.md` |
| H4.S1.M3 | Gates sobre HEAD `1b07eb16` (con `dev` `025e3e37` mergeado) | `node --test` (3 suites), `yarn typecheck`, `yarn lint`, `yarn build`, Jest dirigido | 115/115, exit 0, exit 0, exit 0, 12/12 (evidencia/23–27). `docs:validate` y `docs:build --strict` fallan sólo por 3 enlaces de otros reportes ya en `dev` (evidencia/28–29) |
| H4.S1.M4 | PR contra `dev` | — | PR_NUEVO |
| H4.S1.M5 | Plan y reporte | — | este directorio |

Pasadas (ATC 5 nuevos con monografía / secciones nuevas):

| # | Fuente | ATC 5 | Secciones |
|---|---|---:|---:|
| 1 | openFDA + GSRS | 1 033 | 18 853 |
| 2 | RxNav | +104 (−7) | +2 252 |
| 3 | CIMA | +1 432 | +46 100 |
| 4 | EMA | +59 | +1 401 |
| 5 | eEML de la OMS | +88 | +1 568 |

## A medias

Ninguna microtarea en A MEDIAS. Las EN CURSO son descargas que siguen corriendo; se detallan en
Pendiente.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S2.M6 / H3.S1.M8 — DailyMed | EN CURSO | Termina la descarga: 12 500 de 17 729 identidades a las 18:15 UTC. Después, build con y sin `--no-dailymed`. |
| H2.S2.M8 / H3.S1.M9 — CIMA exhaustiva | EN CURSO | Termina la descarga: 11 200 de 22 506 fichas a las 18:15 UTC. Después, build con `--granularity product`. |
| H3.S1.M10 — dos pasadas en 0 | TODO | Las pasadas 6 y 7 medidas. Si alguna aporta, buscar otra fuente libre y oficial. |

## Evidencia

Salidas literales en la carpeta `evidencia/` de este directorio:

- 01–15: primera sesión y pasada 1.
- 16–19: pasadas 2–5.
- 20: cobertura tras la pasada 5.
- 21: carga y `validate-links`.
- 22: enlace con `drug-treatments`.
- 23–29: gates (28–29: documentación).

Extractos:

```
# 21-postgres-carga-pasada-5.txt
1.ª: "concepts": 3773, "designations": 3757, "relationships": 3759, "properties": 90102, "vademecumMaps": 425  (39 s)
2.ª: todo 0 (19 s)
concept_properties: 342 MB
secciones con textSha256 ≠ sha256(texto): 0 ; filas eEML sin atribución o advertencia: 0

# 23–27
node --test: tests 115, pass 115, fail 0 · typecheck exit=0 · lint exit=0 · build exit=0 · jest vademecum-seed 12/12
```

## No cubierto

- **Aplicaciones:** la base real del stack y la API no se tocaron; la carga se midió sólo contra el
  DDL del módulo 03 en una base desechable.
- **Lint:** `yarn lint` cubre `src`, `apps`, `libs` y `test` en TypeScript, no los `.mjs` de `tools/`.
  Sobre esos archivos sólo corren `node --check` y los tests.
- **Catálogo de productos:** no se midió el cruce con `medicines-*.ndjson`; los archivos no están en
  la sesión.
- **Enfermedades:** no se validó el enlace con `diseases`, que no usa ATC. El enlace fármaco →
  enfermedad pasa por `drug-treatments`.
- **Jest completo:** no se corrió `yarn test`; no hay cambios en `src/`.
- **`yarn docs:validate` y `yarn docs:build`:** OpenAPI y AsyncAPI son válidos, pero los dos
  comandos salen con 1. La causa son 3 enlaces `./evidencia/` (carpeta sin `index.md`) en reportes
  de otros trabajos que ya están en `dev`: `diccionarios-medicos`, `marcelo-lane16-protection` y
  `seed-dx-devices-eu-oficial`. El mismo enlace en este REPORTE se arregló en este PR. Los otros
  quedan fuera de alcance (evidencia/28–29).

## Desvíos del plan

- El plan se escribió después del código (ver PLAN.md).
- Fuentes agregadas a medida que se habilitaron los hosts:
  - **GSRS** (pasada 1), mientras RxNav estaba bloqueado.
  - **EMA**, **eEML** y **DailyMed**.
  - La eEML figuraba como «no usada (CC BY-NC-SA)». Al leer su página el 2026-10-24 resultó
    **CC BY 3.0 IGO**, con uso comercial permitido salvo publicidad.
- **Re-medición por dedupe:** CIMA dejó de repetir textos idénticos dentro de un ATC. La base de la
  pasada 4 pasó de 68 606 a 67 499 secciones; no se perdió ninguna sección distinta.
- **Desempate por uso en España:** los conflictos GSRS/RxNav se desempatan por los ATC que la
  AEMPS usa en CIMA, sólo por código. Así se recuperaron 7 ATC 5 que la pasada 2 había perdido por
  códigos obsoletos del GSRS.
- **NDJSON grande:** el corpus pasó de 512 MB y hubo que leerlo por líneas.

## Riesgos residuales

- **Avisos de las fuentes.** openFDA advierte que sus datos no están validados y la eEML dice que su
  PDF es la versión vinculante. Los dos avisos van en cada fila; quien muestre estas secciones debe
  mostrarlos.
- **Posología** (4.2 / `dosage_and_administration`): contenido profesional, no para pacientes.
- **788 fichas de CIMA sin fecha de revisión publicada**, frente a la obligación de fecha de la
  AEMPS (ambigüedad 6).
- **22 334 etiquetas de openFDA siguen sin enlazar.** Son principios con varios ATC según vía o
  uso. Enlazarlas exigiría inferir; quedan contadas.
- **Tamaño:** `concept_properties` ocupa 342 MB con la pasada 5. La CIMA exhaustiva lo hará crecer.
  Correr `VACUUM` después de recargas grandes.

## Decisiones y ambigüedades

- Concepto por código ATC de los 5 niveles en `clinical-pharmacology`, versión única `1`. La versión
  real de cada documento va en cada sección.
- Nombre mostrado, en este orden:
  1. el de la AEMPS (ES);
  2. si no hay, el de la LINAME (ES);
  3. si tampoco, el de la sustancia en el GSRS (EN), sólo para un principio;
  4. si no, el código.
- Sin ATC asignado por la fuente no se enlaza: 468 medicamentos de CIMA, 166 de la EMA y 184
  recomendaciones de la eEML.
- DailyMed: de las etiquetas que sólo están ahí se guarda el puntero, no el texto (posible copyright
  de terceros según la NLM).
- Ambigüedades 1–6 del plan, abiertas para confirmar con Justin y el propietario.
