# Revisión del módulo `diagnostic_units` — ALOVIDA

## Alcance y evidencia

Se revisaron las unidades diagnósticas, sedes, ofertas de estudio, cronogramas y versiones de precio, equipamiento, acreditaciones y asignaciones. `corepack yarn test src/modules/diagnostic_units --runInBand --silent` aprobó **11 suites y 94 pruebas**.

## Hallazgo confirmado

### DUNIT-01 — Crítica — Las mutaciones administrativas resuelven unidades y recursos por UUID sin alcance de tenant

Los comandos exigen `SECURITY_ADMIN`, pero los controladores sólo pasan el UUID y el actor; no obtienen el tenant de sesión ([`diagnostic-units.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts#L171-L286), [`diagnostic-unit-sites.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts#L43-L67), [`diagnostic-pricing.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts#L44-L81)).

Los servicios cargan unidades, sedes, acreditaciones, equipos, ofertas, cronogramas y precios mediante `findById` sin comparar su tenant con el activo: alta, publicación, especialidades, asignaciones y acreditaciones ([`diagnostic-units.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostic_units/services/diagnostic-units.service.ts#L150-L505)); ofertas ([`diagnostic-studies.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostic_units/services/diagnostic-studies.service.ts#L49-L168)); equipo ([`diagnostic-equipment.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostic_units/services/diagnostic-equipment.service.ts#L47-L145)); y precios ([`diagnostic-pricing.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostic_units/services/diagnostic-pricing.service.ts#L55-L222)). La creación inicial además acepta `dto.tenantId` como propietario ([`diagnostic-units.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/diagnostic_units/services/diagnostic-units.service.ts#L75-L112)).

Un `SECURITY_ADMIN` del tenant A que conozca un UUID de la unidad, sitio, equipo, oferta, cronograma, precio o acreditación de B puede publicar, alterar, retirar o cerrar recursos de B, o crear una unidad para B si la defensa de base no lo bloquea. Las lecturas administrativas sí se presentan como acotadas al tenant, pero no cubren estos writes.

**Plan:** derivar el tenant desde el contexto en cada comando y centralizar resolvers por `id + tenantId`; para recursos hijos, resolver la cadena hijo → sede/unidad → tenant antes de mutar. El alta debe ignorar `dto.tenantId` o rechazar discrepancias. Devolver `404` uniforme fuera de alcance y probar dos tenants para cada familia de UUID.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | `SECURITY_ADMIN` de A crea oferta y precio para unidad activa de A | `201`; sólo se crean filas asociadas a A |
| Límite | Administrador de A publica, agrega equipo o especialidades usando unidad/sede de B | `404`; ninguna fila de B cambia |
| Error | Administrador de A cierra precio, retira oferta o renueva acreditación de B | `404`; estado y vigencia de B se conservan |
| Falla catalogada | UUID inexistente o de otro tenant en una mutación | `404/RESOURCE_NOT_FOUND/DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE` |

## Controles verificados

Las rutas administrativas requieren JWT, `SECURITY_ADMIN` y UUID válido. Las reglas internas sí impiden que una oferta de otra unidad entre en un cronograma y conservan el versionado de precio append-only. Ninguna de esas reglas prueba que la unidad ya pertenezca al tenant autorizado; faltan pruebas de actor A contra recursos de B.
