# Reporte — Ordenar la guía de médicos por nota y por actividad

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): sobre `dev` (API) y sobre `mockup` (front), sin commit todavía
- Peldaño de evidencia alcanzado: `TESTED` en la API (unitarios dirigidos y la suite entera, más la consulta contra PostgreSQL real). En el front, `VERIFIED` contra el backend simulado. Falta la prueba de punta a punta front + API real.
- Avance: 3 / 3 microtareas HECHO (100 %)

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | `directoryStats` (puerto + adaptador): nota y cuatro cuentas por página, en dos consultas | `tsx evidencia/directory-stats.sqlcheck.ts.txt` contra Postgres 16 | Ver `evidencia/directory-stats.sqlcheck.out.txt` |
| H1.S1.M2 | `ratingAverage`, `ratingCount`, `activity` en `PractitionerListItemDto` | `yarn typecheck` | exit 0 |
| H1.S1.M3 | El servicio cruza las cifras por fila; si la lectura falla, la guía sale con ceros | `yarn test …profiles-practitioners.service.spec.ts -t listPractitioners` | 9 passed (2 nuevos) |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| E2E front + API real | TODO | Desplegar esta rama y abrir `/directory` con `start:real-api` |
| `openapi/openapi.yaml` | TODO | Regenerar con `yarn docs:openapi:generate` con la infraestructura de `docker-compose.yml` arriba (hoy el YAML ni siquiera tiene `ListPractitionersResponseDto`) |

## Evidencia
```
$ yarn test src/modules/profiles
Test Suites: 29 passed, 29 total
Tests:       571 passed, 571 total

$ yarn test            # suite unitaria entera
Test Suites: 1 skipped, 896 passed, 896 of 897 total
Tests:       1 skipped, 11105 passed, 11106 total

$ NODE_OPTIONS=--max-old-space-size=8192 yarn typecheck
TC_EXIT 0

$ tsx directory-stats.sqlcheck.ts   (Postgres 16.15, tablas con las columnas de las entidades)
DR_A: encounters 5 · medicationRequests 3 · clinicalNotes 0 · documents 1 · rating 4.3 (3)
      — la reseña de 1★ RETIRADA por moderación no cuenta: (5+4+4)/3 = 4,3
DR_B: encounters 2 · clinicalNotes 1 · rating null (0)
      — el encuentro de su vínculo INACTIVO no cuenta
DR_C: ausente — sin cuenta, y sus reseñas son de un perfil público OCULTO
[] → mapa vacío, sin consulta
```

## No cubierto
- La consulta corrió contra un esquema mínimo con las columnas de las entidades, no contra la base migrada completa. Tampoco se probó con RLS activo.
- El rendimiento con volumen real: `created_by_user_id` no tiene índice confirmado.

## Desvíos del plan
ninguno

## Riesgos residuales
- Las subconsultas por cuenta escanean las cuatro tablas clínicas. Con 50 filas por página y ~16 páginas, hay que medirlo en staging.

## Decisiones y ambigüedades
- «Todas las estadísticas» = la nota y las cuatro cuentas públicas de la ficha (`activity`). La API no sirve `quality` en la ficha de un tercero, así que no entra. **Confirmar con el propietario.**
- La nota sólo cuenta reseñas del perfil público visible y activo, igual que la lectura por slug. **Confirmar con el propietario.**
- El orden se hace en el front: la guía ya trae el padrón entero y lo ordena en memoria. Por eso el servidor no recibe un parámetro `sort`.
