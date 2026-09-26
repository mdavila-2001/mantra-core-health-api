# Reporte — M2 · MacBook: roles, cuentas y directorio de médicos (preproducción 2026-09-26)

> **AVANCE: 0 / 17 microtareas — 0,0 %.** Cortado por límite de uso de la sesión, no por bloqueo
> técnico. Ver "Pendiente" y "Decisiones y ambigüedades": el trabajo tiene camino claro para
> retomar sin arqueología.

- Fecha: 2026-09-26 · Plan: [PLAN.md](./PLAN.md) · Rama: `pablo/test-m2-macbook-roles-cuentas-directorio`
  (worktree `../wt-m2-macbook`, sobre `origin/test@016caaa1`)
- Peldaño de evidencia alcanzado: `DISCOVERED` (H1.S1) — nada de código nuevo escrito todavía.

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| — | ninguna microtarea con DoD ejecutado todavía | — | — |

## A medias
### H1.S1.M1 — Inventario de roles
- Qué anda: inventario completo hecho por lectura de código (no requiere DoD ejecutable, es
  descubrimiento). Confirmado con `grep` real (pegado en `PLAN.md`) que `role-mapping.ts` gobierna
  sólo los 6 roles GLOBALES y que `BILLING`/`FINANCE`/`ACCOUNTING_APPROVER` son roles de NEGOCIO
  que deben sembrarse en `authz.roles` vía un archivo `<módulo>.roles.ts`, registrado en
  `authz-clinical-roles-seed.service.ts`. Esto **corrige** la hipótesis literal del encargo (que
  atribuía el hueco a `role-mapping.ts`): el mecanismo real es `iam-auth.service.ts::mergeRoleCodes`
  + `AuthzEffectiveRolesService`.
- Qué no anda: falta escribir el seed (`insurance.roles.ts` para `BILLING`/`FINANCE`;
  `ACCOUNTING_APPROVER` agregado a `authz.seed.ts` por AMB-01) y registrarlo en
  `authz-clinical-roles-seed.service.ts::SYSTEM_ROLE_SEED`.
- Qué falta exactamente: escribir los dos archivos, correr el seed dos veces (idempotencia),
  consultar `authz.roles` para los tres códigos, y decidir H1.S1.M3 (hacer que un rol de negocio
  no reconocido en `mergeRoleCodes`/`AuthzEffectiveRolesService` falle fuerte en vez de callar).
- Dónde quedó: sin cambios de código todavía. Sólo `docs/trabajo/2026-09-26-m2-macbook/PLAN.md` y
  este reporte, ambos en el worktree (no comiteados). El worktree compila (`yarn typecheck` exit 0,
  ver Evidencia) contra `origin/test@016caaa1` sin ningún cambio propio todavía.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S1.M2 | TODO | Escribir `insurance.roles.ts` + entrada en `authz.seed.ts` para `ACCOUNTING_APPROVER`, registrar en `SYSTEM_ROLE_SEED`, correr seed, verificar en `authz.roles` |
| H1.S1.M3 | TODO | Decidir y escribir el fail-fuerte sobre rol de negocio desconocido |
| H1.S2.M1/M2 | TODO | Determinar qué rol falta realmente para check-in/mostrador/ficha/laboratorio del médico autorregistrado (el encargo nombra `MEDICAL_VISITOR`/`PHARMA_LAB_ADMIN`, que **no** son del actor médico — son visitador/admin de laboratorio; hay que releer qué asigna hoy el alta de `PRACTITIONER` y qué le falta) |
| H2.S1.M1–M4 | TODO | Construir `PeopleSeedService` (patrón `provider-accounts-seed.service.ts` + mapeo de `tools/bolivia-datasets/load_people.py`), sembrar 105 personas del padrón desde `markdown_convertidos/USUARIO_MEDICOS_1.md` y `USUARIO_PACIENTES_1.md` (viven en `mantra-core-health-model`, ya en el working tree local) |
| H3.S1.M1–M3 | TODO | Deduplicar 672+747 filas de `Alianza_Medicos_Habilitados.md` / `Nacional_Seguros_Red_Medica_Bolivia.md` a 455+508 médicos con N sedes, usando `load_provider_networks.py` como referencia de mapeo (no existe `normalize_padron.py` citado por el encargo — ver ambigüedad AMB-02) |
| H3.S2.M1/M2 | TODO | Verificar con procedencia en vez de `DEV_VERIFICATION_BYPASS`; mapear especialidades — depende de que M6 publique `observed-specialties.dataset.json` (no existe hoy en ningún repo local, ver AMB-03) |
| H4.S1.M1–M3 | TODO | IDOR de `GET /common/files/links` (falta actor + guard), lectura del PDF propio del paciente, token fuera de la query |

## Evidencia
```text
$ cd wt-m2-macbook && yarn typecheck
(sin salida, exit 0 — baseline limpio antes de cualquier cambio propio)

$ docker ps --format '{{.Names}}\t{{.Status}}\t{{.Ports}}' | grep mantra-redesa
mantra-redesa-redis-1      Up (healthy)   0.0.0.0:6380->6379/tcp
mantra-redesa-postgres-1   Up (healthy)   0.0.0.0:5434->5432/tcp

$ curl -sS http://localhost:3000/health   (tras `rm -rf dist && yarn start`)
→ respondió 200 antes de detener el proceso para cerrar el turno sin dejarlo huérfano (regla 70.2)
```

## No cubierto
- Ningún test dirigido corrido todavía (no hay código propio que testear aún).
- No se leyó `tools/bolivia-datasets/load_people.py` ni `load_provider_networks.py` línea por línea
  (sólo se confirmó que existen y su tamaño); falta extraer el mapeo columna-a-columna antes de
  escribir el seed de NestJS.
- No se determinó si `IamUsersService.createUser` admite un `initialRole` distinto de
  `USER`/`SECURITY_ADMIN` (visto en `provider-accounts-seed.service.ts:159`) — crítico para H2,
  donde cada persona necesita terminar con el global role correcto (`PATIENT` o `PRACTITIONER`).
- No se leyó el controlador de `common/files` para H4 (IDOR); sólo se citó el hallazgo del encargo.

## Desvíos del plan
Ninguno respecto del plan escrito: el trabajo se cortó durante la Fase 1 (descubrimiento factual)
de H1.S1, antes de llegar a escribir código.

## Riesgos residuales
- **Postgres y Redis del proyecto (`mantra-redesa-postgres-1`/`mantra-redesa-redis-1`) quedan
  corriendo** a propósito, para que la próxima sesión no vuelva a pagar el arranque; usan el volumen
  preexistente `mantra-redesa_postgres_data`, que ya traía 1310 tablas, 16 `authz.roles` y 65
  `iam.users` de sesiones previas — no se verificó su procedencia ni que estén al día con
  `origin/dev@13dd040` del modelo. Antes de sembrar sobre esta base habría que confirmar que no hay
  deriva de esquema (regla 97.2), cosa que este turno no llegó a hacer.
- El proceso de la API (`yarn start`) se detuvo explícitamente para no dejarlo huérfano; hay que
  volver a levantarlo (`rm -rf dist && yarn start` — el `dist/` viejo rompe con `ENOTEMPTY`, es
  gotcha conocido) antes de continuar.
- El checkout principal de `mantra-core-health-redesa-api` (no el worktree) tiene un cambio sin
  commitear en `src/worker/worker.env.spec.ts` (17 líneas, de otra sesión/carril) — no se tocó, se
  documenta para que no se pierda ni se confunda con este trabajo.

## Decisiones y ambigüedades
- **AMB-01** (registrada en el `PLAN.md`): dónde declarar el seed de `ACCOUNTING_APPROVER` sin
  tocar el módulo `accounting` (OUT). Supuesto tomado: agregarlo a `authz.seed.ts`. A confirmar con
  el propietario o M4.
- **AMB-02 (nueva):** el encargo cita `normalize_padron.py` "del repo del modelo" para deduplicar
  H3, pero ese script **no existe** en `mantra-core-health-model` en el commit local (`ae89e9a`,
  detrás de `origin/dev@13dd040` por 54 commits) ni en `origin/dev` recién traído. Sólo existen
  `load_people.py`, `load_provider_networks.py`, `extract_datasets.py`, `load_org_sites.py` en
  `mantra-core-health-redesa-api/tools/bolivia-datasets/`. Supuesto para cuando se retome: la
  deduplicación se escribe dentro del nuevo seed de NestJS (H3), replicando la lógica de
  normalización que `load_provider_networks.py` ya usa como referencia, en vez de invocar un script
  externo que no está en el repo. A confirmar con el propietario o M6 (dueño de los datasets).
- **AMB-03 (nueva):** `observed-specialties.dataset.json` (H3.S2.M2) no existe en ningún repo local
  tampoco. Es un entregable de M6 que hoy (2026-09-26) sigue en `TODO` (0/4 hitos en su daily). Per
  regla 65, cuando se retome: si M6 sigue sin publicarlo, construir un mapeo mínimo propio contra
  `VS_MEDICAL_SPECIALTY` a partir de las especialidades que aparecen en los dos markdown de redes,
  declarado explícitamente como doble hasta que M6 entregue el dataset real.
- **Q-01/Q-02/Q-03** del encargo original: registradas, sin resolver, sin bloquear nada (no eran el
  punto de partida de este turno).

## Cierre de turno
- Corte por **límite de uso de la sesión** (no por bloqueo técnico ni de negocio): se avisa
  explícitamente en vez de simular que el trabajo terminó.
- Proceso en background detenido: la API (`yarn start`, tarea `bff0cwhrs`) — parada antes de cerrar
  para no dejar huérfanos (regla 70.2).
- Quedan corriendo, a propósito y declarado: `mantra-redesa-postgres-1` y `mantra-redesa-redis-1`
  (contenedores Docker, no procesos de esta sesión en el sentido de la regla 70.2 — son
  infraestructura de desarrollo reutilizable entre sesiones).
- Nada comiteado ni pusheado: la rama `pablo/test-m2-macbook-roles-cuentas-directorio` sólo existe
  local, con `PLAN.md`/`REPORTE.md` sin commitear.
