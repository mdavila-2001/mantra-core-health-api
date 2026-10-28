# Reporte — Chat paciente ↔ farmacia a partir de un pedido

- Fecha: 2026-10-28 · Plan: [PLAN.md](./PLAN.md) · Rama: claude/wizardly-ramanujan-9vlisc (sin commit propio; el orquestador tomó instantáneas WIP)
- Peldaño de evidencia alcanzado: `TESTED` (unitarias dirigidas). No `VERIFIED`: no hay Postgres en la sesión.
- Avance: 10 / 10 microtareas con DoD unitario en verde (100 %). El int-spec nuevo NO se ejecutó.

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1–M6, H2, H3 | ver PLAN | `jest src/modules/community src/modules/pharmacy_inventory src/modules/scheduling src/architecture` | `Tests: 1503 passed, 1503 total` + `community-order-chat.service.spec.ts` (12 casos) en verde; 2 suites fallan al cargar por `Cannot find module 'xlsx'` (entorno; fallan igual sin el cambio) |
| gates | typecheck | `tsc --noEmit` | 15 errores, todos en `xlsx-parser*` / `concept-file-import*` (entorno); 0 en el resto |
| gates | lint | `eslint <archivos tocados>` | salida vacía, exit 0 |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| int-spec `test/integration/community-pharmacy-inbox.int-spec.ts` | escrito, no ejecutado | Postgres + `yarn test:integration` |

## Evidencia
Ver comandos de arriba (salida literal recortada en el reporte del agente).

## No cubierto
- Camino real HTTP/WS contra base (sin Postgres).
- RLS activo (`DB_APP_USER`): lecturas cross-tenant de `public_profiles`/`tenant_memberships` no verificadas.

## Desvíos del plan
- Revisión de seguridad (orquestador): el socket que entró a la bandeja por membresía la conservaba tras la baja. Se agregó revalidación periódica (`STAFF_GRANT_RECHECK_MS = 30 s`) que lo saca de las salas.
- Auto-respuesta (`/community/profiles/:id/auto-reply`) también admite al personal (es configuración de la bandeja).

## Riesgos residuales
- Ventana de hasta 30 s tras la baja de una membresía en la que un socket abierto aún recibe eventos.
- Paciente sin perfil comunitario: 422 `PATIENT_CHAT_PROFILE_MISSING` (no se crea).

## Decisiones y ambigüedades
- Roles que atienden: membresía ACTIVA OWNER/ADMIN/STAFF (no PRACTITIONER) + `PHARMACY_STAFF` para vitrinas PHARMACY. Confirmar con producto/seguridad.
- El personal no inicia hilos en frío por `POST /community/conversations` ni busca contactos como la farmacia; sólo por el pedido.
