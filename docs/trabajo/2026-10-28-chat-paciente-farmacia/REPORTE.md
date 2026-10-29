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

## Ronda 2 — arreglos de la revisión independiente (sobre a01c082f)
| # | Arreglo | Test |
|---|---|---|
| 1 | Vitrina **de tenant**: `created_by_user_id` ya no da titularidad. Escrituras sociales (publicar, reseñar, responder, seguir, bloquear) = membresía activa OWNER/ADMIN; mensajería = `canAttend` (OWNER/ADMIN/STAFF, + `PHARMACY_STAFF` en farmacias), siempre `ORGANIZATION_STAFF` (revocable en el gateway). Se conserva `subjects(actor) ∋ target_id`. Una vitrina de tenant no abre hilos en frío por `POST /community/conversations` (403). | visibility, organization-staff, messaging |
| 2 | `pg_advisory_xact_lock(hashtextextended('menor:mayor', 0))` dentro de la transacción antes de `findDirectBetween`, en ambos canales. | messaging (orden lock→find, clave simétrica, canal sistema) |
| 3 | `isTenantBacked` (existe `directory.tenants` con id = `target_id`). Vitrinas organización no-tenant (SupportAdmin, unidad diagnóstica) vuelven a la regla anterior: vínculo de cuenta / `created_by` para titularidad y avisos; como destinatario siguen sin admitirse (igual que antes del cambio). | notifications, visibility, organization-staff |
| 4 | `if (!client.connected) return` antes de `join` y de registrar la concesión; `recheckStaffGrants` corta si desconectado. | gateway |
| 5 | El temporizador llama `runStaffRecheck`: try/catch + `logger.warn` + flag `staffRecheckRunning` anti-solape. | gateway (fake timers) |
| 6 | `servedContentHeaders`: try/catch que omite `filename*` ante `URIError` (lib ES2023, sin `toWellFormed` tipado). | served-content-headers |

Resultados: jest (community, pharmacy_inventory, scheduling, diagnostic_units, common/storage) `Tests: 1773 passed, 1773 total`, 2 suites de módulo sin cargar por `xlsx` (entorno). `tsc --noEmit`: 15 errores, todos xlsx. eslint de los 12 archivos tocados: exit 0. Int-spec sigue sin ejecutar.
