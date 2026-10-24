# Equipos de diagnóstico · resto del mundo (`row/`)

Registros sanitarios fuera de EE. UU. y Europa, normalizados al formato común
de `../README.md`. Fuentes, licencias y criterio: `SOURCES.md`. Cobertura:
`COVERAGE.md`. Registro de pasadas: `docs/seed-research/diagnostic-devices-row.md`.

```sh
D=tools/terminology-import/diagnostic-devices/row
node $D/fetch-mirrors.mjs                          # clona los espejos fijados y verifica sus hashes (red: solo GitHub)
node --max-old-space-size=12000 $D/build.mjs       # espejos → out/*.ndjson.gz + out/manifest.json (sin red, ~3 min)
node $D/build.mjs --only pmda-approvals            # una sola fuente; el resto del manifiesto se conserva
node --max-old-space-size=8192 $D/check-out.mjs    # verifica out/ contra el formato común (sale 1 si algo falla)
node --max-old-space-size=8192 $D/coverage.mjs     # escribe COVERAGE.md y out/coverage.json
node --test "$D/test/*.test.mjs"                   # normalizadores contra extractos reales
```

Los crudos quedan fuera de git en `../dx-devices-build/row/` (junto al repo),
o en `$DX_DEVICES_BUILD_DIR`. La salida es determinista: misma entrada, mismos
sha256.
