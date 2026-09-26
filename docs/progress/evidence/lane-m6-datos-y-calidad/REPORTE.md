# M6 · Acer Aspire 3 — evidencia H1 (los doce markdown)

Rama `marcelo/test-m6-datasets-lint` sobre `origin/test` @ `016caaa1`.

## Corrección al discovery del encargo

El encargo (`Preproduccion.DatosYCalidadDeLaSuite/LosDoceMarkdownSuiteDeterministaYLint.md`)
afirma que sólo 5 de los 12 markdown llegan a la API y lista 6 faltantes con conteos
(clínicas privadas 30, hospitales 2.º/3.º nivel y cajas 35, primer nivel 470, farmacias y
laboratorios 34, arancel odontológico 186, especialidades odontológicas 14).

Verificado contra el código real en `origin/test @ 016caaa1` (no contra el discovery): de los
diez markdown institucionales (los dos de personas — `USUARIO_MEDICOS_1.md` /
`USUARIO_PACIENTES_1.md` — son de M2, no de esta máquina), **nueve YA estaban extraídos**:
`extraer_establecimientos()` ya cubre clínicas privadas, hospitales 2.º/3.º nivel y cajas,
primer nivel, y farmacias/laboratorios/análisis (los cuatro dentro de
`health-facilities.dataset.json`), y `extraer_aranceles()` ya cubre el arancel odontológico
(dentro de `fee-schedule.dataset.json`). El único de los diez sin extractor era
`LISTA_DE_ESPECIALIDADES_ODONTOLOGICAS.md`, y el archivo real tiene **10 filas, no 14**.

## H1.S1 — Lo que faltaba de verdad

| Microtarea | Estado | Evidencia |
|---|---|---|
| H1.S1.M1/M2 — especialidades odontológicas | HECHO | `dental-specialties.dataset.json` nuevo, 10 registros (ver salida abajo) |
| H1.S1.M3 — coordenadas ya derivadas | HECHO | 484/642 filas de `health-facilities` con `lat/lng/precision`, adjuntadas desde `mantra-core-health/data/markdown-institutions/{pharmacies-and-labs,primary-care}.json` por nombre normalizado. Clínicas privadas y hospitales 2/3 quedan en `null`: esas dos fuentes no las cubren, y no se geocodificó nada de nuevo |
| H1.S1.M4 — procedencia en toda fila | HECHO | `source_file`/`source_row` en las 6 salidas (insurance-carriers, health-facilities, provider-networks —a nivel de sede—, fee-schedule, dental-specialties) |

Salida real de `python tools/bolivia-datasets/extract_datasets.py`:

```
Origen : D:\Trabajos Secundarios\Mantra Core Technologies\mantra-core-health-model\markdown_convertidos
Destino: D:\Trabajos Secundarios\Mantra Core Technologies\wt-m6-api\src\common\seed\data\bolivia

  insurance-carriers.dataset.json           17 registros
Padrón : 523 oficiales + 119 de redes
  health-facilities.dataset.json           810 registros
  provider-networks.dataset.json          4549 registros
  fee-schedule.dataset.json               4408 registros
  observed-specialties.dataset.json        196 registros
  dental-specialties.dataset.json           10 registros

Listo.
```

Muestra de una fila con coordenadas y procedencia (`health-facilities.dataset.json`):

```json
{
  "code": "BO_EST_ASCENCION_DE_GUARAYOS_CERRO_GRANDE",
  "nombre": "CERRO GRANDE",
  "tipo": "CENTRO_SALUD",
  "nivel": 1,
  "naturaleza": "PUBLICA",
  "lat": -15.2079598,
  "lng": -63.6147082,
  "precision": "municipio",
  "source_file": "LISTA_DE_HOSPITAL_DE_PRIMER_NIVEL_SANTA_CRUZ_1.md",
  "source_row": 1
}
```

## H1.S1 — Determinismo (el kill-test de H1)

Hash SHA-256 de los 6 JSON, dos corridas consecutivas sobre el mismo árbol:

```
$ sha256sum src/common/seed/data/bolivia/*.json > /tmp/hashes_run1.txt
$ python tools/bolivia-datasets/extract_datasets.py
$ sha256sum src/common/seed/data/bolivia/*.json > /tmp/hashes_run2.txt
$ diff /tmp/hashes_run1.txt /tmp/hashes_run2.txt && echo "IDÉNTICO — determinista"
IDÉNTICO — determinista
```

## H1.S2 — Comprobable en CI

`--check` nuevo en `extract_datasets.py`: regenera y compara con `git diff --exit-code`.

**Sobre un JSON viejo (staged sin commitear el resultado nuevo) — falla:**

```
$ python tools/bolivia-datasets/extract_datasets.py --check
...
 4 files changed, 20976 insertions(+), 6350 deletions(-)
check: el árbol quedó sucio — el JSON versionado no está al día con el markdown de origen.
Correr `python tools/bolivia-datasets/extract_datasets.py` y commitear el resultado.
(exit 1)
```

**Sobre el árbol al día (después de commitear) — pasa:**

```
$ python tools/bolivia-datasets/extract_datasets.py --check
...
check: el árbol está al día.
(exit 0)
```

**Sin el repo del modelo presente — falla con mensaje claro, no traceback:**

```
$ python tools/bolivia-datasets/extract_datasets.py --check --fuente ./no-existe-esta-carpeta
No existe la carpeta de origen: no-existe-esta-carpeta
(exit 1)
```

`yarn seed:datasets` / `yarn seed:datasets:check` en `package.json`, verificado con `yarn`
(no sólo con `python` directo):

```
$ yarn seed:datasets:check
...
check: el árbol está al día.
```

## Regresión

`yarn test src/common/seed/bolivia-facilities.catalog.spec.ts src/common/seed/bolivia-fee-schedule.catalog.ts`
→ 1 suite / 6 tests, todos en verde (no hay aserciones de shape exacto que las columnas nuevas
rompan). `yarn test src/common/seed` completo → **19 suites / 170 tests, verde**. `yarn typecheck`
→ exit 0.

## No cubierto / ambigüedades registradas

- **Q-02** (arancel `ocrSospechoso`): sin resolver, no era alcance de este patch — viajan
  marcadas como siempre.
- **Q-03** (64 ocupaciones vs COB-2023): sin resolver, no tocado.
- Las filas de `naturaleza: RED_ASEGURADORA` (consultorios inferidos de la dirección de las
  redes) llevan `source_row` de la fila de la RED que las originó, no un archivo propio —está
  documentado en el código: el nombre es una lectura nuestra, no una columna.
- No se pudo instalar el «estándar de la casa» (skills+rules+hooks) en el worktree: no está
  commiteado en `origin/test` de ningún repo y no hay script de instalación en
  `AlovidaPromptManager/tools/`. Se citaron las skills por ruta directa en su lugar.

## Peldaño

**REGRESSION_VERIFIED** para H1 completo (H1.S1 y H1.S2): determinismo verificado por hash,
comprobación de CI verificada en los tres casos (sucio / al día / sin fuente), regresión de
los consumidores en verde.
