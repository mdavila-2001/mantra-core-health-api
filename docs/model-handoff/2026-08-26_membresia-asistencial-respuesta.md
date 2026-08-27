# MAC-VINCULO — el eslabón, puesto: aprobar concede membresía asistencial

**Responde a:** `2026-08-26_mac-vinculo-el-eslabon-que-falta.md` (Justin)
**Fecha:** 2026-08-26
**Estado:** decidido e implementado. Verificado con la app entera montada.
**Rama:** `feat/mac-vinculo-membresia-asistencial`

---

## La decisión

De los tres caminos, se tomó el primero: **aprobar un vínculo crea la membresía
con un rol asistencial acotado**. Es el que respeta el diseño de la plataforma
—el aislamiento se resuelve por membresía, y `directory.tenant_memberships`
existe para eso— sin darle a un cardiólogo de turno los cimientos de un
administrador.

El rol nuevo es **`DIR_ROLE_PRACTITIONER`** («Profesional vinculado»),
`directory:ROLE_PRACTITIONER` = `9384ffcc-901f-5fb3-a9d6-2c1593d7f019`.

No hizo falta tocar el modelo canónico: un concepto es una **fila** de
`terminology.catalog_concepts`, no una columna. Tres archivos TS —el concepto,
el value set dinámico `tenant-role`, la designación en castellano— y lo siembra
`TerminologySeedService` al arrancar, con id determinista. Mismo precedente que
`cf9c7a85` (los cinco estados de v4.1.9).

### Por qué no `STAFF`

Porque `STAFF` es personal de la organización y esto no lo es. El rol nuevo
queda fuera de `ADMIN_TENANT_ROLES` y de su gemelo `ROLES_QUE_ADMINISTRAN`, así
que **todo lo administrativo queda cerrado por omisión** —fail-closed, sin una
sola línea de autorización nueva—: la bandeja de vínculos, invitar, editar la
organización, dar de baja. `GET /tenants/me` ya devuelve `canAdminister: false`
para él, sin tocar nada.

### Por qué no figura en `TENANT_ROLE_CONCEPT_BY_CODE`

A propósito. Si estuviera en el mapa, entraría también en los DTO de invitación
y de cambio de rol, y cualquier ADMIN podría repartirlo a mano. Dejándolo
afuera, **el rol sólo lo escribe el aprobador**: la fila es evidencia de un
trámite aprobado, no de una decisión suelta. (Un ADMIN sí puede convertir
después a ese profesional en STAFF o ADMIN; lo que no hay es camino de vuelta
por DTO salvo nueva aprobación. Es aceptable.)

---

## Lo que cambió

| Dónde | Qué |
|---|---|
| `directory.concepts.ts` · `dynamic-enum-catalog.ts` · `terminology-designations.es.ts` | El concepto, en el value set `tenant-role` y con su designación. |
| `directory-memberships.service.ts` | `ensureMembresiaAsistencial(tx, {userId, tenantId, actorUserId})`. |
| `directory.module.ts` | Exporta `DirectoryMembershipsService` (ya exportaba `TenantAdministrationService` para la bandeja). |
| `profiles-affiliations.service.ts` | `decidir()` concede la membresía **en la misma transacción** cuando el destino es aprobado. |
| `practitioner-affiliation-gate.service.ts` | Dos correcciones — ver abajo. |

`ensureMembresiaAsistencial` no reusa `invite` porque difiere en tres cosas: no
abre transacción propia (corre dentro de la decisión, que ya validó permisos),
no vuelve a exigir `assertCanAdminister`, y **no falla si ya hay membresía** —
aprobar un vínculo sólo puede *sumar* acceso, nunca degradar a quien ya
administra la organización. No hay unique `(user_id, tenant_id)` en la base: la
guarda contra la fila duplicada es esa lectura y sólo esa.

El salto perfil → usuario va por `person_account_links.findActiveByPerson`
(el `practitioner_profile_id` **es** `persons.id`). Puede no haber cuenta: un
perfil cargado por la organización todavía no tiene quién lo encarne. En ese
caso **la aprobación vale igual** y se registra un `warn`; negarla sería dejar
sin efecto la decisión de la organización por un motivo que no es suyo. Un fallo
al *crear* la membresía, en cambio, tumba la transacción: aprobar en silencio sin
conceder acceso reproduce el defecto original de forma invisible.

---

## Dos defectos del gate que esto destapó

**1. El puente sede → organización no coincidía consigo mismo.** El gate
resolvía por `practice_sites → practices.tenant_id`, mientras la aprobación y el
cargador del padrón usan `practice_sites.managing_tenant_id`. Hoy coinciden
porque el cargador las escribe juntas, pero una sede cedida a otra organización
las separaría y el gate y la aprobación disentirían. Ahora es
`COALESCE(s.managing_tenant_id, p.tenant_id)`.

**2. Aprobar un vínculo le rompía al médico su propio consultorio.** Éste es
serio y es el que más vale la pena leer. La excepción del gate («si no tiene
vínculos, que pase») se evaluaba sobre el profesional **entero**, no por
organización. En cuanto una institución le aprobaba el vínculo, su consultorio
propio —donde no hay vínculo que pedir ni nadie a quien pedírselo— pasaba a
leerse como una organización más de la que «faltaba» el vínculo, y el médico
dejaba de poder publicar ahí: **422**. Tener una aprobación en otro lado lo
dejaba peor que no tener ninguna.

Es preexistente —el único cambio propio en ese archivo era el `COALESCE`— y ya
alcanza al médico real con el que se probó el circuito. La excepción ahora se
evalúa **por organización**: si no hay vínculo con sede apuntando a ésta, el
veredicto es el mismo que el de quien no tiene ninguno. Lo que bloquea sigue
bloqueando: un vínculo pedido y no resuelto es `pendiente`, y uno rechazado es
`ausente`.

Lo destapó la prueba de integración, no la lectura del código.

---

## Cómo se verificó

`test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts` — **13/13**,
con la app entera montada. Existe precisamente por la advertencia del handoff:
las unitarias no atraviesan el interceptor, así que una regla escrita para ese
camino puede verdear sobre algo que en producción no ocurre nunca. Recorre:

1. Alta real de la institución (`register-organization`), su práctica y su sede
   con `managingTenantId`.
2. Médico registrado. Claims **sin** la institución.
3. **Negativo**: publicar agenda en la institución → `403`. Es el punto exacto
   que las unitarias no alcanzan.
4. En su propio consultorio → `201` (nunca estuvo bloqueado, y sigue sin estarlo).
5. Pide el vínculo → `pendiente` · aparece en la bandeja identificado · la
   institución aprueba → `204` · aprobar de nuevo → `422`.
6. La membresía existe, con el rol asistencial y **sin** rol de administración.
7. El token viejo **sigue en 403** (los claims se sellan al emitirlos).
8. Vuelve a entrar → la institución está en sus organizaciones → publica en la
   institución `201` **y** en su consultorio `201`.
9. La bandeja de vínculos de la institución le responde `403`: la membresía no
   lo volvió administrador.

Además: `yarn typecheck` en 0; los 10 archivos tocados pasan prettier (los 150
errores de lint del repo son preexistentes en `dev`, mismo conteo sin estos
cambios); unitarias de `seed` 120, `scheduling` 286, memberships 26,
affiliations 21.

---

## Backfill — `SQL/patches/2026-08-26_v420_backfill_membresias_asistenciales.sql`

Data-only, sin DDL. Repara los vínculos aprobados **antes** del despliegue: sin
él habría que re-aprobarlos a mano.

**El orden importa: primero la API (siembra el concepto), después el patch.**
Invertirlo falla con un mensaje que lo dice, en vez de morir con una violación de
constraint anónima.

Contempla **los dos** conceptos de «aprobado» —`AFFILIATION_ACTIVE`, el que el
código escribe hoy, y `AFFILIATION_APPROVED` de v4.1.9— para seguir siendo
correcto cuando el carril MAC-VINCULO migre los estados.

Verificado contra la base viva: borrada una membresía, la corrida repuso
exactamente una (`INSERT 0 1`); la segunda corrida, `INSERT 0 0`.

---

## Dos cosas asumidas, dichas en voz alta

**La membresía abre lecturas de la organización.** Con `assertCanRead` alcanza
pertenecer, así que el profesional vinculado ve la ficha de la institución, sus
sedes, sus sub-organizaciones, la agenda completa **y el listado de la plantilla**
(`GET /tenants/:id/memberships`, con el `userId` de cada miembro). Lo último es
lo discutible. No se cerró acá porque cambiar `assertCanRead` afecta a todos los
roles y merece decisión propia: **tarjeta aparte**.

**El acceso llega con la sesión siguiente, no con la abierta.** El claim
`tenants` se sella al emitir el token. Tras la aprobación el médico ve la
institución al volver a entrar (o al refrescar), no antes. Es comportamiento, no
defecto, y la prueba lo fija para que nadie lo lea como un fallo.

---

## Fuera de alcance, a propósito

- **La migración de `ESTADO_DEL_VINCULO`** a los cinco conceptos de v4.1.9 sigue
  siendo del carril MAC-VINCULO (handoff del 25/08). El código todavía escribe
  los deprecados; el backfill contempla ambos para no romperse cuando migre.
- **Endpoint de revocar**: sigue sin existir. Cuando exista, tendrá que dar de
  baja la membresía — `offboard` ya hace el soft-close correcto
  (`MEMBERSHIP_ENDED` + `end_date` + cascada a `branch_memberships`).
- Notificaciones/outbox del circuito: siguen sin existir; el médico no se entera
  de la decisión por ningún canal.
- Front: no necesita cambios estructurales. El `tenant-switcher` se alimenta de
  los claims `tenants`/`tenantNames`, así que la institución aparece con nombre
  al volver a entrar.

**Nota sobre la prueba:** como `fx1` y `tj1`, deja sus fixtures en la base
compartida (una organización «Caja de Salud FX2 …» y un médico por corrida). Se
mantuvo la convención de sus hermanas en vez de inventar una limpieza distinta,
pero conviene resolverlo para las tres juntas.
