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

## Pendiente de las fases 1 y 2

Se completa en este mismo archivo a medida que avanzan (vademécum: int-spec en verde +
endpoint de búsqueda + front/PDF; B-6: esquema por pipeline + `rebuild_stack.py --yes` PASS
con conteos).
