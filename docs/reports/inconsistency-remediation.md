# Corrección de inconsistencias bloqueantes

> Fase 4 del plan de ejecución (Fase 5 del plan maestro, §24 "orden obligatorio de ejecución").
> Revisa cada brecha `BLOCKER`/`CRITICAL` de `docs/reports/documentation-gap-analysis.md` que sea
> corregible sin cambio de comportamiento de negocio, antes de construir documentación definitiva
> sobre una arquitectura con inconsistencias sin resolver.

## 1. Alcance de esta fase

Esta fase corrige o resuelve formalmente **inconsistencias de código/arquitectura** detectadas en
Fase 1-2 que bloquearían la exactitud de la documentación (ej. documentar un límite de dominio que
en código no se respeta). **No** incluye construir el contrato OpenAPI, Scalar, Redocly, C4, ADRs,
AsyncAPI, seguridad u observabilidad — esas son brechas de *ausencia documental*, no de
*inconsistencia*, y se resuelven en sus fases dedicadas (5 en adelante).

## 2. Inconsistencias evaluadas

### 2.1 `ARCH-001` / `GAP-015` — `billing → practice` (único acceso cross-domain directo)

**Revisión del código real** (`src/modules/billing/repositories/practices-lookup.repository.ts`):

```ts
@Injectable()
export class PracticesLookupRepository {
  findActive(em: EntityManager, activeStatusConceptId: string): Promise<Practices[]> {
    return em.find(Practices, { statusConceptId: activeStatusConceptId });
  }
}
```

- Es **de solo lectura** (`em.find`, sin escritura).
- Expone **un único método**, con **una única condición de filtro**.
- El propio archivo documenta la razón: `invoices` no tiene `tenant_id` propio, solo
  `practice_id` (columna plana, no relación de ORM); el worker de morosidad de `billing` necesita
  resolver el tenant de cada factura agrupando por `practice_id`, y la única forma de hacerlo es
  leer qué prácticas están activas.
- No importa lógica de negocio de `practice`, no depende de invariantes internas de ese dominio
  más allá de su forma de tabla, y no crea acoplamiento bidireccional (`practice` no depende de
  `billing`).

**Decisión:** no se fuerza un refactor a "puerto de lectura formal" (p. ej. un método en
`PracticeService` expuesto entre módulos) porque:

1. El beneficio marginal es bajo — ya es de solo lectura y de una sola columna.
2. El costo/riesgo es real — tocar el worker de morosidad de facturación (dominio sensible,
   maneja dinero) sin que el usuario lo haya solicitado, fuera del alcance de una tarea de
   documentación, sería una modificación de comportamiento no pedida sobre lógica financiera.
3. Ya está **documentado como excepción intencional en el propio código** — no es deuda oculta.

**Estado final:** `ACEPTADO`, no `REMEDIADO`. Registrado con justificación completa en
`docs/governance/traceability-matrix.md` (`ARCH-001`) y `docs/reports/documentation-gap-analysis.md`
(`GAP-015`, cerrado). Si en el futuro `billing` necesita más de este único campo de `practice`,
ahí sí corresponde exigir un puerto de lectura formal — se deja la condición de reapertura escrita
en la propia fila de la matriz.

### 2.2 `SEC-001` / `GAP-016` — `RLS_ENFORCE` sin verificar por entorno

**Revisión:** esta no es una inconsistencia de código corregible por documentación — es una
**variable de configuración de despliegue** (`RLS_ENFORCE`, `DB_APP_USER`) cuyo valor real en cada
entorno (staging, producción) no es observable desde el repositorio estático. El código ya soporta
el modo correcto (`RLS_ENFORCE=true` con rol de aplicación sin `BYPASSRLS`); lo que falta es
**verificación operativa**, no un cambio de código.

**Decisión:** no se modifica ningún valor por defecto en `docker-compose.yml` ni en `.env.example`
sin que el usuario confirme el comportamiento deseado por entorno — cambiar el default de una
bandera de seguridad de aislamiento de datos de salud es una decisión con impacto en producción
que excede el mandato de "documentar", y una decisión equivocada aquí (p. ej. forzar
`RLS_ENFORCE=true` sin que el entorno esté preparado) podría romper despliegues activos.

**Estado final:** permanece `ABIERTO`/`BLOCKER`, documentado explícitamente en
`docs/security/tenant-isolation.md` (Fase 13) como una verificación que **debe ejecutarse contra
cada entorno real** antes de declarar `APTO PARA PRODUCCIÓN` en el informe final (Fase 18). Este
plan no puede cerrarlo por sí mismo — es la única brecha de todo el plan con esa característica
(ver nota en `documentation-gap-analysis.md`).

### 2.3 Otras brechas `BLOCKER`/`CRITICAL` de la matriz

El resto de brechas `BLOCKER`/`CRITICAL` (`GAP-001`, `GAP-002`, `GAP-003`, `GAP-004`, `GAP-005`,
`GAP-006`, `GAP-008`, `GAP-009`, `GAP-013`) son **ausencias documentales**, no inconsistencias de
código — no hay nada que "corregir" en esta fase; se construyen en las Fases 5-14 siguientes de
este plan de ejecución.

## 3. Resultado de esta fase

| Inconsistencia | Tipo | Acción tomada | Estado |
|---|---|---|---|
| `ARCH-001` (`billing → practice`) | Arquitectónica | Revisada, justificada, aceptada formalmente | ✅ Cerrada |
| `SEC-001` (`RLS_ENFORCE` sin verificar) | Operativa/seguridad | Documentada como verificación pendiente fuera del alcance de este repositorio | ⏳ Permanece abierta, con procedimiento de verificación definido |

No se detectaron otras inconsistencias de código que bloqueen la exactitud de la documentación a
construir en las fases siguientes. Se procede a Fase 5 (contrato OpenAPI).
