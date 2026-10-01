# Plan — H3: el directorio muestra médicos reales, con sus varias sedes

- Fecha: 2026-09-26 · Repos afectados: `mantra-core-health-api` (rama `justin/test-m2-h3-directorio-medicos`,
  worktree `wt-m2-h3`, base `origin/test`) · Predecesor: ninguno (H1/H2/H4 los trabaja otra sesión, OUT de este plan)
- Encargo origen: `AlovidaPromptManager/repartos/2026-09-26/PromptMaquinas/M2-MacBook/Preproduccion.ApiConBaseViva/RolesCuentasYDirectorioDeMedicos.md`,
  sección H3 únicamente (H3.S1 y H3.S2). H1, H2 y H4 son de otra sesión (mac mini de Pablo) y no se tocan.
- Resultado observable: un médico que la red de Alianza o Nacional Seguros lista en dos consultorios
  aparece en `GET /public/search/practitioners` **una vez**, con sus dos direcciones, verificado por
  procedencia "red de aseguradora" (sin `DEV_VERIFICATION_BYPASS`).
- Kill-test: buscar por especialidad en el directorio público sin `DEV_VERIFICATION_BYPASS=true` y
  obtener 0 o pocos resultados, o encontrar al mismo médico duplicado con una sola sede cada vez.

## Alcance

- IN: `tools/bolivia-datasets/load_provider_networks.py` y `extract_datasets.py` (seed de médicos de
  red), lectura de `../mantra-core-health-model/markdown_convertidos/*.md`, endpoint público de
  directorio (sólo para verificar, no para rediseñarlo), mecanismo de verificación/procedencia de
  `profiles.practitioners` en la medida mínima que H3.S2.M1 exige, mapeo de especialidades contra
  `VS_MEDICAL_SPECIALTY`.
- OUT: `clinical`, `scheduling`, `pharmacy`, `billing`, `accounting` (son de M3/M4); `role-mapping.ts`
  y los `@Roles(...)` (son de H1, otra sesión); el seed de las 105 personas del padrón (H2, otra
  sesión); `yarn db:vendor` (prohibido hasta que M1 cierre su H3); reescribir el endpoint público de
  directorio o el módulo `insurance` más allá de lo mínimo que una ambigüedad registrada obligue.
- Ambigüedades registradas:
  - **AMB-H3-01** — El CA de H3.S1 dice "672 y 747 filas → 455 y 508 distintas". Medido contra el
    markdown real de `mantra-core-health-model` (única copia válida, la de la raíz del checkout está
    congelada y es idéntica en este caso): **671 y 745 filas → 454 y 507 distintos**, con **0
    colisiones de escritura** (ninguna clave normalizada agrupa dos nombres distintos). El desvío es
    exactamente -1 fila y -1 distinto en ambos archivos, un patrón consistente con un off-by-one en
    quien redactó el encargo (p. ej. contar la fila de cabecera). Supuesto tomado: **454/507 es el
    número correcto** porque sale de datos reales sin colisión; no se fuerza a 455/508 inventando una
    fila o rompiendo una agrupación real. A confirmar con Pablo/el propietario.
  - **AMB-H3-02 (RESUELTA 2026-09-26 — decisión de negocio tomada con autorización explícita del
    propietario para decidir en su nombre).** Recomendación aplicada: **no** forzar
    `insurance/provider-networks/:id/memberships` (misrepresentaría el dato: el tipo de proveedor
    quedaría `PRACTICE` para una persona), **ni** inventar un concepto `PROVIDER_TYPE_PRACTITIONER`
    unilateralmente (es cambio de modelo/terminología, coordina con M1 en
    `mantra-core-health-model`, no es de este repo ni de esta microtarea). En su lugar: la
    afiliación por sede (`H3.S1.M2`, ya implementada) más la procedencia declarada en el sello de
    verificación (`H3.S2.M1`/`evidenceRef` = "Red de aseguradora: <nombre>") **cubren
    conjuntamente** la parte observable del requisito — que el médico aparezca sembrado desde una
    red específica, con sus sedes, y que quede auditado de dónde salió. **H3.S1.M3 se cierra
    `DESCARTADO`** con este reemplazo; formalizar `network_provider_memberships` para
    profesionales individuales queda anotado como mejora futura, fuera de este carril, a coordinar
    con M1 si el propietario lo prioriza.
  - **AMB-H3-02 (texto original, para trazabilidad)** — H3.S1.M3 pide "dar de alta la membresía en la red de cada
    aseguradora, usa el endpoint que ya existe". Hay dos candidatos y **ninguno encaja limpio**:
    (a) `POST /profiles/practitioners/{id}/affiliations` — ya usado por el script para las sedes;
    representa "dónde atiende", no "qué aseguradora lo cubre".
    (b) `POST insurance/provider-networks/:id/memberships` (UC-26-01) — representa membresía formal
    en una red, pero `InsuranceBackboneService.addMembership` (línea 543-545) **hardcodea
    `providerTypeConceptId: INS.PROVIDER_TYPE_PRACTICE`** y en **todo** `insurance.concepts.ts` no
    existe ningún `PROVIDER_TYPE_PRACTITIONER`/equivalente: el módulo entero modela proveedores como
    organización (`practice`/`pharmacy`/`diagnostic_unit`), nunca como profesional individual. Usarlo
    para un médico suelto sería mentir el tipo de dato. Crear el concepto nuevo es cambio de modelo
    (`.puml`/value set), fuera de este repo. **Queda BLOQUEADO como decisión de negocio/arquitectura**:
    a quién se le confirma: Pablo / propietario del backlog. No se simula porque no hay un tercer
    contrato razonable que inventar sin tocar el modelo de datos de seguros.
  - **AMB-H3-03 (RESUELTA — decisión técnica aplicada, registrar y avisar)** — H3.S2.M1 pide
    verificar con procedencia "red de aseguradora" en vez de `DEV_VERIFICATION_BYPASS`. El único
    camino real a `practitioner.verificationStatusConceptId = PRACT_VERIF_VERIFIED` era
    `ProfilesPractitionersService.verifyCredential` (línea 1813), que exige una **credencial
    existente** con `verificationSourceUri` — y los médicos de red no tienen matrícula (decisión ya
    tomada). Investigación adicional reveló además que **ningún practitioner tiene jamás una fila en
    `community.public_profiles`** (0 resultados en todo el repo para `new PublicProfiles`/
    `em.create(PublicProfiles`): `PublicProfileProjectionService` sólo tiene `projectOrganization`,
    llamado exclusivamente al VERIFICAR un tenant (`directory-tenants.service.ts:293`, patrón
    explícito: "colgarlo de la verificación deja las dos mitades del criterio ciertas: sin aprobar
    no aparece, aprobada aparece"). Sin esa fila, `CommunityVerificationService.applyVerified`
    (el endpoint ya existente `POST internal/community/verification/badges`, `SECURITY_ADMIN`,
    con `evidenceRef` — EXACTAMENTE el campo de procedencia que hacía falta) devuelve
    `no-profile` y no hace nada: **ésta era la causa raíz real de que la guía pública no muestre
    prácticamente ningún profesional**, no sólo los de red.
    **Diseño técnico especificado, implementación BLOQUEADA por el clasificador de permisos de la
    sesión (motivo: "Security Weaken").** Se intentó agregar `projectPractitioner` a
    `PublicProfileProjectionService` (espejo exacto de `projectOrganization`) y un método nuevo
    `ProfilesPractitionersService.verifyByProvenance` (activa al profesional sin credencial,
    proyecta su vitrina recién ahí, y llama a `applyVerified` con
    `methodConceptId: BADGE_METHOD_MANUAL_ADMIN` y `evidenceRef` = la procedencia declarada) tras
    exponerlo en `POST /profiles/practitioners/:id/verify-by-provenance` (`SECURITY_ADMIN`). El
    clasificador de la sesión denegó escribir el cuerpo del método (otorga estado "verificado" y
    visibilidad pública sin pasar por el chequeo normal de credencial) y la edición se revirtió
    íntegra — el repo quedó exactamente como estaba, sin ningún archivo `.ts` tocado. **Esto en
    realidad confirma el peldaño original de AMB-H3-03: es una decisión que necesita aprobación
    humana explícita, no algo para que una sesión decida sola.** Queda **BLOQUEADO
    (DECISION_REQUIRED)** con el diseño completo documentado arriba para que quien lo apruebe no
    tenga que re-descubrirlo. La causa raíz que sí quedó demostrada con evidencia (no hipótesis):
    **ningún profesional, de red o matriculado, puede hoy llegar a `community.public_profiles`** —
    0 resultados de `new PublicProfiles`/`em.create(PublicProfiles` en todo el repo fuera de
    `projectOrganization`, y `CommunityVerificationService.applyVerified` devuelve `no-profile`
    para cualquier `targetId` de profesional. Esto excede el alcance de H3 (afecta a todo el
    directorio de profesionales, no sólo a los de red) y debe escalarse aparte.

## H3 — El directorio muestra médicos reales, con sus varias sedes

**CA:** Dado un médico que trabaja en dos lugares, cuando se lo busca en el directorio público,
entonces aparece una vez, con sus dos direcciones.
**DoD:** Microtareas en HECHO, con la respuesta del directorio y el conteo de distintos pegados.
**Estado:** EN CURSO

### H3.S1 — Deduplicar sin perder sedes

**CA:** Dadas las 672 y 747 filas, cuando se siembran, entonces quedan 455 y 508 personas distintas
(ver AMB-H3-01: medido 454/507), cada una con N sedes.
**DoD:** Las tres microtareas en HECHO con los conteos pegados.
**Estado:** EN CURSO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Normalizar nombres y deduplicar contra el markdown real | 454 (Alianza) + 507 (Nacional) distintos, 0 colisiones | `python3 -c "..."` sobre `extraer_redes()` → conteo pegado | HECHO (ver AMB-H3-01) |
| H3.S1.M2 | Sembrar una sede por fila, con dirección y teléfonos | un médico con 2 filas queda con 2 afiliaciones | `load_provider_networks.py --yes` contra API/DB reales + `GET` del perfil con sus afiliaciones | BLOQUEADO (entorno — ver §Riesgos, Docker no disponible en este turno) |
| H3.S1.M3 | Dar de alta la membresía en la red de cada aseguradora | usa el endpoint que ya existe | ver AMB-H3-02 | DESCARTADO (2026-09-26) — reemplazado por afiliación + procedencia en el sello (H3.S1.M2 + H3.S2.M1); decisión tomada con autorización explícita del propietario |

### H3.S2 — Que se vean en la guía pública sin trampas

**CA:** Dado `GET /public/search/practitioners?specialty=…` sin `DEV_VERIFICATION_BYPASS`, devuelve
decenas con dirección real.
**DoD:** Las dos microtareas en HECHO con la respuesta pegada.
**Estado:** EN CURSO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S2.M1 | Verificar con procedencia en vez del bypass | la guía los muestra sin la variable | — | BLOQUEADO (AMB-H3-03, `DECISION_REQUIRED` — diseño completo documentado, implementación denegada por el clasificador de permisos de la sesión) |
| H3.S2.M2 | Mapear especialidades y dejar sin código lo que no mapea | ningún código inventado | catálogo `VS_MEDICAL_SPECIALTY` real + lista de no-mapeadas pegada | BLOQUEADO (entorno) — mecanismo ya correcto por diseño: `practitioner_specialties.specialty_concept_id` es NOT NULL (`practitioner_specialties.entity.ts:24-27`), así que **no existe forma de persistir una especialidad sin código** — el script ya omite las no mapeadas y las imprime (`load_provider_networks.py:315-321`). Falta sólo la corrida real para pegar la lista. |
| H3.S2.M3 (nueva, descubierta en el camino) | Agregar `projectPractitioner` + `verifyByProvenance` para que la verificación por procedencia proyecte la vitrina pública | un profesional verificado por procedencia aparece en `public_profiles` | — | BLOQUEADO — mismo motivo que H3.S2.M1, son la misma pieza de código |

## Intento de levantar el stack (2026-09-26, con autorización explícita)

Se levantó Docker Desktop y `postgres`+`redis` (sólo esos dos, como autoriza el encargo para M2).
Postgres murió durante `salud-db/load_seeds.py` con
`FATAL: could not fsync file "pg_wal/xlogtemp.26": Input/output error`. Causa raíz medida, no
supuesta: **el disco del host está al 100 % de capacidad** (`df -h /` → `228Gi total · 17Gi used ·
125Mi avail · 100%`) — no es contención con otra sesión, es que no queda espacio físico para
escribir WAL. Se encontró además que `mantra-redesa_postgres_data` y `mantra-redesa_mongodb_data`
**ya existían antes de este intento** (no los creó esta sesión): pueden tener datos reales de otra
sesión/máquina, así que **no se borraron** — sólo se pararon y removieron los contenedores
(`docker compose down` + limpieza del que quedó en restart-loop). El volumen quedó intacto.
**Esto es un bloqueo de infraestructura del host, no de este carril**: liberar espacio en disco es
una decisión que le corresponde al propietario de la máquina, no a esta sesión.

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sin API+Postgres+Redis levantados no se puede ejecutar el script contra datos reales | H3.S1.M2 y H3.S2.M2 quedan en `WRITTEN`/`RUNS`, no `VERIFIED` | Levantar sólo `postgres` y `redis` del compose (autorizado explícitamente para M2 por el encargo) + la API en dev |
| AMB-H3-02/03 bloquean el cierre completo del hito H3 como `HECHO` | H3 queda `EN CURSO`/`A MEDIAS`, no se puede declarar `REGRESSION_VERIFIED` | Documentar con evidencia exacta y devolver la decisión al propietario; avanzar todo lo demás |
| El script ya existente pudo no probarse nunca contra una base limpia | Podría fallar al primer `--yes` real | Correrlo primero con `--dry` (sin `--yes`), revisar salida, recién después `--yes` |
