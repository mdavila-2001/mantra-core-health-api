# MAC-VINCULO — el circuito funciona, y todavía no habilita nada

**De:** Justin · **Fecha:** 2026-08-26
**Estado:** aprobar un vínculo **no** permite publicar agenda. Decisión pendiente.
**Verificado contra:** la base viva, con un médico real del padrón.

---

## Lo que ya funciona

Anoche el circuito arrancó por primera vez. Las siete cajas de la seguridad
social recibieron sede —datos reales del padrón, cargador en
`tools/bolivia-datasets/load_org_sites.py`— y con eso:

1. El médico pide vínculo a la Caja Petrolera → **nace `pendiente`**, no
   aprobado solo, que es lo que pasaba mientras nadie tenía sede.
2. La bandeja de la Caja lo muestra: **«OLIVER ROMAN URGEL · Matrícula R-1070»**.
3. La Caja aprueba → **204**.

Las cuatro piezas de MAC-VINCULO se ejercitan de punta a punta.

## Y sin embargo, el médico sigue sin poder publicar ahí

Aprobado el vínculo, publicar agenda en la Caja se rechaza:

```
La cuerpo declara tenantId=c97a422d-…, ajeno al tenant del actor (1befcfea-…)
```

No es la regla del vínculo: **es un interceptor global**,
`src/common/tenant/tenant-context.interceptor.ts`, que rechaza cualquier
petición cuyo cuerpo declare un tenant distinto del resuelto para el actor. Sólo
`SUPERADMIN` y `SYSTEM` pueden elegir tenant.

Es una frontera de aislamiento multi-tenant, deliberada y load-bearing. **No se
toca.**

## Por qué la aprobación no alcanza

Comprobado: aprobar el vínculo **no crea membresía** en esa organización.

```sql
-- tras aprobar, con el vínculo en estado aprobado:
SELECT count(*) FROM directory.tenant_memberships m …  → 0
```

Y sin membresía, el tenant de la Caja no está entre los del actor, así que el
interceptor rechaza antes de que ninguna regla de agenda llegue a mirar nada.

## Lo que intenté y deshice

Escribí una regla que aceptaba «vínculo aprobado» como base suficiente para
publicar sin ser miembro. Pasaba sus tres pruebas nuevas — **y era inalcanzable**:
las pruebas unitarias no atraviesan el interceptor, así que verdeaban sobre un
caso que en producción no ocurre nunca.

Lo revertí. Código para una rama muerta, con tests que sólo pasan porque
esquivan al guardián real, es peor que no tener el código: da confianza falsa.

## La decisión que hace falta

**¿Aprobar un vínculo debe otorgar membresía en el tenant de la organización?**

A favor: es lo que el diseño de la plataforma espera. El aislamiento se resuelve
por membresía, y `directory.tenant_memberships` existe justamente para eso.

En contra, y es serio: **la membresía habilita todo lo de ese tenant.** Lo que la
organización aceptó fue que el médico atienda, no que administre. Un vínculo
aprobado que conceda membresía plena le da a un cardiólogo de turno los mismos
cimientos que a un administrador de la Caja.

### Tres caminos, ordenados por lo que me parece más sano

1. **Membresía con rol acotado.** Aprobar crea la membresía con un rol
   asistencial —no `OWNER` ni `ADMIN`—, de modo que el interceptor pase pero la
   autorización siga cerrada para todo lo demás. Requiere decidir qué rol.

2. **Que la agenda la publique la organización.** El médico no manda el
   `tenantId` ajeno; la Caja crea el recurso apuntando a su perfil. Respeta el
   aislamiento sin tocar nada, pero cambia quién inicia la acción —y el registro
   de procesos describe al médico registrando sus horarios, no a la
   organización.

3. **Que el vínculo aprobado extienda los tenants resueltos del actor** sin
   crear membresía: el interceptor lo aceptaría y la autorización de dominio
   seguiría intacta. Es la más quirúrgica y la que menos precedente tiene.

## Qué queda hecho mientras tanto

- Las 7 sedes están cargadas y el cargador es idempotente.
- Los pedidos llegan a la bandeja identificados.
- El médico ve el estado de su trámite.
- El médico **sí puede publicar en su propio consultorio**, que es la mayoría de
  los casos y nunca estuvo bloqueado.

Lo que espera es el caso multi-sede: el mismo médico atendiendo en la Caja
Petrolera y en su consultorio, que es MEDICO 3.1 y 3.2 del registro de procesos.
