# Reporte C10 — equipos de diagnóstico (relevo 2026-10-28)

- Fecha: 2026-10-28 · Plan: [PLAN-C10.md](./PLAN-C10.md) · Rama: `claude/adoring-heisenberg-1rl29k` (commits locales, sin push)
- Peldaño de evidencia: taxonomía `VERIFIED` contra Postgres 16 desechable (no la base del stack); catálogo fabricante→modelo `WRITTEN` (de 2026-10-24, no reconstruido); regiones `TESTED`.
- Avance: 4 HECHO / 15 microtareas = 27 % (M1, M2, M14, M15). M13 y M3–M12 en A medias.

## Completado
| ID | Qué | Comando | Resultado |
|---|---|---|---|
| M1 | Re-sondeo de 47 hosts | `node probe-sources.mjs M1-sondeo-2026-10-28.tsv` | igual que el 27/10 salvo `data.go.kr` (200 → reset) |
| M2 | EMDN oficial v2026 en la taxonomía | `build.mjs --taxonomy-only --eu-dir eu/out` | 8 516 términos oficiales |
| M14 | Carga idempotente | `load-taxonomy.mjs` ×2 con `DB_*` → 55440/c10 | corrida 1: emdn 8 527 conceptos, fda-product-code 7 091, value set 5 645; corrida 2: todo 0 (`M14-carga-corrida-{1,2}.txt`); `M14-integridad.txt`: 0 duplicados, 0 huérfanos, 0 nulos, 0 code systems GMDN/pt/ja/in |
| M15 | `SOURCES.md` (política de carga, §4 sin falsos 403, §6), `docs/seed-research/diagnostic-devices-master.md` (pasada 8), este reporte | `git diff` | ver commit |

## A medias
### M13 — rebuild de `master/`
- Qué anda: `build.mjs --taxonomy-only` (nuevo) reconstruye taxonomía y cruces en 2 m 25 s y <600 MB; dos corridas, mismo SHA-256 (`f7ae0325…` nodos, `cb12f380…` cruces). 44 726 nodos, 39 420 cruces.
- Qué no anda: el build completo muere por heap a 2 500 MB (`FATAL ERROR: Ineffective mark-compacts`, 9 min 27 s, pasada B/C: `keep` retiene todas las filas de diagnóstico de 5,78 M). `master/build.mjs` no estaba cortado (555 líneas, sintaxis OK): lo que fallaba era la memoria.
- Qué falta: procesar por fuente / volcar `keep` a disco, o autorización explícita de más heap (el README pide 8 000).
- Dónde quedó: `master/out/manufacturers|models|review|industry` siguen siendo de 2026-10-24; `manifest.json → partialRebuild` lo declara.

### M3–M12 — regiones us/eu/row
- Qué anda: manifiestos y 35 archivos verifican SHA-256; `node --test` us 24/24, eu 36/36, row 19/19, master 24/24; `gzip -t` OK.
- Qué no anda: los `gaps` de `row/out/manifest.json` dicen «403 del proxy» para hosts que hoy dan 200 (TGA, NMPA, HSA, MDA, INVIMA, WHO PQ…); no los reescribí ni los re-descargué.
- Qué falta: por host, buscar el archivo/API de datos real (el 200 es solo la portada); TGA ARTG es un buscador sin descarga masiva; swissdamed/MHRA siguen sin cargar por términos/GMDN.
- Dónde quedó: sin tocar.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| fda-product-code desde export oficial openFDA (7 096) en vez de copia `ej86` | TODO | cambio en `lib/taxonomy.mjs` |
| `eu` `/udi` completo (550 de ~5 650 páginas) | TODO | `fetch-eudamed.mjs` reanudable |

## Evidencia
`M1-sondeo-2026-10-28.tsv`, `M14-carga-corrida-1.txt`, `M14-carga-corrida-2.txt`, `M14-integridad.{sql,txt}`.

## No cubierto
Carga de fabricantes/marcas/modelos (no hay tablas; ADR-0021). Reproducibilidad del catálogo completo. Ninguna prueba contra la base real.

## Desvíos del plan
Cambié `load-taxonomy.mjs`: política de carga por nomenclatura (`LOAD_POLICY`), guard contra apuntar a la base por defecto sin `DB_NAME`, y lote de importación solo si insertó algo (antes la 2.ª corrida dejaba una fila nueva). `build.mjs` ganó `--out` y `--taxonomy-only`.

## node_modules
`diagnostic-devices/node_modules` no existe en este checkout. Su origen está documentado: `SOURCES.md` §5 (instalación local de yarn/`xlsx` para validar) y `bootstrap-pg-c10.mjs`, que importaba `pg` desde ahí. La raíz ya tiene `pg`; el bootstrap ahora lo toma de la raíz. Nada para commitear.

## Riesgos residuales
Los `fda-product-code` cargados vienen de un espejo (`ej86`, 2026-08-28), con fuente oficial disponible.

## Decisiones y ambigüedades (a quién confirmar: propietario)
1. GMDN (`gmdn`, `gmdn-pt`, 39 420 cruces): licenciado, no se carga. Supuesto: sin membresía de la GMDN Agency.
2. ANVISA: licencia no verificable (dados.gov.br da 401); además nombres en portugués sin `LANG_PT`. ¿Se acepta el decreto 8.777/2016 como licencia abierta y se agrega `LANG_PT`?
3. JMDN: PMDA es PDL 1.0 (verificado), pero falta `LANG_JA` y la fuente es un espejo.
4. CDSCO, CND (IODL 2.0 sin leer), TFDA, INVIMA: licencia no leída / idioma sin concepto.
5. Propuesta (sin DDL): agregar `LANG_PT`, `LANG_JA`, `LANG_IT` a `concepts.ts`.
6. Peso versionado de `diagnostic-devices/`: 298 MB (row 172, us 90, master 20, eu 14). Corte propuesto: no versionar `row/out/hc-mdall-*` (~93 MB) y `anvisa-produtos-modelos`; regenerar desde la fuente.
