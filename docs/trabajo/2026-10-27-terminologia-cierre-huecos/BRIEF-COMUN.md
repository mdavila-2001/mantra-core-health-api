# Brief común de los carriles de terminología (2026-10-27)

Repo: `/home/user/mantra-core-health-api`, rama `claude/adoring-heisenberg-1rl29k`. Castellano rioplatense, como el repo.
Contexto: importadores en `tools/terminology-import/` cargan catálogos de terminología clínica a `terminology.*` (módulo 03). Esta sesión alcanza la mayoría de las fuentes abiertas (CIMA, RxNav, openFDA, Wikidata, EVS/NCI, Zenodo, NCBI, ClinicalTrials, GitHub vía npm/proxy…); `loinc.org` da 403. Pedido del usuario: cargar TODOS los términos que las fuentes abiertas permitan.

Leé primero (por rangos): `AGENTS.md`, `tools/terminology-import/README.md`, un dominio vecino ya terminado como modelo de estructura (p. ej. `nursing-care/` o `symptoms/`: README.md, SOURCES.md, `lib/`, `test/`, `data/`), y `PLAN.md` de este directorio.

## Reglas duras
1. Nada se inventa, redacta ni traduce: verbatim de la fuente. Procedencia por fila (fuente, versión/commit, URL, fecha, SHA-256, licencia). Cruces solo por código exacto o equivalencia que la fuente publica; nunca por parecido de nombre.
2. Licencias: leé la real de cada fuente y registrala en `SOURCES.md`. NO cargar contenido no comercial, SNOMED CT, CPT, MedDRA, DeCS, ATC/DDD de la OMS, DrugBank, KEGG ni nada con licencia no verificada. CC BY-SA/ODbL: solo si ya hay precedente en el repo; si no, "decisión del propietario". No crear cuentas ni eludir captchas.
3. Sin DDL ni cambios al repo del modelo (ADR-0021). Lo que falte va como propuesta en tu reporte.
4. Parsers escritos contra el archivo real descargado, con fixtures reales recortados en `test/`.
5. Escribí SOLO en tus rutas (directorio nuevo del dominio, su doc en `docs/seed-research/`, y `evidencia/<carril>/` de este directorio). No toques los demás carriles.
6. Crudos en `GLOSSARY_BUILD_DIR=/tmp/claude-0/-home-user-mantra-core-health-api/abfc3765-fecd-5e44-a7be-1fc725dff984/scratchpad/build-<carril>`, descarga en streaming, borrá cada crudo apenas lo normalizaste. Lo normalizado va a `data/` del dominio: gzip determinista, partes < 45 MB, `SHA256SUMS`. Si lo versionado supera ~300 MB, decí cuánto pesa y proponé el corte.
7. Recursos (4 CPU, 15 GB RAM, disco compartido y justo): `node --max-old-space-size` ≤ 2500, concurrencia ≤ 4, ≤ 2 pedidos/s por host, backoff, reanudable; sin procesos huérfanos.
8. Postgres 16 desechable propio: `initdb` con `/usr/lib/postgresql/16/bin`, **en `/var/tmp/pg-<carril>`** (el usuario postgres no entra al scratchpad), puerto indicado, DDL de `database/SQL/00_shared` + `03_terminology` (+ el parche `/home/user/mantra-core-health-model/SQL/patches/2026-10-25_v4250_terminology_relationship_evidence.sql` si guardás relaciones con evidencia; no modifiques el repo del modelo). Cargá, repetí (2.ª corrida = 0 filas nuevas), integridad (huérfanos, duplicados por (code system, code), nulos), salida pegada; después `pg_ctl stop` y borrá. No es la base del stack real.
9. Git: commits locales solo de tus rutas (`git add <rutas explícitas>`, nunca `-A`/`.`; reintentá ante `index.lock`), por pasada. NO hagas push. Mensajes `feat(terminologia): …`/`docs(terminologia): …` terminando con:
   `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`
   `Claude-Session: https://claude.ai/code/session_01DPFVbG8gwYLoiikBAfSguD`
10. Escalera de evidencia: sin "listo/hecho/funciona" sin evidencia pegada; peldaño por área y "No cubierto". Saturación: iterá hasta 0 nuevos por causa real (un cero por error de red no cuenta).
11. Entregables: importador + tests (`node --test` verde), corpus en `data/`, carga idempotente demostrada, `SOURCES.md`, doc en `docs/seed-research/<dominio>.md` (hueco → estado hoy → qué se cargó → conteos antes/después), y el reporte de tu carril en `evidencia/<carril>/REPORTE-<carril>.md` (si la herramienta lo rechaza, no lo eludas: ponelo en el mensaje final).
12. Respuesta final ≤ 300 palabras, sin volcados: antes/después de conteos, qué quedó cargado y probado, qué falta (red/licencia/curaduría), decisiones del propietario, hashes de commits, peldaño por área.
