# Plan — Infraestructura hexagonal SIAT real en `billing`

- Fecha: 2026-10-27 · Repos afectados: `mantra-core-health-api` · Predecesor: ninguno
- Resultado observable: el módulo `billing` tiene la capa hexagonal completa (domain / application / infrastructure / presentation), un puerto `ISiatEmitterPort` con token DI, dos adaptadores intercambiables (simulado y real), el Sector 17 exportado y activo, y la alternancia simulado↔real gobernada por la variable `SIAT_MODE` sin tocar código.
- Kill-test: `SIAT_MODE=real` arranca sin error de inyección; `SIAT_MODE=simulated` sigue funcionando; el spec de arquitectura `module-layering.spec.ts` pasa para `billing`.

## Alcance

- IN:
  - Crear estructura hexagonal en `billing` (domain / application / infrastructure / presentation)
  - Agregar `billing` a `MIGRATED_MODULES` en `module-layering.spec.ts`
  - Definir `ISiatEmitterPort` + token DI en `billing/application/ports/`
  - Crear `SiatSimulatedAdapter` que envuelve el engine existente sin tocarlo
  - Crear `SiatRealAdapter` que usa `integration_contracts` (M31) para llamar al SIN real
  - Provider condicional en `BillingModule` según `SIAT_MODE`
  - Exportar y activar `HOSPITAL_CLINIC_SCHEMA` (Sector 17) en `siat-schema.ts`
  - Renombrar entidad `siat_simulated_invoices` → `siat_invoices` con columna `siat_mode`
- OUT:
  - No se mueven los servicios/controladores/repositorios planos existentes de billing
  - No se toca el motor simulado (`siat-simulated.engine.ts`) — es código correcto
  - No se implementan endpoints nuevos de presentación
  - No se migra a NestJS la lógica de facturación real (fuera de alcance por ahora)

## H1 — Estructura hexagonal en `billing` + `billing` en MIGRATED_MODULES

**CA:** Dado que se corre `yarn test src/architecture/module-layering.spec.ts`, cuando billing está en MIGRATED_MODULES y los archivos en sus capas respetan las reglas de importación, entonces el spec pasa en verde.
**DoD:** `yarn test src/architecture/module-layering.spec.ts` → PASS (salida pegada)
**Estado:** TODO

### H1.S1 — Crear directorios y archivos de capa vacíos

**CA:** Existen las carpetas `billing/domain/`, `billing/application/`, `billing/application/ports/`, `billing/infrastructure/`, `billing/infrastructure/adapters/`, `billing/presentation/` con index vacíos.
**DoD:** `ls -la src/modules/billing/application/ports/` muestra al menos el `index.ts`
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Crear `billing/domain/index.ts` (barrel vacío) | El archivo existe | `cat src/modules/billing/domain/index.ts` → archivo vacío con comentario | TODO |
| H1.S1.M2 | Crear `billing/application/ports/index.ts` (barrel vacío) | El archivo existe | `cat src/modules/billing/application/ports/index.ts` → archivo vacío | TODO |
| H1.S1.M3 | Crear `billing/application/index.ts` (barrel vacío) | El archivo existe | `cat src/modules/billing/application/index.ts` → archivo vacío | TODO |
| H1.S1.M4 | Crear `billing/infrastructure/adapters/index.ts` (barrel vacío) | El archivo existe | `cat src/modules/billing/infrastructure/adapters/index.ts` → archivo vacío | TODO |
| H1.S1.M5 | Crear `billing/infrastructure/index.ts` (barrel vacío) | El archivo existe | `cat src/modules/billing/infrastructure/index.ts` → archivo vacío | TODO |
| H1.S1.M6 | Crear `billing/presentation/index.ts` (barrel vacío) | El archivo existe | `cat src/modules/billing/presentation/index.ts` → archivo vacío | TODO |

### H1.S2 — Agregar `billing` a MIGRATED_MODULES

**CA:** `module-layering.spec.ts` incluye `'billing'` en el array `MIGRATED_MODULES`.
**DoD:** `yarn test src/architecture/module-layering.spec.ts` → PASS
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H1.S2.M1 | Agregar `'billing'` al array `MIGRATED_MODULES` | grep encuentra billing | `grep billing src/architecture/module-layering.spec.ts` → muestra la línea | TODO |
| H1.S2.M2 | Correr el spec de arquitectura | spec pasa en verde | `yarn test src/architecture/module-layering.spec.ts` → PASS | TODO |

---

## H2 — Puerto `ISiatEmitterPort` + token DI + `SiatSimulatedAdapter`

**CA:** Dado que el módulo arranca con `SIAT_MODE=simulated`, cuando se inyecta `SIAT_EMITTER_PORT`, entonces se obtiene el adaptador simulado y las llamadas devuelven `simulated: true`.
**DoD:** `yarn test src/modules/billing/infrastructure/adapters/siat-simulated.adapter.spec.ts` → PASS
**Estado:** TODO

### H2.S1 — Definir `ISiatEmitterPort`

**CA:** `billing/application/ports/siat-emitter.port.ts` define la interfaz con los 5 métodos del ciclo SIAT y el símbolo `SIAT_EMITTER_PORT`.
**DoD:** `tsc --noEmit` sin errores sobre el archivo
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Crear `siat-emitter.port.ts` con interface + Symbol | archivo existe con 5 métodos | `grep SIAT_EMITTER_PORT src/modules/billing/application/ports/siat-emitter.port.ts` | TODO |
| H2.S1.M2 | Exportar desde `application/ports/index.ts` | el barrel lo reexporta | `grep ISiatEmitterPort src/modules/billing/application/ports/index.ts` | TODO |

### H2.S2 — Crear `SiatSimulatedAdapter`

**CA:** `SiatSimulatedAdapter` implementa `ISiatEmitterPort` delegando al engine existente; sus 5 métodos devuelven las mismas respuestas que `BillingSimulatedService` hoy, con `simulated: true`.
**DoD:** `yarn test src/modules/billing/infrastructure/adapters/siat-simulated.adapter.spec.ts` → PASS (3+ casos por método: correcto, límite, inválido)
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H2.S2.M1 | Crear `siat-simulated.adapter.ts` implementando `ISiatEmitterPort` | typecheck pasa | `yarn typecheck` sin errores en ese archivo | TODO |
| H2.S2.M2 | Crear spec con casos correcto + límite + inválido para cada método | spec en verde | `yarn test siat-simulated.adapter.spec.ts` → PASS | TODO |

---

## H3 — `SiatRealAdapter`

**CA:** Dado que existe una instancia de `SiatRealAdapter`, cuando se llama a `verificarComunicacion()`, entonces devuelve `true` si el SIN responde OK y lanza `SiatConnectionError` si no (sin filtrar el stack).
**DoD:** `yarn test src/modules/billing/infrastructure/adapters/siat-real.adapter.spec.ts` → PASS (stub de HTTP en 3 niveles)
**Estado:** TODO

### H3.S1 — Crear `SiatRealAdapter`

**CA:** El adaptador usa `integration_contracts` para autenticación/idempotencia, apunta a los endpoints SIAT reales (`SIAT_BASE_URL` desde env), e implementa `ISiatEmitterPort` completo.
**DoD:** typecheck pasa; spec con stubs HTTP en verde
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Leer `integration_contracts` para entender cómo usar M31 | patrón de uso conocido y documentado en el plan | agente confirma la API de M31 con rutas | TODO |
| H3.S1.M2 | Crear `siat-real.adapter.ts` implementando `ISiatEmitterPort` | typecheck pasa | `yarn typecheck` sin errores en ese archivo | TODO |
| H3.S1.M3 | Spec con HTTP stub: correcto, timeout, 4xx del SIN | spec en verde | `yarn test siat-real.adapter.spec.ts` → PASS | TODO |

---

## H4 — Provider condicional y actualización de `BillingModule`

**CA:** `BillingModule` inyecta `SiatRealAdapter` cuando `SIAT_MODE=real` y `SiatSimulatedAdapter` cuando `SIAT_MODE=simulated` (o ausente); el módulo arranca sin error en ambos casos.
**DoD:** `yarn build` → 0 errores; test de integración del provider → PASS
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H4.M1 | Agregar provider condicional en `billing.module.ts` | grep muestra el useClass condicional | `grep SIAT_MODE src/modules/billing/billing.module.ts` | TODO |
| H4.M2 | Exportar `SIAT_EMITTER_PORT` desde `BillingModule` para que `insurance` lo consuma | el token está en `exports[]` | `grep SIAT_EMITTER_PORT src/modules/billing/billing.module.ts` | TODO |
| H4.M3 | `yarn build` sin errores | build pasa | `yarn build 2>&1 | tail -5` → 0 errors | TODO |

---

## H5 — Activar Sector 17 (Hospital/Clínica) en `siat-schema.ts`

**CA:** `siat-schema.ts` exporta `HOSPITAL_CLINIC_SCHEMA` con `activo: true` y la cabecera incluye el campo `modalidadServicio` según el XSD del SIN.
**DoD:** `grep HOSPITAL_CLINIC_SCHEMA src/modules/billing/siat-simulated/siat-schema.ts` muestra `activo: true`; `yarn test src/modules/billing` → PASS
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H5.M1 | Definir `HOSPITAL_CLINIC_SCHEMA` con `activo: true` y los campos del Sector 17 | grep lo encuentra con activo:true | `grep -A3 HOSPITAL_CLINIC_SCHEMA src/modules/billing/siat-simulated/siat-schema.ts` | TODO |
| H5.M2 | Exportar desde el barrel de `siat-simulated` | re-export visible | `grep HOSPITAL_CLINIC_SCHEMA src/modules/billing/siat-simulated/siat-schema.ts` | TODO |
| H5.M3 | Tests del schema Sector 17 pasan | `yarn test siat-schema` → PASS | `yarn test src/modules/billing/siat-simulated/` → PASS | TODO |

---

## H6 — Patch de BD: `siat_invoices` + columna `siat_mode`

**CA:** La entidad `SiatInvoice` (antes `SiatSimulatedInvoice`) tiene la columna `siat_mode: 'simulated' | 'real'` y el archivo de patch está en `patches/SQL/` siguiendo el pipeline del modelo.
**DoD:** `yarn typecheck` sin errores en la entidad; diff del patch en `patches/SQL/` visible
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H6.M1 | Agregar columna `siat_mode` (enum 'simulated'\|'real', default 'simulated') a `siat_simulated_invoices.entity.ts` | typecheck pasa en la entidad | `yarn typecheck` sin errores | TODO |
| H6.M2 | Crear patch SQL en `patches/SQL/` o el mecanismo que use este repo | archivo patch existe | `ls patches/SQL/ \| grep siat` → muestra el nuevo patch | TODO |
| H6.M3 | Hacer lo mismo para `siat_simulated_outbox.entity.ts` | typecheck pasa | `yarn typecheck` sin errores | TODO |

---

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| `module-layering.spec.ts` rechaza archivos existentes en billing al agregarla | CI rojo | Leer el spec entero antes de agregar; el spec solo verifica archivos DENTRO de las capas declaradas |
| `integration_contracts` M31 usa un contrato que no aplica directo a SIAT | SiatRealAdapter no compila | Leer M31 entero antes de escribir el adapter; aislar con stub si hay mismatch |
| Los endpoints reales del SIN SOAP son distintos a los esperados | SiatRealAdapter llama URLs incorrectas | El adapter se testea con HTTP stub; las URLs van a `.env.example`, no hardcodeadas |
| La entidad `siat_simulated_invoices` es referenciada por muchos servicios | renombrarla rompe imports | No renombrar la entidad, solo agregar la columna `siat_mode` con default |
