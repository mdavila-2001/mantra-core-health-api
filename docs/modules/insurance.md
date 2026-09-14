<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/insurance/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `insurance`

**Fuente:** [`src/modules/insurance/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/insurance/README.md)
· 11 controllers · 14 services · 10 repositories · 29 entidades · 13 DTO

---

# src / modules / insurance

Agrupa los componentes relacionados con **insurance** y mantiene cohesionada esta responsabilidad del sistema.

## Administración de planes y coberturas

Las lecturas `GET /insurance-carriers` y `GET /insurance-carriers/:carrierId`
están acotadas al carrier del tenant activo. Ambas calculan `canAdminister` en
el servidor; cada beneficio devuelve `approvalRules` normalizadas con
`requiredDocuments: []` y `exclusionNotes: null` cuando no hay reglas válidas.

Las siguientes mutaciones exigen un tenant activo y una membresía `OWNER` o
`ADMIN`. Los roles de plataforma `SECURITY_ADMIN` y `SUPERADMIN` conservan el
acceso excepcional, pero `OWNER`/`ADMIN` nunca se interpretan como roles del
JWT:

| Método y ruta | Cuerpo administrado | Respuesta |
| --- | --- | --- |
| `POST /insurance-products/:productId/plans` | Código, nombre, vigencia, moneda opcional y prima de lista mensual opcional | `{ id }` |
| `POST /insurance-plans/:planId/benefits` | Categoría, servicio opcional, vigencia e importes | `{ id }` |
| `PUT /insurance-plans/:planId/benefits/:benefitId` | Porcentaje, copago, deducible y tope anual; `null` borra | `{ ok: true }` |
| `PUT /insurance-plans/:planId/benefits/:benefitId/rules` | Autorización previa, documentos y exclusión | `{ ok: true }` |
| `PUT /insurance-plans/:planId/premium` | Prima de lista mensual del plan; `null` la quita | `{ id, monthlyPremiumAmount }` |

Todos los identificadores se resuelven por la cadena
tenant → carrier → producto → plan → beneficio. Un recurso inexistente, ajeno
o una combinación plan/beneficio inválida responde `404`; un miembro activo
sin capacidad administrativa responde `403`. Las escrituras actualizan la
auditoría dentro de la misma transacción.

Los documentos admitidos son `FIRMA_MEDICO`, `SELLO_MEDICO`, `ORDEN_MEDICA` e
`INFORME_CLINICO`. Las reglas se guardan con las claves canónicas
`requiredDocuments` y `exclusionNotes`, preservando claves desconocidas del
JSON de elegibilidad.

## Contenido

### Subcarpetas

- [`controllers/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/insurance/controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/insurance/dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/insurance/entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/insurance/repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/insurance/services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `insurance.concepts.ts` | Implementación o recurso de soporte de esta carpeta. |
| `insurance.module.ts` | Composición de dependencias del módulo NestJS. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

