# ADR-0005: Autorización — RBAC global + PDP clínico aditivo

## Estado
Aceptado.

## Contexto
El sistema mezcla autorización administrativa convencional (¿puede este rol facturar?) con acceso
a PHI, donde un rol clínico por sí solo no debería bastar: se necesita también consentimiento y
relación asistencial vigentes con el paciente concreto.

## Fuerzas y restricciones
- 120 roles de negocio en uso (`@Roles(...)`).
- Regulación de salud: acceso a PHI debe ser justificable caso por caso, no solo por posesión de
  un rol.
- Necesidad de invalidar acceso de inmediato al retirar un consentimiento.

## Opciones consideradas
RBAC puro vs. ABAC puro vs. híbrido: el código implementa un híbrido — RBAC global (`RolesGuard`)
para autorización administrativa, más un PDP (Policy Decision Point) aditivo específicamente para
PHI (`authz-pdp.service.ts`) que evalúa atributos (relación asistencial, consentimiento, alcance)
además del rol.

## Decisión
Dos capas conjuntivas para PHI: RBAC global (rol suficiente) **Y** PDP clínico (alcance vigente:
`ClinicalAccessGrantsRepository` + `CareRelationshipsRepository` + rango de acción vs. nivel de
grant). Para el resto de operaciones administrativas, solo RBAC.

## Consecuencias positivas
- El acceso a PHI es auditable y revocable por consentimiento, no solo por rol.
- `SUPERADMIN` sigue existiendo como comodín de RBAC, pero el PDP clínico es una capa
  arquitectónicamente independiente — revisar el diseño de una no compromete necesariamente la
  otra (aunque `SUPERADMIN` amerita revisión en el modelo de amenazas, ver Fase 13).

## Consecuencias negativas
- Complejidad de razonamiento: un desarrollador nuevo debe entender dos sistemas de autorización,
  no uno.
- Coste de evaluación por request (consulta a `ClinicalAccessGrantsRepository` y
  `CareRelationshipsRepository`) — mitigado con caché invalidable (`InvalidateCacheDto`).

## Riesgos
`SUPERADMIN` como bypass total de RBAC es un punto único de fallo de alto impacto — ver
[actores y roles](../business/actors-and-roles.md) y modelo de amenazas (Fase 13).

## Evidencia
`src/common/auth/roles.guard.ts`, `src/modules/authz/services/authz-pdp.service.ts`,
[autorización](../api/authorization.md).

## Plan de revisión
Revisar en el modelo de amenazas (Fase 13) el impacto de `SUPERADMIN` y si se justifica
un mecanismo de aprobación dual para su uso.
