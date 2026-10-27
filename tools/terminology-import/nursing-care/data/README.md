# Datos normalizados de enfermería (versionados)

Lo que carga `load-nursing-care.mjs`, para que no dependa del contenedor donde se generó
(orden del propietario del 2026-10-24: «que terminen su trabajo y lo lleven todo a la nube»).
Lo genera `pack-data.mjs` (los seis primeros conjuntos) y `pack-omaha.mjs` (Omaha, LOINC y CMDIC; ejecutar **después** de `pack-data.mjs`, que regenera el manifiesto) a partir de `glossary-data-build/nursing-care/`; **no se edita a mano**.

| Archivo | Contenido |
|---|---|
| `openehr-ckm.part-NNN.ndjson.gz` | 8 037 filas: arquetipos, nodos y respuestas de openEHR CKM (`openEHR/CKM-mirror@c3fdc43d`) |
| `es-msssi-cmdic-13606.part-NNN.ndjson.gz` | 617 filas: arquetipos ISO 13606 del CMDIC (`openEHR/adl-archetypes@093c77ea`) |
| `nursing-terminology-registry.part-NNN.ndjson.gz` | 12 filas: terminologías ANA desde `hl7.terminology@7.0.1` |
| `omaha-system.part-NNN.ndjson.gz` | 320 filas: Omaha System (sitio oficial + suplemento del MOSUG), generado por `build-omaha.mjs` y copiado con `pack-omaha.mjs` |
| `omaha-meta`, `omaha-coverage`, `omaha-crosscheck` | URL, SHA-256 y fecha de cada archivo bajado; cobertura; contraste con el formulario de Estambul |
| `loinc-links.part-NNN.ndjson.gz`, `loinc-links-report`, `loinc-omaha-terms` | los 47 términos LOINC enlazados por los arquetipos (resueltos en el subconjunto público del NLM), el reporte y los 403 términos `[OMAHA]` de LOINC |
| `cmdic-license-verification` | cláusula de reutilización del Ministerio de Sanidad leída el 2026-10-27 y comparación del `.zip` oficial con el corpus |
| `coverage.json.gz` | reporte de cobertura del *build* |
| `link-check.json.gz` | estado de las ramas hermanas |
| `sources-meta.json.gz` | commits, fechas, URL, integridad sha512 y SHA-256 del tarball npm (sin rutas locales) |
| `MANIFEST.json` | por parte: filas, bytes y SHA-256 del texto y del `.gz`; el cargador lo verifica al leer |

Partes de a lo sumo 40 MB sin comprimir (los `.gz` quedan muy por debajo de 50 MB). El gzip es
determinista: con las mismas entradas, `pack-data.mjs` produce los mismos bytes.

**Crudos no versionados.** Se reproducen con `fetch-sources.mjs` desde commits fijos de GitHub y
un tarball npm verificado por integridad (ver `sources-meta.json.gz`). Los crudos de CKM no se
suben además porque contienen los ítems con copyright de terceros (Braden, Waterlow…) que el
importador deja afuera.

**Licencias.** Las filas de openEHR CKM son CC-BY-SA (atribución por fila en `provenance`); las
del CMDIC son reutilizables con tres condiciones (Aviso legal del Ministerio, leído el
2026-10-27; las filas conservan el texto de la fecha de armado); las de Omaha son de dominio público con cita obligatoria
del libro de 2005; el registro sale de un paquete CC0. Detalle en `../SOURCES.md`.

```sh
node tools/terminology-import/nursing-care/load-nursing-care.mjs --from-repo-data            # dry-run con estos datos
node tools/terminology-import/nursing-care/load-nursing-care.mjs --apply --from-repo-data    # carga
```
