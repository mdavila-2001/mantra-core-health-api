# Reporte — H3: el directorio muestra médicos reales, con sus varias sedes

> **AVANCE: 1 / 6 — 16,7 %.**

- Fecha: 2026-09-26 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/test-m2-h3-directorio-medicos`
  (worktree `wt-m2-h3`, base `origin/test`)
- Peldaño de evidencia alcanzado: **RUNS/TESTED sólo para la lógica pura de deduplicación**
  (H3.S1.M1, sin dependencias de red ni base). El resto del hito está en `DISCOVERED` (código ya
  existente, leído y citado) o `BLOQUEADO`, nunca por debajo por falta de esfuerzo sino por dos
  causas explícitas: decisiones de negocio pendientes, y Docker no disponible en este turno.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H3.S1.M1 | Deduplicación por nombre normalizado verificada contra el markdown real de `mantra-core-health-model` (la copia válida, no la congelada de la raíz) | `python3 -c "..."` sobre `extract_datasets.extraer_redes()` | `evidencia/h3s1m1-dedup-counts.txt`: **454 distintos en Alianza** (83 con >1 sede) y **507 distintos en Nacional Seguros** (176 con >1 sede), 0 colisiones de escritura |

## A medias

### H3.S1.M2 — Sembrar una sede por fila
- Qué anda: el mecanismo **ya existe y está bien diseñado**:
  `tools/bolivia-datasets/load_provider_networks.py` agrupa por persona (líneas 252-272, con
  comentario explícito sobre el bug de 215 duplicados que este diseño ya corrigió), da de alta cada
  ficha por `POST /profiles/practitioners` y registra cada sede como afiliación con
  `POST /profiles/practitioners/{id}/affiliations` (`cargar_consultorios`, líneas 196-223). Es
  idempotente por `practitionerCode` derivado sólo del nombre (líneas 81-94).
- Qué no anda: no se ejecutó contra una base y API reales en este turno.
- Qué falta exactamente: levantar `docker compose up -d postgres postgres-init redis` (autorizado
  explícitamente para esta máquina por el encargo — "sos la otra que puede levantar Postgres") y la
  API en modo dev, correr el script primero sin `--yes` (simulación) y después con `--yes`, y pegar
  la respuesta de `GET /profiles/practitioners/{id}` de un médico con 2 sedes mostrando sus 2
  afiliaciones.
- Dónde quedó: sin tocar — es código ya existente en `origin/test`, no se modificó nada. El
  worktree `wt-m2-h3` compila porque no se editó ningún `.ts`.

### H3.S2.M2 — Mapear especialidades y dejar sin código lo que no mapea
- Qué anda: el modelo **ya lo impone por diseño, no hace falta escribir nada**:
  `src/modules/profiles/entities/practitioner_specialties.entity.ts:24-27` declara
  `specialty_concept_id` **NOT NULL** — es estructuralmente imposible persistir una especialidad sin
  código en esta tabla. El script ya resuelve contra `VS_MEDICAL_SPECIALTY` vía API
  (`catalogo_de_especialidades`, líneas 177-193) y las que no matchean se omiten de la ficha y se
  imprimen en una lista aparte (líneas 315-321), que es exactamente "dejar sin código lo que no
  mapea" sin inventar ninguno.
- Qué no anda: no se ejecutó contra el catálogo real, así que no hay lista real de especialidades
  del padrón que no mapean a pegar.
- Qué falta exactamente: con la API arriba, correr el script en modo simulación y pegar la sección
  "Especialidades del padrón que NO están en VS_MEDICAL_SPECIALTY".
- Dónde quedó: sin tocar, mismo motivo que H3.S1.M2.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H3.S1.M2 — Sembrar una sede por fila | `BLOQUEADO` (entorno) | Código ya existente y revisado, ver arriba. Verificación en runtime bloqueada por el disco lleno del host (ver más abajo). |
| H3.S1.M3 — Dar de alta la membresía en la red de cada aseguradora | `DESCARTADO` (2026-09-26, decisión tomada con autorización explícita del propietario) | No se destraba: se decidió no perseguirlo por esta vía. Ver "Decisión AMB-H3-02" más abajo. |
| H3.S2.M1 — Verificar con procedencia en vez del bypass | `BLOQUEADO` (AMB-H3-03) | Investigado a fondo, diseño completo especificado, **implementación denegada dos veces por el clasificador de permisos de la sesión** ("Security Weaken"), incluso con autorización explícita del propietario en el chat — ver sección siguiente. |
| H3.S2.M2 — Mapear especialidades sin inventar código | `BLOQUEADO` (entorno) | Mecanismo ya correcto por diseño (ver arriba). Verificación en runtime bloqueada por el disco lleno del host. |
| H3.S2.M3 — `projectPractitioner` + `verifyByProvenance` (microtarea nueva, descubierta al investigar H3.S2.M1) | `BLOQUEADO` — misma causa que H3.S2.M1 | Ídem. |

### Decisión AMB-H3-02 — tomada con autorización explícita del propietario (2026-09-26)

El endpoint "que ya existe" para membresía en red (`insurance/provider-networks/:id/memberships`)
hardcodea `providerTypeConceptId: INS.PROVIDER_TYPE_PRACTICE` (`insurance-backbone.service.ts:
543-545`) y en **todo** `insurance.concepts.ts` no existe ningún tipo de proveedor "profesional
individual" — el módulo entero modela proveedores como organización. Usarlo para un médico suelto
falsearía el dato; crear un concepto nuevo es cambio de modelo/terminología fuera de este repo.

**Decisión tomada:** no se persigue por ninguna de las dos vías. La combinación de
`practitioner_affiliations` (sedes, ya implementado) + la procedencia declarada en el sello de
verificación (`evidenceRef` de H3.S2.M1, cuando se implemente) cubre la parte observable del
requisito: un médico sembrado desde una red específica, con sus sedes reales, con rastro auditable
de qué aseguradora lo originó. **H3.S1.M3 se cierra `DESCARTADO`** con este reemplazo. Formalizar
`network_provider_memberships` para profesionales individuales queda anotado como mejora futura
para coordinar con M1 (modelo), no como pendiente de este carril.

### Por qué H3.S2.M1 y H3.S2.M3 siguen bloqueadas pese al "permiso total"

El propietario autorizó explícitamente implementar `verifyByProvenance`/`projectPractitioner`. Se
intentó **dos veces**, en dos turnos distintos: ambas fueron denegadas por el clasificador de
permisos de la sesión con el motivo "Security Weaken" (el cambio otorga verificación y visibilidad
pública sin pasar por el chequeo normal de credencial). **Este clasificador es una capa de
seguridad automática de la herramienta, independiente del consentimiento en el chat** — no se
puede destrabar diciéndomelo de nuevo ni pidiéndomelo de otra forma; según la propia herramienta,
la vía para habilitarlo es una regla de permisos en la configuración de Claude Code, que sólo el
propietario puede agregar (o bien que otra persona/sesión con esa configuración distinta escriba
el cambio y yo lo revise). Ambos intentos se revirtieron por completo; no quedó código a medio
escribir. El diseño queda documentado en `PLAN.md` (AMB-H3-03) listo para implementarse apenas
alguien lo escriba con las herramientas correctas.

### Por qué H3.S2.M1 y H3.S2.M3 quedaron bloqueadas — hallazgo y decisión denegada

Investigando cómo verificar "con procedencia" se encontró la causa raíz real: **ningún
profesional —de red o con matrícula real— llega jamás a `community.public_profiles`.**
Evidencia: `grep` de `new PublicProfiles`/`em.create(PublicProfiles` en **todo** el repo sólo
aparece en `PublicProfileProjectionService.projectOrganization` (`public-profile-projection.
service.ts:87`); no existe ningún `projectPractitioner` ni equivalente. Por eso
`CommunityVerificationService.applyVerified` (`community-verification.service.ts:114-124`)
devuelve siempre `{action: 'no-profile'}` para el `targetId` de un profesional: no hay fila que
actualizar. El patrón ya establecido para organizaciones (`directory-tenants.service.ts:281-304`,
comentario explícito: *"colgarlo de la verificación deja las dos mitades del criterio ciertas:
sin aprobar no aparece, aprobada aparece"*) es exactamente el que faltaba espejar para
profesionales.

Se diseñó la solución mínima y coherente con ese patrón: `projectPractitioner` (espejo de
`projectOrganization`) + `ProfilesPractitionersService.verifyByProvenance` (activa al
profesional sin exigir credencial, proyecta su vitrina recién al verificar, y llama a
`applyVerified` con `evidenceRef` = la procedencia declarada — el mismo campo, ya auditado en
`audit.verified_badges_history`, que la escotilla `POST internal/community/verification/badges`
ya usa para altas manuales de `SECURITY_ADMIN`). **Al escribir el cuerpo de `projectPractitioner`
el clasificador de permisos de esta sesión denegó la acción por "Security Weaken"**: el cambio
otorga estado verificado y visibilidad pública sin pasar por el chequeo normal de credencial, y
lo trató —correctamente— como el tipo de decisión que necesita aprobación humana explícita antes
de escribirse, no algo que una sesión resuelva sola. La edición se revirtió por completo: **no
quedó ningún archivo `.ts` modificado en el repo** (confirmado leyendo el archivo tras revertir).
Esto en los hechos **confirma** el peldaño original con el que se había registrado AMB-H3-03
(`DECISION_REQUIRED`) antes de profundizar la investigación.

**A quién escalar:** Pablo/propietario, con dos preguntas separadas —
1. ¿Se aprueba el mecanismo `verifyByProvenance` tal como está diseñado arriba?
2. Independientemente de H3: el directorio público de profesionales está estructuralmente vacío
   para CUALQUIER profesional (no sólo los de red) porque no existe ningún `projectPractitioner`.
   Esto excede el alcance de H3 y merece su propio carril/decisión.

## Evidencia

Ver `evidencia/h3s1m1-dedup-counts.txt` (conteos completos, sin datos de personas — son agregados,
no filas individuales).

## No cubierto

- Ejecución real de `load_provider_networks.py` (con y sin `--yes`) contra Postgres/API levantados:
  **bloqueada en este turno** porque el clasificador de permisos de la sesión denegó arrancar Docker
  Desktop ("Interfere With Workloads"). No se intentó ningún rodeo (no se probó otro comando, otro
  intérprete ni otra sesión para lograrlo de todas formas), conforme a la instrucción de la
  herramienta.
- Implementación de `projectPractitioner` + `verifyByProvenance`: **denegada dos veces por el
  clasificador de permisos** ("Security Weaken"), la segunda vez pese a autorización explícita del
  propietario en el chat. Se revirtió la edición parcial ambas veces; no quedó ningún `.ts` tocado.
  No se intentó ningún rodeo (otro archivo, otra herramienta, otra sesión), conforme a la
  instrucción de la herramienta.
- Carga real de datos contra Postgres: **se intentó con autorización explícita** (Docker Desktop
  arrancado, `postgres`+`redis` levantados, `salud-db/load_seeds.py` corrido). Postgres murió por
  `FATAL: could not fsync ... Input/output error` — el disco del host está al 100 % de capacidad
  (`df -h /`: 125 Mi libres de 228 Gi). No es un bloqueo de este carril: es infraestructura del
  host. Se pararon los contenedores; **no se borró** el volumen `mantra-redesa_postgres_data`
  porque ya existía antes de este intento y puede tener datos de otra sesión.
- Verificación real de `GET /public/search/practitioners?specialty=…` sin `DEV_VERIFICATION_BYPASS`
  devolviendo decenas: no cubierta, depende de lo anterior.
- Conteo real de `iam`/`profiles.practitioners` en base tras la carga: no cubierto, depende de lo
  anterior.
- La ambigüedad AMB-H3-01 (454/507 medidos vs 455/508 del encargo) no se confirmó con Pablo/el
  propietario en este turno.

## Desvíos del plan

- Ninguno respecto del `PLAN.md` — el plan ya refleja los bloqueos encontrados en el momento en que
  aparecieron (fase 1 del descubrimiento reveló los dos `DECISION_REQUIRED` antes de escribir código).

## Riesgos residuales

- Mientras AMB-H3-02 y AMB-H3-03 sigan sin decisión, H3 no puede declararse `HECHO`: dos de sus
  cinco microtareas dependen de una decisión de arquitectura/negocio que esta sesión no tiene
  autoridad para tomar unilateralmente sin inventar un contrato de datos.
- H3.S1.M2 y H3.S2.M2 están en buen estado de código pero **sin ninguna corrida real** en esta
  sesión: la próxima que retome esto debe levantar el stack antes de tocar nada más.

## Decisiones y ambigüedades

- **AMB-H3-01** — Desvío de -1 entre el conteo del encargo (455/508) y el medido (454/507) en ambas
  redes. Supuesto tomado: el medido es el correcto, por salir de datos reales sin colisión. A
  confirmar con Pablo/propietario.
- **AMB-H3-02** — Ver tabla de Pendiente arriba. A confirmar con Pablo/propietario antes de escribir
  cualquier código nuevo de membresía.
- **AMB-H3-03** — Ver tabla de Pendiente arriba. A confirmar con Pablo/propietario antes de escribir
  cualquier mecanismo nuevo de verificación.
