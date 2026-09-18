# Checkpoint · F00 + primer lote F01 (contención)

Plan: *Mantra Backend 10/10*, paquete `MANTRA_DEV_CORREGIDO` del 18/09/2026. Este checkpoint
registra lo que se ejecutó en esta sesión. **No es una calificación ni cierra ningún MCH**: los
cierres exigen revisión independiente humana y el gate del candidato.

## Identidad del trabajo

| Campo | Valor |
|---|---|
| Repositorio | `mdavila-2001/mantra-core-health-api` (origin verificado) |
| Base (`origin/dev`) | `98e7fb5a09914de393a6e7138f4ad21c25a10e6f` (Merge PR #419) |
| SHA del paquete | `d11168012de432a2b359ff0aa35033c3f7a11ee9` (dev avanzó 8 commits desde entonces) |
| Rama de trabajo | `hardening/f01-contencion`, worktree aislado derivado de `origin/dev` |
| Fecha | 2026-09-18 |
| Runtime local | Node 22.23.1 (CI declara 24), Yarn 4.14.1 vía Corepack, Windows 11 |

### Delta desde el SHA del paquete (F00-T01)

61 archivos entre `d1116801` y `98e7fb5a`. Afectan fichas del plan:

- `clinical/guards/clinical-record-access.guard.ts` y su nuevo `…mounting.spec.ts`, más los
  controladores de `chart` y `clinical` (PR #417, IDOR del chart). Toca MCH-007: **revalidar en
  F04**, puede haber avance que el plan no conoce.
- `quotations/*` (planes de pago flexibles, #419) y `promotions/*` (loyalty, #418): fuera de las
  fichas de este lote.
- Ningún cambio en `payments/` ni en `.github/workflows/`: MCH-003/014/015/031/032 se revalidaron
  sobre el mismo código que auditó el paquete.

## Resultado del lote

| Ficha | Revalidación | Qué se hizo | Estado |
|---|---|---|---|
| MCH-003 | `CONFIRMED_CURRENT` | Contención F01-T01 (ver abajo) | Contenido, **no cerrado**: falta el puerto de gateway (F05) |
| MCH-014 | `CONFIRMED_CURRENT` — la API reporta el repo **público**; el runbook decía privado | `fork-guard` + `docs` sólo para ramas del propio repo; token `contents: read`; `persist-credentials: false`; runbook corregido | Contenido, **no cerrado**: el runner sigue sin ser efímero |
| MCH-015 | `CONFIRMED_CURRENT` — `required_status_checks` vacío en `dev`; 0 check-runs en `98e7fb5a`; rulesets `[]` | Nada: exige cambiar la protección de rama | `BLOCKED_EXTERNAL` (admin del repo) |
| MCH-031 | `CONFIRMED_CURRENT` | 4 acciones fijadas a SHA (idénticos a los que resolvían `v4`/`v5`); eliminado el `npx --yes @redocly/cli diff` | Contenido |
| MCH-032 | `CONFIRMED_CURRENT` | La publicación pasa a `workflow_dispatch`, con SHA en el nombre y `if-no-files-found: error` | Corregido en YAML, **sin ejecutar** en Actions |

### MCH-003 · contención de operaciones financieras (F01-T01)

El módulo no tiene adaptador de gateway: ninguna ruta llama a un proveedor. Cambios en
`payments-transactions.service.ts`:

- `processTransaction` crea la transacción en `TXN_PROCESSING` y deja el intent en
  `PI_PROCESSING`, sea cual sea la operación. Antes, CAPTURE/SALE dejaban `TXN_CAPTURED` y
  `PI_SUCCEEDED` sin que nadie hubiera cobrado.
- Se rechaza (409) una segunda operación mientras haya una en `PROCESSING`, y cualquier operación
  que no sea CAPTURE sobre una autorización ya confirmada (evita doble cargo).
- `inquireStatus` ya no convierte `PROCESSING` en `CAPTURED`; `reconciled` es siempre `false` y
  se registra un warning.
- `refund` crea el reembolso en `REFUND_PENDING` (antes `REFUND_DONE`) y sin `processedAt`. El
  tope de reembolsos descuenta los fallidos y cuenta los pendientes.
- `requestCancellation` registra `CANCEL_REQUESTED` y **no** anula la transacción.
- El único camino que puede fijar un estado final sigue siendo `applyCallback`, que verifica HMAC.

**Qué queda pendiente (F05):** no hay forma de llevar un reembolso a `REFUND_DONE` ni una
anulación a `CANCEL_DONE`/`TXN_VOIDED`, porque el callback sólo cubre transacciones. Es lo honesto
mientras no haya proveedor. Contrato HTTP: mismas rutas y DTO; **cambian los valores de estado**
devueltos. El frontend (`mantra-core-health`) no consume estas rutas (búsqueda sin coincidencias).
No se regeneró OpenAPI: no cambió ningún decorador.

TDD: 7 regresiones en RED por conducta (aserciones de estado, no imports) → GREEN. La revisión
técnica encontró el doble cargo AUTHORIZED→SALE: se agregaron 3 casos (el de CAPTURE en RED) y se
corrigió la consulta del repositorio. Los casos SALE/AUTHORIZE pasaban con el mock antes del
arreglo, porque el filtro defectuoso vivía en el repositorio: **la prueba real de ese filtro
requiere PostgreSQL** (`test/integration/hardening/mch-003.int-spec.ts`, no creado).

## Comandos ejecutados

Directorio: worktree `mch-hardening-f01`. `NODE_OPTIONS=--max-old-space-size=6144`.

| Comando | Exit | Nota |
|---|---|---|
| `corepack yarn install --immutable` | 0 | lockfile sin cambios |
| `corepack yarn build` | 0 | |
| `corepack yarn typecheck` | 0 | repetido tras los arreglos de la revisión: 0 |
| `corepack yarn lint --max-warnings=0` | 1 | **37 errores prettier preexistentes en dev** (recetas PDF, seguros); reproducidos en `98e7fb5a` limpio. 0 en `payments/` |
| `corepack yarn test` | 1 | 7934 ok, 1 skip, **1 falla preexistente**: `terminology-designations.es.spec.ts`, reproducida en `98e7fb5a` limpio |
| `corepack yarn test src/modules/payments` | 0 | 63/63 tras la revisión |

Los logs quedaron fuera del repositorio (scratchpad de la sesión). Aviso: install/build/test
empezaron antes de terminar la edición de `payments/`, así que valen para el **candidato**, no
para dev puro. Los dos rojos se confirmaron aparte en un worktree limpio de `98e7fb5a`.

**No ejecutado:** `test:integration`, `test:e2e`, generación de OpenAPI y el workflow en GitHub
Actions (requieren el stack de Docker o un PR real). Ningún pago, envío ni llamada a proveedor.

## Revisión

Una revisión técnica en contexto separado (subagente, sin la conclusión del implementador) marcó
2 problemas, ambos incorporados: doble cargo por la vía AUTHORIZED y `fork-guard` en cola
indefinida si el runner propio está apagado (pasó a `ubuntu-latest`). **Sigue siendo
`INDEPENDENT_REVIEW_PENDING`**: un subagente del mismo sistema no reemplaza al revisor humano
que pide el plan.

## Bloqueos y decisiones

- **MCH-015 / F01-T04 — `BLOCKED_EXTERNAL`.** Hay que marcar como requeridos los checks `docs` y
  `fork-guard` en la protección de `dev` y `master`. Necesita admin del repo, y el check tiene que
  haber corrido al menos una vez para poder elegirlo.
- **MCH-014 — `NEEDS_DECISION`.** Aislamiento real: runner efímero o volver a runners hospedados
  (depende de la facturación de Actions). No se pudo leer la política de aprobación de forks
  (API 403).
- **F01-T02 (contención clínica) — no iniciado.** #417 ya montó un guard de acceso al chart;
  revalidar MCH-007 contra ese código antes de agregar flags que puedan romper el frontend.
- **Rojos preexistentes de dev:** 37 errores de prettier y 1 test de terminología. Cada uno
  merece un PR chico propio, fuera de este lote.

## Próximo paso exacto

1. Correr el workflow en un PR de esta rama: confirmar que `docs` corre y `fork-guard` se omite
   (MCH-032-AC01 con `workflow_dispatch`).
2. Crear `test/integration/hardening/mch-003.int-spec.ts` contra PostgreSQL: AUTHORIZED + SALE → 409
   sin filas nuevas.
3. F02 (MCH-004/005: sesiones y refresh atómico), con preflight previo si dev avanzó.
