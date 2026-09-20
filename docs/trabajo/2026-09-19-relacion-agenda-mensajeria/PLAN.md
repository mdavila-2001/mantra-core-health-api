# PLAN — La relación `agenda → mensajería`: dobles, integración y regresión final

- **Persona:** Justin · **Turno:** noche · **Fecha:** 2026-09-19 · **Línea:** B
- **Rol:** responsable de relación e integración
- **Prompt:** `AlovidaPromptManager/repartos/2026-09-19/PromptNoche/Justin/Noche-PilotoDeAvisos.Integracion/DoblesRelacionYRegresionFinal.md`
- **6 hitos · 18 subtareas · 53 microtareas**

## 0. Ficha de asignación — verificada, no supuesta

| Campo | Valor declarado | Valor verificado |
|---|---|---|
| `WORKSPACE` | Checkout real de `mantra-core-health-api` | `C:\Users\usuario\Documents\Sistema Salud\mantra-core-health-api` (`git rev-parse --show-toplevel`) |
| `TARGET_REF` | `32ae9399…` | **`5d5007fbdb7916b124010bbfbb560b7bb3aabc06`** (`dev`). `32ae939…` es ancestro, 2 commits atrás |
| Rama de trabajo | — | `justin/noche-2026-09-19-relacion-agenda-mensajeria`, desde `dev` |
| `AUTHORIZED_BATCH` | Directorio de evidencia | `docs/trabajo/2026-09-19-relacion-agenda-mensajeria/` |
| `ALLOWED_INFRA` | repo, `git`, `yarn`, `node`; PG y Docker a verificar | `git`/`node`/`yarn` OK · Docker CLI 29.4.2 presente, **daemon caído al arrancar** (ver H1.S2.M4) |

**Decisión de corte declarada:** trabajo contra **`5d5007f`**, no contra `32ae939`. Motivo verificable:
los 2 commits de diferencia tocan exclusivamente `src/modules/clinical/services/{conditions,service-requests}.service.ts`
y sus spec — **ninguno toca `scheduling`, `messaging` ni el puerto de avisos**, que es la superficie de
esta relación. Trabajar contra el `HEAD` real evita un rebase posterior sin costo de alcance.
Si Pablo fija `32ae939…` como corte del turno, esta decisión se revierte sin impacto (H1.S3.M1).

## 1. Estado del estándar (sección 1 del prompt) — HECHO

| Check | Esperado | Obtenido |
|---|---|---|
| `ls .claude/skills \| wc -l` | 176 | **176** |
| `ls .claude/rules/*.md \| wc -l` | 14 | **14** |
| `python .claude/hooks/plan_gate.py --self-test` | 11 PASS, 0 FAIL | **11 PASS, 0 FAIL** |

Evidencia: `evidencia/h0-instalacion-estandar.txt`.

## 2. Las tres capas del plan

### Capa 1 — Qué se quiere lograr

Que la relación `agenda → mensajería` (puerto `AGENDA_NOTICE_PORT` ← adaptador
`MessagingAgendaNoticeAdapter`) quede **especificada, ejercitada con dobles estrictos y medida contra
la persistencia real**, con un registro de resultados que no permita confundir «corrió con dobles»
con «integración verificada».

### Capa 2 — Cómo se ataca

En el orden de dependencia del prompt: H1 (especificación y registro) → H2 (dobles de ambos extremos)
→ H3 (participantes reales) → H4 (idempotencia/concurrencia/recuperación) → H5 (control anti-doble en
producción) → H6 (regresión final). H3 y H4 dependen de PostgreSQL; si el daemon no levanta, se
degradan a `BLOCKED` con causa y el turno sigue por H5/H6 en lo que no exija base.

### Capa 3 — Microtareas

Las 53 del prompt, con su CA y DoD literales. El estado vive en `REPORTE.md` y en el daily.

## 3. Estados permitidos

`TODO` · `EN CURSO` · `HECHO` · `A MEDIAS` · `BLOQUEADO` · `DESCARTADO`.
Una microtarea cuyo DoD no se ejecutó **nunca** es `HECHO`.

## 4. Riesgos y bloqueos previstos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Docker no levanta → sin PostgreSQL | **Materializado al arrancar** | H3, H4 y etapa 4 de H6 sin ejecutar | Lanzado Docker Desktop; si no responde, `BLOCKED` con salida pegada, y se avanza H1/H2/H5/H6-parcial |
| El contrato versionado de Ender no existe todavía | Alta | H2.S1 no puede referenciar versión | Doble especificado como `PROVISIONAL`, con la versión derivada del puerto en el corte y su hash |
| Q-06 (durabilidad del aviso) sin decidir | Abierta | H4.S3 no tiene oráculo de negocio | Se registra `DECISION_REQUIRED`, no se inventa política |
| Q-12/Q-13 (idempotencia y reintentos) sin definir | Abierta | H4.S1.M2 sin respuesta esperada | Se mide el comportamiento **observado** y se registra como hallazgo, sin declararlo correcto |
| Escribir en `src/` fuera de alcance | Baja | Rompe el reparto (área reservada) | Todo lo nuevo va en `test/` y `docs/trabajo/`; `src/` no se toca |

## 5. Alcance — lo que NO voy a hacer

No implemento ni modifico el adaptador (`src/modules/scheduling/adapters/messaging-agenda-notice.adapter.ts`),
no decido la semántica del contrato (es de Ender), no armo la composición ni el baseline (es de Itzan),
no invento ventana de deduplicación, TTL ni política de reintentos, y no declaro
`INTEGRATION_VERIFIED_WITH_REAL_IMPLEMENTATIONS` si falta un participante.
