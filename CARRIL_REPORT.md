# CARRIL 05 — Perfil del doctor · reporte (backend)

**Branch:** `fix/alovida-c05-doctor_profile`
**Base:** `origin/dev` @ `51895db8` (Merge PR #83 — carril-2/forms-glosario-clean)
**Fecha:** 15/08/2026

---

## 1. Qué se hizo

### A. El resumen del profesional no devolvía la trayectoria

`buildSummary()` juntaba especialidades, credenciales, matrículas, idiomas y
actividad — **nunca las afiliaciones**. El historial laboral (UC-05-16) se
escribía y no había forma de leerlo desde el perfil, así que la pestaña
Trayectoria del carril 05 no tenía de dónde sacar «experiencia histórica» ni
«actividad actual».

- `dto/read-practitioner-profile.dto.ts`: `affiliations: AffiliationResponseDto[]`
  en `PractitionerProfileSummaryDto` (se **reutiliza** el DTO que ya existía en
  `affiliation.dto.ts`, no se duplicó) y `verificationSourceUri?: string` en
  `PractitionerCredentialDto` — la columna existía en la entidad y no se exponía.
- `services/profiles-practitioners.service.ts`: `buildSummary` suma
  `affiliationsRepo.findByPractitioner` al `Promise.all` y mapea con la función
  `toAffiliation` ya existente. `current` se sigue derivando de `endDate`; el
  reparto en fases lo hace la pantalla.

### B. Bypass de verificación DEV/TEST (corrección #12 y #13)

**Hallazgo:** `listPractitioners` **no filtraba por verificación en absoluto**.
La regla «la Guía sólo lista verificados» que la spec da por sentada no existía;
esto no fue «quitar un filtro» sino **agregar el filtro de producción junto con
su apagador de DEV/TEST**.

Nuevo, en `src/common/verification/`:

| Archivo | Qué hace |
| --- | --- |
| `verification-bypass.env.ts` | Schema Joi `DEV_VERIFICATION_BYPASS` (rechaza `true` con `NODE_ENV=production`) + `assertVerificationBypassNotInProduction()` |
| `verification-bypass.service.ts` | `isActive()`; aborta la construcción en producción; loguea warning estructurado cuando está activo |
| `verification-bypass.module.ts` | `@Global()`, mismo criterio que `AuthModule`/`FileStorageModule` |

Enforcement: `listPractitioners` pasa `verificationStatusConceptId =
PROF.PRACT_VERIF_VERIFIED` a `listPage` **salvo** que el bypass esté activo. El
estado sigue viajando en cada fila como badge informativo, nunca como filtro
adicional.

**Lo que el bypass NO toca** (verificado por lectura y por pruebas): no escribe
`verificationStatusConceptId` ni `stateConceptId`, no modifica ni remueve
`RequiresVerifiedIdentity`, `RolesGuard` ni `verifyCredential`. Sólo cambia un
`WHERE` de lectura.

### C. Seed

`tools/redesa/seed-dev-data.mjs` no sembraba ni una afiliación, así que la
pestaña Trayectoria salía vacía contra datos sembrados. Ahora siembra una
histórica (`endDate` seteado) y una actual (`endDate` omitido) para la cuenta de
prueba, con lectura previa para ser idempotente. El endpoint es self-service sin
atajo de plataforma (`profile-ownership.service.ts`), así que sólo puede
sembrarse para el médico con sesión real (índice 0); el resto queda con
trayectoria vacía, que ejercita el otro estado que la pantalla debe mostrar.

---

## 2. Deuda upstream encontrada y resuelta — `practitioner_affiliations`

**La tabla no existía.** La entidad, repositorio, servicio, controlador, DTOs y
la pantalla de historial laboral se shippearon en un carril anterior sin que la
tabla llegara nunca al modelo canónico (`.puml`), al DDL generado (`SQL/`) ni a
la base. `GET/POST /profiles/practitioners/me/affiliations` respondía **500** —
nunca había funcionado, y ninguna prueba lo detectaba porque las de integración
no la ejercían.

Resuelto siguiendo el protocolo de 4 capas (`.puml → SQL/ → BD → ORM`):

1. **`.puml`** — entidad `practitioner_affiliations`, su relación con
   `health_practitioner_profiles` y su bloque `INDEX_SET`, agregados a
   `Mantra Core Health Context/modules/diagram_05_profiles.puml`.
2. **DDL** — `python3 gen_ddl.py 05` produce exactamente la tabla + índices + FK
   esperados. El resultado se conserva en
   `tools/redesa/2026-08-15_c05_practitioner_affiliations.sql` (idempotente).
3. **BD** — aplicado a la base local; verificado con `\d`.

Dos detalles que sólo aparecieron al ejercer el flujo de verdad:

- **`gen_ddl.py 05` es lossy en este workspace.** La regeneración completa
  **pierde 7 FK ya resueltas** (`fk_persons_merge_survivor_person_id`,
  `photo_file_id`, `issuing_authority_tenant_id`, `source_tenant_id`, las dos de
  `patient_merge_events`, `scope_value_set_id`) porque el generador lee los
  destinos de un vault (`vitara/SALUD/FK/`) que no está presente acá. **Los
  archivos de `SQL/05_profiles/` se restauraron sin cambios**; sólo se conserva
  la adición, aparte. Quien tenga el vault debe re-generar el módulo.
- **`row_version` necesita `DEFAULT 1`.** El `.puml` no modela defaults, así que
  el generador no lo emite — pero las **17 tablas hermanas de `profiles` lo
  tienen** y MikroORM cuenta con él: sin el default el INSERT manda `NULL` y la
  fila viola el `NOT NULL` (400 `VALIDATION_FAILED`). Incluido en el `.sql`.

> ⚠️ **Nota de integración:** `SQL/`, el `.puml` y el generador **no están bajo
> control de versiones** (sólo lo están los dos sub-repos). El cambio del `.puml`
> y la regeneración **no viajan en esta branch**. Lo que sí viaja es
> `tools/redesa/2026-08-15_c05_practitioner_affiliations.sql`, que deja la base
> en el estado correcto. **Quien administre el modelo canónico debe incorporar la
> entidad al `.puml` y regenerar `SQL/05_profiles/` con el vault de FK completo.**

---

## 3. Archivos

**Nuevos**
- `src/common/verification/verification-bypass.env.ts` (+ `.spec.ts`)
- `src/common/verification/verification-bypass.service.ts` (+ `.spec.ts`)
- `src/common/verification/verification-bypass.module.ts`
- `test/integration/verification-bypass.int-spec.ts`
- `tools/redesa/2026-08-15_c05_practitioner_affiliations.sql`

**Modificados**
- `src/common/index.ts` — barrel
- `src/app.module.ts` — schema Joi + `VerificationBypassModule`
- `src/modules/profiles/dto/read-practitioner-profile.dto.ts`
- `src/modules/profiles/services/profiles-practitioners.service.ts` (+ `.spec.ts`)
- `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts`
- `tools/redesa/seed-dev-data.mjs`
- `.env.example`

---

## 4. Pruebas

| Comando | Resultado |
| --- | --- |
| `yarn lint` | ✅ limpio |
| `yarn typecheck` | ✅ limpio |
| `yarn test` (unitarias) | ✅ **4811 pasan**, 1 falla **preexistente** (`local-disk-file-storage.adapter.spec.ts`, timeout de 15 s — falla igual sin estos cambios) |
| `yarn test:integration` (mis 2 specs aislados) | ✅ **23/23** |
| `yarn test:integration` (suite completa) | 4 fallas **preexistentes**, verificadas contra `dev` limpio con `git stash`: `vademecum` (falta `SQL/patches/2026-07-30_vademecum_dev_seed.sql` en el workspace) e `identity-verification-cycle` (concept id). **Idénticas sin mis cambios.** |
| `yarn seed:dev` | ✅ **545/545 conformes, 0 fuera de lo esperado** |

Casos nuevos: bypass on/off/prod (env + service), `listPractitioners` filtra o no
según bypass y combinado con filtro de especialidad, `buildSummary` incluye
afiliaciones con `current` derivado, y un caso de integración real-DB que levanta
**dos aplicaciones Nest** (una por estado del flag) para probar visibilidad.

> Nota metodológica: una primera corrida de `test:integration` dio 148 fallas.
> Fue **autoinfligida** — había arrancado el servidor dev en paralelo y ambos
> procesos compiten por el caché de metadata de MikroORM en disco. Corrida sola
> y con el caché limpio, el resultado es el de la tabla.

---

## 5. Evidencia funcional (API real, build local, base sembrada)

```
GET /profiles/practitioners/me/summary
  ACTIVIDAD ACTUAL   → Sede Central Sopocachi | Médica cardióloga | desde 2019-04-01
  EXPERIENCIA HIST.  → Hospital Obrero N.º 1  | Médica residente  | 2008-03-01 → 2013-02-28

POST /profiles/practitioners/me/affiliations  → 201 (histórica y actual)

me/summary  vs  :profileId/summary   (la vista previa contra la del paciente)
  mismas claves: True
  campos que difieren: NINGUNO — contrato idéntico

GET /profiles/practitioners  (bypass activo)
  127 doctores, 3 estados de verificación distintos presentes  → no filtra
  log: {"event":"verification_bypass.active","nodeEnv":"development"}
```

---

## 6. Deuda restante

- **`.puml` + `SQL/05_profiles/` fuera de repo** (ver nota de integración §2). Es
  lo único que impide que el arreglo de la tabla viaje solo.
- **`gen_ddl.py` pierde FK sin el vault** — no es de este carril, pero cualquiera
  que regenere un módulo en este workspace introducirá la misma regresión.
- **`fileId` de credenciales sin exponer**: la pestaña Credenciales muestra
  `verificationSourceUri` (decisión acordada); ver el documento real subido exige
  definir el control de acceso de un tercero (paciente) a un archivo del doctor.
- El estado «declarado vs verificado» se deriva de `stateConceptId` /
  `verificationSourceUri` ya existentes; **no se agregó ningún campo nuevo** para
  eso.

## 7. Estado

**No integrado.** La branch queda lista para que el carril 21 la rebase contra el
`dev` del momento y la mergee. Merge pendiente de registrar por el integrador.
