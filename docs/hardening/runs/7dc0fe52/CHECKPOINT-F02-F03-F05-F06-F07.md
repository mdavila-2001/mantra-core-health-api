# Checkpoint · lotes F02(P0)/F03(P0 parcial), F05, F06, F07

Sesión del 2026-09-18/19. Base original: `dev` `7dc0fe5209...` (merge del #422). El usuario mergeó
#420-#426 y #428 durante la sesión; #427 (F07) y #423 (F02 MCH-005) siguen abiertos.

## Estado final

| PR | Rama | Fichas | Estado |
|---|---|---|---|
| #428 | `hardening/f02-revocacion` | MCH-004, MCH-001 (P0) | **mergeado** |
| #425 | `hardening/f05-pagos` | MCH-017, 011, 036, 018 | **mergeado** |
| #426 | `hardening/f06-objetos` | MCH-009, 010, 020, 021 | **mergeado** |
| #427 | `hardening/f07-egreso` | MCH-006, 019, 035 | abierto |
| — | `hardening/f03-scope-adicional` (este checkpoint) | MCH-034 | nuevo, por abrir |

## El bloqueo de infraestructura de antes ya se identificó y arregló

La sesión anterior documentaba `DriverException: Connection terminated unexpectedly` en el bootstrap
de cada prueba de integración, atribuido a presión de memoria. **Eso era sólo parte del problema.**

La causa real, confirmada con un `psql` suelto desde un contenedor descartable: el túnel
`host.docker.internal` de Docker Desktop en esta máquina está roto — `server closed the connection
unexpectedly` de forma reproducible al 100%, sin relación con memoria disponible. La red de
contenedores del propio `docker compose` (`mantra-redesa-network`), en cambio, funciona bien.

**Arreglo:** el runner de integración (script de sesión, no versionado en el repo) ahora conecta el
contenedor efímero de la prueba a `mantra-redesa-network` y usa el hostname de cada servicio
(`mantra-redesa-postgres-1:5432`, etc.) en vez de `localhost`/`host.docker.internal`. Con eso:

```
yarn test:integration --ci --runInBand --testPathPatterns='hardening/mch-001|hardening/mch-003|hardening/mch-004|hardening/mch-005|hardening/mch-034'
Tests: 9 passed, 9 total
```

Quien retome esto en otra máquina: si `test:integration` corre normalmente vía `docker compose`
(mismo host de red), este problema no existe — es específico de correr el harness *fuera* del compose
en un contenedor aparte apuntando por IP/nombre de host publicado.

## MCH-001 (P0) — verificado de punta a punta

Unitario (458/458 antes del lote; 101/101 en `authz` con MCH-034 encima) + integración confirmada:
`test/integration/hardening/mch-001.int-spec.ts` en verde contra PostgreSQL real. El primer intento
tenía tres errores propios del test (no del código de producción), corregidos en el commit
`fix(test): corrige el int-spec de MCH-001...`:
1. Ruta `/chart/templates` → el controlador real cuelga de `/charts/templates`.
2. El sujeto de prueba era un `PRACTITIONER`, que trae el rol global `PRACTITIONER` y ese endpoint lo
   acepta: el caso no ejercía el camino con ámbito. Pasa a una paciente sin rol clínico alguno.
3. `tenantType: 'PROVIDER'` en el alta de organización daba 422 (FK) sin país/jurisdicción.

## MCH-034 — nuevo, en este checkpoint

`findActive` en `UserRoleAssignmentsRepository` sólo comparaba `(userId, roleId)`: el mismo rol
concedido en el tenant A hacía que `ensureRoleByCode` diera por satisfecha la misma alta pedida en B
(sin crear la fila), y `POST /authz/users/:id/role-assignments` rechazaba la segunda alta con 409
"ya asignado" aunque el ámbito fuera distinto. Esto además era lo que impedía administrar por HTTP el
escenario que corrige MCH-001 (mismo rol en dos tenants para la misma persona).

`findActive` ahora recibe `{tenantId, branchId, practiceId}` y normaliza cada ausencia a `null`
explícito (no `undefined`, que MikroORM omite del `WHERE`): el ámbito es parte de la clave, no un
comodín. Verificado: unitario (3 casos del repositorio + 2 de los llamadores) e integración
(`mch-034.int-spec.ts`: dos altas del mismo rol en tenants distintos → 2 filas distinguibles; repetir
la alta exacta → 409 real).

## Pendiente de F03

- **MCH-013** — RLS por defecto en despliegue: `RLS_ENFORCE` en `false` cuando no se informa, con
  fallback del ORM al usuario de conexión en vez de `DB_APP_USER`/`DB_APP_PASSWORD`. Sin empezar.
- **MCH-002** — la política RLS genérica no cubre `custodian_tenant_id` (usada por `observations` y
  otras 28 definiciones de entidad); el parche histórico captura `feature_not_supported` y sigue sin
  proteger esas tablas, sólo con una advertencia. Sin empezar; requiere una migración nueva
  (expand/contract), no editar el parche ya aplicado.

## Próximo paso exacto

1. Abrir PR de `hardening/f03-scope-adicional` (MCH-034) a `dev`.
2. Revisar y mergear #427 (F07), con los gates corridos contra esta misma corrección de red.
3. MCH-013: inspeccionar `current_user`/rol runtime/políticas instaladas antes de tocar el booleano;
   no activar `RLS_ENFORCE=true` a ciegas (puede romper login/workers si el contexto de sistema no
   está resuelto — ver el propio ticket).
4. MCH-002: clasificar exhaustivamente las tablas con `custodian_tenant_id` (no sólo `tenant_id`
   UUID), nueva migración de políticas, prueba con rol de aplicación real (no superusuario) que
   demuestre aislamiento en `observations` como mínimo.
