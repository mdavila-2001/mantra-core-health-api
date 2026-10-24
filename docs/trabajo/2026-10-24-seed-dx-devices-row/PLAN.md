# Plan — Equipos de diagnóstico: registros del resto del mundo (ROW)

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` · Predecesor: formato común de `justin/seed-dx-devices-master` (`tools/terminology-import/diagnostic-devices/README.md`, commit fc725c48)
- Resultado observable: la sesión de consolidación lee `tools/terminology-import/diagnostic-devices/row/out/manifest.json` y los `<source>-NNNN.ndjson.gz` de la rama de esta sesión, y cada fila trae su cita (fuente, id, URL, versión, fecha).
- Kill-test: `node tools/terminology-import/diagnostic-devices/row/check-out.mjs` falla si una fila carece de un campo obligatorio, si un `sha256` del manifiesto no coincide o si un `.gz` pesa 50 MB o más.

## Alcance
- IN: `tools/terminology-import/diagnostic-devices/row/**`, `docs/seed-research/diagnostic-devices-row.md`, esta carpeta `docs/trabajo/2026-10-24-seed-dx-devices-row/`.
- OUT: `src/**` (no hay dónde guardar fabricante/marca/modelo; no se crean tablas, ADR-0021), las carpetas `us/`, `eu/`, `master/` y el `README.md` común (los escribe otra sesión).
- Ambigüedades registradas:
  1. Rama. El brief pide `justin/seed-dx-devices-row`; el entorno de esta sesión obliga a `claude/inspiring-planck-xhpf4w`. Supuesto: se trabaja y empuja en `claude/inspiring-planck-xhpf4w` y se avisa a la sesión master. Confirmar con Justin.
  2. Red. El proxy del entorno rechaza (403) todos los registros oficiales. Supuesto: se usan **copias públicas en GitHub** de archivos oficiales, con la fuente oficial y el espejo (repo, commit, ruta, sha256) citados por fila. Lo que no tenga copia queda como hueco.
  3. Filtro «diagnóstico». El README común permite exportar todo y deja el recorte a `master/`. Supuesto: se exporta todo lo de cada fuente y se documenta en `SOURCES.md`.
  4. Datos en git. La orden del propietario (vía la sesión coordinadora) es subir el NDJSON comprimido en partes de menos de 50 MB. Los crudos no se suben: el script los clona en un commit fijo.

## H1 — Fuentes con copia pública normalizadas al formato común
**CA:** Dado un clon limpio, cuando se corren `fetch-mirrors.mjs` y `build.mjs`, entonces `out/` tiene un `.ndjson.gz` por fuente y un `manifest.json` cuyos conteos y sha256 coinciden con los archivos.
**DoD:** `node tools/terminology-import/diagnostic-devices/row/check-out.mjs` → `OK` con 0 errores.
**Estado:** TODO

### H1.S1 — Descarga reproducible
| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | `fetch-mirrors.mjs` clona cada espejo en su commit fijo fuera de git y verifica el sha256 del archivo usado | el sha256 calculado coincide con el fijado en `sources.mjs` | `node …/row/fetch-mirrors.mjs` → `sha256 OK` por fuente | TODO |

### H1.S2 — Normalizadores por fuente
| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S2.M1 | ANVISA registros (`anvisa-produtos`) | una fila por número de registro con los 18 campos | `node --test …/row/test/` → pass | TODO |
| H1.S2.M2 | ANVISA modelos (`anvisa-produtos-modelos`) | una fila por registro+modelo | `node --test …/row/test/` → pass | TODO |
| H1.S2.M3 | PMDA aprobaciones y certificaciones (`pmda-approvals`) | una fila por número+fecha+tipo de trámite | `node --test …/row/test/` → pass | TODO |
| H1.S2.M4 | Health Canada MDALL (`hc-mdall`) | una fila por identificador de dispositivo, con licencia y compañía | `node --test …/row/test/` → pass | TODO |
| H1.S2.M5 | TGA DAEN (`tga-daen`) | una fila por ARTG+nombre comercial | `node --test …/row/test/` → pass | TODO |

### H1.S3 — Salida y verificación
| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S3.M1 | `build.mjs` escribe `.gz` < 50 MB y `manifest.json` con `gaps` | sha256 y filas del manifiesto coinciden | `node …/row/check-out.mjs` → `OK` | TODO |
| H1.S3.M2 | `coverage.mjs` escribe el reporte de cobertura (por país, tipo, fabricantes, marcas, huecos) | el reporte existe y sus totales coinciden con el manifiesto | `node …/row/coverage.mjs` → totales iguales | TODO |

## H2 — Saturación (/loop)
**CA:** Dado el registro de pasadas, cuando dos pasadas seguidas aportan 0 filas nuevas tras deduplicar, entonces el loop se detiene y el registro lo muestra.
**DoD:** `docs/seed-research/diagnostic-devices-row.md` lista cada pasada con fuentes, filas nuevas y descartes.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Pasada 1: fuentes de H1 | registrada con conteos | `grep -c "Pasada 1" docs/seed-research/diagnostic-devices-row.md` → ≥1 | TODO |
| H2.S1.M2 | Pasadas siguientes: buscar más copias (NMPA, MFDS, TFDA, INVIMA, CDSCO, HSA, WHO PQ, …) | cada una registrada con conteos o descartes | ídem | TODO |

## H3 — Cierre
| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Gates del repo | salen 0 | `corepack yarn typecheck` y `corepack yarn lint` → exit 0 | TODO |
| H3.S1.M2 | PR contra `dev` sin mergear | PR abierto | URL del PR | TODO |
| H3.S1.M3 | `REPORTE.md` | existe con las secciones obligatorias | `ls docs/trabajo/2026-10-24-seed-dx-devices-row/REPORTE.md` | TODO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Un espejo no es copia fiel del archivo oficial | filas con datos alterados | se cita el espejo por fila; se comparan encabezados con el diccionario oficial cuando exista; se marca en `SOURCES.md` |
| Espejos viejos (Health Canada 2020, ANVISA modelos 2020) | estado desactualizado | `sourceVersion` lleva la fecha de corte del dato, no la de descarga |
| Repos espejo borrados | build no reproducible | commit y sha256 fijados; la salida normalizada queda en git |
