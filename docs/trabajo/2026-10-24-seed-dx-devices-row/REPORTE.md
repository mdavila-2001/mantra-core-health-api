# Reporte — Equipos de diagnóstico: registros del resto del mundo (ROW)

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `claude/inspiring-planck-xhpf4w` (el brief pedía `justin/seed-dx-devices-row`; ver Desvíos)
- Peldaño de evidencia alcanzado: `TESTED` para los normalizadores (tests dirigidos en verde) y `VERIFIED` para la salida (`check-out.mjs` recorre las 3 534 775 filas con 0 errores y el build re-ejecutado da los mismos sha256). Los gates del repo (`typecheck`, `lint`) no se pudieron correr: `BLOQUEADO`.
- Avance: 13 / 14 microtareas `HECHO` (92,9 %); 1 `BLOQUEADO` (H3.S1.M1).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Los 6 espejos se clonan en su commit fijo y se verifican por sha256 o árbol git | `node tools/terminology-import/diagnostic-devices/row/fetch-mirrors.mjs` | `sha256 OK` / `tree OK` en los 7 pines |
| H1.S2.M1 | ANVISA registros → `anvisa-produtos` | `node --test "tools/terminology-import/diagnostic-devices/row/test/*.test.mjs"` | `# pass 12 · # fail 0` |
| H1.S2.M2 | ANVISA modelos → `anvisa-produtos-modelos` | ídem | ídem |
| H1.S2.M3 | PMDA aprobaciones y certificaciones → `pmda-approvals` | ídem | ídem |
| H1.S2.M4 | Health Canada MDALL → `hc-mdall` | ídem | ídem |
| H1.S2.M5 | TGA DAEN → `tga-daen` | ídem | ídem |
| H1.S2.M6 | CDSCO licencias de importación → `cdsco-import-licences` | ídem | ídem |
| H1.S3.M1 | `out/*.ndjson.gz` (< 50 MB) + `manifest.json` con `gaps` | `node --max-old-space-size=8192 tools/terminology-import/diagnostic-devices/row/check-out.mjs` | `OK: 3534775 filas en 7 archivos, 0 errores` |
| H1.S3.M2 | `COVERAGE.md` y `out/coverage.json` | `node --max-old-space-size=8192 tools/terminology-import/diagnostic-devices/row/coverage.mjs` | `3.534.775 filas, 26.968 fabricantes, 240.458 fabricante+marca` |
| H2.S1.M1 | Pasada 1 registrada (5 fuentes, 3 508 983 filas) | `grep -c "## Pasada" docs/seed-research/diagnostic-devices-row.md` | 5 (pasadas 0–4) |
| H2.S1.M2 | Pasadas 2–4 registradas; 3 y 4 aportan 0 → loop detenido | ídem | ídem |
| H3.S1.M2 | PR contra `dev`, sin mergear | ver la descripción del PR | abierto |
| H3.S1.M3 | Este reporte | `ls docs/trabajo/2026-10-24-seed-dx-devices-row/REPORTE.md` | existe |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H3.S1.M1 | BLOQUEADO | `corepack` no puede bajar Yarn 4.14.1: `repo.yarnpkg.com` da 403 en el proxy (`evidencia/typecheck.txt`, `evidencia/lint.txt`). Se destraba con red hacia `repo.yarnpkg.com` (y `cdn.sheetjs.com` para la dependencia `xlsx`) o corriendo los gates en local/CI. Este cambio no toca archivos `.ts` (`evidencia/alcance-ts.txt`: 0), que son lo único que cubren `typecheck` y `lint`. |

## Evidencia

```
$ node --test "tools/terminology-import/diagnostic-devices/row/test/*.test.mjs"
# tests 12
# pass 12
# fail 0
exit 0

$ node --max-old-space-size=8192 tools/terminology-import/diagnostic-devices/row/check-out.mjs
  anvisa-produtos.ndjson.gz: 93770 filas, 9.0 MB
  anvisa-produtos-modelos.ndjson.gz: 1027762 filas, 45.1 MB
  pmda-approvals.ndjson.gz: 35298 filas, 2.8 MB
  hc-mdall-0001.ndjson.gz: 1853420 filas, 47.2 MB
  hc-mdall-0002.ndjson.gz: 479816 filas, 13.5 MB
  tga-daen.ndjson.gz: 18917 filas, 1.1 MB
  cdsco-import-licences.ndjson.gz: 25792 filas, 7.4 MB
OK: 3534775 filas en 7 archivos, 0 errores

$ node build.mjs (re-ejecución) ; diff sha256 antes/después
IDENTICOS: misma entrada, mismos sha256 en los 7 archivos

$ corepack yarn typecheck
Error: Error when performing the request to https://repo.yarnpkg.com/4.14.1/packages/yarnpkg-cli/bin/yarn.js
      cause: RequestAbortedError [AbortError]: Proxy response (403) !== 200 when HTTP Tunneling
exit 1
```

Salidas completas en `evidencia/`. El kill-test del plan detectó una falla
real durante el trabajo (`anvisa-produtos.ndjson.gz no está en el manifiesto`,
tras una corrida cortada) y se corrigió regenerando la fuente.

## No cubierto
- No se comparó ningún espejo contra el archivo oficial: los portales dan 403. La fidelidad se apoya en encabezados idénticos a los oficiales, conteos coherentes y en que no se tocó ningún valor.
- La idempotencia vale para la misma `retrieved.json`: un clon nuevo de los espejos cambia `retrievedAt` y, con eso, los sha256 (los datos no cambian).
- El importador a base (`terminology.*`) no se escribió: no hay tablas para fabricante, marca, modelo ni registro (ver «Decisiones»).
- La partición de los textos de modelos (`Model Numbers` de CDSCO, `DS_MODELO` de ANVISA) en modelos individuales no se hizo: se dejan verbatim.

## Desvíos del plan
- Rama: el entorno exige empujar a `claude/inspiring-planck-xhpf4w`; se avisó a la sesión master, que lee de esa rama.
- Se agregó H1.S2.M6 (CDSCO), encontrada en la pasada 2.
- Datos en git: se suben los `.ndjson.gz` (≈ 126 MB en 7 archivos, todos < 50 MB) por la orden del propietario transmitida por la sesión coordinadora; el brief original decía dejarlos fuera.

## Riesgos residuales
- Espejos de terceros: si el autor del espejo alteró un valor, la fila lo hereda. Cada fila cita espejo, commit y hash para poder auditarla y reemplazarla.
- Datos viejos: `hc-mdall` es de 2020-02-07 y `anvisa-produtos-modelos` de 2020-12-25; faltan las licencias y modelos posteriores.
- `tga-daen` no es el ARTG: solo trae dispositivos con eventos adversos notificados, casi todos implantables.
- Licencias de reutilización marcadas **por verificar** en `SOURCES.md` (ANVISA, PMDA, Health Canada, TGA, CDSCO).
- `out/` no está recortado a «diagnóstico»: el recorte depende de la taxonomía de `master/`.

## Decisiones y ambigüedades
- **Red** (supuesto, confirmar con Justin): con los portales bloqueados se usaron copias públicas en GitHub, fijadas por commit y hash, con la cita del espejo por fila. Se descartaron los resúmenes de WebFetch (pasan por un modelo) y las extracciones de PDF de terceros.
- **Taiwán**: la release `data-20261023` de `masalu0105-gif/taiwan-laboratory-mcp` trae las 104 891 licencias de TFDA, pero bajar assets de releases exige adjuntar el repo con credenciales y esa acción fue denegada. Queda como hueco con la ubicación exacta; se destraba si Justin autoriza ese acceso o habilita la red a `data.gov.tw`.
- **Texto verbatim**: solo se recortan los extremos; se conservan espacios dobles y el espacio de ancho completo U+3000 del japonés.
- **Fabricante vs. titular**: ANVISA publica el CNPJ del titular (pasa a `manufacturerRegistryId` solo si fabricante = titular por texto exacto); PMDA publica al titular japonés (sin país); CDSCO, el sitio de fabricación legal.

### Qué requiere cambiar el repo del modelo (`mantra-core-technologies/mantra-core-health-model`)
Hoy solo existe `diagnostic_units.diagnostic_equipment` (equipo instalado, con
`manufacturer` y `model` en texto libre y el tipo como `catalog_concepts`). Para
cargar este corpus hace falta, como mínimo (la propuesta consolidada de las
cuatro regiones la arma `justin/seed-dx-devices-master`):

1. `device_catalog.manufacturers` (razón social normalizada + original, país) y `manufacturer_identifiers` (esquema `cnpj`, `jp-corporate-number`, `hc-company`, `srn`, `fei`…, valor).
2. `device_catalog.device_models` (fabricante, marca, modelo, tipo como FK a `terminology.catalog_concepts`).
3. `device_catalog.regulatory_authorizations` (modelo, autoridad, número, clase de riesgo, fecha, estado, y la cita: `source`, `sourceRecordId`, `sourceUrl`, `sourceVersion`, `retrievedAt`).
4. `device_catalog.device_identifiers` (UDI-DI / JAN / GTIN por modelo).
5. `code_systems` en `terminology` para cada nomenclatura (`jmdn`, `br:anvisa-nome-tecnico`, `gmdn-pt`, `in:cdsco-device-name`).
6. En `diagnostic_units.diagnostic_equipment`, una FK opcional `device_model_id` que conviva con el texto libre actual.
