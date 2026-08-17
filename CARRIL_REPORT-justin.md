# Carril C-A · Justin — reporte

**Rama (API):** `justin/h01-verificacion-habilita-acceso`
**Semana:** 17–21/08/2026 · **Base:** `dev` al día (API `59bf51e6`, front `234227b`)
**Entorno:** stack `mantra-redesa` (Postgres 5433), API local `node dist/src/main.js` en :3000

---

## Resumen

| Fase | Estado |
|---|---|
| Prerequisitos | Hecho — con 2 hallazgos de entorno que bloqueaban a todo el equipo |
| Fase 2 · **H-01** | **CERRADO y verificado contra la API viva (403 → 200)** |
| Fase 1 · recorrida de la vertical | En curso |
| Fase 3 · última milla de UI | Pendiente (depende de la fase 1) |
| Fase 4 · E2E integrado | Pendiente (viernes) |

H-01 se resolvió primero porque es el bloqueo de entrada de la propia vertical.

---

## Fase 2 · H-01 — la verificación de identidad no habilitaba el acceso

### El diagnóstico: eran DOS defectos, no uno

El informe original (12/08) describía el síntoma del **camino del revisor**: aprobar
una revisión manual dejaba el caso en `CASE_VERIFIED` con su check abierto y sin
aserción. **Ese ya estaba arreglado** en `dev` por `b5e81486` (12/08 16:15), que
introdujo `settleManualApproval`.

Lo que seguía roto —y es lo que sufre un paciente real, porque en producción no
interviene ningún administrador— es el **camino automático**:

1. El paciente abre su caso (`POST /identity/me/identity-verification`). Queda en
   `CASE_IN_VERIFICATION` con un check `CHECK_PENDING`.
2. `DispatchIdentityChecksJob` lo despacha y asienta un intento con
   `outcome: 'PENDING'` — la autoridad encoló la solicitud pero todavía no
   resolvió—. En `recordAttempt`, un intento PENDIENTE se crea con
   `completedAt: undefined`.
3. En el siguiente tick el worker recoge el veredicto y llama a
   `POST /internal/identity/checks/{id}/results`.
4. **Ahí moría**: `recordResult` exige `existsCompletedForCase`, que cuenta
   intentos con `completed_at IS NOT NULL`. Nadie cerraba nunca el intento del
   paso 2, así que la precondición no se cumplía **jamás**.

Resultado: 422 en cada tick, para siempre. El check se quedaba en
`CHECK_IN_PROGRESS`, el caso nunca emitía aserción, y `VerifiedIdentityGuard`
—que consulta `identity_assertions` en cada petición— seguía devolviendo 403.
La pantalla prometía «Se habilita tu acceso» y no pasaba nada.

### El arreglo

`identity-checks.service.ts` — `completeInFlightAttempt`, llamado al principio de
`recordResult`: **el veredicto es lo que cierra la conversación con la autoridad**,
así que el intento que lo estaba esperando se completa ahí.

Tres decisiones, con su razón:

- **El intento es mutable, y esto es lo que sus columnas esperan.** El modelo
  (`diagram_27_identity_assurance.puml`) marca `identity_check_results` e
  `identity_assertions` como `<<IMMUTABLE>>`, y `identity_verification_attempts`
  **no**: tiene `started_at`/`completed_at` justamente para esto. No lleva
  `row_version` ni `updated_at`, así que no se le aplica `touch()`.
- **El desenlace es `ATTEMPT_SUCCESS` incluso con veredicto negativo.** El intento
  mide si la autoridad contestó, no qué contestó; `FAILED` está reservado al fallo
  técnico de despacho (es lo que manda el worker cuando la autoridad rechaza
  encolar). Que la identidad no coincida lo dice el resultado, que es el único que
  porta el veredicto.
- **La precondición se mantiene intacta.** Sólo se cierra un intento que esté
  `ATTEMPT_PENDING` y sin `completedAt`. Un veredicto sin ningún intento previo
  sigue dando 422 (verificado abajo).

### Verificación — contra la API viva

Criterio de cierre del carril, ejercitado de punta a punta con un paciente
**nuevo**, sin ningún atajo de base de datos:

```
=== PASO 1 · alta publica del paciente (CI-H01-cc9e4753) ===
  POST /iam/auth/register-patient -> 201
=== PASO 2 · inicia sesion con su documento ===
  POST /iam/auth/login -> 200
=== PASO 3 · su resumen ANTES de verificar (se espera 403) ===
  GET /profiles/patients/me/summary -> 403
=== PASO 4 · sube la foto con el carnet y abre su caso ===
  POST /common/files -> 201
  POST /identity/me/identity-verification -> 201
  caseId=8ea68e05-4531-4163-9c61-76647df89046 checkId=2d3f722d-3a56-49fa-a857-2f93634cf35f
=== PASO 5 · token administrativo (hace de worker SYSTEM) ===
  POST /iam/auth/login (admin) -> 200
=== PASO 6 · el worker descubre el check a despachar ===
  GET /internal/identity/checks/dispatchable -> 200
  encontrado: checkTypeCode=IDENTITY_CARD awaitingVerdict=False
=== PASO 7 · despacha: la autoridad ENCOLA (intento PENDIENTE) ===
  POST /internal/identity/checks/{id}/attempts -> 201
=== PASO 8 · segundo tick: el worker ve que espera veredicto ===
  awaitingVerdict=True (debe ser True)
=== PASO 9 · la autoridad responde MATCH  <-- AQUI ESTABA H-01 ===
  POST /internal/identity/checks/{id}/results -> 201
=== PASO 10 · el titular consulta su propio caso ===
  GET /identity/me/verification-cases -> 200
=== PASO 11 · su resumen DESPUES de verificar (se espera 200) ===
  GET /profiles/patients/me/summary -> 200

================ VEREDICTO ================
  antes  : 403
  despues: 200
  H-01: PASS  (403 -> 200)
```

Estado resultante en la base, con los conceptos resueltos a su código:

```
         intento_desenlace          | attempt_number | cerrado
------------------------------------+----------------+---------
 identity_assurance:ATTEMPT_SUCCESS |              1 | t

            check_estado            |           caso_estado
------------------------------------+----------------------------------
 identity_assurance:CHECK_COMPLETED | identity_assurance:CASE_ASSERTED

 aserciones_vigentes
---------------------
                   1
```

Comprobación negativa — que el arreglo no debilitó la precondición:

```
POST results SIN intento previo -> 422
  PASS: la precondicion sigue protegiendo
```

### Pruebas

```
corepack yarn typecheck                        -> EXIT=0
corepack yarn build                            -> EXIT=0
corepack yarn test src/modules/identity_assurance/
  Test Suites: 10 passed, 10 total
  Tests:       68 passed, 68 total              -> EXIT=0
```

Se sumaron **4 unitarias** que fijan el ciclo (`identity-checks.service.spec.ts`):
cierra el intento en vuelo y el veredicto deja de rechazarse (H-01); lo cierra como
exitoso aunque el veredicto sea negativo; no reescribe la fecha de un intento ya
completado; no resucita un intento que falló al despacharse.

Y **2 int-specs**:

- `identity-verification-self-service.int-spec.ts` (**nuevo**) — el camino del
  titular de punta a punta, incluido el 403 → 200.
- `identity-verification-cycle.int-spec.ts` — corregido su **rojo preexistente**:
  esperaba `CASE_VERIFIED` donde el flujo termina en `CASE_ASSERTED` (la aserción se
  emite en la misma transacción, y `VERIFIED` es un estado de paso dentro de ella).
  Se le sumó la comprobación de que la aprobación deja una aserción vigente.

> Los int-specs **no se pudieron correr en verde** por un bloqueo de entorno ajeno
> a este cambio (hallazgo E-3 abajo): el harness aborta el arranque cuando un seed
> falla, y el seed de mensajería no es idempotente contra una base ya poblada. Por
> eso la verificación de H-01 se hizo contra la API viva, que es además el criterio
> de cierre que pide el carril.

---

## Hallazgos de entorno (bloqueaban a todo el equipo, no sólo a este carril)

### E-1 · `dist/` estaba obsoleto y le faltaba el módulo `surveys`

`dist/` era del **15/08** y tenía **62** módulos; el código fuente tiene **63**.
Faltaba `surveys` entero — es el residuo del `git reset` ajeno que se comió ese
módulo (el mismo incidente que motivó la regla del worktree por persona).

Importa porque **MikroORM descubre entidades desde `dist/` en las pruebas**
(`entities: ['dist/src/modules/**/entities/*.entity.js']`), no desde los `.ts`. Con
el `dist` viejo, **todo `test:integration` moría al arrancar** con
`MetadataError: Metadata for entity SurveyAnswers not found` — incluidos specs que
nadie había tocado (comprobado con `common.int-spec.ts`).

**Cómo salir:** `corepack yarn build`. Vale la pena que lo corra todo el equipo
antes de tocar int-specs.

### E-2 · caché de metadata del ORM rancia

`node_modules/.cache/mikro-orm` tenía 1 230 entradas y **ninguna** `Survey*`.
Se borra sin consecuencias (se reconstruye sola). No era la causa de E-1, pero
convenía descartarla.

### E-3 · el harness de integración no arranca contra una base poblada

`test/integration/harness.ts` lanza si algún seed falla (`La siembra dejo N
seed(s) omitido(s)`), y el seed de **mensajería** no es idempotente:

```
UniqueConstraintViolationException: duplicate key value violates unique constraint
"uq_message_channels_code" - detail: Key (code)=(EMAIL) already exists.
```

Los canales ya vienen sembrados por el paquete (`load_seeds.py`), así que el seed
de arranque los reinserta y choca. **Consecuencia: ningún int-spec puede correr
contra una base cargada.** La app en cambio sí arranca (registra
`Seeds: 9/10 ok · 1 omitidos` y sigue): sólo el harness es estricto.

Pasó inadvertido porque **CI sólo corre `postgres-privileges`** de la suite de
integración; cualquier otro int-spec en rojo es invisible.

No lo toqué: `messaging` es el carril de Pablo y el arreglo (hacer idempotente el
seed por `code`) le corresponde a él o a Marcelo. **Queda como bloqueador
compartido.**

---

## Hallazgos de producto (no tocados, para decidir juntos)

### P-1 · un despacho fallido deja el check en un callejón sin salida

Si la autoridad rechaza encolar (con el adapter por defecto,
`PROVIDER_NOT_CONFIGURED`), `recordAttempt` deja el check en `CHECK_FAILED`. Pero
`findDispatchable` sólo lista `CHECK_PENDING` y `CHECK_IN_PROGRESS`: **el check
desaparece de la cola del worker para siempre** y el caso se queda colgado hasta
expirar, aunque el intento se haya marcado `retryEligible: true` — nadie consume
ese campo.

No es H-01 (aparece sólo cuando el proveedor falla), pero es el mismo tipo de
callejón. Propuesta: que `findDispatchable` incluya `CHECK_FAILED` con
`retry_eligible = true`, o un barrido de reintento. Requiere decisión, no es
mecánico.

---

## Cómo reproducir

```powershell
# 1. Infra (ya levantada con Docker Desktop)
docker ps   # mantra-redesa-postgres-1 healthy en :5433

# 2. Construir y arrancar la API con el fix
cd mantra-core-health-redesa-api
corepack yarn build
node dist/src/main.js          # :3000

# 3. Ciclo de H-01 de punta a punta
#    (script en el scratchpad de la sesión: h01-verify.ps1)
```
