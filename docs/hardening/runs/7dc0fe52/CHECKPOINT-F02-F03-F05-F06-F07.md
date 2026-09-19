# Checkpoint · lotes F02(P0)/F03(P0 parcial), F05, F06, F07

Sesión del 2026-09-18/19. Base: `dev` `7dc0fe5209...` (merge del #422). Cuatro PRs abiertos, ninguno
mergeado todavía. **No es un cierre de fase**: falta revisión humana y, en algunos, correr los gates
en una máquina sin la presión de memoria que hubo hoy.

## PRs abiertos

| PR | Rama | Fichas | Quién |
|---|---|---|---|
| #425 | `hardening/f05-pagos` | MCH-017, 011, 036, 018 | agente (retomado 2 veces por límite de sesión) |
| #426 | `hardening/f06-objetos` | MCH-009, 010, 020, 021 | agente (retomado 1 vez) |
| #427 | `hardening/f07-egreso` | MCH-006, 019, 035 | agente (retomado 2 veces); el último tramo (MCH-019) lo terminé yo a mano, revisando el diff antes de commitear |
| #428 | `hardening/f02-revocacion` | MCH-004, MCH-001 (P0) | yo, directo |

## Lo que verifiqué yo mismo (#428)

- `yarn lint --max-warnings=0`: limpio, en lotes (el heap type-aware no entraba completo con la
  memoria disponible; por lotes de 2-4 archivos sí).
- `yarn typecheck` (proyecto completo, heap 3 GB): **0 errores**.
- `yarn test --runInBand` de `src/common/auth`, `src/common/tenant`, `src/modules/iam`,
  `src/modules/authz`: **458/458 OK**.
- Integración: **no pude correrla de forma concluyente**. Ver "Bloqueo de infraestructura" abajo.

## Lo que NO verifiqué yo (#425, #426, #427)

Los agentes que los hicieron murieron por el límite de sesión de la cuenta antes de reportar si
habían corrido los gates finales. Revisé el diff de MCH-019 a mano (línea por línea) antes de
commitearlo porque quedó a medio terminar; el resto lo heredé de commits ya hechos por los agentes,
sin volver a correr sus pruebas yo mismo por la misma razón de memoria. **Antes de mergear cualquiera
de los tres, correr en una máquina con margen:**

```bash
yarn lint --max-warnings=0
yarn typecheck
yarn test --runInBand src/modules/payments src/modules/accounting        # #425
yarn test --runInBand src/modules/object_storage                         # #426
yarn test --runInBand src/common/http src/modules/payments               # #427
```

## Bloqueo de infraestructura (no es un defecto de MCH-001)

Durante buena parte de la sesión corrieron en simultáneo: esta rama, tres agentes retomando F05/F06/
F07, y varios `docker run` de `node:24` para integración. La máquina (16 GB) llegó a **0,4-0,8 GB
libres**, con la VM de Docker (`vmmemWSL`) en ~2,8 GB y Windows comprimiendo memoria activamente.

Bajo esa presión, la siembra del catálogo de conceptos (`TerminologySeedService`, paso obligatorio de
`bootstrapTestApp()`) falla con `DriverException: Connection terminated unexpectedly` — la conexión
TCP entre el contenedor `node:24` y `mantra-redesa-postgres-1` se corta a mitad de la siembra. Postgres
en sí no estaba exigido (114 MB, 3% CPU en ese momento): es la red del VM de Docker bajo presión de
memoria del host, no el motor.

**Prueba de que es el entorno y no el código:** corrí `test/integration/seed.int-spec.ts` —existente
en `dev` desde antes de esta sesión, sin tocar— y falló con el mismo error exacto, en el mismo paso.
Ningún cambio de esta sesión pudo haber roto ese archivo.

Con la memoria liberada (agentes terminados, `git push`/PRs ya hechos), el problema debería
desaparecer. **Próximo paso:** repetir
`yarn test:integration --ci --runInBand --testPathPatterns='hardening/mch-00[1345]|hardening/mch-01[79]|hardening/mch-036|hardening/mch-020|hardening/mch-021|hardening/mch-009|hardening/mch-010|hardening/mch-006'`
contra el stack local (`docker compose --profile local-db up -d postgres postgres-init mongodb mongo-init redis opensearch opensearch-init minio`, con el DDL de `database/` aplicado — ver
[[integracion-api-como-correrla]]) cuando la máquina tenga margen, y adjuntar el resultado a cada PR
antes de pedir el merge.

## MCH-001 (P0) — qué prueba cada nivel

- **Unitario** (`roles.guard.spec.ts`, `tenant-scope.guard.spec.ts`,
  `authz-effective-roles.service.spec.ts`, `iam-auth.service.spec.ts`): 22 casos nuevos, todos en
  verde. Cubren el mecanismo completo: SUPERADMIN, excepción global, autoriza en el tenant que
  concedió el rol, deniega en otro, deniega sin tenant resuelto, retirar el rol deja de autorizar,
  resolución de tenant único/con cabecera/ambiguo/privilegiado.
- **Integración** (`test/integration/hardening/mch-001.int-spec.ts`, escrito y commiteado, **no
  ejecutado con éxito por el bloqueo de arriba**): dos organizaciones reales, un profesional con
  `CLINICIAN` asignado por `authz` sólo en el tenant A y membresía ordinaria en B, contra
  `GET /chart/templates` (gateada por `@Roles('CLINICIAN', ...)`). Falta correrla.

## Próximo paso exacto

1. Repetir la corrida de integración de las cuatro ramas cuando la máquina tenga memoria libre.
2. Revisión humana de los 4 PRs (#425-#428). Ninguno se mergea sólo con esto.
3. Seguir con el resto de F03: MCH-002 (RLS del modelo de custodia clínica), MCH-013 (RLS por
   defecto), MCH-034 (búsqueda de asignación ignora tenant/branch/practice) — quedaron pendientes,
   documentado en `LEEME-PRIMERO.md` de los carriles entregados al usuario.
