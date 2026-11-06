# Reporte — Equipos de diagnóstico FDA: pasada 12 (export oficial de noviembre)

- Fecha: 2026-11-06 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `justin/seed-dx-devices-us-pass12`
- Peldaño de evidencia alcanzado: `TESTED` en el importador: 27 tests dirigidos y 176 de regresión de `tools/terminology-import` en verde, más el dry-run del cargador. `RUNS` en el build. No hay `VERIFIED`: esta pasada no cargó la base.
- Avance: 4 microtareas HECHO / 5 = **80 %** (H1.S1.M4 queda A MEDIAS por el lint de `dev`).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Descarga del export oficial de openFDA: `device/udi` 2026-11-03 (52 partes); `510k`, `pma`, `classification` y `registrationlisting` 2026-11-02 | `NODE_USE_ENV_PROXY=1 node tools/terminology-import/diagnostic-devices/us/fetch-official.mjs` | `exit=0`, 57 archivos con sha256 |
| H1.S1.M2 | Reconstrucción del corpus | `node --max-old-space-size=12288 tools/terminology-import/diagnostic-devices/us/build.mjs` | `exit=0` en 10 min 29 s; 1 099 433 filas; `gaps: []`; la parte más grande pesa 12,8 MB |
| H1.S1.M3 | Pasada 12 en la bitácora y cobertura regenerada | `node tools/terminology-import/diagnostic-devices/us/coverage-report.mjs` | `exit=0` |
| H1.S1.M5 | PR contra `dev` | — | ver la descripción del PR |

## A medias
### H1.S1.M4 — Gates
- Qué anda:
  - tests dirigidos: 27/27;
  - regresión de `tools/terminology-import`: 176 en verde, 0 fallos;
  - `yarn typecheck`: `exit=0`;
  - `yarn docs:links`: sin enlaces rotos;
  - dry-run del cargador: `exit=0`, con versión `openFDA device/classification export 2026-11-02`.
- Qué no anda: `yarn lint` da `exit=1` con 129 errores.
- Qué falta exactamente: nada en esta rama. Todos los errores están en `src/**/*.ts` (`surveys`, `profiles`, `iam`, `delegated_access`…), y esta rama no toca ningún archivo de `src/`: `git diff --name-only origin/dev` sólo lista `tools/terminology-import/diagnostic-devices/us/out/**` y `docs/`. Es el estado actual de `dev` y le toca a quien es dueño de esos módulos.
- Dónde quedó: salida literal en `evidencia/gates.txt`.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| Lint de `dev` en `src/` | BLOQUEADO (fuera de alcance) | Lo arreglan los dueños de esos módulos |
| Catálogo fabricante → marca → modelo en el modelo de datos | BLOQUEADO | Decisión del repo del modelo (propuesta de la pasada 1, PR #695) |

## Evidencia
```
build.mjs → deltaVsPrevious: records 1 974 (fda-rl 1 937 · fda-510k 26 · fda-pma 11), manufacturers 46, brands 832, udiDi 0
rows 1 099 433: fda-gudid 635 097 · fda-rl 362 255 · fda-510k 71 981 · fda-recall 13 692 · fda-maude 12 930 · fda-pma 2 755 · cdc-livd 483 · fda-denovo 240
GUDID: 635 097 UDI-DI en la pasada 11 y 635 097 ahora; 0 altas y 0 bajas (comm sobre los sourceRecordId)
node --test us/test → 27 pass · 0 fail · node --test terminology-import/test → 176 pass · 0 fail
yarn typecheck → exit=0 · yarn docs:links → sin enlaces rotos · yarn lint → exit=1 (129 errores en src/, ajenos)
```
Literal completo en `evidencia/`.

## No cubierto
- Esta pasada no corrió la carga real a PostgreSQL: el código del cargador no cambió desde #712, donde sí se probó dos veces.
- Para la regresión hubo que hacer `yarn install`, porque `dev` agregó `pg-copy-streams`. `xlsx` vino desde npm porque `cdn.sheetjs.com` está bloqueado. Fue sólo local: `package.json` y `yarn.lock` quedaron restaurados con `git checkout`.
- `yarn build` y `yarn test` no se corrieron: el cambio no toca TypeScript.

## Desvíos del plan
ninguno

## Riesgos residuales
- 1 057 registros de la pasada 11 ya no están en el export de noviembre, así que salen del NDJSON:
  - 1 051 son listados de Registration & Listing dados de baja;
  - 6 son PMA cuyo id cambió, porque ahora su primer registro por nombre comercial es otro.

  Quien ya los haya consolidado (`master`) los va a ver desaparecer.
- El export de UDI de openFDA del 2026-11-03 trae el mismo conjunto de UDI-DI de alcance diagnóstico que el del 2026-10-21. Sólo cambia la versión de cada fila.

## Decisiones y ambigüedades
- No se bajó el AccessGUDID delimitado: `build.mjs` le da prioridad a openFDA `device/udi`, que es el mismo GUDID.
- Los espejos se reusan tal cual, fijados por commit. Ninguno cambió de versión.
