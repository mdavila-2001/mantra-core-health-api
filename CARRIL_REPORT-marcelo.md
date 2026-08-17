# CARRIL_REPORT-marcelo · semana del 17 al 21 de agosto 2026

Carril **C-C** (`carriles-semana-2026-08-17/MARCELO.md`): higiene de infraestructura +
receta con vademécum + B-6 trayectoria.

Rama de esta fase: `marcelo/higiene-ramas-y-canonica` (base `origin/dev` @ `59bf51e6`).
Verificación local (regla 1 del README de carriles: el CI no es red esta semana).

---

## Fase 0 · Higiene — auditoría de ramas y reconciliación `master`↔`dev`

### Veredicto: **NO SE BORRÓ NINGUNA RAMA.** El diagnóstico de partida era incorrecto

`MARCELO.md` daba por sentado que el contenido de las 3 ramas «zombis» ya había llegado a
`dev` por otro camino, y ordenaba borrarlas. **La auditoría lo refuta: las 3 tienen código
fuente que `dev` no tiene.** Borrarlas habría destruido ~2 400 líneas de trabajo, dos de
ellas justo en lo que otros dos carriles están construyendo esta semana.

Método (el del propio archivo: diff de **árboles**, no de historial), con el filtro que hace
la pregunta correcta — archivos de `src/` donde la rama agrega líneas y `dev` no borra
ninguna, es decir **donde la versión de `dev` es un subconjunto estricto de la de la rama**:

```console
$ git diff --numstat origin/dev origin/<rama> -- src/ | awk '$2==0 && $1>0'
```

| Rama | commits que `dev` no tiene | archivos nuevos (A) | **código único en `src/`** | ¿borrable? |
|---|---|---|---|---|
| `integracion/carriles-10-11-14-17` | 10 | 0 | **4 archivos · 161 líneas** | **NO** |
| `fix/alovida-c11-diagnostics_lab_imaging` | 1 | 0 | **6 archivos · 488 líneas** | **NO** |
| `fix/alovida-c18-doctor_accounting_notifications` | 17 | 6 | **24 archivos · 1 802 líneas** | **NO** |
| `origin/master` | 11 | 0 | 4 archivos · 161 líneas (= los de `integracion`) | n/a |

> Por qué el diagnóstico anterior falló: el diff «directo» está dominado por artefactos
> **generados** (`openapi/openapi.json` y `.yaml` solos son ±24 900 y ±16 900 líneas) y por
> los 179 archivos que `dev` agregó después (`pharma_lab`, `surveys`, `common/verification`).
> Con ese ruido, las ramas parecen «atrás» — y lo están en volumen, pero no en contenido.
> El conteo que importa es el de arriba, que aísla lo que solo existe en la rama.

### Lo que hay en cada rama, y de quién es

**1. `fix/alovida-c11` — 2 endpoints de `scheduling` que `dev` no tiene** (UC-41-18 y
UC-41-19), con service, DTOs, transición de estado y **150 líneas de spec**:

```
POST /scheduling/bookings/:id/request-info      (pedir documentación/orden/preparación)
POST /scheduling/bookings/:id/propose-schedule  (contraproponer horario, sin liberar el cupo)
```

Confirmado ausente en `dev` (el único `request-info` de `dev` es de `pharma_lab`, otro caso
de uso: visitas de visitadores médicos):

```console
$ git grep -n -E "request-info|propose-schedule|proposeSchedule" origin/dev -- src/
origin/dev:src/modules/pharma_lab/controllers/visit-requests.controller.ts:115:  @Post(':visitRequestId/request-info')
origin/dev:src/modules/pharma_lab/services/visit-requests.service.ts:304:  async requestInfo(
```

→ **Territorio de Justin** (`scheduling`). No lo integro: aviso, no acción.

**2. `integracion/carriles-10-11-14-17` y `master` — `GET /scheduling/bookings/:id/decisions`**
(historial de decisiones de la solicitud) + su DTO y transición. También ausente en `dev`.
→ **Territorio de Justin.**

**3. `fix/alovida-c18` — 1 802 líneas, y 386 de ellas son EL carril de Pablo de esta semana.**
El aviso más urgente de esta auditoría. La rama tiene implementado en `messaging`:

```
GET  /messaging/notifications/in-app        ← la bandeja in-app: el hueco de PABLO.md
GET  /messaging/notifications/channels
GET  /messaging/notifications/preferences
+ notifications.service.ts (136) · notifications.repository.ts (87) · spec (163)
  (listMyInApp · markInAppRead · getMyPreferences · setMyPreference)
```

`dev` hoy tiene la escritura (`POST notifications/requests`, `POST notifications/in-app/:id/read`)
y **no tiene el `GET` de la bandeja** — exactamente el hueco que `PABLO.md` describe como
«12 endpoints de escritura y una sola lectura». Además trae `accounting/practitioner`
(3 rutas, 590 líneas: consultas pagadas, ingreso por consulta, asientos) y el autoservicio
de `practice` para vincularse a organizaciones (`self-request-role-assignment`, 424 líneas).

→ **Territorio de Pablo** (`messaging`) y sin dueño esta semana (`accounting`, `practice`).

### Reconciliación `master`↔`dev`: **`dev` es canónica** (declarado en `ESTADO-Y-PENDIENTES.md`)

Los 11 commits exclusivos de `master` son los 10 de `integracion/carriles-10-11-14-17` más el
merge del PR #100. Revisados uno por uno, `master` **está detrás y además revierte
correcciones deliberadas de `dev`**:

- `src/common/seed/terminology-seed.service.ts`: `master` reintroduce
  `ensureRowVersionDefaults()`, el `ALTER TABLE` en cada arranque que se eliminó a propósito
  cuando `gen_ddl.py` pasó a emitir `row_version DEFAULT 1` en el DDL (727/727 columnas). Es
  la dirección de cambio prohibida por ADR-0021. También revierte el `fields: ['id']` que
  evita hidratar ~2 800 conceptos en cada boot.
- `src/modules/profiles/read/practitioner-names.ts`: `master` vuelve al salto por
  `person_profiles` suponiendo PK compartida con `persons` — medido contra la base, **0 de 14
  filas la comparten**, así que no resolvía ni un nombre. `dev` tiene el fix.
- `src/common/seed/seed-bootstrap.service.ts`: `dev` tiene 225 líneas que `master` no.

**Nada que rescatar de `master` salvo el endpoint de `scheduling`**, que es de Justin.
Conclusión operativa: `dev` es la rama canónica; `master` no se usa como punto de partida de
ningún carril (fue el origen de la ambigüedad que costó código el 14/08).

### Estado de las ramas al cierre de la fase

Las 3 quedan **vivas y anotadas**, no borradas. El alcance de limpieza de la semana era esas
3; el repo tiene ~48 ramas remotas más que son residuo (`fix/alovida-c*` ya mergeadas,
`carril-*`, `carril-r2-*`, `recover/*`, `j-*`) y el barrido completo debe hacerse con **este**
método, no con el diff directo.

### GitHub Actions

Fuera del alcance por decisión explícita. La semana opera con verificación local (regla 1).

---

## Hallazgo que define la fase 2 (B-6): falta SOLO el esquema

Todo el código de `practitioner_affiliations` **ya está en `dev`**: entidad, repositorio,
DTOs, conceptos (`AFFILIATION_ACTIVE`, `AFFILIATION_RETRACTED`,
`AFFILIATION_TYPE_EMPLOYMENT` con UUIDv5 estable) y los dos endpoints
(`GET`/`POST /profiles/practitioners/me/affiliations`,
`profiles-practitioners.controller.ts:212` y `:223`). Lo que falta es la tabla, y por eso
esos dos endpoints responden **500** y la pestaña Trayectoria no tiene quién la sirva
(bloqueador ya escrito al inicio de `ESTADO-Y-PENDIENTES.md`).

Además `dev` arrastra `tools/redesa/2026-08-15_c05_practitioner_affiliations.sql`: un
`CREATE TABLE` **fuera de `SQL/`**, con su propia nota reconociendo la deuda. Es el síntoma
exacto que ADR-0021 prohíbe. La fase 2 lo resuelve por el camino canónico
(`.puml` → `gen_ddl.py` → `SQL/patches/`) y ese archivo suelto deja de tener razón de existir.

---

---

## Fase 2 · B-6 Trayectoria — **adelantada al lunes** (PR API #115 · vault #38)

### Por qué se adelantó del jueves

Porque su deuda tenía **roto `rebuild_stack.py` para todo el equipo desde el 15/08**, y ese
es el paso 4 del prerequisito del lunes. `dev` arrastraba
`tools/redesa/2026-08-15_c05_practitioner_affiliations.sql`, un `CREATE TABLE` fuera de
`SQL/`, y el guardián lo corta en el paso 0/4:

```console
$ python salud-db/rebuild_stack.py --yes
══ 0/4 · fuentes de DDL ══
  [XX] `…\tools\redesa\2026-08-15_c05_practitioner_affiliations.sql` declara CREATE TABLE
       fuera de `SQL/` y `NoSQL/`
Hay DDL fuera de SQL/: reconstruir ahora materializaría una fuente que no es el modelo.
```

Dejarlo para el jueves costaba tres días de gente sin poder reconstruir su base. Tras el
cambio:

```console
$ python salud-db/check_ddl_sources.py
Fuentes de DDL OK: `SQL/` y `NoSQL/` de la raíz son las únicas.
```

### Qué se tocó, capa por capa

De `practitioner_affiliations` **ya estaba todo el código en `dev`** (entidad, repositorio,
DTOs, conceptos y los dos endpoints en `profiles-practitioners.controller.ts:212` y `:223`):
faltaba sólo la tabla. Se promovió por el camino de ADR-0021.

| Capa | Cambio |
|---|---|
| `.puml` | La entidad, la relación con `health_practitioner_profiles` y su `<<INDEX_SET>>` en `diagram_05_profiles.puml` |
| Vault `SALUD/FK/` | **6 notas**. La del padre era imprescindible: el subtipo CTI comparte PK y el destino es `health_practitioner_profiles(profile_id)`, no `id`, así que la convención por nombre no alcanzaba y la FK salía «sin destino canónico». Las otras 5 evitan que se emitan como «(inferida)» |
| Vault `SALUD/Entidades/` | `E profiles.idxset_practitioner_affiliations.md` — el catálogo del ORM lee los índices **del vault**, no del `.puml` |
| `SQL/` | `gen_ddl.py 05` → 19 tablas · 24 FK intra · 99 diferidas · 131 índices · **0 inferidas**. Bases vivas: `SQL/patches/2026-08-17_v410_profiles_practitioner_affiliations.sql` |
| Repo API | **Sólo** el borrado del `.sql` suelto + el catálogo declarativo. Regenerar el módulo 05 entero (`gen_entities.py 05` + prettier) reproduce las **19 entidades byte a byte**, incluida la que estaba escrita a mano |

### Verificación

```
$ python salud-db/rebuild_stack.py --yes
  [OK] tablas BD == SQL/       esperado 1185  observado 1185
  [OK] FKs BD == SQL/          esperado 6669  observado 6669
  [OK] huérfanos de la carga   esperado    0  observado    0
  … 18/18 en [OK]
  (informativo) índices: 9130 · filas insertadas: 24565 · avisos de carga: 7
VEREDICTO: PASS
```

Deltas exactos contra los conteos canónicos: **+1 tabla** (1184→1185) · **+6 FKs**
(6663→6669) · **+8 índices** (9122→9130 = 6 IX + 1 UNIQUE + PK).

Ciclo real contra la API viva, con una profesional registrada por
`POST /iam/auth/register-practitioner`:

```
GET  /profiles/practitioners/me/affiliations  → 200  {"items":[],"count":0}   (antes: 500)
POST /profiles/practitioners/me/affiliations  → 201
GET  /profiles/practitioners/me/affiliations  → 200  1 ítem
POST idéntico (misma institución, cargo e inicio) → 409 CONFLICT
```

El 409 prueba `uq_practitioner_affiliation_same`; la fila quedó con `row_version=1` por el
DEFAULT del DDL. Repo: `yarn typecheck` 0 · `yarn lint --max-warnings=0` 0 ·
`yarn test src/modules/profiles/` **6 suites / 78 pruebas**.

### Deriva ajena que arrastró `orm:catalog`

El catálogo declarativo no se regeneraba desde hacía varias entregas. Va incluida —editar a
mano un artefacto generado es peor— y se detalla en el PR: `pharma_lab` y `surveys` entran al
registro de schemas (módulo `null`, mismo patrón que `audio_assets` antes de promoverse),
`audit` pasa de 123 a 131 tablas, y `diagnostic_units` corrige un índice compuesto viejo por
los dos únicos que declaran el `.puml`, el vault y `SQL/23_diagnostic_units/04_indexes.sql`.

---

## Fase 1 · Receta con vademécum (PR API #116 · front #126)

### El «rojo preexistente» no era lo que decía el registro

El registro lo daba como «falta un patch de seed». Aplicado sobre una base recién
reconstruida, el seed del vademécum falla así:

```
error: insert or update on table "concept_designations" violates foreign key
constraint "fk_concept_designations_language_concept_id"
```

El dataset referencia conceptos que siembra `TerminologySeedService` —los idiomas `EN`/`ES`
de cada designación y las severidades `clinical_ext:SEVERITY_*` de cada interacción—.
**No faltaba un patch: faltaba el orden.** El int-spec pasaba sólo porque él mismo aplica el
patch en su `beforeAll`, después de que la app hubiera arrancado alguna vez.

### 1. El catálogo ahora lo siembra la app

Vivía en `SQL/patches/2026-07-30_vademecum_dev_seed.sql`, fuera de `apply_all.sql`: una base
reconstruida **no lo traía**. Ahora es `VademecumSeedService`, un seed dependiente más que
corre después del catálogo de conceptos, así que el orden queda resuelto por construcción.

El dataset (`data/vademecum/vademecum.dataset.json`) se **exportó de la base ya poblada**
conservando los UUID deterministas del seed original: una base que ya tenía el catálogo
reconoce sus propias filas en vez de duplicarlo con ids nuevos.

```
base limpia (catálogo en 0) + arranque de la app:
  Seeds: 11/11 ok · 4446 filas · 7131 ms
    {"name":"vademécum de medicamentos","inserted":240,"failed":false}

reinicio del contenedor:
  Seeds: 11/11 ok · 0 filas · 592 ms
    {"name":"vademécum de medicamentos","inserted":0,"failed":false}
```

En la base: **17 medicamentos · 155 propiedades · 5 interacciones**.
`yarn test:integration --testPathPatterns=vademecum` → **3/3 en verde**.

### 2. La búsqueda: no se creó ningún endpoint

`GET /terminology/concepts?q=` ya encontraba el medicamento. Lo que faltaba era que alguna
lectura publicara `dose_forms`, `strengths` y `routes`: `ConceptDetailDto` gana `properties`
como mapa `código -> valor`, resuelto con `findPropertiesByConcept`, que **ya existía** en el
repositorio y nadie usaba desde la ficha. Va sólo en la ficha y no en la búsqueda: son varias
filas por concepto y traerlas para cada resultado de un autocompletar es peso que la lista no
usa.

### 3. La receta referenciando el catálogo: no requirió cambios

`medication_requests.medication_concept_id` ya era `NOT NULL` con FK a
`terminology.catalog_concepts`. Lo que faltaba era que el catálogo tuviera algo que elegir.

### 4. El front (PR front #126)

El campo era un desplegable sobre el binding de columna, es decir la expansión de **un** value
set: los 12 conceptos ATC del enum básico. **Los 17 del vademécum viven en otro sistema de
codificación, así que no se podía recetar ninguno.** Ahora es `<app-reference-combobox>` +
`searchConcepts` —el par que ya usan otras cuatro features—, sin texto libre: se guarda el
`conceptId`. Al elegir se lee la ficha y sus `strengths`/`dose_forms` se ofrecen como dos
desplegables; lo elegido viaja compuesto en `doseText` porque el modelo **no tiene columna**
para presentación ni concentración. Si el concepto no las declara, queda el campo de texto de
siempre.

**El PDF ya funciona sin tocarlo**: `doseText` es lo que `from-summary.ts` mapea a `dosis` y
lo que `lineaDeMedicamento` pinta.

### Verificación de la cadena completa, contra la API viva

```
GET  /terminology/concepts?q=vanco&limit=20 → 200 · Vancomycin | J01XA01
GET  /terminology/concepts/<id>             → 200 · 11 propiedades
     concentraciones: ['500 mg','750 mg','1 g','1.25 g','1.5 g','1.75 g','2 g']
     presentaciones : ['powder for solution for infusion','oral capsule','oral solution']
POST /clinical/medication-requests           → 201
```

Y lo que quedó guardado, que es lo que el PDF pinta como dosis:

```
dose_text   = 1 g · oral capsule
frequency   = cada 12 horas
medicamento = Vancomycin
```

Pruebas: API `yarn typecheck` 0 · `lint --max-warnings=0` 0 ·
`yarn test src/modules/terminology/ src/common/seed/` **22 suites / 224 pruebas**.
Front: `medication-block.spec.ts` **29/29** (6 nuevos) · `terminology.client.spec.ts`
**23/23** (2 nuevos) · los cuatro specs afectados juntos **121/121** ·
`tsc -p tsconfig.spec.json --noEmit` en 0.

### Dos hallazgos del front que no son de este carril

- **El presupuesto del bundle ya estaba excedido en `origin/dev`**: 852.76 kB medidos ahí
  contra 852.86 kB en la rama (**+0.10 kB**). El aviso sale igual sin mis cambios.
- **`tutorial.engine.spec.ts` falla 18/18 en `origin/dev` limpio.** Preexistente y ajeno.
  Además, correr la suite completa produce fallos que no aparecen archivo por archivo: es la
  contención del pool de vitest que ya documenta el `CLAUDE.md` del repo, no regresiones.

---

## Estado del carril al cierre del lunes 17/08

| Fase | Estado |
|---|---|
| F0.1 · minutos de GitHub Actions | **Excluida** por decisión del dueño del carril |
| F0.2 · ramas zombis | Auditadas — **no borrables**, hallazgo entregado |
| F0.3 · `master`↔`dev` + rama canónica | Hecha |
| F0.4 · **B-2** | **Pendiente** |
| F1 · vademécum (seed, búsqueda, receta, front) | Hecha |
| F2 · B-6 Trayectoria | Hecha (adelantada) |

PRs abiertos, ninguno mergeado todavía: API #114 · #115 · #116 · front #125 · #126 ·
vault #38. Orden de merge sugerido en el mensaje de cada uno; lo único obligatorio es
**#115 → #116 → front #126**.

### Lo que queda pendiente, dicho sin adornos

1. **B-2** — meter `Mantra Core Health Context/`, `SQL/` y `salud-db/` bajo git. Es el único
   ítem del carril sin empezar, y esta semana **volvió a morder**: todo el trabajo de modelo
   de la fase 2 —el `.puml`, el DDL regenerado y el patch— **no viaja en ningún diff**. Vive
   en un disco. Los PRs describen ese cambio; no lo contienen.
2. **La vía en el PDF** quedó fuera: `MedicationRequestItemDto` del summary no expone
   `routeConceptId`, así que exigiría cambiar el contrato de la API, el tipo del front y la
   recolección de ids de etiquetas. Presentación y concentración, que son el pedido, ya llegan.
3. **El gate `catalogoListo`** del bloque de receta quedó intacto. Con el buscador ya no sería
   estrictamente necesario para elegir medicamento, pero sigue señalando que el catálogo
   clínico está publicado —vía y unidad lo necesitan— y cambiarlo sin pedido sería alterar un
   comportamiento deliberado.
